import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ApiDocs({ user }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">API & Entegrasyon</h1>
        <p className="text-muted">Sisteminizi Qimlik'e bağlamak için gereken kimlik bilgileri.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: 800 }}>
        
        {/* API Info Card */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Erişim Bilgileriniz</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Atanan Prefix (Ön Ek)</div>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 8, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--brand-primary)' }}>
                {user?.prefix}
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Kullanıcılarınız SMS metnine bu ön eki yazarak size kod gönderecektir. (Örn: {user?.prefix} 1234)
              </p>
            </div>

            <div>
              <div className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>API Key</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="password" 
                  value="••••••••••••••••" 
                  readOnly 
                  style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white', outline: 'none' }}
                />
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }}>
                  Yalnızca Admin Değiştirebilir
                </button>
              </div>
            </div>

            <div>
              <div className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Kayıtlı Webhook URL</div>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{user?.webhook_url}</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Doğrulanan kodlar bu adrese POST isteği olarak iletilir.
              </p>
            </div>
          </div>
        </div>

        {/* Webhook Payload Example */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Örnek Webhook Verisi (Payload)</h2>
          <div style={{ background: '#0d1117', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--glass-border)', position: 'relative' }}>
            <button 
              onClick={() => handleCopy(`{\n  "prefix": "${user?.prefix}",\n  "user_phone": "+905xxxxxxxxx",\n  "code": "123456",\n  "full_message": "${user?.prefix} 123456",\n  "status": "verified"\n}`)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {copied ? <CheckCircle size={16} color="var(--status-success)" /> : <Copy size={16} />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
            <pre style={{ margin: 0, color: '#e6edf3', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5' }}>
{`{
  "prefix": "${user?.prefix}",
  "user_phone": "+905xxxxxxxxx",
  "code": "123456",
  "full_message": "${user?.prefix} 123456",
  "status": "verified"
}`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
