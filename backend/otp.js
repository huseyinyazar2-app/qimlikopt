const crypto = require('crypto');
const db = require('./db');

// Kriptografik olarak güvenli 6 haneli kod
function genCode() {
    return String(crypto.randomInt(100000, 1000000));
}

function samePhone(a, b) {
    const x = (a || '').replace(/\D/g, '');
    const y = (b || '').replace(/\D/g, '');
    if (x.length >= 9 && y.length >= 9) {
        return x.endsWith(y.slice(-9)) || y.endsWith(x.slice(-9));
    }
    return x === y;
}

/**
 * Bir telefon için sunucuda OTP üretir ve saklar. Aynı telefon+modül+amaç için
 * bekleyen eski kodları geçersizler (used=1). Üretilen kodu döndürür.
 */
async function createOtp(module, purpose, phone, packageId = null) {
    const code = genCode();
    await db.query(
        'UPDATE otp_codes SET used = 1 WHERE module = ? AND purpose = ? AND phone_number = ? AND used = 0',
        [module, purpose, phone]
    );
    await db.query(
        'INSERT INTO otp_codes (module, purpose, phone_number, code, package_id) VALUES (?, ?, ?, ?, ?)',
        [module, purpose, phone, code, packageId]
    );
    return code;
}

/**
 * OTP doğrulaması. İki koşul birlikte sağlanmalı:
 *  1) Kod bu modül+amaç için, bu telefona sunucuda üretilmiş ve henüz kullanılmamış
 *     ve 5 dakika içinde olmalı (otp_codes).
 *  2) Kullanıcı bu kodu gerçekten gateway'e göndermiş olmalı (logs kaydı, aynı telefon).
 * Başarılıysa kodu tek kullanımlık olarak işaretler. { verified, otp } döndürür.
 */
async function verifyOtp(module, purpose, phone, code, prefix) {
    const { rows } = await db.query(
        "SELECT * FROM otp_codes WHERE module = ? AND purpose = ? AND code = ? AND used = 0 AND created_at >= datetime('now', '-5 minutes') ORDER BY id DESC",
        [module, purpose, code]
    );
    const match = rows.find(r => samePhone(r.phone_number, phone));
    if (!match) return { verified: false };

    const targetMessage = `${prefix} ${code}`.toUpperCase();
    const { rows: logRows } = await db.query(
        "SELECT phone_number FROM logs WHERE UPPER(message_body) = ? AND created_at >= datetime('now', '-5 minutes') ORDER BY id DESC LIMIT 10",
        [targetMessage]
    );
    const logMatch = logRows.find(l => samePhone(l.phone_number, phone));
    if (!logMatch) return { verified: false };

    await db.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [match.id]);
    return { verified: true, otp: match };
}

module.exports = { createOtp, verifyOtp, genCode, samePhone };
