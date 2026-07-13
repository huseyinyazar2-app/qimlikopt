import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, Globe, Terminal, Code, HelpCircle } from 'lucide-react';
import { GATEWAY_PHONE } from '../config';

export default function PopupGuide({ user }) {
  const [testStatus, setTestStatus] = useState('idle'); // 'idle', 'testing', 'success'
  const [testCode, setTestCode] = useState('');
  const [copied, setCopied] = useState(false);

  const gatewayPhone = `+${GATEWAY_PHONE}`;

  // Handle message listener for our own live demo test
  useEffect(() => {
    const handleMessage = (event) => {
      // Accept both qimlik.com and localhost for testing
      if (!event.origin.includes('qimlik.com') && !event.origin.includes('localhost') && !event.origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data.type === 'qimlik_verification' && event.data.status === 'verified') {
        if (event.data.code === testCode) {
          setTestStatus('success');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [testCode]);

  const handleStartTest = () => {
    // Generate a random 6-digit code for testing
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setTestCode(randomCode);
    setTestStatus('testing');

    // Clean phone number
    const cleanPhone = gatewayPhone.replace(/[^0-9]/g, '');

    // Open verification popup
    const popupUrl = `${window.location.protocol}//${window.location.host.replace('panel', 'www').replace('5002', '5003')}/verify?prefix=${user?.prefix || 'PREFIX'}&code=${randomCode}&gateway_phone=${cleanPhone}`;
    const left = (window.screen.width - 500) / 2;
    const top = (window.screen.height - 650) / 2;
    
    window.open(
      popupUrl, 
      'Qimlik OTP Test', 
      `width=500,height=650,left=${left},top=${top},resizable=yes`
    );
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippet = `<!-- 1. HTML Butonu (Web Sitenizde İstediğiniz Yere Ekleyin) -->
<button onclick="startQimlikVerification()" class="qimlik-btn">
  WhatsApp ile Doğrula
</button>

<script>
function startQimlikVerification() {
  // Rastgele 6 haneli doğrulama kodunu kendi sunucunuzda üretip buraya yerleştirin
  const code = "${testCode || '791104'}"; 
  const prefix = "${user?.prefix || 'PREFIX'}";
  const gatewayPhone = "${gatewayPhone.replace(/[^0-9]/g, '')}"; 
  
  // Qimlik güvenli doğrulama penceresini açın
  const popupUrl = \`https://qimlik.com/verify?prefix=\${prefix}&code=\${code}&gateway_phone=\${gatewayPhone}\`;
  const popup = window.open(popupUrl, "Qimlik OTP", "width=500,height=650,resizable=yes");
}

// Qimlik'ten gelen başarılı doğrulama bildirimini dinleyen mesaj mekanizması
window.addEventListener("message", (event) => {
  // Güvenlik için sadece resmi qimlik.com adresinden gelen mesajları kabul edin
  if (event.origin !== "https://qimlik.com") return;
  
  if (event.data.type === "qimlik_verification" && event.data.status === "verified") {
    alert("Başarıyla doğrulandı! Kod: " + event.data.code);
    
    // TODO: Burada kendi sunucunuza kullanıcının doğrulandığını bildiren bir istek gönderin.
    // Örneğin: window.location.href = "/islem-tamam?code=" + event.data.code;
  }
});
</script>`;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Globe size={32} /> Açılır Pencere (Popup) ile Doğrulama
        </h1>
        <p className="text-muted">Kullanıcının web sitenizden ayrılmadan, tıpkı banka 3D Secure ekranlarında olduğu gibi WhatsApp üzerinden kimliğini doğrulaması için bu yöntemi kullanabilirsiniz.</p>
      </header>

      {/* Benefits Card */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Bu Yöntem Neden Çok Kolay?</h2>
        <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Sıfır Sunucu Trafiği:</strong> Kodun doğrulanıp doğrulanmadığını öğrenmek için kendi sunucularınızdan sürekli istek (polling) yapmak zorunda kalmazsınız.</li>
          <li><strong>Hazır Arayüz:</strong> QR kod oluşturma, WhatsApp linki üretme ve süreyi sayma gibi tüm zor işleri Qimlik hazır arayüzü üstlenir.</li>
          <li><strong>Güvenli İletişim:</strong> Tarayıcılar arası güvenli <code>postMessage</code> protokolü sayesinde, kod doğrulandığı an ana sayfanız anında haberdar olur.</li>
        </ul>
      </div>

      {/* Interactive Live Demo */}
      <div className="glass-card" style={{ marginBottom: '2rem', border: testStatus === 'success' ? '1px solid var(--status-success)' : '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Canlı Entegrasyon Simülatörü</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Aşağıdaki butona basarak açılır pencere doğrulama akışını kendi tarayıcınızda canlı olarak test edin. Kod doğrulanınca bu sayfa anında yeşile dönecektir.
        </p>

        <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1.5rem', borderRadius: 8, textAlign: 'center' }}>
          {testStatus === 'idle' && (
            <div>
              <button onClick={handleStartTest} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Canlı Testi Başlat <ExternalLink size={16} />
              </button>
            </div>
          )}

          {testStatus === 'testing' && (
            <div>
              <div style={{ color: 'var(--status-warning)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Doğrulama Penceresi Açıldı. Sinyal Bekleniyor...
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Test Kodunuz: <strong>{testCode}</strong>. Test etmek için açılan penceredeki adımları izleyin.
              </p>
              <button onClick={handleStartTest} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Yeniden Aç
              </button>
            </div>
          )}

          {testStatus === 'success' && (
            <div>
              <div style={{ color: 'var(--status-success)', fontWeight: 700, fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle size={24} /> Canlı Entegrasyon Başarılı!
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Doğrulama penceresinden <strong>{testCode}</strong> numaralı kodun doğrulama mesajı başarıyla yakalandı ve pencere otomatik kapatıldı.
              </p>
              <button onClick={() => setTestStatus('idle')} className="btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Yeni Test Yap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Code Snippet and explanation */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Sitenize Eklemeniz Gereken Kod (Tek Dosya)</h2>
          <button 
            onClick={() => handleCopy(codeSnippet)} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {copied ? 'Kopyalandı!' : 'Kodu Kopyala'}
          </button>
        </div>

        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Müşterinizin (veya yazılımcınızın) sitenize eklemesi gereken tek şey aşağıdaki HTML ve Javascript kodudur. Herhangi bir kütüphane veya paket yükleme gereksinimi yoktur.
        </p>

        <div style={{ background: '#0d1117', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--glass-border)', position: 'relative' }}>
          <pre style={{ margin: 0, color: '#e6edf3', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', overflowX: 'auto' }}>
            {codeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
