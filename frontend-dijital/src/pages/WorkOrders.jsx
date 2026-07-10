import { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Plus, AlertTriangle, Clock, Wrench, CheckCircle, Play, UserPlus, ShieldAlert, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

// --- Durum & öncelik yardımcıları ---
const STATUS_TR = { open: 'Açık', assigned: 'Atandı', in_progress: 'Devam Ediyor', done: 'Tamamlandı', cancelled: 'İptal' };
const STATUS_BADGE = { open: 'warning', assigned: 'success', in_progress: 'success', done: 'success', cancelled: 'error' };
const STATUS_COLOR = { open: '#f59e0b', assigned: '#0ea5e9', in_progress: '#6366f1', done: '#10b981', cancelled: '#94a3b8' };
const PRIORITY_TR = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', urgent: 'Acil' };
const PRIORITY_COLOR = { low: '#94a3b8', normal: '#0ea5e9', high: '#f59e0b', urgent: '#ef4444' };
const TYPE_TR = { preventive: 'Önleyici', corrective: 'Düzeltici' };

// SQLite UTC zaman damgasını ("YYYY-MM-DD HH:MM:SS") güvenli parse et
const parseUtc = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z') : null);

// Kalan SLA süresini insan-okur biçimde döndür
function slaRemaining(due_at) {
  const due = parseUtc(due_at);
  if (!due) return null;
  const diffMs = due.getTime() - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  let txt;
  if (days > 0) txt = `${days} gün ${hours} sa`;
  else if (hours > 0) txt = `${hours} sa ${mins} dk`;
  else txt = `${mins} dk`;
  return { overdue, txt };
}

export default function WorkOrders({ user }) {
  const isCompany = user?.role === 'company';
  const host = getApiUrl();
  const token = user?.token;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [orders, setOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [techs, setTechs] = useState([]);
  const [preventiveDue, setPreventiveDue] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Yeni iş emri formu
  const [form, setForm] = useState({ machine_id: '', technician_id: '', order_type: 'preventive', priority: 'normal', title: '', description: '', sla_hours: '' });
  const [saving, setSaving] = useState(false);

  const fetchCompany = async (filter = statusFilter) => {
    setLoading(true);
    try {
      const q = filter ? `?status=${filter}` : '';
      const [ro, rm, rt, rp] = await Promise.all([
        axios.get(`${host}/api/dijital/company/work-orders${q}`, authHeader),
        axios.get(`${host}/api/dijital/machines`, authHeader),
        axios.get(`${host}/api/dijital/technicians`, authHeader),
        axios.get(`${host}/api/dijital/company/preventive-due`, authHeader),
      ]);
      setOrders(ro.data);
      setMachines(rm.data);
      setTechs(rt.data.filter(t => t.is_active));
      setPreventiveDue(rp.data);
    } catch (err) {
      toast.error('İş emirleri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnician = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${host}/api/dijital/technician/work-orders`, authHeader);
      setOrders(res.data);
    } catch (err) {
      toast.error('İş emirleriniz yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCompany) fetchCompany();
    else fetchTechnician();
  }, []);

  // Firma: durum filtresi değişince yeniden çek
  const applyFilter = (val) => {
    setStatusFilter(val);
    fetchCompany(val);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.machine_id || !form.title) {
      toast.error('Makine ve başlık zorunludur.');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${host}/api/dijital/company/work-orders`, {
        machine_id: form.machine_id,
        technician_id: form.technician_id || null,
        order_type: form.order_type,
        priority: form.priority,
        title: form.title,
        description: form.description,
        sla_hours: form.sla_hours ? parseInt(form.sla_hours) : null,
      }, authHeader);
      setShowModal(false);
      setForm({ machine_id: '', technician_id: '', order_type: 'preventive', priority: 'normal', title: '', description: '', sla_hours: '' });
      fetchCompany();
      toast.success('İş emri oluşturuldu.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'İş emri oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  // Firma: iş emri güncelle (atama / durum)
  const updateOrder = async (id, payload) => {
    try {
      await axios.put(`${host}/api/dijital/company/work-orders/${id}`, payload, authHeader);
      fetchCompany();
      toast.success('İş emri güncellendi.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Güncellenemedi.');
    }
  };

  // Teknisyen: durum güncelle
  const updateTechStatus = async (id, status) => {
    try {
      await axios.put(`${host}/api/dijital/technician/work-orders/${id}/status`, { status }, authHeader);
      fetchTechnician();
      toast.success('Durum güncellendi.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Güncellenemedi.');
    }
  };

  // Önleyici bakım: makine için tek tıkla önleyici iş emri
  const createPreventive = async (machine) => {
    try {
      await axios.post(`${host}/api/dijital/company/work-orders`, {
        machine_id: machine.id,
        order_type: 'preventive',
        priority: 'normal',
        title: `Periyodik bakım — ${machine.machine_name}`,
        description: `Otomatik önleyici bakım. Son bakım: ${machine.last_maintenance_date || '-'}, periyot: ${machine.maintenance_interval_days} gün.`,
        sla_hours: 72,
      }, authHeader);
      fetchCompany();
      toast.success('Önleyici iş emri oluşturuldu.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Oluşturulamadı.');
    }
  };

  // --- Ortak iş emri kartı ---
  const OrderCard = ({ o }) => {
    const sla = slaRemaining(o.due_at);
    const overdue = o.is_overdue === 1;
    return (
      <div className="glass-card" style={{ padding: '1.25rem', border: overdue ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace' }}>{o.machine_code}</span>
              <span className="badge" style={{ background: 'rgba(15,23,42,0.04)', color: 'var(--text-secondary)' }}>{TYPE_TR[o.order_type] || o.order_type}</span>
              <span className="badge" style={{ background: `${PRIORITY_COLOR[o.priority]}22`, color: PRIORITY_COLOR[o.priority], fontWeight: 700 }}>{PRIORITY_TR[o.priority] || o.priority}</span>
              {overdue && (
                <span className="badge error" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 700 }}>
                  <AlertTriangle size={12} /> GECİKTİ
                </span>
              )}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{o.title}</div>
            <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>{o.machine_name}</div>
            {o.description && <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.3rem', lineHeight: 1.5 }}>{o.description}</div>}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.6rem', fontSize: '0.78rem' }}>
              {isCompany && o.technician_name && (
                <span className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Wrench size={12} /> {o.technician_name}</span>
              )}
              {o.due_at && sla && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: overdue ? '#ef4444' : 'var(--text-secondary)', fontWeight: overdue ? 700 : 500 }}>
                  <Clock size={12} /> {overdue ? `${sla.txt} gecikti` : `SLA: ${sla.txt} kaldı`}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
            <span className={`badge ${STATUS_BADGE[o.status] || ''}`} style={{ color: STATUS_COLOR[o.status], fontWeight: 700, whiteSpace: 'nowrap' }}>
              {STATUS_TR[o.status] || o.status}
            </span>

            {/* Firma aksiyonları */}
            {isCompany && o.status !== 'done' && o.status !== 'cancelled' && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {!o.technician_id && techs.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && updateOrder(o.id, { technician_id: parseInt(e.target.value) })}
                    style={{ ...selectStyle, padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                  >
                    <option value="">Teknisyen ata...</option>
                    {techs.map(t => <option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
                  </select>
                )}
                {(o.status === 'assigned' || o.status === 'open') && (
                  <button onClick={() => updateOrder(o.id, { status: 'in_progress' })} className="btn-outline" style={miniBtn}><Play size={13} /> Başlat</button>
                )}
                {o.status === 'in_progress' && (
                  <button onClick={() => updateOrder(o.id, { status: 'done' })} className="btn-outline" style={miniBtn}><CheckCircle size={13} /> Tamamla</button>
                )}
                <button onClick={() => updateOrder(o.id, { status: 'cancelled' })} className="btn-outline" style={{ ...miniBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>İptal</button>
              </div>
            )}

            {/* Teknisyen aksiyonları */}
            {!isCompany && (
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {(o.status === 'assigned' || o.status === 'open') && (
                  <button onClick={() => updateTechStatus(o.id, 'in_progress')} className="btn-primary" style={miniBtn}><Play size={13} /> Başlat</button>
                )}
                {o.status === 'in_progress' && (
                  <button onClick={() => updateTechStatus(o.id, 'done')} className="btn-primary" style={miniBtn}><CheckCircle size={13} /> Tamamla</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- TEKNİSYEN GÖRÜNÜMÜ ---------- */
  if (!isCompany) {
    return (
      <div style={{ maxWidth: 900 }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 className="gradient-text">Atanmış İş Emirlerim</h1>
          <p className="text-muted">Size atanan bakım ve arıza iş emirlerini buradan başlatıp tamamlayabilirsiniz.</p>
        </header>
        {loading ? (
          <div className="glass-card" style={{ height: 120 }}><div className="skeleton-box" style={{ height: 24, width: '40%' }} /></div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Bekleyen iş emriniz yok" description="Firma size bir iş emri atadığında burada görünecek. Başlat ve Tamamla butonlarıyla durumu güncelleyebilirsiniz." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(o => <OrderCard key={o.id} o={o} />)}
          </div>
        )}
      </div>
    );
  }

  /* ---------- FİRMA GÖRÜNÜMÜ ---------- */
  const filterButtons = [
    { key: '', label: 'Tümü' },
    { key: 'open', label: 'Açık' },
    { key: 'assigned', label: 'Atandı' },
    { key: 'in_progress', label: 'Devam Ediyor' },
    { key: 'done', label: 'Tamamlandı' },
    { key: 'cancelled', label: 'İptal' },
  ];

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">İş Emirleri & SLA</h1>
          <p className="text-muted">Önleyici ve düzeltici bakım iş emirlerini yönetin, teknisyen atayın, SLA sürelerini takip edin.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Yeni İş Emri
        </button>
      </header>

      {/* ÖNLEYİCİ BAKIM ADAY LİSTESİ */}
      {preventiveDue.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(245,158,11,0.45)', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.03))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Önleyici Bakım Önerileri</h3>
              <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0 }}>Bakımı yaklaşan/gecikmiş ve henüz açık iş emri olmayan {preventiveDue.length} makine. Tek tıkla iş emri açın.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {preventiveDue.map(m => {
              const due = parseUtc(m.next_due + ' 00:00:00');
              const overdue = due && due.getTime() < Date.now();
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.6)', padding: '0.75rem 1rem', borderRadius: 8, border: `1px solid ${overdue ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.3)'}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', fontFamily: 'monospace' }}>{m.machine_code}</span>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{m.machine_name}</strong>
                      <span className="badge" style={{ background: overdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.18)', color: overdue ? '#ef4444' : '#b45309', fontWeight: 700 }}>{overdue ? 'GECİKTİ' : 'Yaklaşıyor'}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      Sonraki bakım: <strong style={{ color: overdue ? '#ef4444' : '#b45309' }}>{m.next_due}</strong> • Periyot: {m.maintenance_interval_days} gün
                    </div>
                  </div>
                  <button onClick={() => createPreventive(m)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    <Plus size={14} /> Önleyici İş Emri Oluştur
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DURUM FİLTRESİ */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {filterButtons.map(f => (
          <button
            key={f.key}
            onClick={() => applyFilter(f.key)}
            className={statusFilter === f.key ? 'btn-primary' : 'btn-outline'}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* İŞ EMRİ LİSTESİ */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ height: 110 }}><div className="skeleton-box" style={{ height: 24, width: '40%', marginBottom: '0.75rem' }} /><div className="skeleton-box" style={{ height: 16, width: '70%' }} /></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Henüz iş emri yok"
          description="Yeni iş emri oluşturarak makine bakım ve arıza süreçlerini SLA takibiyle yönetmeye başlayın. Müşteri arıza taleplerini de tek tıkla düzeltici iş emrine çevirebilirsiniz."
          actionLabel="Yeni İş Emri"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(o => <OrderCard key={o.id} o={o} />)}
        </div>
      )}

      {/* YENİ İŞ EMRİ MODALI */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni İş Emri</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={labelStyle}>Makine</label>
                <select required style={selectStyle} value={form.machine_id} onChange={e => setForm({ ...form, machine_id: e.target.value })}>
                  <option value="">Makine seçin...</option>
                  {machines.map(m => <option key={m.id} value={m.id}>{m.machine_code} — {m.machine_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tür</label>
                  <select style={selectStyle} value={form.order_type} onChange={e => setForm({ ...form, order_type: e.target.value })}>
                    <option value="preventive">Önleyici</option>
                    <option value="corrective">Düzeltici</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Öncelik</label>
                  <select style={selectStyle} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Düşük</option>
                    <option value="normal">Normal</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Başlık</label>
                <input required style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Örn: 6 aylık periyodik bakım" />
              </div>
              <div>
                <label style={labelStyle}>Açıklama</label>
                <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Yapılacak işlerin detayı..." />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Teknisyen (opsiyonel)</label>
                  <select style={selectStyle} value={form.technician_id} onChange={e => setForm({ ...form, technician_id: e.target.value })}>
                    <option value="">Sonra ata</option>
                    {techs.map(t => <option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>SLA Süresi (saat)</label>
                  <input type="number" min="1" style={inputStyle} value={form.sla_hours} onChange={e => setForm({ ...form, sla_hours: e.target.value })} placeholder="Örn: 24" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Kaydediliyor...' : 'Oluştur'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
const selectStyle = { width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' };
const miniBtn = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.35rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' };
