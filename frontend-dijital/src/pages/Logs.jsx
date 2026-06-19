import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, Wrench, ChevronDown, ChevronUp, Image } from 'lucide-react';

export default function Logs({ user }) {
  const [logs, setLogs] = useState([]);
  const [expandedLog, setExpandedLog] = useState(null);

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.password;
  const isCompany = user?.role === 'company';

  const fetchLogs = async () => {
    try {
      let res;
      if (isCompany) {
        res = await axios.get(`${host}/api/dijital/company/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.get(`${host}/api/dijital/technician/${user.id}/logs`);
      }
      setLogs(res.data);
    } catch (err) {
      console.error('Rapor kayıtları alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedLog(expandedLog === id ? null : id);
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">{isCompany ? 'Bakım ve Arıza Raporları' : 'Son Raporlarım'}</h1>
        <p className="text-muted">Sahada gerçekleştirilen servis, kontrol ve bakım rapor geçmişi.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {logs.map(log => {
          const isExpanded = expandedLog === log.id;
          return (
            <div 
              key={log.id} 
              className="glass-card" 
              style={{ 
                padding: '1.25rem', 
                border: isExpanded ? '1px solid var(--brand-primary)' : '1px solid var(--glass-border)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Header summary of report */}
              <div 
                onClick={() => toggleExpand(log.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', fontFamily: 'monospace' }}>{log.machine_code}</span>
                    <strong style={{ fontSize: '1rem', color: 'white' }}>{log.machine_name}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isCompany ? `Teknisyen: ${log.technician_name}` : `Tarih: ${new Date(log.created_at).toLocaleDateString()}`}
                  </div>
                  <span className={`badge ${log.status_after === 'active' ? 'success' : log.status_after === 'maintenance' ? 'warning' : 'error'}`}>
                    {log.status_after === 'active' ? 'Aktif' : log.status_after === 'maintenance' ? 'Bakımda' : 'Arızalı'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} />
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded details containing dynamic fields and image */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '1.25rem', paddingTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  
                  {/* Dynamic checklist details */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--brand-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>Dinamik Kontrol Listesi Sonuçları</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                      {Object.entries(log.form_data).map(([key, val]) => (
                        <div key={key}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{key}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {typeof val === 'boolean' ? (val ? 'Evet' : 'Hayır') : val}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technician Notes & Photo */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--brand-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Teknisyen Notları</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'rgba(0,0,0,0.1)', padding: '0.85rem', borderRadius: 8, minHeight: '60px', margin: 0 }}>
                        {log.notes || 'Not eklenmemiş.'}
                      </p>
                    </div>

                    {log.photo_base64 && (
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--brand-secondary)', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Image size={16} /> Servis Kanıt Fotoğrafı
                        </h4>
                        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '0.5rem', borderRadius: 8, display: 'inline-block' }}>
                          <img 
                            src={log.photo_base64} 
                            alt="Servis Rapor Görseli" 
                            style={{ display: 'block', maxWidth: '280px', maxHeight: '180px', borderRadius: 6, objectFit: 'contain' }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileText size={48} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
            <p className="text-muted">Kayıtlı servis/bakım raporu bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
