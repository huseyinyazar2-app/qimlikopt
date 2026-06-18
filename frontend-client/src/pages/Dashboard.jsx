import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`http://localhost:3303/api/client/${user.id}/stats`);
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.id) fetchStats();
  }, [user]);

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Merhaba, {user?.company_name}</h1>
        <p className="text-muted">Aylık başarılı/başarısız OTP işlemlerini buradan takip edebilirsiniz.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--brand-primary)' }}>
            <MessageSquare size={32} />
          </div>
          <div>
            <div className="text-muted">Toplam İşlem</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--status-success)' }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <div className="text-muted">Başarılı İşlem</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.successful}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--status-error)' }}>
            <XCircle size={32} />
          </div>
          <div>
            <div className="text-muted">Başarısız/Hatalı</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.failed}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
