// Sahte AI ekran goruntuleri yerine gecen, gercek arayuzu yansitan SVG mockup'lar.
// Dogru Turkce metin + dogru qimlik markasi + modul rengi. Ileride gercek ekran goruntusuyle degistirilebilir.

const C = { otp: '#0ea5e9', mesai: '#10b981', teslimat: '#f59e0b', dijital: '#6366f1' };

function WindowChrome({ color, url }) {
  return (
    <g>
      <rect x="0" y="0" width="480" height="360" rx="18" fill="#ffffff" stroke="#e9eef5" />
      <rect x="0" y="0" width="480" height="44" rx="18" fill="#f8fafc" />
      <rect x="0" y="26" width="480" height="18" fill="#f8fafc" />
      <circle cx="24" cy="22" r="5" fill="#ef4444" opacity="0.5" />
      <circle cx="42" cy="22" r="5" fill="#f59e0b" opacity="0.5" />
      <circle cx="60" cy="22" r="5" fill="#10b981" opacity="0.5" />
      <rect x="120" y="12" width="240" height="20" rx="10" fill="#ffffff" stroke="#e2e8f0" />
      <circle cx="136" cy="22" r="3.5" fill={color} />
      <text x="148" y="26" fontFamily="Inter, sans-serif" fontSize="10.5" fill="#64748b">{url}</text>
      <line x1="0" y1="44" x2="480" y2="44" stroke="#eef2f7" />
    </g>
  );
}

function Stat({ x, value, label, color }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <text x="0" y="18" fontFamily="Outfit, sans-serif" fontSize="22" fontWeight="800" fill={color}>{value}</text>
      <text x="0" y="34" fontFamily="Inter, sans-serif" fontSize="10.5" fill="#64748b">{label}</text>
    </g>
  );
}

function OtpMock() {
  const rows = [
    ['+90 5•• ••• 41', 'QMLK-4821', 'Doğrulandı', '#10b981'],
    ['+90 5•• ••• 88', 'QMLK-7390', 'Doğrulandı', '#10b981'],
    ['+90 5•• ••• 02', 'QMLK-1174', 'Bekliyor', '#f59e0b'],
  ];
  return (
    <svg width="100%" viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="qimlik OTP dogrulama paneli mockup">
      <WindowChrome color={C.otp} url="panel.qimlik.com" />
      <text x="28" y="80" fontFamily="Outfit, sans-serif" fontSize="16" fontWeight="700" fill="#0f172a">Doğrulama Akışı</text>
      <g transform="translate(28 96)"><rect width="60" height="18" rx="9" fill="#ecfdf5" /><circle cx="12" cy="9" r="3" fill="#10b981" /><text x="22" y="13" fontFamily="Inter, sans-serif" fontSize="9.5" fill="#065f46">canlı</text></g>
      <g transform="translate(28 126)">
        <Stat x={0} value="1.284" label="bugün doğrulama" color="#0f172a" />
        <Stat x={140} value="%99,2" label="başarı oranı" color="#0f172a" />
        <Stat x={280} value="₺0" label="SMS gideri" color={C.otp} />
      </g>
      <rect x="28" y="176" width="424" height="1" fill="#eef2f7" />
      {rows.map((r, i) => (
        <g key={i} transform={`translate(28 ${188 + i * 46})`}>
          <rect x="0" y="0" width="424" height="38" rx="10" fill="#f8fafc" />
          <circle cx="22" cy="19" r="11" fill={C.otp} opacity="0.12" />
          <path d="M18 19 a4 4 0 1 1 8 0 M15 26 c0-3 3-5 7-5 s7 2 7 5" stroke={C.otp} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <text x="42" y="23" fontFamily="Inter, sans-serif" fontSize="11" fill="#334155">{r[0]}</text>
          <text x="190" y="23" fontFamily="Outfit, monospace" fontSize="11" fontWeight="700" fill="#475569">{r[1]}</text>
          <g transform="translate(320 10)"><rect width="86" height="19" rx="9.5" fill={r[3]} opacity="0.12" /><text x="43" y="13.5" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600" fill={r[3]}>{r[2]}</text></g>
        </g>
      ))}
    </svg>
  );
}

