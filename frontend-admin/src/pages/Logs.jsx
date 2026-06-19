import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Logs() {
  const getApiUrl = () => window.location.hostname.endsWith('qimlik.com') ? 'https://api.qimlik.com' : `http://${window.location.hostname}:3303`;
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/api/admin/logs`);
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">İşlem Kayıtları (Loglar)</h1>
        <p className="text-muted">Müşterilere iletilen tüm OTP işlemlerinin kayıtları. (Faturalandırma baz alınır)</p>
      </header>

      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Müşteri</th>
                <th>Alıcı Numara</th>
                <th>Mesaj</th>
                <th>Durum</th>
                <th>Hata Detayı</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="text-muted">{new Date(l.created_at).toLocaleString()}</td>
                  <td style={{ fontWeight: 500 }}>
                    {l.company_name ? `${l.company_name} (${l.prefix})` : '-'}
                  </td>
                  <td>{l.phone_number}</td>
                  <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.message_body}
                  </td>
                  <td>
                    <span className={`badge ${l.status === 'success' ? 'success' : (l.status === 'invalid_prefix' ? 'warning' : 'error')}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="text-muted" style={{ fontSize: '0.85rem' }}>{l.error_details || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Hiç kayıt bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
