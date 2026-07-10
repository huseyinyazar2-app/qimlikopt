import { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import {
  Calculator,
  Download,
  User,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Wallet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import EmptyState from '../components/EmptyState';

const f2 = (n) => (Number(n) || 0).toFixed(2);
const tl = (n) => `₺${(Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dayKindLabel = (kind) => {
  switch (kind) {
    case 'weekend': return { text: 'Hafta Tatili', bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' };
    case 'holiday': return { text: 'Resmi Tatil', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    case 'half_holiday': return { text: 'Yarım Tatil', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
    default: return { text: 'İş Günü', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' };
  }
};

const hourBadge = (value, bg, color) => {
  const v = Number(value) || 0;
  if (v <= 0) return <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>;
  return (
    <span style={{ background: bg, color, padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {f2(v)}
    </span>
  );
};

export default function Payroll({ user }) {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(null); // 'YYYY-MM' or 'all'

  const host = getApiUrl();
  const token = user?.token;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${host}/api/mesai/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(res.data);
      } catch (err) {
        console.error('Personel listesi yüklenemedi:', err);
        toast.error('Personel listesi yüklenemedi');
      }
    };
    fetchEmployees();
  }, []);

  const selectedEmp = employees.find(e => String(e.id) === String(selectedId));

  const loadReport = async (id) => {
    setSelectedId(id);
    setReportData(null);
    setExpandedMonth(null);
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${host}/api/mesai/employees/${id}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
    } catch (err) {
      console.error('Bordro raporu yüklenemedi:', err);
      toast.error('Bordro raporu yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const dailyForMonth = (month) => {
    if (!reportData?.daily) return [];
    return reportData.daily.filter(d => (d.date || '').startsWith(month));
  };

  const exportExcel = () => {
    if (!reportData || !selectedEmp) return;

    const wsMonthly = XLSX.utils.json_to_sheet((reportData.monthly || []).map(m => ({
      'Ay': m.month,
      'Toplam Saat': f2(m.hours),
      'Normal Saat': f2(m.normal_hours),
      'Fazla Mesai (Saat)': f2(m.overtime_hours),
      'Hafta Tatili (Saat)': f2(m.weekend_hours),
      'Resmi Tatil (Saat)': f2(m.holiday_hours),
      'Çalışılan Gün': m.days_present,
      'İzinli Gün': m.days_leave,
      'Toplam Ücret (₺)': f2(m.wage)
    })));

    const wsDaily = XLSX.utils.json_to_sheet((reportData.daily || []).map(d => {
      const k = dayKindLabel(d.day_kind);
      return {
        'Tarih': d.date,
        'Gün Türü': k.text + (d.holiday_name ? ` (${d.holiday_name})` : ''),
        'Giriş': d.check_in || '',
        'Çıkış': d.check_out || '',
        'Normal Saat': f2(d.normal_hours),
        'Fazla Mesai (Saat)': f2(d.overtime_hours),
        'Hafta Tatili (Saat)': f2(d.weekend_hours),
        'Resmi Tatil (Saat)': f2(d.holiday_hours),
        'Toplam Saat': f2(d.hours),
        'Ücret (₺)': f2(d.wage)
      };
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Aylık Bordro');
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Günlük Döküm');
    XLSX.writeFile(wb, `${selectedEmp.name}_${selectedEmp.surname}_Bordro.xlsx`);
  };

  const monthly = reportData?.monthly || [];

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">Bordro</h1>
          <p className="text-muted">Personel bazlı aylık ücret hesabı, fazla mesai ve tatil dökümü.</p>
        </div>
        {reportData && (
          <button onClick={exportExcel} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}>
            <Download size={16} /> Excel'e Aktar
          </button>
        )}
      </header>

      {/* Employee selector */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <label style={{ marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={16} color="var(--brand-primary)" /> Personel Seçin
        </label>
        <select value={selectedId} onChange={e => loadReport(e.target.value)} style={inputStyle}>
          <option value="">— Personel seçin —</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name} {emp.surname}</option>
          ))}
        </select>
      </div>

      {!selectedId && (
        <div className="glass-card">
          <EmptyState
            icon={Calculator}
            title="Bordro için personel seçin"
            description="Yukarıdan bir personel seçtiğinizde aylık ücret dökümü, fazla mesai ve tatil saatleri burada listelenir."
          />
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">
          Bordro hesaplanıyor...
        </div>
      )}

      {selectedId && !loading && reportData && (
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            <Wallet size={20} color="var(--brand-primary)" /> Aylık Bordro Özeti
          </h3>

          <div className="table-container">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Ay</th>
                  <th>Normal Saat</th>
                  <th>Fazla Mesai</th>
                  <th>Hafta Tatili</th>
                  <th>Resmi Tatil</th>
                  <th>Toplam Ücret</th>
                  <th>Detay</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => {
                  const isOpen = expandedMonth === m.month;
                  const days = dailyForMonth(m.month);
                  return (
                    <Fragment key={m.month}>
                      <tr
                        style={{ cursor: 'pointer', background: isOpen ? 'rgba(2, 132, 199, 0.08)' : 'transparent' }}
                        onClick={() => setExpandedMonth(isOpen ? null : m.month)}
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} className="text-muted" /> {m.month}
                          </div>
                        </td>
                        <td>{f2(m.normal_hours)}</td>
                        <td>{hourBadge(m.overtime_hours, 'rgba(245, 158, 11, 0.15)', '#f59e0b')}</td>
                        <td>{hourBadge(m.weekend_hours, 'rgba(99, 102, 241, 0.15)', '#6366f1')}</td>
                        <td>{hourBadge(m.holiday_hours, 'rgba(239, 68, 68, 0.15)', '#ef4444')}</td>
                        <td style={{ fontWeight: 700, color: 'var(--status-success)' }}>{tl(m.wage)}</td>
                        <td>{isOpen ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan="7" style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.5)' }}>
                            <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: 8 }}>
                              <table style={{ margin: 0, width: '100%', fontSize: '0.8rem' }}>
                                <thead>
                                  <tr style={{ background: 'rgba(255,255,255,0.6)' }}>
                                    <th style={thSm}>Gün</th>
                                    <th style={thSm}>Tür</th>
                                    <th style={thSm}>Giriş</th>
                                    <th style={thSm}>Çıkış</th>
                                    <th style={thSm}>Normal</th>
                                    <th style={thSm}>FM</th>
                                    <th style={thSm}>HS</th>
                                    <th style={thSm}>Tatil</th>
                                    <th style={thSm}>Ücret</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {days.map((d, idx) => {
                                    const k = dayKindLabel(d.day_kind);
                                    return (
                                      <tr key={idx} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                        <td style={tdSm}>{d.date}</td>
                                        <td style={tdSm}>
                                          <span style={{ background: k.bg, color: k.color, padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {k.text}
                                          </span>
                                          {d.holiday_name && <span className="text-muted" style={{ display: 'block', marginTop: 2 }}>{d.holiday_name}</span>}
                                        </td>
                                        <td style={{ ...tdSm, color: 'var(--status-success)' }}>{d.check_in || '—'}</td>
                                        <td style={{ ...tdSm, color: 'var(--status-warning)' }}>{d.check_out || '—'}</td>
                                        <td style={tdSm}>{f2(d.normal_hours)}</td>
                                        <td style={tdSm}>{hourBadge(d.overtime_hours, 'rgba(245, 158, 11, 0.15)', '#f59e0b')}</td>
                                        <td style={tdSm}>{hourBadge(d.weekend_hours, 'rgba(99, 102, 241, 0.15)', '#6366f1')}</td>
                                        <td style={tdSm}>{hourBadge(d.holiday_hours, 'rgba(239, 68, 68, 0.15)', '#ef4444')}</td>
                                        <td style={{ ...tdSm, fontWeight: 600, color: 'var(--status-success)' }}>{tl(d.wage)}</td>
                                      </tr>
                                    );
                                  })}
                                  {days.length === 0 && (
                                    <tr><td colSpan="9" style={{ ...tdSm, textAlign: 'center' }} className="text-muted">Bu aya ait günlük kayıt yok.</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {monthly.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: 0 }}>
                      <EmptyState
                        icon={Clock}
                        title="Bordro verisi bulunamadı"
                        description="Bu personel için henüz ücret hesabına dahil edilecek çalışma kaydı yok."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span><b style={{ color: '#f59e0b' }}>FM</b> = Fazla Mesai</span>
            <span><b style={{ color: '#6366f1' }}>HS</b> = Hafta Tatili Saati</span>
            <span><b style={{ color: '#ef4444' }}>Tatil</b> = Resmi Tatil Saati</span>
          </p>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)',
  background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
const thSm = { padding: '0.4rem 0.6rem', fontSize: '0.75rem', textAlign: 'left' };
const tdSm = { padding: '0.4rem 0.6rem', fontSize: '0.78rem' };
