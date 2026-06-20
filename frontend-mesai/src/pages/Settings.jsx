import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Save, Info } from 'lucide-react';

export default function Settings({ user }) {
  const [shiftType, setShiftType] = useState('company_wide');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [tolerance, setTolerance] = useState(15);
  const [deductBreakTime, setDeductBreakTime] = useState(true);
  const [loading, setLoading] = useState(false);
  const host = `http://${window.location.hostname}:3303`;

  useEffect(() => {
    // Fetch current settings
    const fetchSettings = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.password}` };
        const res = await axios.get(`${host}/api/mesai/company/settings`, { headers });
        const comp = res.data;
        if (comp) {
          setShiftType(comp.shift_type || 'company_wide');
          setShiftStart(comp.shift_start_time || '09:00');
          setShiftEnd(comp.shift_end_time || '18:00');
          setTolerance(comp.tolerance_minutes !== undefined ? comp.tolerance_minutes : 15);
          setDeductBreakTime(comp.deduct_break_time === undefined ? true : !!comp.deduct_break_time);
        }
      } catch (err) {
        console.error('Mevcut ayarlar yuklenirken hata:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.password}` };
      await axios.put(`${host}/api/mesai/company/settings`, {
        shift_type: shiftType,
        shift_start_time: shiftStart,
        shift_end_time: shiftEnd,
        tolerance_minutes: tolerance,
        deduct_break_time: deductBreakTime
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={18} /> {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>
        </form>
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
