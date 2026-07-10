import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldUser, Plus, User, Mail, KeyRound, Crown, Edit, Trash2, Shield } from 'lucide-react';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';
import { ROLE_LABELS, ROLE_BADGE } from '../utils/role';

// Sahibin atayabileceği roller (owner kendisi atanamaz)
const ASSIGNABLE_ROLES = ['manager', 'operator', 'viewer'];

const ROLE_DESC = {
  manager: 'Tüm günlük işlemleri yapabilir (makine, iş emri, form, teknisyen).',
  operator: 'Günlük saha işlemlerini yapar (yönetici ile aynı yazma yetkisi).',
  viewer: 'Yalnızca görüntüler; hiçbir değişiklik yapamaz.',
};

export default function Users({ user }) {
  const host = getApiUrl();
  const token = user?.token;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [owner, setOwner] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ekleme modalı
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'operator' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  // Düzenleme modalı
  const [editUser, setEditUser] = useState(null); // {id,name,email,role,is_active}
  const [editForm, setEditForm] = useState({ name: '', role: 'operator', password: '', is_active: true });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${host}/api/dijital/company/users`, authHeader);
      setOwner(res.data.owner || null);
      setUsers(Array.isArray(res.data.users) ? res.data.users : []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kullanıcılar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setAddError('');
    if (addForm.password.length < 6) {
      setAddError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${host}/api/dijital/company/users`, addForm, authHeader);
      setShowAdd(false);
      setAddForm({ name: '', email: '', password: '', role: 'operator' });
      fetchUsers();
      toast.success('Kullanıcı eklendi.');
    } catch (err) {
      setAddError(err.response?.data?.error || 'Kullanıcı eklenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name || '', role: u.role || 'operator', password: '', is_active: u.is_active !== 0 && u.is_active !== false });
    setEditError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError('');
    if (editForm.password && editForm.password.length < 6) {
      setEditError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    setEditSaving(true);
    try {
      const payload = { name: editForm.name, role: editForm.role, is_active: editForm.is_active };
      if (editForm.password) payload.password = editForm.password;
      await axios.put(`${host}/api/dijital/company/users/${editUser.id}`, payload, authHeader);
      setEditUser(null);
      fetchUsers();
      toast.success('Kullanıcı güncellendi.');
    } catch (err) {
      setEditError(err.response?.data?.error || 'Güncellenirken hata oluştu.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`"${u.name}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    try {
      await axios.delete(`${host}/api/dijital/company/users/${u.id}`, authHeader);
      fetchUsers();
      toast.success('Kullanıcı silindi.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silinirken hata oluştu.');
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">Kullanıcı & Rol Yönetimi</h1>
          <p className="text-muted">Firma panelinize e-posta ile giriş yapacak ek personel ekleyin ve yetki seviyelerini belirleyin.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Yeni Kullanıcı
        </button>
      </header>

      {/* SAHİP (birincil) KARTI */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(16,185,129,0.35)', background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(2,132,199,0.03))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Crown size={24} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{owner?.name || 'Firma Sahibi'}</strong>
              <span className="badge success" style={{ fontWeight: 700 }}>Sahip (Birincil)</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {owner?.login_hint || owner?.email || 'Telefon + şifre ile giriş yapar'}
            </div>
          </div>
          <span className="text-muted" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Bu hesap düzenlenemez</span>
        </div>
      </div>

      {/* ALT KULLANICI TABLOSU */}
      {loading ? (
        <div className="glass-card" style={{ height: 120 }}>
          <div className="skeleton-box" style={{ height: 24, width: '40%', marginBottom: '0.75rem' }} />
          <div className="skeleton-box" style={{ height: 16, width: '70%' }} />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={ShieldUser}
          title="Henüz ek kullanıcı yok"
          description="Panelinize e-posta ile giriş yapacak personel ekleyin. Yönetici ve operatör günlük işlemleri yapar, izleyici yalnızca görüntüler."
          actionLabel="Yeni Kullanıcı"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="glass-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] || ''}`} style={{ fontWeight: 600 }}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${(u.is_active === 0 || u.is_active === false) ? 'error' : 'success'}`}>
                        {(u.is_active === 0 || u.is_active === false) ? 'Askıda' : 'Aktif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => openEdit(u)}
                          className="btn-outline"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Düzenle"
                        >
                          <Edit size={14} /> Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn-outline"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                          title="Sil"
                        >
                          <Trash2 size={14} /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EKLEME MODALI */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni Kullanıcı Ekle</h2>
            {addError && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {addError}
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Ad Soyad</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input required style={inputStyle} value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="Örn: Ayşe Kaya" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>E-posta</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={iconStyle} />
                  <input type="email" required style={inputStyle} value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="personel@firma.com" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Şifre (en az 6 karakter)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={iconStyle} />
                  <input type="password" required minLength={6} style={inputStyle} value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={iconStyle} />
                  <select style={{ ...inputStyle, background: '#ffffff' }} value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
                    {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem', lineHeight: 1.4 }}>{ROLE_DESC[addForm.role]}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={cancelBtn}>İptal</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DÜZENLEME MODALI */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Kullanıcıyı Düzenle</h2>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>{editUser.email}</p>
            {editError && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {editError}
              </div>
            )}
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Ad Soyad</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input required style={inputStyle} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={iconStyle} />
                  <select style={{ ...inputStyle, background: '#ffffff' }} value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                    {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem', lineHeight: 1.4 }}>{ROLE_DESC[editForm.role]}</p>
              </div>
              <div>
                <label style={labelStyle}>Yeni Şifre (boş bırakılırsa değişmez)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={iconStyle} />
                  <input type="password" style={inputStyle} value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="••••••••" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} style={{ width: 16, height: 16 }} />
                Hesap aktif (kapalıysa giriş yapamaz)
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditUser(null)} style={cancelBtn}>İptal</button>
                <button type="submit" className="btn-primary" disabled={editSaving} style={{ flex: 1 }}>{editSaving ? 'Kaydediliyor...' : 'Güncelle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' };
const iconStyle = { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' };
const cancelBtn = { flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' };
