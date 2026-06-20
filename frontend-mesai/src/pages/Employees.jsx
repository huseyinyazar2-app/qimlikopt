import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Phone, User, Camera, Calendar, Clock, Pause, Play, ChevronRight, X, Image, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Employees({ user }) {
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null); // Employee selected for report
  const [reportData, setReportData] = useState(null); // { daily, monthly }

  // New employee states
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [photo, setPhoto] = useState(null); // Base64 compressed profile image
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const host = `http://${window.location.hostname}:3303`;
  const token = user?.password;

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${host}/api/mesai/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
    } catch (err) {
      console.error('Personel listesi yüklenemedi:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(
        `${host}/api/mesai/employees`,
        { name, surname, phone_number: phone, photo_base64: photo, hourly_wage: hourlyWage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setName('');
      setSurname('');
      setPhone('');
      setPhoto(null);
      setHourlyWage('');
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Personel eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(
        `${host}/api/mesai/employees/${id}/toggle`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchEmployees();
      if (selectedEmp && selectedEmp.id === id) {
        setSelectedEmp(prev => ({ ...prev, is_active: !currentStatus }));
      }
    } catch (err) {
      console.error('Durum değiştirilemedi:', err);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max_size = 200; // Small resolution avatar
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setPhoto(compressedBase64);
      };
    };
  };

  const exportEmployeeExcel = () => {
    if (!reportData || !selectedEmp) return;
    
    const wsDaily = XLSX.utils.json_to_sheet(reportData.daily.map(day => ({
      'Tarih': day.date,
      'Giriş': day.check_in,
      'Çıkış': day.check_out,
      'Net Süre (Saat)': day.hours,
      'Mola Süresi (Saat)': day.break_hours,
      'Günlük Kazanç': `₺${day.wage}`
    })));
    
    const wsMonthly = XLSX.utils.json_to_sheet(reportData.monthly.map(m => ({
      'Ay': m.month,
      'Çalışılan Süre (Saat)': m.hours,
      'Mola Süresi (Saat)': m.break_hours,
      'Çalışılan Gün Sayısı': m.days_present,
      'İzinli Gün Sayısı': m.days_leave,
      'Toplam Kazanç': `₺${m.wage}`
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDaily, "Günlük Rapor");
    XLSX.utils.book_append_sheet(wb, wsMonthly, "Aylık Özet");
    
    const filename = `${selectedEmp.name}_${selectedEmp.surname}_Mesai_Raporu.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const viewReport = async (emp) => {
    setSelectedEmp(emp);
    setReportData(null);
    try {
      const res = await axios.get(`${host}/api/mesai/employees/${emp.id}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
    } catch (err) {
      console.error('Çalışma raporu yüklenemedi:', err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedEmp ? '1fr 1.2fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
      
      {/* LEFT COLUMN: Employees List */}
      <div>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="gradient-text">Personel Yönetimi</h1>
            <p className="text-muted">Saha personellerinizi listeleyin ve durumlarını yönetin.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={18} /> Yeni Personel Ekle
          </button>
        </header>

        <div className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Personel</th>
                  <th>Telefon</th>
                  <th>Kayıt</th>
                  <th>Durum</th>
                  <th>Rapor</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr 
                    key={emp.id} 
                    style={{ background: selectedEmp?.id === emp.id ? 'rgba(2, 132, 199, 0.1)' : 'transparent', cursor: 'pointer' }}
                    onClick={() => viewReport(emp)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {emp.photo_base64 ? (
                          <img src={emp.photo_base64} alt={emp.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} />
                          </div>
                        )}
                        <span style={{ fontWeight: 500 }}>{emp.name} {emp.surname}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{emp.phone_number}</td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(emp.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${emp.is_active ? 'success' : 'error'}`}>
                        {emp.is_active ? 'Aktif' : 'Askıda'}
                      </span>
                    </td>
                    <td>
                      <ChevronRight size={18} className="text-muted" />
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Kayıtlı saha personeli bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Selected Employee Retrospective Reports */}
      {selectedEmp && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignSelf: 'start', position: 'sticky', top: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {selectedEmp.photo_base64 ? (
                <img src={selectedEmp.photo_base64} alt={selectedEmp.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} />
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>{selectedEmp.name} {selectedEmp.surname}</h2>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedEmp.phone_number}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {reportData && (
                <button 
                  onClick={exportEmployeeExcel}
                  className="btn-outline"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
                >
                  <Download size={14} /> Excel Raporu
                </button>
              )}
              <button 
                onClick={() => toggleStatus(selectedEmp.id, selectedEmp.is_active)}
                className={selectedEmp.is_active ? "btn-outline" : "btn-primary"}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {selectedEmp.is_active ? <Pause size={14} /> : <Play size={14} />}
                {selectedEmp.is_active ? 'Askıya Al' : 'Aktifleştir'}
              </button>
              <button 
                onClick={() => setSelectedEmp(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {reportData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Monthly Summaries */}
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--brand-secondary)', marginBottom: '0.75rem' }}>Aylık Çalışma Toplamları</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {reportData.monthly.map((m, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.8)', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.month}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--text-primary)' }}>{m.hours} Saat</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--status-success)' }}>₺{m.wage}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gün: {m.days_present} | İzin: {m.days_leave} | Mola: {m.break_hours}s</div>
                    </div>
                  ))}
                  {reportData.monthly.length === 0 && (
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>Aylık çalışma verisi bulunmuyor.</div>
                  )}
                </div>
              </div>

              {/* Daily logs timesheet */}
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--brand-secondary)', marginBottom: '0.75rem' }}>Günlük Mesai Detayları</h3>
                <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: 8 }}>
                  <table style={{ margin: 0, width: '100%' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Tarih</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Giriş</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Çıkış</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Süre (S)</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Mola (S)</th>
                        <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Kazanç (₺)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.daily.map((day, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>{day.date}</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--status-success)' }}>{day.check_in}</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--status-warning)' }}>{day.check_out}</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>{day.hours}</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>{day.break_hours}</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--status-success)' }}>₺{day.wage}</td>
                        </tr>
                      ))}
                      {reportData.daily.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem' }} className="text-muted">
                            Bu personele ait çalışma kaydı bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }} className="text-muted">
              Mesai çalışma raporları yükleniyor...
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400 }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni Personel Kaydet</h2>
            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Profile Photo Upload and compression preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {photo ? (
                  <img src={photo} alt="Avatar Preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)' }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Users size={32} />
                  </div>
                )}
                <label className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                  <Camera size={14} /> Fotoğraf Ekle
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Personel Adı</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Ahmet" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Personel Soyadı</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={surname} onChange={e => setSurname(e.target.value)} placeholder="Örn: Yılmaz" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Telefon Numarası (WhatsApp ile Giriş İçin)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input required style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Örn: +905XXXXXXXXX" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Saatlik Ücret (₺)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>₺</span>
                  <input type="number" step="0.01" style={inputStyle} value={hourlyWage} onChange={e => setHourlyWage(e.target.value)} placeholder="Örn: 250" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
