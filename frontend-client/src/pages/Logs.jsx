import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Inbox } from 'lucide-react';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

export default function Logs({ user }) {
  const [logs, setLogs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/api/client/${user.id}/logs`);
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoaded(true);
      }
    };
    if (user?.id) fetchLogs();
  }, [user]);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">İşlem Kayıtları</h1>
        <p className="text-muted">Sisteminize gönderilen OTP bildirimlerinin (webhook) son 200 kaydı.</p>
      </header>

      <div className="glass-card">
        {loaded && logs.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Henüz doğrulama işlemi yok"
            description="Entegrasyonunuzu tamamlayıp ilk doğrulamayı test ettiğinizde, tüm işlem kayıtları burada listelenecektir."
            actionLabel="Entegrasyon Rehberini Aç"
            onAction={() => navigate('/integration')}
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Alıcı Numara</th>
                  <th>Gelen Mesaj</th>
                  <th>İletim Durumu</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="text-muted">{new Date(l.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 500 }}>{l.phone_number}</td>
                    <td className="text-muted" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.message_body}
                    </td>
                    <td>
                      <span className={`badge ${l.status === 'success' ? 'success' : 'error'}`}>
                        {l.status === 'success' ? 'İletildi' : 'Hata Oluştu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
