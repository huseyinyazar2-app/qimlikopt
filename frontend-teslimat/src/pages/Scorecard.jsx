import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { Award, RefreshCw, Truck, CheckCircle2, XCircle, Repeat, CalendarClock } from 'lucide-react';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

// Başarı oranına göre renk (yeşil / turuncu / kırmızı)
const rateColor = (r) => (r >= 80 ? '#10b981' : r >= 50 ? '#f59e0b' : '#ef4444');

export default function Scorecard({ user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const host = getApiUrl();
  const token = user?.token;

  const fetchData = async () => {
    try {
      const res = await axios.get(`${host}/api/teslimat/company/courier-scorecard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRows(res.data);
    } catch (err) {
      toast.error('Kurye karnesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw className="spin" size={36} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
        <p className="text-muted">Kurye karnesi yükleniyor...</p>
      </div>
    );
  }

  const chartData = rows
    .map(r => ({ name: r.courier_name, rate: r.success_rate }))
    .sort((a, b) => a.rate - b.rate);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Kurye Performans Karnesi</h1>
        <p className="text-muted">Her kuryenin teslim, başarısızlık, başarı oranı ve ortalama deneme sayısı gibi performans göstergeleri.</p>
      </header>

      {rows.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<Award size={40} />}
            title="Kurye verisi yok"
            description="Kurye ekleyip paket zimmetledikçe performans karnesi burada oluşur."
          />
        </div>
      ) : (
        <>
          {/* Başarı oranı grafiği */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={18} color="var(--brand-primary)" /> Başarı Oranı (%)
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 42)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} unit="%" />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={(v) => [`%${v}`, 'Başarı Oranı']} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey="rate" name="Başarı Oranı" radius={[0, 6, 6, 0]} barSize={20}>
                  {chartData.map((entry, i) => <Cell key={`r-${i}`} fill={rateColor(entry.rate)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detay tablosu */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={18} color="var(--brand-secondary)" /> Performans Tablosu
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Kurye</th>
                    <th style={{ textAlign: 'center' }}>Atanan</th>
                    <th style={{ textAlign: 'center' }}><CheckCircle2 size={13} style={{ verticalAlign: 'middle' }} /> Teslim</th>
                    <th style={{ textAlign: 'center' }}><XCircle size={13} style={{ verticalAlign: 'middle' }} /> Başarısız</th>
                    <th style={{ textAlign: 'center' }}>Başarı Oranı</th>
                    <th style={{ textAlign: 'center' }}><Repeat size={13} style={{ verticalAlign: 'middle' }} /> Ort. Deneme</th>
                    <th style={{ textAlign: 'center' }}><CalendarClock size={13} style={{ verticalAlign: 'middle' }} /> Son 30 Gün</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.courier_name}</div>
                        {!r.is_active && <span className="text-muted" style={{ fontSize: '0.72rem' }}>Pasif</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>{r.total_assigned}</td>
                      <td style={{ textAlign: 'center', color: 'var(--status-success)', fontWeight: 600 }}>{r.delivered}</td>
                      <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>{r.failed}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="badge"
                          style={{ background: `${rateColor(r.success_rate)}1a`, color: rateColor(r.success_rate), fontWeight: 700 }}
                        >
                          %{r.success_rate}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{r.avg_attempts}</td>
                      <td style={{ textAlign: 'center' }}>{r.last30_delivered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
