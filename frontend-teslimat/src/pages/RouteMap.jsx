import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import { Marker, Popup, Polyline } from 'react-leaflet';
import MapView, { MapLegend } from '../components/MapView';
import { numberedIcon } from '../utils/mapIcons';
import { Map as MapIcon, MapPin, Users, CheckCircle2, XCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState';

// Kurye rota rengi paleti (index bazlı, döngüsel)
const COURIER_COLORS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'];

// Nokta durum rengi
const STATUS_COLORS = {
  delivered_success: '#10b981',
  delivered_partial: '#0ea5e9',
  picked_up: '#64748b',
  returned: '#f59e0b',
  delivery_failed: '#ef4444',
};

const STATUS_LABELS = {
  delivered_success: 'Teslim edildi',
  delivered_partial: 'Kısmi teslim',
  picked_up: 'Teslim alındı',
  returned: 'İade edildi',
  delivery_failed: 'Teslim edilemedi',
};

const FAIL_LABELS = {
  recipient_absent: 'Alıcı adreste yok',
  wrong_address: 'Yanlış adres',
  refused: 'Alıcı reddetti',
  other: 'Diğer',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function RouteMap({ user }) {
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState({ date: null, routes: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]); // seçili courier_id listesi

  const host = getApiUrl();
  const token = user?.token;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${host}/api/teslimat/company/map/data?date=${date}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) { setData(res.data); setSelected([]); } })
      .catch(() => { if (!cancelled) setData({ date: null, routes: [], summary: null }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date, host, token]);

  // courier_id -> renk eşlemesi (rota listesindeki sırayla)
  const colorOf = useMemo(() => {
    const m = new Map();
    data.routes.forEach((r, i) => m.set(r.courier_id, COURIER_COLORS[i % COURIER_COLORS.length]));
    return m;
  }, [data.routes]);

  const toggleCourier = (id) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Görünür rotalar: hiçbiri seçili değilse hepsi
  const visibleRoutes = useMemo(
    () => (selected.length === 0 ? data.routes : data.routes.filter(r => selected.includes(r.courier_id))),
    [data.routes, selected]
  );

  const fitPoints = useMemo(() => {
    const pts = [];
    visibleRoutes.forEach(r => r.points.forEach(p => pts.push([p.latitude, p.longitude])));
    return pts;
  }, [visibleRoutes]);

  // Kurye bazlı özet
  const courierStats = useMemo(() =>
    data.routes.map((r, i) => {
      const delivered = r.points.filter(p => p.log_type === 'delivered_success' || p.log_type === 'delivered_partial').length;
      const failed = r.points.filter(p => p.log_type === 'delivery_failed').length;
      const times = r.points.map(p => p.created_at).filter(Boolean);
      return {
        courier_id: r.courier_id,
        courier_name: r.courier_name,
        color: COURIER_COLORS[i % COURIER_COLORS.length],
        stops: r.points.length,
        delivered,
        failed,
        first: times[0] || null,
        last: times[times.length - 1] || null,
      };
    }), [data.routes]);

  const totalPoints = data.summary?.points ?? 0;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="gradient-text">Rota Haritası</h1>
          <p className="text-muted">Kuryelerin gün içindeki teslimat hareketleri.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="text-muted" style={{ fontSize: '0.85rem' }}>Tarih</label>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon={<Users size={18} />} label="Kurye" value={data.summary?.couriers ?? 0} />
        <StatCard icon={<MapPin size={18} />} label="Toplam Durak" value={totalPoints} />
        <StatCard icon={<CheckCircle2 size={18} />} label="Teslim Edilen" value={data.summary?.delivered ?? 0} color="#10b981" />
        <StatCard icon={<XCircle size={18} />} label="Başarısız" value={data.summary?.failed ?? 0} color={(data.summary?.failed ?? 0) > 0 ? '#ef4444' : undefined} />
      </div>

      {/* Kurye filtresi çipleri */}
      {data.routes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {data.routes.map((r, i) => {
            const color = COURIER_COLORS[i % COURIER_COLORS.length];
            const active = selected.includes(r.courier_id);
            return (
              <button
                key={r.courier_id ?? 'unassigned'}
                onClick={() => toggleCourier(r.courier_id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '0.35rem 0.75rem', borderRadius: 999,
                  border: `1px solid ${active ? color : 'var(--glass-border)'}`,
                  background: active ? `${color}1a` : 'rgba(255,255,255,0.6)',
                  color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
                {r.courier_name}
              </button>
            );
          })}
        </div>
      )}

      <div className="glass-card">
        {loading ? (
          <div className="text-muted" style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Harita yükleniyor…</div>
        ) : totalPoints === 0 ? (
          <EmptyState
            icon={<MapIcon size={44} />}
            title="Bu tarihte teslimat hareketi yok"
            description="Seçili günde kuryelerin kaydedilmiş teslimat hareketi bulunmuyor. Başka bir tarih seçin."
          />
        ) : (
          <>
            <MapView fitPoints={fitPoints}>
              {visibleRoutes.map(r => {
                const routeColor = colorOf.get(r.courier_id);
                const line = r.points.map(p => [p.latitude, p.longitude]);
                return (
                  <div key={r.courier_id ?? 'unassigned'}>
                    {line.length > 1 && (
                      <Polyline positions={line} pathOptions={{ color: routeColor, weight: 3, opacity: 0.7 }} />
                    )}
                    {r.points.map((p, idx) => (
                      <Marker
                        key={p.id}
                        position={[p.latitude, p.longitude]}
                        icon={numberedIcon(STATUS_COLORS[p.log_type] || '#64748b', idx + 1)}
                      >
                        <Popup>
                          <strong>{p.package_code}</strong>
                          <br />
                          {p.recipient_name}
                          <br />
                          <span style={{ color: '#64748b' }}>{p.delivery_address}</span>
                          <br />
                          {fmtTime(p.created_at)} — <strong style={{ color: STATUS_COLORS[p.log_type] || '#64748b' }}>{STATUS_LABELS[p.log_type] || p.log_type}</strong>
                          {p.log_type === 'delivery_failed' && p.fail_reason && (
                            <><br /><span style={{ color: '#ef4444' }}>Neden: {FAIL_LABELS[p.fail_reason] || p.fail_reason}</span></>
                          )}
                          <br />
                          <span style={{ color: '#64748b' }}>Kurye: {r.courier_name}</span>
                        </Popup>
                      </Marker>
                    ))}
                  </div>
                );
              })}
            </MapView>

            <MapLegend
              items={[
                { color: STATUS_COLORS.delivered_success, label: 'Teslim edildi' },
                { color: STATUS_COLORS.delivered_partial, label: 'Kısmi teslim' },
                { color: STATUS_COLORS.picked_up, label: 'Teslim alındı' },
                { color: STATUS_COLORS.returned, label: 'İade edildi' },
                { color: STATUS_COLORS.delivery_failed, label: 'Teslim edilemedi' },
              ]}
            />
          </>
        )}
      </div>

      {/* Kurye bazlı özet */}
      {!loading && courierStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {courierStats.map(c => (
            <div key={c.courier_id ?? 'unassigned'} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
                <strong style={{ fontSize: '0.95rem' }}>{c.courier_name}</strong>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', fontSize: '0.82rem' }}>
                <Metric label="Durak" value={c.stops} />
                <Metric label="Teslim" value={c.delivered} color="#10b981" />
                <Metric label="Başarısız" value={c.failed} color={c.failed > 0 ? '#ef4444' : undefined} />
                <Metric label="İlk-Son" value={`${fmtTime(c.first)} – ${fmtTime(c.last)}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: color || 'var(--brand-primary)', marginBottom: 6 }}>
        {icon}
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
