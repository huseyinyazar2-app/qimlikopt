import { useState, useEffect } from 'react';
import axios from 'axios';
import { Battery, Wifi, Smartphone, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [health, setHealth] = useState({});

  useEffect(() => {
    let active = true;

    const fetchHealth = async (list) => {
      const results = await Promise.allSettled(
        list.map(d => axios.get(`${getApiUrl()}/api/admin/devices/${d.device_id}/health`))
      );
      if (!active) return;
      const map = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          map[list[i].device_id] = r.value.data;
        }
      });
      setHealth(map);
    };

    const fetchDevices = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/api/admin/devices`);
        if (!active) return;
        setDevices(res.data);
        if (res.data.length > 0) fetchHealth(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // SQLite UTC string'ini doğru ayrıştır
  const parseUtcDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const normalizedStr = dateStr.endsWith('Z') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
    return new Date(normalizedStr);
  };

  // Son 5 dakikada sinyal yoksa çevrimdışı
  const isOffline = (lastSeen) => {
    const diff = new Date() - parseUtcDate(lastSeen);
    return diff > 5 * 60 * 1000;
  };

  // Çevrimiçilik yüzdesine göre renk sınıfı
  const uptimeClass = (v) => (v >= 80 ? 'success' : v >= 40 ? 'warning' : 'error');

  // history[].battery_level dizisinden hafif bir SVG çizgi grafiği üretir
  const BatterySparkline = ({ history }) => {
    const points = (history || [])
      .map(h => h.battery_level)
      .filter(v => typeof v === 'number');

    if (points.length < 2) {
      return <span className="text-muted" style={{ fontSize: '0.75rem' }}>Yeterli veri yok</span>;
    }

    const w = 120, h = 32, pad = 3;
    const n = points.length;
    const coords = points.map((v, i) => {
      const x = pad + (i / (n - 1)) * (w - 2 * pad);
      const clamped = Math.max(0, Math.min(100, v));
      const y = h - pad - (clamped / 100) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const last = points[points.length - 1];
    const stroke = last < 20 ? 'var(--status-error)' : last < 40 ? 'var(--status-warning)' : 'var(--status-success)';

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
        <polyline
          points={coords}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Gateway Cihazları (Filo)</h1>
        <p className="text-muted">Sahadaki Android SMS terminallerinin anlık durumlarını izleyin.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {devices.map(device => {
          const offline = isOffline(device.last_seen);
          const dh = health[device.device_id];
          const lowBattery = device.battery_level < 20;
          return (
            <div key={device.id} className="glass-card" style={{ borderTop: `3px solid ${offline ? 'var(--status-error)' : 'var(--status-success)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>{device.device_name}</h3>
                <span className={`badge ${offline ? 'error' : 'success'}`}>
                  {offline ? 'Çevrimdışı' : 'Aktif'}
                </span>
              </div>

              <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                ID: {device.device_id}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {dh && typeof dh.uptime_24h === 'number' && (
                  <span className={`badge ${uptimeClass(dh.uptime_24h)}`}>
                    Son 24s çevrimiçi: %{Math.round(dh.uptime_24h)}
                  </span>
                )}
                {lowBattery && (
                  <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={14} /> Düşük pil
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Battery size={18} color={lowBattery ? 'var(--status-error)' : 'var(--status-success)'} />
                  <span>{device.battery_level}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wifi size={18} />
                  <span>{device.network_status}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  Pil eğilimi (son 7 gün)
                </div>
                <BatterySparkline history={dh?.history} />
              </div>

              <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '1.5rem' }}>
                Son Sinyal: {parseUtcDate(device.last_seen).toLocaleString()}
              </div>
            </div>
          )
        })}

        {devices.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: 0 }}>
            <EmptyState
              icon={Smartphone}
              title="Henüz gateway cihazı bağlanmadı"
              description="Android gateway uygulamasının sunucuya bağlanmasını bekleyin. Cihazlar canlılık sinyali (heartbeat) gönderdiğinde otomatik olarak burada listelenecek ve pil/ağ durumları anlık izlenecektir."
            />
          </div>
        )}
      </div>
    </div>
  );
}
