import { useState } from 'react';
import { BookOpen, Globe, Smartphone, Monitor, CheckCircle, Copy, Zap, Server, MousePointerClick } from 'lucide-react';
import { GATEWAY_PHONE } from '../config';

const API_BASE = 'https://api.qimlik.com';

export default function IntegrationGuide({ user }) {
  const [activeTab, setActiveTab] = useState('nodejs');
  const [copiedText, setCopiedText] = useState('');

  const PREFIX = user?.prefix || 'PREFIX';
  const API_KEY = user?.api_key || 'API_ANAHTARINIZ';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // --- Yöntem 1: Polling (önerilen) örnek kodu ---
  const pollingCode = `// 1) Her doğrulama için 6 haneli rastgele kod üretin
const code = String(Math.floor(100000 + Math.random() * 900000));
const mesaj = "${PREFIX} " + code;                 // ör: "${PREFIX} 483920"

// 2) Kullanıcıya iki gönderim butonu gösterin (mesajı otomatik hazırlar)
const waLink  = "https://wa.me/${GATEWAY_PHONE}?text=" + encodeURIComponent(mesaj);
const smsLink = "sms:+${GATEWAY_PHONE}?body=" + encodeURIComponent(mesaj);

// 3) Doğrulanana kadar durumu sorgulayın (2 sn'de bir, ~3 dk)
const userPhone = ""; // opsiyonel: "+9053..." verirseniz GÖNDEREN de eşleşmeli
const timer = setInterval(async () => {
  let url = "${API_BASE}/api/client/verify-status?prefix=${PREFIX}&code=" + code;
  if (userPhone) url += "&phone=" + encodeURIComponent(userPhone);

  const { verified } = await (await fetch(url)).json();
  if (verified) {
    clearInterval(timer);
    // TODO: kullanıcının telefonunu doğrulanmış say, akışa devam et
  }
}, 2000);`;

  // --- Yöntem 3: Webhook (sunucu-taraflı) örnekleri ---
  const codeTemplates = {
    nodejs: `const express = require('express');
const app = express();
app.use(express.json());

// qimlik, doğrulama başarılı olunca bu adrese POST atar.
// (Adresi panelde "Hesap & Entegrasyon" sayfasından tanımlarsınız.)
app.post('/qimlik-webhook', (req, res) => {
  // 1) Güvenlik: anahtar HEADER'da gelir (x-qimlik-key)
  if (req.headers['x-qimlik-key'] !== '${API_KEY}') {
    return res.status(401).send('Yetkisiz İstek');
  }

  const { prefix, user_phone, code, full_message, status } = req.body;
  if (status === 'verified') {
    // TODO: user_phone + code eşleşmesini kendi oturumunuzla doğrulayın,
    //       ardından kullanıcıyı doğrulanmış olarak işaretleyin.
    console.log(\`\${user_phone} -> \${code} doğrulandı\`);
  }

  res.sendStatus(200); // 2xx dönmezseniz qimlik yeniden dener
});

app.listen(3000);`,

    php: `<?php
// qimlik webhook alıcısı
$headers = array_change_key_case(getallheaders(), CASE_LOWER);
if (($headers['x-qimlik-key'] ?? '') !== '${API_KEY}') {
    http_response_code(401);
    exit('Yetkisiz İstek');
}

$data = json_decode(file_get_contents('php://input'), true);
if (($data['status'] ?? '') === 'verified') {
    $phone = $data['user_phone'];
    $code  = $data['code'];
    // TODO: $phone + $code eşleşmesini oturumunuzla doğrulayın.
}

http_response_code(200);
echo json_encode(["status" => "ok"]);`,

    python: `from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/qimlik-webhook', methods=['POST'])
def qimlik_webhook():
    # Güvenlik: anahtar HEADER'da gelir
    if request.headers.get('x-qimlik-key') != '${API_KEY}':
        return 'Yetkisiz Istek', 401

    data = request.json or {}
    if data.get('status') == 'verified':
        phone = data.get('user_phone')
        code = data.get('code')
        # TODO: phone + code eşleşmesini oturumunuzla doğrulayın.

    return jsonify(status='ok'), 200

if __name__ == '__main__':
    app.run(port=3000)`,

    csharp: `[ApiController]
[Route("qimlik-webhook")]
public class QimlikWebhook : ControllerBase
{
    [HttpPost]
    public IActionResult Handle([FromBody] Payload p)
    {
        // Güvenlik: anahtar HEADER'da gelir
        if (!Request.Headers.TryGetValue("x-qimlik-key", out var k) || k != "${API_KEY}")
            return Unauthorized();

        if (p.Status == "verified")
        {
            // TODO: p.User_Phone + p.Code eşleşmesini oturumunuzla doğrulayın.
        }
        return Ok(new { status = "ok" });
    }
}

public class Payload
{
    public string Prefix { get; set; }
    public string User_Phone { get; set; }
    public string Code { get; set; }
    public string Full_Message { get; set; }
    public string Status { get; set; }
}`,
  };

  const CodeBlock = ({ code, k }) => (
    <div style={{ background: '#0d1117', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', position: 'relative' }}>
      <button
        onClick={() => handleCopy(code, k)}
        style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e6edf3', padding: '0.4rem 0.65rem', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
      >
        {copiedText === k ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
        {copiedText === k ? 'Kopyalandı' : 'Kopyala'}
      </button>
      <pre style={{ margin: 0, color: '#e6edf3', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.55, overflowX: 'auto', whiteSpace: 'pre' }}>{code}</pre>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000 }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={32} /> Entegrasyon Rehberi
        </h1>
        <p className="text-muted">Kendi sitenize veya uygulamanıza SMS gideri olmadan doğrulama eklemek için aşağıdaki adımları izleyin. Prefix ve API anahtarınız otomatik olarak örneklere yerleştirilmiştir.</p>
      </header>

      {/* Çalışma akışı */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Nasıl çalışır? (Ters-OTP)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {[
            ['1. Kod üretin', <>Doğrulama anında 6 haneli rastgele bir kod üretin (ör. <code>483920</code>) ve kullanıcının oturumuyla ilişkilendirin.</>],
            ['2. Kullanıcı göndersin', <>Kullanıcı, <strong>{PREFIX} 483920</strong> mesajını <strong>WhatsApp veya SMS</strong> ile Gateway numaranıza gönderir. SMS gideri kullanıcının hattından çıkar — size maliyeti <strong>₺0</strong>.</>],
            ['3. Siz doğrulayın', <>qimlik mesajı anında yakalar. Sonucu ister sorgulayarak (polling), ister webhook ile öğrenirsiniz.</>],
          ].map(([t, d], i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.8)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t}</div>
              <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* YÖNTEM 1: Polling */}
      <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(14,165,233,0.35)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={20} color="var(--brand-primary)" /> Yöntem 1 — Durum Sorgulama (Polling) <span style={{ fontSize: '0.7rem', background: 'var(--brand-primary)', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: 999 }}>ÖNERİLEN</span>
        </h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          En kolay yol — kendi sunucunuza webhook kurmanız gerekmez, tamamen ön yüzden (frontend) çalışır. Kodu gösterip aşağıdaki ucu sorgularsınız:
        </p>
        <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1rem 1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', marginBottom: '1.25rem', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto' }}>
          <div><span style={{ color: '#10b981', fontWeight: 700 }}>GET</span> {API_BASE}/api/client/verify-status?prefix=<b>{PREFIX}</b>&code=<b>483920</b></div>
          <div className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Yanıt: <code>{'{ "verified": true }'}</code> veya <code>{'{ "verified": false }'}</code></div>
          <div className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>Opsiyonel <code>&amp;phone=+9053...</code> eklerseniz, kodu <b>gönderen numara</b> da bu numarayla eşleşmezse doğrulanmaz (gerçek telefon-sahipliği).</div>
        </div>
        <CodeBlock code={pollingCode} k="polling" />
        <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.85rem', lineHeight: 1.5 }}>
          Kod <strong>5 dakika</strong> geçerlidir; arayüzde 3 dakikalık bir geri sayım iyi olur. Mobil uygulamada da aynı mantık: kod üret → WhatsApp/SMS bağlantısını aç → aynı ucu sorgula.
        </p>
      </div>

      {/* YÖNTEM 2: Popup */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MousePointerClick size={20} color="var(--brand-primary)" /> Yöntem 2 — Hazır Doğrulama Penceresi
        </h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Hiç arayüz yazmak istemiyorsanız, qimlik'in hazır doğrulama sayfasını bir popup ya da iframe olarak açın. Kullanıcı tamamlayınca pencere ana sayfanıza <code>postMessage</code> ile "doğrulandı" bildirir.
        </p>
        <CodeBlock k="popup" code={`// 1) Hazır doğrulama penceresini açın
const code = String(Math.floor(100000 + Math.random() * 900000));
const url = "https://qimlik.com/verify?prefix=${PREFIX}&code=" + code
          + "&gateway_phone=${GATEWAY_PHONE}";
const win = window.open(url, "Qimlik", "width=460,height=680");

// 2) Sonucu dinleyin
window.addEventListener("message", (e) => {
  if (e.origin !== "https://qimlik.com") return;
  if (e.data.type === "qimlik_verification" && e.data.status === "verified") {
    // TODO: kullanıcıyı içeri alın
  }
});`} />
      </div>

      {/* YÖNTEM 3: Webhook */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={20} color="var(--brand-primary)" /> Yöntem 3 — Webhook (sunucu-taraflı)
        </h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          En sağlam yol: doğrulama başarılı olunca qimlik <strong>sizin sunucunuza</strong> anında <code>POST</code> atar (sorgulamaya gerek kalmaz).
          Önce <strong>Hesap &amp; Entegrasyon</strong> sayfasından <strong>Webhook URL</strong> alanına kendi adresinizi yazın. Güvenlik anahtarı istek başlığında (<code>x-qimlik-key</code>) gelir; tekrarları ayırmak için <code>x-qimlik-delivery-id</code> başlığı da gönderilir.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {Object.keys(codeTemplates).map(lang => (
            <button
              key={lang}
              onClick={() => setActiveTab(lang)}
              style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid var(--glass-border)', background: activeTab === lang ? 'var(--brand-gradient)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
            >
              {lang === 'nodejs' ? 'Node.js' : lang === 'csharp' ? 'C# .NET' : lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
        <CodeBlock code={codeTemplates[activeTab]} k={'wh-' + activeTab} />
      </div>

      {/* Platform bağlantıları */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Gönderim bağlantıları (WhatsApp &amp; SMS)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {[
          [<Globe size={18} />, 'Web', 'HTML linki'],
          [<Smartphone size={18} />, 'Mobil', 'React Native / Flutter'],
          [<Monitor size={18} />, 'Masaüstü', 'C# / Electron'],
        ].map(([icon, title, sub], i) => (
          <div className="glass-card" key={i}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--brand-primary)' }}>{icon}</span> {title} <span className="text-muted" style={{ fontSize: '0.75rem' }}>· {sub}</span>
            </h3>
            <CodeBlock k={'plat-' + i} code={
              i === 0
                ? `<a href="https://wa.me/${GATEWAY_PHONE}?text=${PREFIX}%20483920">WhatsApp ile Doğrula</a>
<a href="sms:+${GATEWAY_PHONE}?body=${PREFIX}%20483920">SMS ile Doğrula</a>`
                : i === 1
                ? `import { Linking } from 'react-native';

const mesaj = encodeURIComponent("${PREFIX} " + code);
Linking.openURL("https://wa.me/${GATEWAY_PHONE}?text=" + mesaj); // WhatsApp
// veya SMS:
Linking.openURL("sms:+${GATEWAY_PHONE}?body=" + mesaj);`
                : `using System.Diagnostics;

var mesaj = Uri.EscapeDataString($"${PREFIX} {code}");
Process.Start(new ProcessStartInfo(
    $"https://wa.me/${GATEWAY_PHONE}?text={mesaj}") { UseShellExecute = true });`
            } />
          </div>
        ))}
      </div>
      <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '1rem', lineHeight: 1.5 }}>
        Not: SMS bağlantısında iOS için <code>?body=</code> yerine <code>&amp;body=</code> kullanılır. WhatsApp bağlantısı her platformda aynıdır. Boşluk yerine daima <code>%20</code> (veya <code>encodeURIComponent</code>) kullanın.
      </p>
    </div>
  );
}
