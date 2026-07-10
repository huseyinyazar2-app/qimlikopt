import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config';
import { Marker, Popup, Circle } from 'react-leaflet';
import MapView, { MapLegend } from '../components/MapView';
import { dotIcon, pinIcon } from '../utils/mapIcons';
import { Map as MapIcon, MapPin, AlertTriangle, Wrench, Crosshair } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { isReadOnly } from '../utils/role';

const COLOR_OK = '#10b981';       // sorunsuz
const COLOR_OPEN = '#0ea5e9';     // açık iş emri
const COLOR_MAINT = '#f59e0b';    // bakımı gecikmiş / uyarı
const COLOR_OVERDUE = '#ef4444';  // geciken iş emri
const COLOR_LOG = '#6366f1';      // bakım kaydı konumu

// Makine rengini durum önceliğine göre seç
function machineColor(m) {
  if (Number(m.overdue_orders) > 0) return COLOR_OVERDUE;
  if (m.maintenance_overdue) return COLOR_MAINT;
  if (Number(m.open_orders) > 0) return COLOR_OPEN;
  return COLOR_OK;
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('tr-TR') : '—');

export default function MachineMap({ user }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState({ machines: [], maintenance: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [unlocatedMachines, setUnlocatedMachines] = useState([]);
  const [modalMachine, setModalMachine] = useState(null);

  const host = getApiUrl();
  const token = user?.token;
  const readOnly = isReadOnly();

  const fetchData = () => {
    setLoading(true);
    axios
      .get(`${host}/api/dijital/company/map/data?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => setData({ machines: [], maintenance: [], summary: null }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${host}/api/dijital/company/map/data?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setData({ machines: [], maintenance: [], summary: null }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days, host, token]);

  // Konumsuz makine listesi (yalnızca gerektiğinde çekilir)
  const unlocatedCount = data.summary?.unlocated ?? 0;
  useEffect(() => {
    if (unlocatedCount <= 0 || readOnly) { setUnlocatedMachines([]); return; }
    let cancelled = false;
    axios
      .get(`${host}/api/dijital/machines`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!cancelled) setUnlocatedMachines((res.data || []).filter(m => m.gps_latitude == null)); })
      .catch(() => { if (!cancelled) setUnlocatedMachines([]); });
    return () => { cancelled = true; };
  }, [unlocatedCount, host, token, readOnly]);

  const fitPoints = useMemo(() => {
    const pts = data.machines.map(m => [m.gps_latitude, m.gps_longitude]);
    data.maintenance.forEach(p => pts.push([p.latitude, p.longitude]));
    return pts;
  }, [data.machines, data.maintenance]);

  const handleSaved = () => {
    setModalMachine(null);
    fetchData();
    toast.success('Makine konumu kaydedildi.');
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="gradient-text">Makine Haritası</h1>
          <p className="text-muted">Makinelerinizin konumlarını, iş emri durumlarını ve teknisyen bakım noktalarını harita üzerinde görün.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Bakım aralığı</span>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={days === d ? 'btn-primary' : ''}
              style={days === d
                ? { padding: '0.45rem 0.85rem', fontSize: '0.85rem' }
                : { padding: '0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {d} gün
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon={<MapIcon size={18} />} label="Toplam Makine" value={data.summary?.total_machines ?? 0} />
        <StatCard icon={<MapPin size={18} />} label="Haritada" value={data.summary?.located ?? 0} />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Konumsuz"
          value={unlocatedCount}
          color={unlocatedCount > 0 ? COLOR_MAINT : undefined}
        />
        <StatCard icon={<Wrench size={18} />} label="Bakım Noktası" value={data.summary?.maintenance_points ?? 0} />
      </div>

      {unlocatedCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.7rem 1rem', marginBottom: '1.25rem', borderRadius: 8, background: 'rgba(245,158,11,0.12)', color: COLOR_MAINT, fontSize: '0.85rem', fontWeight: 600 }}>
          <AlertTriangle size={16} />
          {unlocatedCount} makinenin konumu tanımlı değil — haritada görünmez.
        </div>
      )}

      <div className="glass-card">
        {loading ? (
          <div className="text-muted" style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Harita yükleniyor…</div>
        ) : data.machines.length === 0 && data.maintenance.length === 0 ? (
          <EmptyState
            icon={MapIcon}
            title="Haritada gösterilecek veri yok"
            description="Makinelerinize GPS konumu tanımlayın; teknisyenler bakım yaptıkça konumları burada görünecek."
          />
        ) : (
          <>
            <MapView fitPoints={fitPoints}>
              {data.machines.map(m => (
                m.require_location_match ? (
                  <Circle
                    key={`c-${m.id}`}
                    center={[m.gps_latitude, m.gps_longitude]}
                    radius={m.allowed_radius}
                    pathOptions={{ color: machineColor(m), fillColor: machineColor(m), fillOpacity: 0.1, weight: 1.5 }}
                  />
                ) : null
              ))}

              {data.machines.map(m => (
                <Marker key={`m-${m.id}`} position={[m.gps_latitude, m.gps_longitude]} icon={pinIcon(machineColor(m))}>
                  <Popup>
                    <strong>{m.machine_name}</strong> <span style={{ color: '#64748b' }}>({m.machine_code})</span>
                    <br />
                    {m.location || 'Konum belirtilmemiş'}
                    <br />
                    Durum: {m.status || '—'}
                    <br />
                    Sonraki bakım: {fmtDate(m.next_maintenance_date)}
                    <br />
                    Açık iş emri: <strong>{Number(m.open_orders)}</strong>
                    <br />
                    Geciken iş emri: <strong style={{ color: Number(m.overdue_orders) > 0 ? COLOR_OVERDUE : undefined }}>{Number(m.overdue_orders)}</strong>
                    <br />
                    <span style={{ color: '#64748b' }}>{m.gps_latitude.toFixed(5)}, {m.gps_longitude.toFixed(5)}</span>
                  </Popup>
                </Marker>
              ))}

              {data.maintenance.map(p => (
                <Marker key={`p-${p.id}`} position={[p.latitude, p.longitude]} icon={dotIcon(COLOR_LOG, 12)}>
                  <Popup>
                    <strong>{p.technician_name}</strong>
                    <br />
                    {p.machine_name} <span style={{ color: '#64748b' }}>({p.machine_code})</span>
                    <br />
                    {new Date(p.created_at).toLocaleDateString('tr-TR')}
                    {p.calculated_distance != null && (
                      <><br />Makineye uzaklık: <strong>{Math.round(p.calculated_distance)} m</strong></>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapView>

            <MapLegend
              items={[
                { color: COLOR_OK, label: 'Sorunsuz' },
                { color: COLOR_OPEN, label: 'Açık iş emri' },
                { color: COLOR_MAINT, label: 'Bakımı gecikmiş' },
                { color: COLOR_OVERDUE, label: 'Geciken iş emri' },
                { color: COLOR_LOG, label: 'Bakım kaydı konumu' },
              ]}
            />
          </>
        )}
      </div>

      {!readOnly && unlocatedCount > 0 && unlocatedMachines.length > 0 && (
        <div className="glass-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.25rem' }}>Konumsuz Makineler</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            Konumu tanımlanmamış makineler haritada görünmez. Aşağıdan harita üzerinde konumlandırın.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {unlocatedMachines.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.7rem 0.9rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.machine_name}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>{m.machine_code}{m.location ? ` — ${m.location}` : ''}</div>
                </div>
                <button
                  onClick={() => setModalMachine(m)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.9rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  <MapPin size={15} /> Haritada Konumlandır
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalMachine && (
        <LocationModal
          machine={modalMachine}
          host={host}
          token={token}
          onClose={() => setModalMachine(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function LocationModal({ machine, host, token, onClose, onSaved }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState(100);
  const [requireMatch, setRequireMatch] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pickedLat = parseFloat(latitude);
  const pickedLng = parseFloat(longitude);
  const hasPick = !isNaN(pickedLat) && !isNaN(pickedLng);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError('Konum alınamadı. Tarayıcı izinlerini kontrol edin.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!hasPick) {
      setError('Harita üzerinde bir konum seçin veya koordinat girin.');
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${host}/api/dijital/machines/${machine.id}/location`,
        {
          gps_latitude: pickedLat,
          gps_longitude: pickedLng,
          allowed_radius: parseInt(radius) || 100,
          require_location_match: requireMatch,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Konum kaydedilirken hata oluştu.');
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem', overflowY: 'auto' }}>
      <div className="glass-card" style={{ width: 520, maxHeight: '92vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>{machine.machine_name}</h2>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          {machine.machine_code} — haritaya tıklayarak makinenin konumunu işaretleyin.
        </p>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <MapView
            height={300}
            center={hasPick ? [pickedLat, pickedLng] : undefined}
            zoom={hasPick ? 16 : undefined}
            fitPoints={hasPick ? [[pickedLat, pickedLng]] : undefined}
            onPick={(lat, lng) => { setLatitude(lat.toFixed(6)); setLongitude(lng.toFixed(6)); }}
          >
            {hasPick && (
              <>
                <Circle
                  center={[pickedLat, pickedLng]}
                  radius={parseInt(radius) || 100}
                  pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.15, weight: 1.5 }}
                />
                <Marker position={[pickedLat, pickedLng]} icon={pinIcon('#0ea5e9')} />
              </>
            )}
          </MapView>

          <button type="button" onClick={useMyLocation} disabled={locating} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--brand-primary)', padding: 0, alignSelf: 'flex-start' }}>
            <Crosshair size={14} /> {locating ? 'Konum alınıyor…' : 'Bulunduğum Konumu Kullan'}
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Enlem (Latitude)</label>
              <input style={inputStyle} value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Örn: 39.9207" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Boylam (Longitude)</label>
              <input style={inputStyle} value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Örn: 32.8541" />
            </div>
          </div>

          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>İzin Verilen Yarıçap (Metre)</label>
            <input type="number" style={inputStyle} value={radius} onChange={e => setRadius(e.target.value)} placeholder="Örn: 100" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={requireMatch} onChange={e => setRequireMatch(e.target.checked)} />
            Bakım için konum eşleşmesi zorunlu olsun (teknisyen yarıçap içinde olmalı)
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </div>
        </form>
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

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
