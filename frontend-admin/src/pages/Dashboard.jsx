import { useEffect, useState } from 'react';
import { Activity, Users, Smartphone, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';

export default function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, devices: 0, logs: 0 });
  const [devicesList, setDevicesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseUtcDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const normalizedStr = dateStr.endsWith('Z') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
    return new Date(normalizedStr);
  };

  const isOffline = (lastSeen) => {
    const diff = new Date() - parseUtcDate(lastSeen);
    return diff > 5 * 60 * 1000;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cRes, dRes, lRes] = await Promise.all([
          axios.get(`${getApiUrl()}/api/admin/clients`),
          axios.get(`${getApiUrl()}/api/admin/devices`),
          axios.get(`${getApiUrl()}/api/admin/logs`)
        ]);
        setStats({
          clients: cRes.data.length,
          devices: dRes.data.length,
          logs: lRes.data.length
        });
        setDevicesList(dRes.data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalDevices = devicesList.length;
  const offlineDevices = devicesList.filter(d => isOffline(d.last_seen)).length;
  const onlineDevices = totalDevices - offlineDevices;

  const renderAlertCard = () => {
    if (loading) {
      return (
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid var(--glass-border)' }}>
          <div className="text-muted">Durum hesaplanıyor...</div>
        </div>
      );
    }

    if (totalDevices === 0) {
      return (
        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 8, borderLeft: '3px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle color="#f59e0b" size={20} />
          <div>
            <div style={{ fontWeight: 600, color: '#f59e0b' }}>Bağlı Gateway Bulunmuyor</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>Sistemde kayıtlı gateway cihazı bulunamadı. Lütfen Android APK üzerinden heartbeat gönderin.</div>
          </div>
        </div>
      );
    }

    if (offlineDevices > 0) {
      return (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, borderLeft: '3px solid var(--status-error)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle color="var(--status-error)" size={20} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--status-error)' }}>{offlineDevices} Gateway Cihazı Çevrimdışı!</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>Bağlantı kesintisi algılandı. Lütfen cihazların internet ve servis durumunu kontrol edin.</div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, borderLeft: '3px solid var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CheckCircle color="var(--status-success)" size={20} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--status-success)' }}>Tüm Gateway Cihazları Çevrimiçi</div>
          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>Şu anda aktif {onlineDevices} cihaz sorunsuz çalışıyor.</div>
        </div>
      </div>
    );
  };

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
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{onlineDevices} / {totalDevices}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: '#8b5cf6' }}>
            <Activity size={32} />
          </div>
          <div>
            <div className="text-muted">Toplam İşlenen SMS</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.logs}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} className="text-muted" /> Sistem Durum Bildirimleri
        </h2>
        {renderAlertCard()}
      </div>
    </div>
  );
}
