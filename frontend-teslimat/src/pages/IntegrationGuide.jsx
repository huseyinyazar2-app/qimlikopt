import { useState } from 'react';
import { BookOpen, Code, Terminal, Smartphone, Monitor, Globe, CheckCircle, Copy } from 'lucide-react';

export default function IntegrationGuide({ user }) {
  const [activeTab, setActiveTab] = useState('nodejs');
  const [copiedText, setCopiedText] = useState('');

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const codeTemplates = {
    nodejs: `const express = require('express');
const app = express();
app.use(express.json());

// Qimlik'ten gelen webhook bildirimlerini yakalayan endpoint
app.post('/webhook/${user?.prefix || 'PREFIX'}', (req, res) => {
  // 1. Güvenlik Kontrolü: İstek başlığındaki API anahtarını doğrulayın
  const qimlikKey = req.headers['x-qimlik-key'];
  if (qimlikKey !== '${user?.api_key || 'API_KEYINIZ'}') {
    return res.status(401).send('Yetkisiz İstek');
  }

  const { prefix, user_phone, code, status } = req.body;

  // 2. Doğrulama Durumu Kontrolü
  if (status === 'verified') {
    console.log(\`\${user_phone} numaralı kullanıcı \${code} kodunu başarıyla doğruladı.\`);
    
    // TODO: Burada veritabanınızda ilgili kullanıcının oturumunu aktif edin
    // veya OTP kodunu doğrulanmış olarak işaretleyin.
  }

  // Qimlik sunucusuna başarılı yanıt dönün
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Webhook dinleniyor: Port 3000'));`,

    php: `<?php
// Qimlik'ten gelen webhook bildirimlerini yakalayan PHP scripti

// 1. Güvenlik Kontrolü: İstek başlığındaki API anahtarını doğrulayın
$headers = getallheaders();
$qimlikKey = isset($headers['x-qimlik-key']) ? $headers['x-qimlik-key'] : '';

if ($qimlikKey !== '${user?.api_key || 'API_KEYINIZ'}') {
    http_response_code(401);
    exit('Yetkisiz İstek');
}

// 2. Gelen JSON verisini oku
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data && $data['status'] === 'verified') {
    $prefix = $data['prefix'];
    $phone = $data['user_phone'];
    $code = $data['code'];
    
    // TODO: Burada veritabanınızda ilgili kullanıcının oturumunu aktif edin
    // veya OTP kodunu doğrulanmış olarak işaretleyin.
}

// Qimlik sunucusuna başarılı yanıt dönün
http_response_code(200);
echo json_encode(["status" => "success"]);
?>`,

    python: `from flask import Flask, request, jsonify
app = Flask(__name__)

# Qimlik'ten gelen webhook bildirimlerini yakalayan Python/Flask endpointi
@app.route('/webhook/${user?.prefix || 'PREFIX'}', methods=['POST'])
def qimlik_webhook():
    # 1. Güvenlik Kontrolü: API anahtarını doğrulayın
    qimlik_key = request.headers.get('x-qimlik-key')
    if qimlik_key != '${user?.api_key || 'API_KEYINIZ'}':
        return 'Yetkisiz Istek', 401
    
    data = request.json
    if data and data.get('status') == 'verified':
        prefix = data.get('prefix')
        phone = data.get('user_phone')
        code = data.get('code')
        
        # TODO: Burada veritabanınızda ilgili kullanıcının oturumunu aktif edin
        # veya OTP kodunu doğrulanmış olarak işaretleyin.
        print(f"{phone} kullanıcısı {code} kodunu doğruladı.")
        
    return jsonify({'status': 'success'}), 200

if __name__ == '__main__':
    app.run(port=3000)`,

    csharp: `using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("webhook")]
public class QimlikWebhookController : ControllerBase
{
    // Qimlik'ten gelen webhook bildirimlerini yakalayan .NET Core Controller
    [HttpPost("${user?.prefix || "PREFIX"}")]
    public IActionResult HandleWebhook([FromBody] WebhookPayload payload)
    {
        // 1. Güvenlik Kontrolü: API anahtarını doğrulayın
        if (!Request.Headers.TryGetValue("x-qimlik-key", out var qimlikKey) || 
            qimlikKey != "${user?.api_key || "API_KEYINIZ"}")
        {
            return Unauthorized("Yetkisiz Istek");
        }

        // 2. Doğrulama Durumu Kontrolü
        if (payload.Status == "verified")
        {
            // TODO: Burada veritabanınızda ilgili kullanıcının oturumunu aktif edin
            // veya OTP kodunu doğrulanmış olarak işaretleyin.
        }

        return Ok(new { status = "success" });
    }
}

public class WebhookPayload
{
    public string Prefix { get; set; }
    public string User_Phone { get; set; }
    public string Code { get; set; }
    public string Full_Message { get; set; }
    public string Status { get; set; }
}`
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={32} /> Qimlik Entegrasyon Rehberi
        </h1>
        <p className="text-muted">Kendi sistemlerinizde Qimlik altyapısını kullanarak sıfır maliyetli doğrulama gerçekleştirmek için aşağıdaki adımları izleyin.</p>
      </header>

      {/* Steps List */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Çalışma Akışı</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>1. Kod Üretin</div>
            <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Kullanıcınız web sitenizde veya uygulamanızda doğrulama talep ettiğinde, arka planda 6 haneli rastgele bir sayı üretin (Örn: <code>791104</code>) ve bunu kullanıcının oturumuyla ilişkilendirin.
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>2. Yönlendirin</div>
            <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Kullanıcıyi WhatsApp butonuyla Gateway cihazınıza yönlendirin. Gönderilecek hazır mesaj <strong>Firma Ön Eki + Kodu</strong> olmalıdır (Örn: <code>{user?.prefix || 'ASHE'} 791104</code>).
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>3. Webhook Dinleyin</div>
            <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Kullanıcı mesajı gönderdiği anda, Qimlik Gateway mesajı okur ve tanımladığınız Webhook adresine doğrulanmış veriyi anında iletir. Sunucunuzda oturumu açarsınız.
            </p>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Arka Plan (Backend) Webhook Kod Örnekleri</h2>
          
          {/* Language Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8 }}>
            {Object.keys(codeTemplates).map(lang => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 6,
                  border: 'none',
                  background: activeTab === lang ? 'var(--brand-gradient)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'background var(--transition-fast)'
                }}
              >
                {lang.toUpperCase() === 'NODEJS' ? 'Node.js' : lang.toUpperCase() === 'CSHARP' ? 'C# .NET' : lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Code display */}
        <div style={{ background: '#0d1117', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--glass-border)', position: 'relative' }}>
          <button 
            onClick={() => handleCopy(codeTemplates[activeTab], activeTab)}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(15,23,42,0.05)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
          >
            {copiedText === activeTab ? <CheckCircle size={14} color="var(--status-success)" /> : <Copy size={14} />}
            {copiedText === activeTab ? 'Kopyalandı' : 'Kodu Kopyala'}
          </button>
          <pre style={{ margin: 0, color: '#e6edf3', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', overflowX: 'auto' }}>
            {codeTemplates[activeTab]}
          </pre>
        </div>
      </div>

      {/* Platform specific guides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Web Sitesi Entegrasyonu */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="var(--brand-primary)" /> Web Siteleri İçin
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Kullanıcı web sayfanızda iken "WhatsApp ile Doğrula" butonuna tıklar. Sayfada bir "Sinyal Bekleniyor..." göstergesi açılır ve arka planda sunucunuza doğrulama durumunu soran kısa aralıklarla (polling) istekler gönderilir.
          </p>
          <div style={{ background: '#0d1117', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>HTML Linki:</div>
            <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto' }}>
{`<a href="https://wa.me/CIHAZ_NUMARASI?text=${user?.prefix || 'PREFIX'}+791104" target="_blank" class="btn">
  WhatsApp ile Giriş Yap
</a>`}
            </pre>
          </div>
        </div>

        {/* Mobil Uygulama Entegrasyonu */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={18} color="var(--brand-primary)" /> Mobil Uygulamalar İçin
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            React Native veya Flutter gibi frameworklerde, WhatsApp derin linkini (Deep Link) tetikleyerek kullanıcıyı doğrudan WhatsApp uygulamasına yönlendirebilirsiniz.
          </p>
          <div style={{ background: '#0d1117', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>React Native Yönlendirme:</div>
            <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto' }}>
{`import { Linking } from 'react-native';

const launchQimlik = (code) => {
  const url = \`https://wa.me/CIHAZ_NUMARASI?text=${user?.prefix || 'PREFIX'}+\${code}\`;
  Linking.openURL(url);
};`}
            </pre>
          </div>
        </div>

        {/* Masaüstü Entegrasyonu */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Monitor size={18} color="var(--brand-primary)" /> Masaüstü Yazılımları İçin
          </h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Windows, macOS veya Linux tabanlı (C#, Java, Electron vb.) masaüstü yazılımlarında, varsayılan tarayıcıyı WhatsApp linki ile açarak kullanıcının mobil veya masaüstü WhatsApp üzerinden mesaj göndermesini sağlayabilirsiniz.
          </p>
          <div style={{ background: '#0d1117', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', fontFamily: 'monospace' }}>C# .NET Process Start:</div>
            <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto' }}>
{`using System.Diagnostics;

void OpenWhatsApp(string code) {
    string url = $"https://wa.me/CIHAZ_NUMARASI?text=${user?.prefix || "PREFIX"}+{code}";
    Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
}`}
            </pre>
          </div>
        </div>

      </div>

      {/* Popup / Modal Integration Card */}
      <div className="glass-card" style={{ marginBottom: '2rem', marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={20} color="var(--brand-primary)" /> Popup (Pencere) ile Kolay Doğrulama
        </h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Kullanıcı deneyimini en üst düzeye çıkarmak için (tıpkı 3D Secure kart ödeme sayfalarında olduğu gibi) web sitenizde bir popup penceresi açabilirsiniz. Kullanıcı pencerede doğrulama işlemini tamamladığında, pencere otomatik olarak kapanacak ve sitenizdeki ana pencereye (parent window) doğrulandı bildirimi gönderilecektir.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Aşama 1: Sitenizde Popup Açın ve Dinleyin (Javascript)</div>
            <div style={{ background: '#0d1117', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)', position: 'relative' }}>
              <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`// 1. Popup penceresini açın
const popupUrl = "https://qimlik.com/verify?prefix=${user?.prefix || 'PREFIX'}&code=791104&gateway_phone=905303700589";
const popup = window.open(popupUrl, "Qimlik OTP", "width=500,height=650,resizable=yes");

// 2. Doğrulama sonucunu dinleyin
window.addEventListener("message", (event) => {
  // Sadece Qimlik'ten gelen mesajları kabul edin
  if (event.origin !== "https://qimlik.com") return;
  
  if (event.data.type === "qimlik_verification" && event.data.status === "verified") {
    console.log("Kullanıcı doğrulandı! Kod: " + event.data.code);
    // TODO: Kullanıcıyı sitenizde içeri alın veya işlemi tamamlayın
  }
});`}
              </pre>
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Popup Link Yapısı Parametreleri</div>
            <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', height: 'calc(100% - 1.5rem)' }}>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong><code>prefix</code></strong>: Firmanızın ön eki (örn: <code>{user?.prefix || 'ASHE'}</code>) - <em>Zorunlu</em></li>
                <li><strong><code>code</code></strong>: Ürettiğiniz 6 haneli doğrulama kodu - <em>Zorunlu</em></li>
                <li><strong><code>gateway_phone</code></strong>: Aktif Qimlik Gateway telefon numaranız (örn: <code>905303700589</code>) - <em>İsteğe Bağlı</em></li>
                <li><strong><code>phone</code></strong>: Kullanıcının kendi telefon numarası (örn: <code>+905555555555</code>, ekranda göstermek için) - <em>İsteğe Bağlı</em></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
