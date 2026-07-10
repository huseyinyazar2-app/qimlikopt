import { useState, useEffect } from 'react';
import { Webhook, Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

const STATUS_META = {
  pending: { label: 'Bekliyor', className: 'badge', style: { background: 'rgba(14, 165, 233, 0.15)', color: 'var(--brand-primary)' } },
  delivered: { label: 'Teslim edildi', className: 'badge success' },
  failed: { label: 'Başarısız', className: 'badge warning' },
  dead: { label: 'Ölü', className: 'badge error' },
};

const FILTERS = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Bekleyen' },
  { value: 'failed', label: 'Başarısız' },
  { value: 'dead', label: 'Ölü' },
  { value: 'delivered', label: 'Teslim edilen' },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: 'badge' };
  return <span className={meta.className} style={meta.style}>{meta.label}</span>;
}

const fmtDate = (v) => (v ? new Date(v).toLocaleString('tr-TR') : '-');

export default function Webhooks() {
  const [deliveries, setDeliveries] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, delivered: 0, failed: 0, dead: 0 });
  const [filter, setFilter] = useState('all');
  const [loaded, setLoaded] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const fetchDeliveries = async (status = filter) => {
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const res = await axios.get(`${getApiUrl()}/api/admin/webhook-deliveries${query}`);
      setDeliveries(Array.isArray(res.data?.deliveries) ? res.data.deliveries : []);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchDeliveries(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await axios.post(`${getApiUrl()}/api/admin/webhook-deliveries/${id}/retry`);
      toast.success('Teslim yeniden kuyruğa alındı.');
      fetchDeliveries(filter);
    } catch (err) {
      toast.error('Hata: ' + (err.response?.data?.error || err.message));
    } finally {
      setRetryingId(null);
    }
  };

  const summaryCards = [
    { key: 'pending', label: 'Bekleyen', value: summary.pending, icon: Clock, color: 'var(--brand-primary)', bg: 'rgba(14, 165, 233, 0.1)' },
    { key: 'delivered', label: 'Teslim edilen', value: summary.delivered, icon: CheckCircle, color: 'var(--status-success)', bg: 'rgba(16, 185, 129, 0.1)' },
    { key: 'failed', label: 'Başarısız', value: summary.failed, icon: AlertTriangle, color: 'var(--status-warning)', bg: 'rgba(245, 158, 11, 0.1)' },
    { key: 'dead', label: 'Ölü', value: summary.dead, icon: XCircle, color: 'var(--status-error)', bg: 'rgba(239, 68, 68, 0.1)' },
  ];

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Webhook Teslimleri</h1>
        <p className="text-muted">Doğrulanan kodların müşteri webhook adreslerine iletim durumu. Başarısız teslimler artan aralıklarla otomatik yeniden denenir.</p>
      </header>

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

      {/* Durum filtresi */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={filter === f.value ? 'btn-primary' : ''}
            style={filter === f.value ? { padding: '0.5rem 1.1rem', fontSize: '0.85rem' } : {
              padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: 8,
              background: 'transparent', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="glass-card" style={deliveries.length === 0 ? { padding: 0 } : undefined}>
        {loaded && deliveries.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="Bu filtrede teslim kaydı yok"
            description="Bir doğrulama tamamlanıp müşterinin webhook adresine bildirim gönderildiğinde teslimler burada listelenir."
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Durum</th>
                  <th>Deneme</th>
                  <th>Son HTTP</th>
                  <th>Son Hata</th>
                  <th>Sıradaki Deneme</th>
                  <th>Güncelleme</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.company_name || '-'}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{d.prefix}</div>
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td className="text-muted">{d.attempts}/{d.max_attempts}</td>
                    <td className="text-muted">{d.last_status_code || '-'}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.last_error || '-'}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {d.status === 'pending' ? fmtDate(d.next_attempt_at) : '-'}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{fmtDate(d.updated_at)}</td>
                    <td>
                      {(d.status === 'failed' || d.status === 'dead') && (
                        <button
                          onClick={() => handleRetry(d.id)}
                          disabled={retryingId === d.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.8rem',
                            background: 'transparent', border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)', cursor: retryingId === d.id ? 'default' : 'pointer',
                            opacity: retryingId === d.id ? 0.6 : 1,
                          }}
                          title="Yeniden Dene"
                        >
                          <RefreshCw size={14} /> Yeniden Dene
                        </button>
                      )}
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
