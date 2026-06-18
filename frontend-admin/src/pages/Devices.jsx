import { useState, useEffect } from 'react';
import axios from 'axios';
import { Battery, Wifi } from 'lucide-react';

export default function Devices() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axios.get(`http://${window.location.hostname}:3303/api/admin/devices`);
        setDevices(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDevices();
    // Poll every 30s
    const interval = setInterval(fetchDevices, 33030);
    return () => clearInterval(interval);
  }, []);

  // Helper to check if offline (not seen in last 5 mins)
  const isOffline = (lastSeen) => {
    const diff = new Date() - new Date(lastSeen);
    return diff > 5 * 60 * 1000;
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
          return (
            <div key={device.id} className="glass-card" style={{ borderTop: `3px solid ${offline ? 'var(--status-error)' : 'var(--status-success)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>{device.device_name}</h3>
                <span className={`badge ${offline ? 'error' : 'success'}`}>
                  {offline ? 'Çevrimdışı' : 'Aktif'}
                </span>
              </div>
              
              <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                ID: {device.device_id}
              </div>

              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Battery size={18} color={device.battery_level < 20 ? 'var(--status-error)' : 'var(--status-success)'} />
                  <span>{device.battery_level}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wifi size={18} />
                  <span>{device.network_status}</span>
                </div>
              </div>

              <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '1.5rem' }}>
                Son Sinyal: {new Date(device.last_seen).toLocaleString()}
              </div>
            </div>
          )
        })}
        
        {devices.length === 0 && (
          <div className="text-muted">Sisteme kayıtlı gateway cihazı bulunamadı. Cihazlar heartbeat gönderdiğinde burada belirecektir.</div>
        )}
      </div>
    </div>
  );
}
