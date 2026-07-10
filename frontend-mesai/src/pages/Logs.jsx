import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
import { 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  LogIn, 
  LogOut, 
  Navigation, 
  RefreshCw,
  Download,
  Coffee,
  CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { isReadOnly } from '../utils/role';

export default function Logs({ user }) {
  const readOnly = isReadOnly();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState(null);
  const [activeTab, setActiveTab] = useState('logs'); // logs | leaves
  const [leaves, setLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('annual');

  const host = getApiUrl();
  const token = user?.token;
  const isCompany = user?.role === 'company';

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (isCompany) {
        const resLeaves = await axios.get(`${host}/api/mesai/company/leaves`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaves(resLeaves.data);
        const res = await axios.get(`${host}/api/mesai/company/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
      } else {
        // For employee, fetch their personal report
        const res = await axios.get(`${host}/api/mesai/worker/report`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setLogs(res.data.daily);
      }
    } catch (err) {
      console.error('Mesai kayıtları alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${host}/api/mesai/worker/leaves`, {
        start_date: leaveStart,
        end_date: leaveEnd,
        leave_type: leaveType
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowLeaveModal(false);
      setLeaveStart(''); setLeaveEnd('');
      toast.success('İzin talebiniz gönderildi.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleUpdateLeave = async (id, status) => {
    try {
      await axios.put(`${host}/api/mesai/company/leaves/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      Tarih: new Date(log.created_at).toLocaleDateString('tr-TR'),
      Saat: new Date(log.created_at).toLocaleTimeString('tr-TR'),
      Personel: log.employee_name,
      Islem: log.log_type === 'check_in' ? 'Giriş' : log.log_type === 'check_out' ? 'Çıkış' : log.log_type === 'break_start' ? 'Molaya Çıkış' : 'Moladan Dönüş',
      Konum: log.location_name,
      Sapma: Math.round(log.calculated_distance) + 'm'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MesaiKayıtları");
    XLSX.writeFile(wb, "Mesai_Raporu.xlsx");
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">{isCompany ? 'Mesai ve İzin Yönetimi' : 'Giriş/Çıkış ve İzinlerim'}</h1>
          <p className="text-muted">Personel mesai logları, konum bilgileri ve izin talepleri.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isCompany && activeTab === 'logs' && (
            <button onClick={exportExcel} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Download size={16} /> Excel İndir
            </button>
          )}
          {!isCompany && (
            <button onClick={() => setShowLeaveModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Calendar size={16} /> İzin Talep Et
            </button>
          )}
          <button onClick={fetchLogs} disabled={loading} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Güncelle
          </button>
        </div>
      </header>

      {/* Tabs */}
      {isCompany && (
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
          <button onClick={() => setActiveTab('logs')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: activeTab === 'logs' ? 'var(--brand-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'logs' ? '2px solid var(--brand-primary)' : 'none' }}>Giriş/Çıkış ve Mola Kayıtları</button>
          <button onClick={() => setActiveTab('leaves')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', color: activeTab === 'leaves' ? 'var(--brand-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'leaves' ? '2px solid var(--brand-primary)' : 'none' }}>İzin Talepleri</button>
        </div>
      )}


      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw className="spin" size={36} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
          <p className="text-muted">Kayıtlar yükleniyor...</p>
        </div>
      ) : isCompany ? (
        /* --- COMPANY VIEW: LIST OF ALL LOGS --- */
        activeTab === 'logs' ? (
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
                        <span className={`badge ${log.log_type === 'check_in' ? 'success' : log.log_type === 'check_out' ? 'warning' : 'primary'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {log.log_type === 'check_in' ? <LogIn size={12} /> : log.log_type === 'check_out' ? <LogOut size={12} /> : <Coffee size={12} />}
                          {log.log_type === 'check_in' ? 'İş Girişi' : log.log_type === 'check_out' ? 'İş Çıkışı' : log.log_type === 'break_start' ? 'Molaya Çıktı' : 'Moladan Döndü'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} className="text-muted" />
                          {log.location_name}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {log.gps_latitude?.toFixed(5)}, {log.gps_longitude?.toFixed(5)}
                        <button onClick={() => setSelectedMap({lat: log.gps_latitude, lng: log.gps_longitude, name: log.employee_name})} style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>Harita</button>
                      </td>
                      <td style={{ fontWeight: 700, color: isClose ? 'var(--status-success)' : '#ef4444' }}>
                        {Math.round(log.calculated_distance)} metre
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: 0 }}>
                      <EmptyState
                        icon={FileText}
                        title="Henüz mesai kaydı yok"
                        description="Personeliniz şantiyedeki QR kodu okutup giriş/çıkış yaptıkça tüm hareketler konum bilgisiyle birlikte burada listelenecek."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
              ) : (
          <div className="glass-card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Personel</th>
                    <th>Tür</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                    <th>Durum / İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(lv => (
                    <tr key={lv.id}>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(lv.created_at).toLocaleDateString('tr-TR')}</td>
                      <td style={{ fontWeight: 600 }}>{lv.employee_name}</td>
                      <td>{lv.leave_type === 'annual' ? 'Yıllık İzin' : lv.leave_type === 'sick' ? 'Hastalık/Rapor' : 'Ücretsiz İzin'}</td>
                      <td>{lv.start_date}</td>
                      <td>{lv.end_date}</td>
                      <td>
                        {lv.status === 'pending' ? (
                          readOnly ? (
                            <span className="badge warning">Bekliyor</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleUpdateLeave(lv.id, 'approved')} style={{ background: 'var(--status-success)', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>Onayla</button>
                              <button onClick={() => handleUpdateLeave(lv.id, 'rejected')} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>Reddet</button>
                            </div>
                          )
                        ) : (
                          <span className={`badge ${lv.status === 'approved' ? 'success' : 'error'}`}>{lv.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: 0 }}>
                        <EmptyState
                          icon={Calendar}
                          title="Bekleyen izin talebi yok"
                          description="Personelleriniz uygulamadan yıllık izin, rapor veya ücretsiz izin talebi oluşturduğunda onayınız için burada listelenir."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
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
                      {day.late_minutes > 0 && <span style={{ display: 'block', fontSize: '0.7rem', color: '#ef4444' }}>{day.late_minutes} dk geç</span>}
                    </td>
                    <td style={{ color: 'var(--status-warning)', fontWeight: 600 }}>
                      {day.check_out}
                      {day.early_minutes > 0 && <span style={{ display: 'block', fontSize: '0.7rem', color: '#ef4444' }}>{day.early_minutes} dk erken</span>}
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
                    <td colSpan="5" style={{ padding: 0 }}>
                      <EmptyState
                        icon={Calendar}
                        title="Henüz giriş/çıkış kaydınız yok"
                        description="Şantiyedeki QR kodu telefonunuzla okutarak ilk mesainizi başlatın. Tüm giriş/çıkış geçmişiniz burada görünecek."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    
      {selectedMap && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '600px', maxWidth: '90%', background: '#fff' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Konum Haritası</span>
              <button onClick={() => setSelectedMap(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </h3>
            <div style={{ height: '400px', borderRadius: 8, overflow: 'hidden' }}>
              <MapContainer center={[selectedMap.lat, selectedMap.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedMap.lat, selectedMap.lng]}>
                  <Popup>{selectedMap.name} - Konumu</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}


      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400, padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>İzin / Rapor Talebi</h3>
            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>İzin Türü</label>
                <select required style={{ width: '100%', padding: '0.5rem', borderRadius: 6 }} value={leaveType} onChange={e=>setLeaveType(e.target.value)}>
                  <option value="annual">Yıllık İzin (Ücretli)</option>
                  <option value="sick">Hastalık / Rapor</option>
                  <option value="unpaid">Ücretsiz İzin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Başlangıç Tarihi</label>
                  <input type="date" required style={{ width: '100%', padding: '0.5rem', borderRadius: 6 }} value={leaveStart} onChange={e=>setLeaveStart(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>Bitiş Tarihi</label>
                  <input type="date" required style={{ width: '100%', padding: '0.5rem', borderRadius: 6 }} value={leaveEnd} onChange={e=>setLeaveEnd(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn-outline" style={{ flex: 1 }}>İptal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Talep Et</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
