// El yapimi hero illustrasyonu. Reverse-OTP akisini dogru qimlik markasiyla gosterir.
// Foto degil, vektor: keskin, hafif, dogru Turkce metin. Cevre kartlari 4 modulu temsil eder.

export default function HeroArt({ className = '', style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 640 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="qimlik reverse-OTP akisi: kullanici dogrulama kodunu WhatsApp ile gateway numarasina gonderir"
    >
      <defs>
        <radialGradient id="ha-glow1" cx="0.3" cy="0.2" r="0.8">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ha-glow2" cx="0.8" cy="0.9" r="0.8">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ha-phone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="ha-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <filter id="ha-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="#0f172a" floodOpacity="0.12" />
        </filter>
        <filter id="ha-card" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.10" />
        </filter>
      </defs>

      {/* Arka plan parlamalari */}
      <rect x="0" y="0" width="640" height="560" fill="url(#ha-glow1)" />
      <rect x="0" y="0" width="640" height="560" fill="url(#ha-glow2)" />

      {/* Nokta izgara */}
      <g fill="#94a3b8" opacity="0.25">
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 9 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={60 + c * 66} cy={70 + r * 70} r="1.6" />
          ))
        )}
      </g>

      {/* Baglanti cizgileri (telefon merkezinden kartlara) */}
      <g stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.7">
        <path d="M320 160 C 220 140, 170 130, 130 128" />
        <path d="M300 300 C 210 300, 170 300, 128 300" />
        <path d="M400 210 C 470 190, 505 185, 520 182" />
        <path d="M400 360 C 470 370, 505 380, 520 388" />
      </g>

      {/* Telefon */}
      <g filter="url(#ha-soft)">
        <rect x="222" y="70" width="196" height="420" rx="38" fill="url(#ha-phone)" />
        <rect x="234" y="82" width="172" height="396" rx="28" fill="#f8fafc" />
        {/* centik */}
        <rect x="298" y="92" width="44" height="9" rx="4.5" fill="#0f172a" />

        {/* WhatsApp tarzi ust bar */}
        <rect x="234" y="110" width="172" height="46" fill="#059669" />
        <path d="M234 110 h172 v0 a0 0 0 0 1 0 0 v18 h-172 z" fill="#059669" />
        <circle cx="258" cy="133" r="13" fill="#ffffff" opacity="0.9" />
        <path d="M252 133.5c0 3.6 3 6.5 6.5 6.5 1.2 0 2.3-.3 3.3-.9l3.2.9-.9-3.1c.6-1 .9-2.1.9-3.4 0-3.6-2.9-6.5-6.5-6.5s-6.5 2.9-6.5 6.5z" fill="#059669" />
        <text x="280" y="129" fontFamily="Outfit, sans-serif" fontSize="12" fontWeight="700" fill="#ffffff">Dogrulama Servisi</text>
        <text x="280" y="144" fontFamily="Inter, sans-serif" fontSize="9" fill="#d1fae5">cevrimici</text>

        {/* Sohbet: sistem balonu */}
        <g>
          <rect x="246" y="176" width="132" height="40" rx="12" fill="#ffffff" stroke="#e2e8f0" />
          <text x="258" y="194" fontFamily="Inter, sans-serif" fontSize="9.5" fill="#475569">Onaylamak icin bu kodu</text>
          <text x="258" y="207" fontFamily="Inter, sans-serif" fontSize="9.5" fill="#475569">bize geri gonderin:</text>
        </g>

        {/* Kod cipi */}
        <g>
          <rect x="256" y="226" width="112" height="34" rx="10" fill="#eff6ff" stroke="#bfdbfe" />
          <text x="312" y="248" textAnchor="middle" fontFamily="Outfit, monospace" fontSize="16" fontWeight="800" letterSpacing="2" fill="#0ea5e9">QMLK-4821</text>
        </g>

        {/* Kullanici giden balonu (yesil, saga yasli) */}
        <g>
          <rect x="266" y="272" width="112" height="30" rx="12" fill="#dcfce7" />
          <text x="360" y="291" textAnchor="end" fontFamily="Outfit, monospace" fontSize="12" fontWeight="700" fill="#166534">QMLK-4821</text>
          <path d="M366 300 l3 3 5-6" stroke="#16a34a" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Basari balonu */}
        <g>
          <rect x="246" y="314" width="120" height="34" rx="12" fill="#ecfdf5" stroke="#a7f3d0" />
          <circle cx="266" cy="331" r="9" fill="#10b981" />
          <path d="M262 331.5 l3 3 5.5-6" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="282" y="335" fontFamily="Outfit, sans-serif" fontSize="11" fontWeight="700" fill="#065f46">Dogrulandi</text>
        </g>

        {/* Alt: guvenli rozet */}
        <rect x="246" y="430" width="148" height="34" rx="17" fill="#0f172a" opacity="0.04" />
        <path d="M268 447 l-6-3 v-4 l6-2 6 2 v4 z" fill="#0ea5e9" transform="translate(0,-1)" />
        <circle cx="268" cy="444" r="8" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M264.5 444 l2.5 2.5 4-4.5" stroke="#0ea5e9" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="286" y="448" fontFamily="Inter, sans-serif" fontSize="10.5" fontWeight="600" fill="#334155">Uctan uca sifreli</text>
      </g>

      {/* Kalkan rozet (sol ust, yuzen) */}
      <g filter="url(#ha-card)" transform="translate(0,0)">
        <path d="M96 78 l30 10 v22 c0 20 -13 33 -30 40 c-17 -7 -30 -20 -30 -40 v-22 z" fill="url(#ha-shield)" />
        <path d="M84 100 l8 8 15 -16" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Cevre karti: SMS gideri (mavi) */}
      <FeatureChip x="34" y="108" color="#0ea5e9" title="SMS gideri" value="₺0" sub="operator ucreti yok" />
      {/* Cevre karti: QR bakim (indigo) */}
      <FeatureChip x="18" y="278" color="#6366f1" title="QR'li bakim" value="" sub="makine kimligi + gecmis" />
      {/* Cevre karti: Konumlu mesai (yesil) */}
      <FeatureChip x="474" y="158" color="#10b981" title="Konumlu mesai" value="" sub="GPS dogrulamali giris" />
      {/* Cevre karti: Imzali teslimat (amber) */}
      <FeatureChip x="474" y="364" color="#f59e0b" title="Imzali teslimat" value="" sub="alici onayi + konum" />
    </svg>
  );
}

function FeatureChip({ x, y, color, title, value, sub }) {
  return (
    <g filter="url(#ha-card)" transform={`translate(${x} ${y})`}>
      <rect width="150" height="56" rx="14" fill="#ffffff" stroke="#eef2f7" />
      <rect x="0" y="0" width="5" height="56" rx="2.5" fill={color} />
      <circle cx="26" cy="28" r="12" fill={color} opacity="0.14" />
      <circle cx="26" cy="28" r="4" fill={color} />
      <text x="46" y="25" fontFamily="Outfit, sans-serif" fontSize="12.5" fontWeight="700" fill="#0f172a">
        {title}
        {value ? <tspan fontFamily="Outfit, monospace" fill={color} dx="4">{value}</tspan> : null}
      </text>
      <text x="46" y="41" fontFamily="Inter, sans-serif" fontSize="9.5" fill="#64748b">{sub}</text>
    </g>
  );
}
