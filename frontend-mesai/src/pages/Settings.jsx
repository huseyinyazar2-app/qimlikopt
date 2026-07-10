import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Save, Info, Calculator, CalendarDays, Plus, Trash2, Lock, Camera } from 'lucide-react';
import { isReadOnly } from '../utils/role';

const WEEKDAYS = [
  { v: '1', l: 'Pzt' },
  { v: '2', l: 'Sal' },
  { v: '3', l: 'Çar' },
  { v: '4', l: 'Per' },
  { v: '5', l: 'Cum' },
  { v: '6', l: 'Cmt' },
  { v: '0', l: 'Paz' },
];
const f2 = (n) => (Number(n) || 0).toFixed(2);

export default function Settings({ user }) {
  const readOnly = isReadOnly();
  const [shiftType, setShiftType] = useState('company_wide');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [tolerance, setTolerance] = useState(15);
  const [deductBreakTime, setDeductBreakTime] = useState(true);
  const [requireSelfie, setRequireSelfie] = useState(false);
  const [selfieRetention, setSelfieRetention] = useState(30);
  const [loading, setLoading] = useState(false);
  const host = getApiUrl();
  const headers = { Authorization: `Bearer ${user.token}` };

  // --- Payroll settings ---
  const [payroll, setPayroll] = useState({
    overtime_multiplier: 1.5,
    weekend_multiplier: 2,
    holiday_multiplier: 2,
    daily_normal_hours: 8,
    annual_leave_days: 14,
    weekend_days: '0',
  });
  const [payrollLoading, setPayrollLoading] = useState(false);

  // --- Holidays ---
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ holiday_date: '', name: '', is_half_day: false, multiplier: '' });
  const [holidayLoading, setHolidayLoading] = useState(false);

  const fetchPayroll = async () => {
    try {
      const res = await axios.get(`${host}/api/mesai/company/payroll-settings`, { headers });
      if (res.data) {
        setPayroll({
          overtime_multiplier: res.data.overtime_multiplier ?? 1.5,
          weekend_multiplier: res.data.weekend_multiplier ?? 2,
          holiday_multiplier: res.data.holiday_multiplier ?? 2,
          daily_normal_hours: res.data.daily_normal_hours ?? 8,
          annual_leave_days: res.data.annual_leave_days ?? 14,
          weekend_days: res.data.weekend_days ?? '0',
        });
      }
    } catch (err) {
      console.error('Bordro ayarları yüklenemedi:', err);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(`${host}/api/mesai/company/holidays`, { headers });
      setHolidays(res.data || []);
    } catch (err) {
      console.error('Tatiller yüklenemedi:', err);
    }
  };

  const savePayroll = async (e) => {
    e.preventDefault();
    setPayrollLoading(true);
    try {
      await axios.put(`${host}/api/mesai/company/payroll-settings`, {
        overtime_multiplier: Number(payroll.overtime_multiplier),
        weekend_multiplier: Number(payroll.weekend_multiplier),
        holiday_multiplier: Number(payroll.holiday_multiplier),
        daily_normal_hours: Number(payroll.daily_normal_hours),
        annual_leave_days: Number(payroll.annual_leave_days),
        weekend_days: payroll.weekend_days,
      }, { headers });
      toast.success('Bordro çarpanları kaydedildi');
    } catch (err) {
      toast.error('Bordro ayarları kaydedilemedi');
    } finally {
      setPayrollLoading(false);
    }
  };

  const toggleWeekendDay = (v) => {
    const set = new Set((payroll.weekend_days || '').split(',').filter(Boolean));
    if (set.has(v)) set.delete(v); else set.add(v);
    const ordered = WEEKDAYS.map(d => d.v).filter(x => set.has(x));
    setPayroll(p => ({ ...p, weekend_days: ordered.join(',') }));
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.holiday_date || !newHoliday.name) {
      toast.error('Tarih ve tatil adı zorunlu');
      return;
    }
    setHolidayLoading(true);
    try {
      await axios.post(`${host}/api/mesai/company/holidays`, {
        holiday_date: newHoliday.holiday_date,
        name: newHoliday.name,
        is_half_day: newHoliday.is_half_day ? 1 : 0,
        multiplier: newHoliday.multiplier === '' ? null : Number(newHoliday.multiplier),
      }, { headers });
      setNewHoliday({ holiday_date: '', name: '', is_half_day: false, multiplier: '' });
      toast.success('Tatil eklendi');
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Tatil eklenemedi');
    } finally {
      setHolidayLoading(false);
    }
  };

  const deleteHoliday = async (id) => {
    try {
      await axios.delete(`${host}/api/mesai/company/holidays/${id}`, { headers });
      toast.success('Tatil silindi');
      fetchHolidays();
    } catch (err) {
      toast.error('Tatil silinemedi');
    }
  };

  useEffect(() => {
    // Fetch current settings
    const fetchSettings = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get(`${host}/api/mesai/company/settings`, { headers });
        const comp = res.data;
        if (comp) {
          setShiftType(comp.shift_type || 'company_wide');
          setShiftStart(comp.shift_start_time || '09:00');
          setShiftEnd(comp.shift_end_time || '18:00');
          setTolerance(comp.tolerance_minutes !== undefined ? comp.tolerance_minutes : 15);
          setDeductBreakTime(comp.deduct_break_time === undefined ? true : !!comp.deduct_break_time);
          setRequireSelfie(!!comp.require_checkin_selfie);
          setSelfieRetention(comp.selfie_retention_days ?? 30);
        }
      } catch (err) {
        console.error('Mevcut ayarlar yuklenirken hata:', err);
      }
    };
    fetchSettings();
    fetchPayroll();
    fetchHolidays();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      await axios.put(`${host}/api/mesai/company/settings`, {
        shift_type: shiftType,
        shift_start_time: shiftStart,
        shift_end_time: shiftEnd,
        tolerance_minutes: tolerance,
        deduct_break_time: deductBreakTime,
        require_checkin_selfie: requireSelfie,
        selfie_retention_days: Number(selfieRetention) || 30
      }, { headers });
      toast.success('Mesai ayarları başarıyla kaydedildi');
    } catch (err) {
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Mesai Ayarları</h1>
        <p className="text-muted">Personelinizin mesai takibi ve geç kalma/erken çıkma kurallarını buradan yönetin.</p>
      </header>

      <div className="glass-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          <SettingsIcon size={20} color="var(--brand-primary)" /> Mesai Kuralları
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Mesai Tipi</label>
            <select 
              value={shiftType} 
              onChange={e => setShiftType(e.target.value)}
              style={inputStyle}
            >
              <option value="company_wide">Şirket Geneli Ortak Saat</option>
              <option value="location_based">Lokasyon / Şube Bazlı Ayrı Saatler</option>
              <option value="flexible">Esnek Mesai (Sadece Toplam Saate Bakılır)</option>
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {shiftType === 'company_wide' && 'Tüm personeller için aşağıda belirlediğiniz saatler geçerli olur.'}
              {shiftType === 'location_based' && 'Her çalışma alanı/şantiye için ayrı mesai saati belirleyebilirsiniz (Lokasyonlar sekmesinden).'}
              {shiftType === 'flexible' && 'Giriş/çıkış saatine bakılmaz, sadece toplam çalışma saati hesaplanır.'}
            </p>
          </div>

          {shiftType === 'company_wide' && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Başlangıç Saati</label>
                <input 
                  type="time" 
                  value={shiftStart}
                  onChange={e => setShiftStart(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Bitiş Saati</label>
                <input 
                  type="time" 
                  value={shiftEnd}
                  onChange={e => setShiftEnd(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
            </div>
          )}

          {shiftType !== 'flexible' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Esneklik Payı (Dakika)</label>
              <input 
                type="number" 
                value={tolerance}
                onChange={e => setTolerance(e.target.value)}
                style={inputStyle}
                min="0"
                max="120"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={14} /> Örn: 15 dakika yazarsanız, {shiftStart}'da başlayan mesaiye {parseInt(shiftStart.split(':')[0])}:{parseInt(shiftStart.split(':')[1]) + 15} kadar geç kalındığında uyarı verilmez.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="deductBreakTime"
              checked={deductBreakTime} 
              onChange={e => setDeductBreakTime(e.target.checked)} 
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="deductBreakTime" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
              Mola ve yemek sürelerini toplam çalışma süresinden düş
            </label>
          </div>

          {/* Faz 6: giriş selfie'si (denetim kaydı — girişi engellemez) */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="requireSelfie"
                checked={requireSelfie}
                onChange={e => setRequireSelfie(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="requireSelfie" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={16} color="var(--brand-primary)" /> Giriş/çıkışta selfie iste
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} /> Personel giriş yaparken ön kameradan bir fotoğraf çekilir ve kayda eklenir. Bu bir <b>denetim kaydıdır</b>: kamera reddedilse veya çalışmasa bile giriş engellenmez. Fotoğraflar aşağıdaki süre sonunda otomatik silinir.
            </p>
            {requireSelfie && (
              <div style={{ marginTop: '0.75rem', maxWidth: 260 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>Selfie saklama süresi (gün)</label>
                <input
                  type="number" min="1" max="365" style={inputStyle}
                  value={selfieRetention}
                  onChange={e => setSelfieRetention(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading || readOnly} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: readOnly ? 0.5 : 1 }}>
              <Save size={18} /> {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* --- BORDRO ÇARPANLARI --- */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          <Calculator size={20} color="var(--brand-primary)" /> Bordro Çarpanları
        </h3>
        <form onSubmit={savePayroll} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Fazla Mesai Çarpanı</label>
              <input type="number" step="0.1" min="1" style={inputStyle} value={payroll.overtime_multiplier}
                onChange={e => setPayroll(p => ({ ...p, overtime_multiplier: e.target.value }))} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hafta Tatili Çarpanı</label>
              <input type="number" step="0.1" min="1" style={inputStyle} value={payroll.weekend_multiplier}
                onChange={e => setPayroll(p => ({ ...p, weekend_multiplier: e.target.value }))} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Resmi Tatil Çarpanı</label>
              <input type="number" step="0.1" min="1" style={inputStyle} value={payroll.holiday_multiplier}
                onChange={e => setPayroll(p => ({ ...p, holiday_multiplier: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Günlük Normal Saat Eşiği</label>
              <input type="number" step="0.5" min="1" max="24" style={inputStyle} value={payroll.daily_normal_hours}
                onChange={e => setPayroll(p => ({ ...p, daily_normal_hours: e.target.value }))} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={14} /> Bu saatin üzeri fazla mesai sayılır.
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Yıllık İzin Günü (Varsayılan)</label>
              <input type="number" step="1" min="0" style={inputStyle} value={payroll.annual_leave_days}
                onChange={e => setPayroll(p => ({ ...p, annual_leave_days: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hafta Tatili Günleri</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {WEEKDAYS.map(d => {
                const active = (payroll.weekend_days || '').split(',').filter(Boolean).includes(d.v);
                return (
                  <button type="button" key={d.v} onClick={() => toggleWeekendDay(d.v)}
                    style={{
                      padding: '0.5rem 0.9rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      border: active ? '1px solid var(--brand-primary)' : '1px solid var(--glass-border)',
                      background: active ? 'var(--brand-primary)' : '#ffffff',
                      color: active ? '#ffffff' : 'var(--text-primary)'
                    }}>
                    {d.l}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Seçili günler hafta tatili çarpanıyla ücretlendirilir.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={payrollLoading || readOnly} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: readOnly ? 0.5 : 1 }}>
              <Save size={18} /> {payrollLoading ? 'Kaydediliyor...' : 'Çarpanları Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* --- RESMİ TATİLLER --- */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          <CalendarDays size={20} color="var(--brand-primary)" /> Resmi Tatiller
        </h3>

        <form onSubmit={addHoliday} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Tarih</label>
            <input type="date" required style={inputStyle} value={newHoliday.holiday_date}
              onChange={e => setNewHoliday(h => ({ ...h, holiday_date: e.target.value }))} />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Tatil Adı</label>
            <input type="text" required style={inputStyle} value={newHoliday.name} placeholder="Örn: Şirket Kuruluş Günü"
              onChange={e => setNewHoliday(h => ({ ...h, name: e.target.value }))} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Çarpan (ops.)</label>
            <input type="number" step="0.1" min="1" style={inputStyle} value={newHoliday.multiplier} placeholder="Varsayılan"
              onChange={e => setNewHoliday(h => ({ ...h, multiplier: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: '0.75rem' }}>
            <input type="checkbox" id="halfDay" checked={newHoliday.is_half_day} style={{ width: 18, height: 18, cursor: 'pointer' }}
              onChange={e => setNewHoliday(h => ({ ...h, is_half_day: e.target.checked }))} />
            <label htmlFor="halfDay" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Yarım gün</label>
          </div>
          <button type="submit" className="btn-primary" disabled={holidayLoading || readOnly} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: readOnly ? 0.5 : 1 }}>
            <Plus size={16} /> Ekle
          </button>
        </form>

        <div className="table-container">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ad</th>
                <th>Tür</th>
                <th>Çarpan</th>
                <th>Kaynak</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holidays.map(h => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.holiday_date}</td>
                  <td>{h.name}</td>
                  <td>{h.is_half_day ? <span className="badge warning">Yarım Gün</span> : <span className="badge success">Tam Gün</span>}</td>
                  <td>{h.multiplier ? `${f2(h.multiplier)}x` : '—'}</td>
                  <td>
                    {h.is_official ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <Lock size={12} /> Resmi
                      </span>
                    ) : (
                      <span style={{ color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 600 }}>Firma</span>
                    )}
                  </td>
                  <td>
                    {!h.is_official && !readOnly && (
                      <button onClick={() => deleteHoliday(h.id)} title="Sil"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--status-error)', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {holidays.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }} className="text-muted">Tanımlı tatil bulunmuyor.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', 
  padding: '0.75rem', 
  borderRadius: 8, 
  border: '1px solid var(--glass-border)', 
  background: '#ffffff', 
  color: 'var(--text-primary)', 
  outline: 'none',
  boxSizing: 'border-box'
};
