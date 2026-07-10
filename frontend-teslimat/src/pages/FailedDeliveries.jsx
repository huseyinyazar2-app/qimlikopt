import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Truck, User, Phone, MapPin,
  Clock, Calendar, RotateCcw, PackageX
} from 'lucide-react';
import { getApiUrl } from '../config';
import { isReadOnly } from '../utils/role';
import EmptyState from '../components/EmptyState';

const FAIL_REASON_LABELS = {
  recipient_absent: 'Alıcı adreste yok',
  wrong_address: 'Yanlış adres',
  refused: 'Alıcı reddetti',
  other: 'Diğer',
};

const translateReason = (r) => FAIL_REASON_LABELS[r] || r || '-';

export default function FailedDeliveries({ user }) {
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [attempts, setAttempts] = useState({}); // { [packageId]: [attempts] }
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  const [reassignPackId, setReassignPackId] = useState(null);
  const [selectedCourierId, setSelectedCourierId] = useState('');

  const readOnly = isReadOnly();
  const host = getApiUrl();
  const token = user?.token;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const resP = await axios.get(`${host}/api/teslimat/company/packages/failed`, { headers });
      setPackages(resP.data);
      const resC = await axios.get(`${host}/api/teslimat/couriers`, { headers });
      setCouriers(resC.data.filter(c => c.is_active));
    } catch (err) {
      toast.error('Başarısız teslim verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleAttempts = async (packId) => {
    if (expandedId === packId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(packId);
    if (!attempts[packId]) {
      setAttemptsLoading(true);
      try {
        const res = await axios.get(`${host}/api/teslimat/company/packages/${packId}/attempts`, { headers });
        setAttempts(prev => ({ ...prev, [packId]: res.data }));
      } catch (err) {
        toast.error('Deneme geçmişi yüklenemedi');
      } finally {
        setAttemptsLoading(false);
      }
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedCourierId) return;
    try {
      await axios.put(
        `${host}/api/teslimat/company/packages/${reassignPackId}/reassign`,
        { courier_id: parseInt(selectedCourierId) },
        { headers }
      );
      toast.success('Paket yeniden atandı ve dağıtıma alındı.');
      setReassignPackId(null);
      setSelectedCourierId('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Yeniden atama başarısız.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw className="spin" size={36} color="var(--brand-primary)" style={{ margin: '0 auto 1rem auto' }} />
        <p className="text-muted">Başarısız teslimler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">Başarısız Teslimler</h1>
        <p className="text-muted">Teslim edilemeyen gönderileri inceleyin, deneme geçmişini görün ve yeniden dağıtım için kurye atayın.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {packages.map(p => {
          const isOpen = expandedId === p.id;
          const list = attempts[p.id] || [];
          return (
            <div key={p.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace' }}>{p.package_code}</span>
                    <span className="badge error">Başarısız</span>
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      {p.attempts} Deneme
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{p.recipient_name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Phone size={14} className="text-muted" /> {p.recipient_phone}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}><MapPin size={14} className="text-muted" style={{ marginTop: 2, flexShrink: 0 }} /> {p.delivery_address}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Truck size={14} className="text-muted" /> Son Kurye: <strong>{p.courier_name || 'Atanmamış'}</strong></div>
                    {p.return_reason && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#ef4444' }}>
                        <AlertTriangle size={14} /> Son Neden: {translateReason(p.return_reason)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 180 }}>
                  {!readOnly && (
                    <button
                      onClick={() => { setReassignPackId(p.id); setSelectedCourierId(''); }}
                      className="btn-primary"
                      style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <RotateCcw size={15} /> Yeniden Ata
                    </button>
                  )}
                  <button
                    onClick={() => toggleAttempts(p.id)}
                    className="btn-outline"
                    style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />} Deneme Geçmişi
                  </button>
                </div>
              </div>

              {/* Deneme geçmişi (açılır) */}
              {isOpen && (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  {attemptsLoading && !attempts[p.id] ? (
                    <div className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>Geçmiş yükleniyor...</div>
                  ) : list.length === 0 ? (
                    <div className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>Kayıtlı deneme bulunmuyor.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {list.map(a => (
                        <div key={a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--glass-border)', borderRadius: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                            {a.attempt_no}
                          </div>
                          <div style={{ flex: 1, fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: '#ef4444' }}>{translateReason(a.reason)}</span>
                              <span className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <User size={12} /> {a.courier_name || 'Bilinmiyor'}
                              </span>
                              <span className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={12} /> {new Date(a.created_at).toLocaleString('tr-TR')}
                              </span>
                            </div>
                            {a.note && <div className="text-muted" style={{ marginBottom: 4 }}>Not: {a.note}</div>}
                            {a.next_attempt_date && (
                              <div className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Calendar size={12} /> Yeniden deneme: {new Date(a.next_attempt_date).toLocaleDateString('tr-TR')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {packages.length === 0 && (
          <div className="glass-card">
            <EmptyState
              icon={<PackageX size={40} />}
              title="Başarısız teslim yok"
              description="Teslim edilemeyen (başarısız) gönderiler burada listelenir. Kuryeler teslim edemedikleri paketleri işaretlediğinde bu ekranda görürsünüz."
            />
          </div>
        )}
      </div>

      {/* Yeniden Atama Modalı */}
      {reassignPackId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400 }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Paketi Yeniden Ata</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Bu başarısız gönderiyi yeniden dağıtıma almak için bir aktif kurye seçin. Paket "Dağıtımda" durumuna geçer.</p>
            <form onSubmit={handleReassign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Atanacak Kurye</label>
                <select
                  required
                  value={selectedCourierId}
                  onChange={e => setSelectedCourierId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Kurye Seçin...</option>
                  {couriers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.surname} ({c.phone_number})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setReassignPackId(null); setSelectedCourierId(''); }} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Yeniden Ata</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
