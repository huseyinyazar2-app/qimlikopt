#!/usr/bin/env bash
# Sunucu sistem yedegi: qimlik DB + sirlar, Coolify platform durumu, onexpertiz DB.
# 7 gunden eski yedekleri siler, ama her zaman en yeni 3 kopyayi korur.
set -euo pipefail

DEST=/root/qimlik-backups/auto
LOG=/var/log/qimlik-backup.log
KEEP_DAYS=7
KEEP_MIN=3

TS=$(date -u +%Y%m%d-%H%M%SZ)
WORK=$(mktemp -d /tmp/qbk.XXXXXX)
trap 'rm -rf "$WORK"' EXIT

log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG"; echo "$*"; }
fail() {
    log "HATA: $*"
    mkdir -p "$DEST"
    printf 'FAIL %s %s\n' "$TS" "$*" > "$DEST/LAST_STATUS"
    exit 1
}

mkdir -p "$DEST" /root/qimlik-backups
chmod 700 /root/qimlik-backups "$DEST"

# Ayni anda iki yedek calismasin (elle tetikleme + zamanlayici cakismasi).
exec 9>/var/lock/qimlik-backup.lock
flock -n 9 || { log "onceki yedek hala calisiyor; bu calisma atlandi"; exit 0; }

log "=== yedek basladi: $TS ==="

# Canli SQLite dosyasini cp ile kopyalamak yirtik yedek uretir (yazma ortasinda
# yakalanabilir, WAL modunda -wal dosyasi disarida kalir). .backup online yedek
# API'sini kullanir ve kilitlenmeye karsi bekler.
snap_sqlite() {
    local src="$1" dst="$2" name="$3" res
    sqlite3 -cmd ".timeout 15000" "$src" ".backup '$dst'" || fail "$name: .backup basarisiz"
    res=$(sqlite3 "$dst" "PRAGMA integrity_check;" 2>&1) || fail "$name: integrity_check calistirilamadi"
    [ "$res" = "ok" ] || fail "$name: integrity_check '$res' dondu"
    local tables
    tables=$(sqlite3 "$dst" "SELECT count(*) FROM sqlite_master WHERE type='table';")
    [ "$tables" -gt 0 ] || fail "$name: yedekte hic tablo yok"
    log "$name: tamam ($(stat -c%s "$dst") bayt, $tables tablo, integrity ok)"
}

mkdir -p "$WORK/qimlik" "$WORK/coolify" "$WORK/onexpertiz"

# --- 1) qimlik uygulama veritabani ---
snap_sqlite /data/qimlik-db/local.db "$WORK/qimlik/local.db" "qimlik-db"

# --- 2) qimlik sirlari (JWT_SECRET, GATEWAY_API_KEY) ---
[ -f /data/qimlik-secrets/.env ] || fail "qimlik-secrets/.env bulunamadi"
cp -a /data/qimlik-secrets/.env "$WORK/qimlik/secrets.env"

# --- 3) Coolify platform durumu ---
# Postgres dokumu: hangi uygulama, hangi domain, hangi ortam degiskeni... hepsi burada.
docker exec coolify-db pg_dump -U coolify -d coolify --clean --if-exists \
    > "$WORK/coolify/coolify.sql" 2>"$WORK/coolify/pg_dump.err" \
    || fail "coolify pg_dump basarisiz: $(head -c 300 "$WORK/coolify/pg_dump.err")"
[ -s "$WORK/coolify/coolify.sql" ] || fail "coolify.sql bos"
rm -f "$WORK/coolify/pg_dump.err"
log "coolify-db: tamam ($(stat -c%s "$WORK/coolify/coolify.sql") bayt)"

# Coolify sirlari APP_KEY ile sifreler; bu dosya olmadan yukaridaki dokum ISE YARAMAZ.
[ -f /data/coolify/source/.env ] || fail "coolify source .env bulunamadi"
cp -a /data/coolify/source/.env "$WORK/coolify/source.env"
tar -C /data/coolify -czf "$WORK/coolify/keys.tar.gz" ssh ssl 2>/dev/null || log "uyari: coolify ssh/ssl arsivlenemedi"

# --- 4) onexpertiz veritabani (WAL modunda; .backup sart) ---
if [ -f /data/onexpertiz/production.db ]; then
    snap_sqlite /data/onexpertiz/production.db "$WORK/onexpertiz/production.db" "onexpertiz-db"
else
    log "uyari: /data/onexpertiz/production.db yok, atlandi"
fi

# --- 5) manifest ---
{
    echo "yedek_zamani_utc=$TS"
    echo "sunucu=$(hostname)"
    echo "--- calisan konteyner imajlari ---"
    docker ps --format '{{.Names}} {{.Image}}'
    echo "--- dosya ozetleri (sha256) ---"
    (cd "$WORK" && find . -type f ! -name manifest.txt -exec sha256sum {} +)
} > "$WORK/manifest.txt" 2>&1

# --- 6) paketle ---
ARCHIVE="$DEST/system-$TS.tar.gz"
tar -C "$WORK" -czf "$ARCHIVE" .
chmod 600 "$ARCHIVE"
tar -tzf "$ARCHIVE" > /dev/null || fail "olusan arsiv okunamiyor"
log "arsiv: $ARCHIVE ($(stat -c%s "$ARCHIVE") bayt)"

# --- 7) saklama: 7 gunden eskiyi sil, ama en yeni 3'u her halukarda koru ---
# Koruma sarti onemli: yedek gunlerce hata verirse, salt yas kurali elimizdeki
# saglam kopyalari da silip bizi yedeksiz birakirdi.
mapfile -t archives < <(ls -1t "$DEST"/system-*.tar.gz 2>/dev/null || true)
if [ "${#archives[@]}" -gt "$KEEP_MIN" ]; then
    for f in "${archives[@]:$KEEP_MIN}"; do
        if [ -n "$(find "$f" -maxdepth 0 -mtime +$KEEP_DAYS 2>/dev/null)" ]; then
            rm -f "$f"
            log "silindi ($KEEP_DAYS gunden eski): $(basename "$f")"
        fi
    done
fi

printf 'OK %s %s\n' "$TS" "$ARCHIVE" > "$DEST/LAST_STATUS"
log "=== yedek bitti: $(ls -1 "$DEST"/system-*.tar.gz | wc -l) kopya tutuluyor ==="