function MesaiMock() {
  return (
    <svg width="100%" viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="qimlik Mesai konumlu giris mockup">
      <WindowChrome color={C.mesai} url="mesai.qimlik.com" />
      {/* Harita */}
      <g>
        <rect x="20" y="58" width="440" height="176" rx="12" fill="#eef4f1" />
        <path d="M20 120 h440 M20 180 h440 M150 58 v176 M320 58 v176" stroke="#dbe7e1" strokeWidth="6" />
        <path d="M20 120 h440 M20 180 h440 M150 58 v176 M320 58 v176" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 8" />
        {/* geofence */}
        <circle cx="250" cy="146" r="62" fill={C.mesai} opacity="0.12" />
        <circle cx="250" cy="146" r="62" fill="none" stroke={C.mesai} strokeWidth="1.5" strokeDasharray="5 5" />
        <text x="250" y="96" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600" fill={C.mesai}>Şantiye · 200m</text>
        {/* pin */}
        <path d="M250 158 c-9 -10 -13 -16 -13 -24 a13 13 0 0 1 26 0 c0 8 -4 14 -13 24 z" fill={C.mesai} />
        <circle cx="250" cy="134" r="5" fill="#ffffff" />
      </g>
      {/* Giris satirlari */}
      <g transform="translate(20 250)">
        <rect x="0" y="0" width="440" height="42" rx="10" fill="#f8fafc" />
        <circle cx="24" cy="21" r="9" fill="#10b981" /><path d="M20 21.5 l3 3 5-6" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="42" y="18" fontFamily="Inter, sans-serif" fontSize="11.5" fontWeight="600" fill="#0f172a">Ahmet Y. · Giriş 08:30</text>
        <text x="42" y="32" fontFamily="Inter, sans-serif" fontSize="10" fill="#059669">şantiye içinde</text>
      </g>
      <g transform="translate(20 300)">
        <rect x="0" y="0" width="440" height="42" rx="10" fill="#f8fafc" />
        <circle cx="24" cy="21" r="9" fill="#f59e0b" /><text x="24" y="25" textAnchor="middle" fontFamily="Outfit" fontSize="12" fontWeight="800" fill="#fff">!</text>
        <text x="42" y="18" fontFamily="Inter, sans-serif" fontSize="11.5" fontWeight="600" fill="#0f172a">Mehmet K. · Çıkış 17:05</text>
        <text x="42" y="32" fontFamily="Inter, sans-serif" fontSize="10" fill="#b45309">40m sınır dışında — işaretlendi</text>
      </g>
    </svg>
  );
}

function TeslimatMock() {
  return (
    <svg width="100%" viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="qimlik Teslimat imzali kanit mockup">
      <WindowChrome color={C.teslimat} url="teslimat.qimlik.com" />
      <g transform="translate(28 62)">
        <rect x="0" y="0" width="424" height="44" rx="10" fill="#fffbeb" />
        <rect x="14" y="10" width="24" height="24" rx="5" fill={C.teslimat} opacity="0.15" />
        <path d="M20 22 h12 M26 16 v12" stroke={C.teslimat} strokeWidth="1.6" strokeLinecap="round" />
        <text x="50" y="20" fontFamily="Outfit, sans-serif" fontSize="12.5" fontWeight="700" fill="#0f172a">Paket #TSL-2049</text>
        <text x="50" y="35" fontFamily="Inter, sans-serif" fontSize="10" fill="#92400e">Kurye: Kadıköy Bölge · 14:32</text>
        <g transform="translate(330 12)"><rect width="80" height="20" rx="10" fill="#10b981" opacity="0.14" /><text x="40" y="14" textAnchor="middle" fontFamily="Inter" fontSize="10" fontWeight="600" fill="#047857">Teslim edildi</text></g>
      </g>
      {/* Alici OTP onayi */}
      <g transform="translate(28 120)">
        <circle cx="12" cy="12" r="10" fill="#10b981" /><path d="M8 12.5 l3 3 5-6" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="32" y="10" fontFamily="Inter, sans-serif" fontSize="11.5" fontWeight="600" fill="#0f172a">Alıcı OTP onayı alındı</text>
        <text x="32" y="24" fontFamily="Inter, sans-serif" fontSize="10" fill="#64748b">Ahmet Y. · +90 5•• ••• 41</text>
      </g>
      {/* Imza kutusu */}
      <g transform="translate(28 158)">
        <rect x="0" y="0" width="424" height="120" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
        <text x="14" y="20" fontFamily="Inter, sans-serif" fontSize="10" fill="#94a3b8">Alıcı imzası</text>
        <path d="M40 88 c20 -34 34 6 52 -10 c14 -12 8 22 26 14 c16 -7 20 -30 40 -18 c14 8 6 30 30 24 c20 -5 26 -28 46 -22" stroke={C.teslimat} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M300 92 l6 -40 l10 30 l8 -18" stroke={C.teslimat} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* GPS footer */}
      <g transform="translate(28 292)">
        <path d="M10 20 c-6 -7 -9 -11 -9 -16 a9 9 0 0 1 18 0 c0 5 -3 9 -9 16 z" fill={C.teslimat} />
        <circle cx="10" cy="4" r="3.4" fill="#fff" />
        <text x="30" y="14" fontFamily="Inter, sans-serif" fontSize="11" fill="#334155">41.0082, 28.9784 · konum ve saat kilitli</text>
      </g>
    </svg>
  );
}

