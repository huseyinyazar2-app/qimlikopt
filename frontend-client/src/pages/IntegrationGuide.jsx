import { useState } from 'react';
import { BookOpen, Globe, Smartphone, Monitor, CheckCircle, Copy, Zap, Server, MousePointerClick } from 'lucide-react';
import { GATEWAY_PHONE } from '../config';

const API_BASE = 'https://api.qimlik.com';

export default function IntegrationGuide({ user }) {
  const [activeTab, setActiveTab] = useState('nodejs');
  const [copiedText, setCopiedText] = useState('');

  const PREFIX = user?.prefix || 'PREFIX';
  const API_SECRET = user?.api_secret || 'API_SECRET_INIZ';

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // --- Yöntem 1: Sunucu-taraflı güçlü doğrulama (önerilen) ---
  // Kod SUNUCUDA üretilir (CSPRNG), telefona bağlıdır ve tek kullanımlıktır.
  // API_SECRET yalnız SUNUCUNUZDA durur — asla tarayıcıya koymayın.
  const pollingCode = `// SUNUCU tarafı (Node örneği). API_SECRET'i .env'den okuyun.
const API_SECRET = process.env.QIMLIK_API_SECRET;   // "${API_SECRET}"

// 1) Kod isteyin — qimlik kodu SUNUCUDA üretir (telefon ZORUNLU)
async function baslat(userPhone) {
  const r = await fetch("${API_BASE}/api/client/otp/start", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-qimlik-secret": API_SECRET },
    body: JSON.stringify({ phone: userPhone }),
  });
  const { code } = await r.json();
  return code;   // kullanıcıya gösterin: "${PREFIX} <kod>" (deep-link mesajı hazırlar)
}

// 2) Kullanıcı "${PREFIX} <kod>" mesajını WhatsApp/SMS ile Gateway'e gönderir.

// 3) Doğrulanana kadar sorgulayın (2 sn'de bir, ~3 dk). Telefon ZORUNLU.
async function dogrula(userPhone, code) {
  const r = await fetch("${API_BASE}/api/client/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-qimlik-secret": API_SECRET },
    body: JSON.stringify({ phone: userPhone, code }),
  });
  const { verified } = await r.json();
  return verified;   // true olduğunda kod tek kullanımlık TÜKENİR
}`;

  // --- Yöntem 3: Webhook (sunucu-taraflı) örnekleri — HMAC imza doğrulamalı ---
  // qimlik gövdeyi imzalar: x-qimlik-signature = "sha256=" + HMAC_SHA256(API_SECRET, "<timestamp>.<ham govde>")
  // Alıcı: (1) timestamp ±5 dk penceresi, (2) sabit-zamanlı imza karşılaştırması.
  const codeTemplates = {
    nodejs: `const express = require('express');
const crypto = require('crypto');
const app = express();

const API_SECRET = process.env.QIMLIK_API_SECRET; // "${API_SECRET}"

// HAM gövde gerekir (imza ham byte üzerinden hesaplanır)
app.post('/qimlik-webhook', express.raw({ type: '*/*' }), (req, res) => {
  const raw = req.body.toString('utf8');
  const sig = req.headers['x-qimlik-signature'] || '';
  const ts  = req.headers['x-qimlik-timestamp'] || '';

  // 1) Replay koruması: ±5 dk
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > 300)
    return res.status(401).send('Eski istek');

  // 2) HMAC imza doğrulama (sabit-zamanlı)
  const expected = 'sha256=' + crypto.createHmac('sha256', API_SECRET)
    .update(ts + '.' + raw).digest('hex');
  if (sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return res.status(401).send('Geçersiz imza');

  const { user_phone, code, status } = JSON.parse(raw);
  if (status === 'verified') {
    // TODO: user_phone + code eşleşmesini oturumunuzla doğrulayıp kullanıcıyı içeri alın
  }
  res.sendStatus(200); // 2xx dönmezseniz qimlik yeniden dener
});

app.listen(3000);`,

    php: `<?php
$raw = file_get_contents('php://input');
$headers = array_change_key_case(getallheaders(), CASE_LOWER);
$sig = $headers['x-qimlik-signature'] ?? '';
$ts  = $headers['x-qimlik-timestamp'] ?? '';
$secret = getenv('QIMLIK_API_SECRET'); // "${API_SECRET}"

if (abs(time() - (int)$ts) > 300) { http_response_code(401); exit('Eski istek'); }

$expected = 'sha256=' . hash_hmac('sha256', $ts . '.' . $raw, $secret);
if (!hash_equals($expected, $sig)) { http_response_code(401); exit('Gecersiz imza'); }

$data = json_decode($raw, true);
if (($data['status'] ?? '') === 'verified') {
    // TODO: $data['user_phone'] + $data['code'] eşleşmesini oturumunuzla doğrulayın
}
http_response_code(200);
echo json_encode(["status" => "ok"]);`,

    python: `from flask import Flask, request
import hmac, hashlib, time, json
app = Flask(__name__)

API_SECRET = "${API_SECRET}"  # os.environ'dan okuyun

@app.route('/qimlik-webhook', methods=['POST'])
def qimlik_webhook():
    raw = request.get_data()  # ham byte
    sig = request.headers.get('x-qimlik-signature', '')
    ts  = request.headers.get('x-qimlik-timestamp', '0')

    if abs(int(time.time()) - int(ts)) > 300:
        return 'Eski istek', 401

    expected = 'sha256=' + hmac.new(
        API_SECRET.encode(), f"{ts}.{raw.decode()}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return 'Gecersiz imza', 401

    data = json.loads(raw)
    if data.get('status') == 'verified':
        pass  # TODO: data['user_phone'] + data['code'] eşleşmesini doğrulayın
    return 'ok', 200

if __name__ == '__main__':
    app.run(port=3000)`,

    csharp: `[ApiController]
[Route("qimlik-webhook")]
public class QimlikWebhook : ControllerBase
{
    const string ApiSecret = "${API_SECRET}"; // config/env'den okuyun

    [HttpPost]
    public async Task<IActionResult> Handle()
    {
        using var reader = new StreamReader(Request.Body);
        var raw = await reader.ReadToEndAsync();
        var sig = Request.Headers["x-qimlik-signature"].ToString();
        var ts  = Request.Headers["x-qimlik-timestamp"].ToString();

        if (Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - long.Parse(ts)) > 300)
            return Unauthorized();

        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(ApiSecret));
        var expected = "sha256=" + Convert.ToHexString(
            h.ComputeHash(Encoding.UTF8.GetBytes($"{ts}.{raw}"))).ToLower();
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(sig)))
            return Unauthorized();

        var data = JsonSerializer.Deserialize<Payload>(raw);
        if (data.Status == "verified")
        {
            // TODO: data.User_Phone + data.Code eşleşmesini oturumunuzla doğrulayın.
        }
        return Ok(new { status = "ok" });
    }
}

public class Payload
{
    public string User_Phone { get; set; }
    public string Code { get; set; }
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
        <p className="text-muted">Kendi sitenize veya uygulamanıza SMS gideri olmadan doğrulama eklemek için aşağıdaki adımları izleyin. Prefix ve API Secret'iniz otomatik olarak örneklere yerleştirilmiştir. <strong>API Secret sunucu-taraflı bir sırdır — tarayıcıya koymayın.</strong></p>
      </header>

      {/* Çalışma akışı */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Nasıl çalışır? (Ters-OTP)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {[
            ['1. Kod isteyin', <>Sunucunuzdan <code>otp/start</code> çağırın; qimlik kodu <strong>sunucuda</strong> (kriptografik) üretir, kullanıcının telefonuna bağlar ve size döner (ör. <code>483920</code>).</>],
            ['2. Kullanıcı göndersin', <>Kullanıcı, <strong>{PREFIX} 483920</strong> mesajını <strong>WhatsApp veya SMS</strong> ile Gateway numaranıza gönderir. SMS gideri kullanıcının hattından çıkar — size maliyeti <strong>₺0</strong>.</>],
            ['3. Siz doğrulayın', <>qimlik mesajı anında yakalar. <code>otp/verify</code> (telefon zorunlu, tek kullanımlık) ile sorgular veya webhook ile öğrenirsiniz.</>],
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
          <Zap size={20} color="var(--brand-primary)" /> Yöntem 1 — Sunucu-taraflı Doğrulama <span style={{ fontSize: '0.7rem', background: 'var(--brand-primary)', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: 999 }}>ÖNERİLEN</span>
        </h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          En güvenli yol — kod sunucuda üretilir, telefona bağlıdır, tek kullanımlıktır. İki uç, <code>API Secret</code> ile (başlık: <code>x-qimlik-secret</code>) <strong>sunucunuzdan</strong> çağrılır:
        </p>
        <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1rem 1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', marginBottom: '1.25rem', fontFamily: 'monospace', fontSize: '0.82rem', overflowX: 'auto' }}>
          <div><span style={{ color: '#0ea5e9', fontWeight: 700 }}>POST</span> {API_BASE}/api/client/otp/start &nbsp;<span className="text-muted">→ {'{ code }'}</span></div>
          <div style={{ marginTop: '0.35rem' }}><span style={{ color: '#0ea5e9', fontWeight: 700 }}>POST</span> {API_BASE}/api/client/otp/verify &nbsp;<span className="text-muted">→ {'{ verified }'}</span></div>
          <div className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Gövde: <code>{'{ "phone": "+9053...", "code": "483920" }'}</code> — telefon <b>zorunlu</b>. Doğrulanan kod <b>tek kullanımlık</b> tükenir; başka oturumun kodu sizinkini doğrulayamaz.</div>
        </div>
        <CodeBlock code={pollingCode} k="polling" />
        <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.85rem', lineHeight: 1.5 }}>
          Kod <strong>5 dakika</strong> geçerlidir; arayüzde 3 dakikalık bir geri sayım iyi olur. Mobil uygulamada da aynı mantık: sunucudan kod al → WhatsApp/SMS bağlantısını aç → sunucudan <code>otp/verify</code> sorgula.
        </p>
      </div>

      {/* YÖNTEM 2: Popup */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MousePointerClick size={20} color="var(--brand-primary)" /> Yöntem 2 — Hazır Doğrulama Penceresi <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: 999 }}>BASİT / DÜŞÜK GÜVENLİK</span>
        </h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          Hiç arayüz yazmak istemiyorsanız, qimlik'in hazır doğrulama sayfasını bir popup ya da iframe olarak açın. Kullanıcı tamamlayınca pencere ana sayfanıza <code>postMessage</code> ile "doğrulandı" bildirir.
        </p>
        <p style={{ fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8 }}>
          <strong>Not:</strong> Bu yöntem kodu tarayıcıda üretir ve paylaşılan-kod yolunu (<code>verify-status</code>) kullanır — telefon-sahipliği ve tek-kullanımlık garantisi <strong>yoktur</strong>. Demo/düşük riskli akışlar içindir. Gerçek doğrulama için <strong>Yöntem 1 (sunucu-taraflı)</strong> önerilir.
        </p>
        <CodeBlock k="popup" code={`// 1) Hazır doğrulama penceresini açın (basit yol — kod tarayıcıda üretilir)
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
          Önce <strong>Hesap &amp; Entegrasyon</strong> sayfasından <strong>Webhook URL</strong> alanına kendi adresinizi yazın. <strong>Güvenlik:</strong> gövde HMAC-SHA256 ile imzalanır — <code>x-qimlik-signature</code> = <code>sha256=HMAC(API_SECRET, "&lt;timestamp&gt;.&lt;ham gövde&gt;")</code> ve <code>x-qimlik-timestamp</code> gelir. Alıcıda timestamp penceresini (±5 dk) ve imzayı sabit-zamanlı doğrularsınız. Sır <strong>tel üzerinden gönderilmez</strong>. Tekrarları ayırmak için <code>x-qimlik-delivery-id</code> başlığı da gelir.
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
