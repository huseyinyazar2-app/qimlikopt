import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import { Marker, Popup, Circle } from 'react-leaflet';
import MapView, { MapLegend } from '../components/MapView';
import { dotIcon, pinIcon } from '../utils/mapIcons';
import { Map as MapIcon, AlertTriangle, MapPin, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState';

const COLOR_SITE = '#6366f1';
const COLOR_IN = '#10b981';
const COLOR_OUT = '#ef4444';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function MapPage({ user }) {
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState({ locations: [], checkins: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [onlyOutside, setOnlyOutside] = useState(false);

  const host = getApiUrl();
  const token = user?.token;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${host}/api/mesai/company/map/data?date=${date}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setData({ locations: [], checkins: [], summary: null }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date, host, token]);

  const checkins = useMemo(
    () => (onlyOutside ? data.checkins.filter(c => c.outside) : data.checkins),
    [data.checkins, onlyOutside]
  );

  const fitPoints = useMemo(() => {
    const pts = data.locations.map(l => [l.latitude, l.longitude]);
    checkins.forEach(c => pts.push([c.latitude, c.longitude]));
    return pts;
  }, [data.locations, checkins]);

  const outsideCount = data.summary?.outside ?? 0;

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="gradient-text">Saha Haritası</h1>
          <p className="text-muted">Şantiye sınırlarını ve personelin gün içindeki giriş/çıkış konumlarını görün.</p>
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
        <StatCard icon={<MapPin size={18} />} label="Çalışma Alanı" value={data.summary?.locations ?? 0} />
        <StatCard icon={<Users size={18} />} label="Okutma (seçili gün)" value={data.summary?.checkins ?? 0} />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Yarıçap Dışı"
          value={outsideCount}
          color={outsideCount > 0 ? COLOR_OUT : undefined}
        />
      </div>

      {outsideCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 1rem', marginBottom: '1.25rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: COLOR_OUT, fontSize: '0.85rem', fontWeight: 600 }}>
          <AlertTriangle size={16} />
          {outsideCount} okutma izin verilen yarıçapın dışında yapılmış.
          <button
            onClick={() => setOnlyOutside(v => !v)}
            style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${COLOR_OUT}`, color: COLOR_OUT, borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {onlyOutside ? 'Tümünü göster' : 'Sadece bunları göster'}
          </button>
        </div>
      )}

      <div className="glass-card">
        {loading ? (
          <div className="text-muted" style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Harita yükleniyor…</div>
        ) : data.locations.length === 0 && data.checkins.length === 0 ? (
          <EmptyState
            icon={MapIcon}
            title="Haritada gösterilecek veri yok"
            description="Önce bir çalışma alanı tanımlayın; personel giriş/çıkış yaptıkça konumları burada görünecek."
          />
        ) : (
          <>
            <MapView fitPoints={fitPoints}>
              {data.locations.map(loc => (
                <Circle
                  key={`c-${loc.id}`}
                  center={[loc.latitude, loc.longitude]}
                  radius={loc.allowed_radius}
                  pathOptions={{ color: COLOR_SITE, fillColor: COLOR_SITE, fillOpacity: 0.12, weight: 1.5 }}
                />
              ))}

              {data.locations.map(loc => (
                <Marker key={`m-${loc.id}`} position={[loc.latitude, loc.longitude]} icon={pinIcon(COLOR_SITE)}>
                  <Popup>
                    <strong>{loc.location_name}</strong>
                    <br />
                    Tolerans yarıçapı: {loc.allowed_radius} m
                    <br />
                    <span style={{ color: '#64748b' }}>{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</span>
                  </Popup>
                </Marker>
              ))}

              {checkins.map(c => (
                <Marker key={`k-${c.id}`} position={[c.latitude, c.longitude]} icon={dotIcon(c.outside ? COLOR_OUT : COLOR_IN)}>
                  <Popup>
                    <strong>{c.employee_name}</strong>
                    <br />
                    {c.log_type === 'check_in' ? 'Giriş' : 'Çıkış'} — {new Date(c.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    <br />
                    {c.location_name}
                    <br />
                    Merkeze uzaklık: <strong style={{ color: c.outside ? COLOR_OUT : COLOR_IN }}>{Math.round(c.calculated_distance)} m</strong>
                    {c.outside && <><br /><span style={{ color: COLOR_OUT }}>Yarıçap dışında ({c.allowed_radius} m)</span></>}
                  </Popup>
                </Marker>
              ))}
            </MapView>

            <MapLegend
              items={[
                { color: COLOR_SITE, label: 'Çalışma alanı (daire = izin verilen yarıçap)' },
                { color: COLOR_IN, label: 'Yarıçap içinde okutma' },
                { color: COLOR_OUT, label: 'Yarıçap dışında okutma' },
              ]}
            />
          </>
        )}
      </div>
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