function QrGlyph({ x, y, s, color }) {
  const cells = [
    [0,0],[1,0],[2,0],[4,0],[6,0],[0,1],[2,1],[4,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[6,2],
    [4,3],[0,4],[2,4],[3,4],[5,4],[6,4],[1,5],[3,5],[4,5],[0,6],[2,6],[4,6],[5,6],[6,6],
  ];
  const u = s / 7;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-4" y="-4" width={s + 8} height={s + 8} rx="6" fill="#ffffff" stroke="#e2e8f0" />
      {cells.map(([cx, cy], i) => (
        <rect key={i} x={cx * u} y={cy * u} width={u} height={u} fill={color} />
      ))}
    </g>
  );
}

function DijitalMock() {
  return (
    <svg width="100%" viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="qimlik Dijital makine bakim mockup">
      <WindowChrome color={C.dijital} url="dijital.qimlik.com" />
      {/* Makine basligi + QR */}
      <g transform="translate(28 62)">
        <rect x="0" y="0" width="424" height="72" rx="12" fill="#f8fafc" />
        <QrGlyph x={16} y={16} s={40} color={C.dijital} />
        <text x="80" y="28" fontFamily="Outfit, sans-serif" fontSize="14" fontWeight="700" fill="#0f172a">CNC-07 · Dik İşleme</text>
        <text x="80" y="46" fontFamily="Inter, sans-serif" fontSize="10.5" fill="#64748b">Kimlik: MCH-2231 · Atölye B</text>
        <g transform="translate(320 24)"><rect width="86" height="22" rx="11" fill="#10b981" opacity="0.14" /><circle cx="16" cy="11" r="3.5" fill="#10b981" /><text x="30" y="15" fontFamily="Inter" fontSize="10.5" fontWeight="600" fill="#047857">Çalışıyor</text></g>
      </g>
      {/* Bakim formu */}
      <text x="28" y="158" fontFamily="Outfit, sans-serif" fontSize="12" fontWeight="700" fill="#0f172a">Periyodik Bakım Formu</text>
      {[['Yağ değişimi', 'tamam'], ['Filtre kontrolü', 'değişti'], ['Kayış gerginliği', 'tamam']].map((r, i) => (
        <g key={i} transform={`translate(28 ${172 + i * 40})`}>
          <rect x="0" y="0" width="424" height="32" rx="9" fill="#f8fafc" />
          <rect x="12" y="8" width="16" height="16" rx="4" fill={C.dijital} />
          <path d="M16 16.5 l3 3 5-6" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="40" y="21" fontFamily="Inter, sans-serif" fontSize="11.5" fill="#334155">{r[0]}</text>
          <text x="360" y="21" fontFamily="Inter, sans-serif" fontSize="10.5" fill="#64748b">{r[1]}</text>
        </g>
      ))}
      {/* Stok dusumu */}
      <g transform="translate(28 300)">
        <rect x="0" y="0" width="424" height="40" rx="10" fill="#eef2ff" />
        <text x="16" y="18" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" fill="#3730a3">Yedek parça otomatik düşüldü</text>
        <text x="16" y="32" fontFamily="Inter, sans-serif" fontSize="10" fill="#4f46e5">Hava filtresi −1 · kalan stok: 3</text>
      </g>
    </svg>
  );
}

export default function ProductMock({ type, style }) {
  const map = { otp: OtpMock, mesai: MesaiMock, teslimat: TeslimatMock, dijital: DijitalMock };
  const Cmp = map[type] || OtpMock;
  return <div style={{ width: '100%', ...style }}><Cmp /></div>;
}
