import { useState, useEffect } from 'react';
import { Webhook, Clock, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

const STATUS_META = {
  pending: { label: 'Bekliyor', className: 'badge', style: { background: 'rgba(14, 165, 233, 0.15)', color: 'var(--brand-primary)' } },
  delivered: { label: 'Teslim edildi', className: 'badge success' },
  failed: { label: 'Başarısız', className: 'badge warning' },
  dead: { label: 'Ulaşılamadı', className: 'badge error' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: 'badge' };
  return <span className={meta.className} style={meta.style}>{meta.label}</span>;
}

const fmtDate = (v) => (v ? new Date(v).toLocaleString('tr-TR') : '-');

export default function Webhooks({ user }) {
  const [deliveries, setDeliveries] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, delivered: 0, failed: 0, dead: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await axios.get(`${getApiUrl()}/api/client/${user.id}/webhook-deliveries`);
        setDeliveries(Array.isArray(res.data?.deliveries) ? res.data.deliveries : []);
        if (res.data?.summary) setSummary(res.data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoaded(true);
      }
    };
    if (user?.id) fetchDeliveries();
  }, [user]);

  const summaryCards = [
    { key: 'pending', label: 'Bekleyen', value: summary.pending, icon: Clock, color: 'var(--brand-primary)', bg: 'rgba(14, 165, 233, 0.1)' },
    { key: 'delivered', label: 'Teslim edilen', value: summary.delivered, icon: CheckCircle, color: 'var(--status-success)', bg: 'rgba(16, 185, 129, 0.1)' },
    { key: 'failed', label: 'Başarısız', value: summary.failed, icon: AlertTriangle, color: 'var(--status-warning)', bg: 'rgba(245, 158, 11, 0.1)' },
    { key: 'dead', label: 'Ulaşılamadı', value: summary.dead, icon: XCircle, color: 'var(--status-error)', bg: 'rgba(239, 68, 68, 0.1)' },
  ];

  const hasFailures = (summary.failed || 0) > 0 || (summary.dead || 0) > 0;

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Webhook Durumu</h1>
        <p className="text-muted">Bir doğrulama tamamlandığında sisteminizin webhook adresine "doğrulandı" bildirimi gönderilir. Bu ekranda bu bildirimlerin iletim durumunu görebilirsiniz.</p>
      </header>

      {/* Kısa açıklama */}
      <div className="glass-card" style={{ display: 'flex', gap: '0.85rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
        <Info size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          Kullanıcı doğrulama kodunu gönderdiğinde bildirim, sizin webhook adresinize otomatik iletilir.
          Sunucunuz o an kapalıysa teslim başarısız olur ve sistem artan aralıklarla (1&nbsp;dk, 5&nbsp;dk, 15&nbsp;dk, 1&nbsp;saat, 3&nbsp;saat, 6&nbsp;saat) yeniden dener.
          Herhangi bir işlem yapmanıza gerek yoktur; sunucunuz erişilebilir olduğunda teslim kendiliğinden tamamlanır.
        </p>
      </div>

      {/* Durum özeti kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {summaryCards.map((card) => (
          <div key={card.key} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.85rem', background: card.bg, borderRadius: 12, color: card.color }}>
              <card.icon size={28} />
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>{card.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{card.value ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      {hasFailures && (
        <div className="glass-card" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <AlertTriangle size={20} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0, color: 'var(--text-primary)' }}>
            Bazı bildirimler sunucunuza ulaştırılamadı. Sunucunuz erişilebilir olduğunda otomatik olarak yeniden denenecektir.
          </p>
        </div>
      )}

      <div className="glass-card" style={deliveries.length === 0 ? { padding: 0 } : undefined}>
        {loaded && deliveries.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="Henüz webhook teslimi yok"
            description="İlk doğrulama tamamlandığında sisteminize gönderilen bildirimlerin durumu burada listelenecektir."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th>Deneme</th>
                  <th>Son HTTP</th>
                  <th>Son Hata</th>
                  <th>Sıradaki Deneme</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{fmtDate(d.created_at)}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td className="text-muted">{d.attempts}/{d.max_attempts}</td>
                    <td className="text-muted">{d.last_status_code || '-'}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.last_error || '-'}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {d.status === 'pending' ? fmtDate(d.next_attempt_at) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
