import { useEffect, useState } from 'react';
import { Activity, Users, Smartphone, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, devices: 0, logs: 0 });

  useEffect(() => {
    // In a real app, this would be a single /api/admin/stats endpoint
    const fetchStats = async () => {
      try {
        const [cRes, dRes, lRes] = await Promise.all([
          axios.get(`http://${window.location.hostname}:3303/api/admin/clients`),
          axios.get(`http://${window.location.hostname}:3303/api/admin/devices`),
          axios.get(`http://${window.location.hostname}:3303/api/admin/logs`)
        ]);
        setStats({
          clients: cRes.data.length,
          devices: dRes.data.length,
          logs: lRes.data.length
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Genel Bakış</h1>
        <p className="text-muted">Sistem durumunu ve istatistikleri buradan takip edebilirsiniz.</p>
      </header>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--brand-primary)' }}>
            <Users size={32} />
          </div>
          <div>
            <div className="text-muted">Aktif Müşteriler</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.clients}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--status-success)' }}>
            <Smartphone size={32} />
          </div>
          <div>
            <div className="text-muted">Bağlı Cihazlar</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.devices}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: '#8b5cf6' }}>
            <Activity size={32} />
          </div>
          <div>
            <div className="text-muted">İşlenen SMS (Son 24s)</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.logs}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Mockup */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} className="text-muted" /> Sistem Uyarıları
        </h2>
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid var(--status-success)' }}>
          <div style={{ fontWeight: 500 }}>Tüm Gateway cihazları çevrimiçi.</div>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>Son kontrol: Az önce</div>
        </div>
      </div>
    </div>
  );
}
