import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  LogIn, 
  LogOut, 
  Navigation, 
  RefreshCw 
} from 'lucide-react';

export default function Logs({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.token;
  const isCompany = user?.role === 'company';

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (isCompany) {
        const res = await axios.get(`${host}/api/mesai/company/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
      } else {
        // For employee, fetch their personal report
        const res = await axios.get(`${host}/api/mesai/public/employees/${user.id}/report`);
        setLogs(res.data.daily);
      }
    } catch (err) {
      console.error('Mesai kayıtları alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text">{isCompany ? 'Saha Mesai Kayıtları' : 'Giriş / Çıkış Geçmişim'}</h1>
          <p className="text-muted">Sahadaki tüm giriş ve çıkış işlemlerinin saat, konum ve GPS mesafe log geçmişi.</p>
        </div>
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          className="btn-outline" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Güncelle
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="spin" size={36} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
          <p className="text-muted">Kayıtlar yükleniyor...</p>
        </div>
      ) : isCompany ? (
        /* --- COMPANY VIEW: LIST OF ALL LOGS --- */
        <div className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Personel</th>
                  <th>İşlem Türü</th>
                  <th>Çalışma Alanı</th>
                  <th>GPS Koordinatları</th>
                  <th>Sapma Mesafesi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const dateVal = new Date(log.created_at);
                  const isClose = log.calculated_distance <= 50;

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div>{dateVal.toLocaleDateString('tr-TR')}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                          {dateVal.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <User size={14} className="text-muted" />
                          {log.employee_name}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${log.log_type === 'check_in' ? 'success' : 'warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {log.log_type === 'check_in' ? <LogIn size={12} /> : <LogOut size={12} />}
                          {log.log_type === 'check_in' ? 'İş Girişi' : 'İş Çıkışı'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} className="text-muted" />
                          {log.location_name}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {log.gps_latitude?.toFixed(5)}, {log.gps_longitude?.toFixed(5)}
                      </td>
                      <td style={{ fontWeight: 700, color: isClose ? 'var(--status-success)' : '#ef4444' }}>
                        {Math.round(log.calculated_distance)} metre
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                      Henüz mesai giriş/çıkış kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* --- EMPLOYEE VIEW: LIST OF DAILY TIMESHEET DAYS --- */
        <div className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Giriş Saati</th>
                  <th>Çıkış Saati</th>
                  <th>Çalışılan Süre</th>
                  <th>Bulunduğu Şantiye</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((day, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <Calendar size={14} className="text-muted" />
                        {day.date}
                      </div>
                    </td>
                    <td style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                      {day.check_in}
                    </td>
                    <td style={{ color: 'var(--status-warning)', fontWeight: 600 }}>
                      {day.check_out}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {day.hours} Saat
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={14} className="text-muted" />
                        {day.location}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                      Henüz mesai giriş/çıkış kaydınız bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
