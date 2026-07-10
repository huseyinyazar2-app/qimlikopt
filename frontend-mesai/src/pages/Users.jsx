import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config';
import toast from 'react-hot-toast';
import {
  UserCog, Plus, Mail, User, KeyRound, Shield, Phone, Trash2, Pencil, Save, X, Crown,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { getRole, ROLE_LABELS, ROLE_COLORS } from '../utils/role';

// Alt kullanıcılar için seçilebilir roller (owner örtük olduğu için listede yok)
const ASSIGNABLE_ROLES = ['manager', 'operator', 'viewer'];

const ROLE_HINTS = {
  manager: 'Kullanıcılar hariç her şeye erişir (Ayarlar, Bordro dahil).',
  operator: 'Günlük işlemler açık; Ayarlar ve Bordro kapalı.',
  viewer: 'Sadece görüntüler; hiçbir değişiklik yapamaz.',
};

function RoleBadge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.viewer;
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999, background: c.bg, color: c.fg }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export default function Users({ user }) {
  // Sayfa guard'ı: yalnızca owner.
  if (getRole() !== 'owner') return <Navigate to="/dashboard" replace />;

  const host = getApiUrl();
  const headers = { Authorization: `Bearer ${user.token}` };

  const [owner, setOwner] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ekle formu
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [addLoading, setAddLoading] = useState(false);

  // Düzenle modalı
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'viewer', password: '', is_active: true });
  const [editLoading, setEditLoading] = useState(false);

  // Silme onayı
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${host}/api/mesai/company/users`, { headers });
      setOwner(res.data.owner || null);
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (addForm.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }
    setAddLoading(true);
    try {
      await axios.post(`${host}/api/mesai/company/users`, {
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
      }, { headers });
      toast.success('Kullanıcı eklendi');
      setShowAdd(false);
      setAddForm({ name: '', email: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kullanıcı eklenemedi');
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name || '', role: u.role || 'viewer', password: '', is_active: !!u.is_active });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (editForm.password && editForm.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }
    setEditLoading(true);
    try {
      const body = {
        name: editForm.name,
        role: editForm.role,
        is_active: editForm.is_active,
      };
      if (editForm.password) body.password = editForm.password;
      await axios.put(`${host}/api/mesai/company/users/${editUser.id}`, body, { headers });
      toast.success('Kullanıcı güncellendi');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Güncelleme başarısız');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${host}/api/mesai/company/users/${deleteTarget.id}`, { headers });
      toast.success('Kullanıcı silindi');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silme başarısız');
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">Kullanıcı Yönetimi</h1>
          <p className="text-muted">Firma panelinize personel hesapları ekleyin ve yetki seviyelerini belirleyin.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          <Plus size={18} /> Yeni Kullanıcı
        </button>
      </header>

      {/* Owner (birincil) kartı — düzenlenemez */}
      {owner && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--brand-primary)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: ROLE_COLORS.owner.bg, color: ROLE_COLORS.owner.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{owner.name || 'Firma Sahibi'}</span>
              <RoleBadge role="owner" />
              <span className="badge" style={{ background: 'rgba(15,23,42,0.05)', color: 'var(--text-secondary)' }}>Birincil Hesap</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} /> {owner.login_hint || 'Telefon ile giriş'}
            </div>
          </div>
        </div>
      )}

      {/* Alt kullanıcı tablosu */}
      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ad</th>
                <th>E-posta</th>
                <th>Rol</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 500 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={15} />
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'success' : 'error'}`}>
                      {u.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(u)} title="Düzenle"
                        style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <Pencil size={14} /> Düzenle
                      </button>
                      <button onClick={() => setDeleteTarget(u)} title="Sil"
                        style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: 6, padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--status-error)', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 0 }}>
                    <EmptyState
                      icon={UserCog}
                      title="Henüz alt kullanıcı yok"
                      description="Firma panelinize yönetici, operatör veya izleyici hesapları ekleyerek ekibinizle güvenli şekilde çalışın."
                      actionLabel="Yeni Kullanıcı Ekle"
                      onAction={() => setShowAdd(true)}
                    />
                  </td>
                </tr>
              )}
              {loading && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Yükleniyor...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ekle Modalı */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 420 }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni Kullanıcı</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Ad Soyad</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input required style={inputStyle} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Örn: Ayşe Kaya" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>E-posta</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={iconStyle} />
                  <input type="email" required style={inputStyle} value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="ornek@firma.com" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Şifre (en az 6 karakter)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={iconStyle} />
                  <input type="password" required minLength={6} style={inputStyle} value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={iconStyle} />
                  <select style={inputStyle} value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                    {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>{ROLE_HINTS[addForm.role]}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={cancelBtn}>İptal</button>
                <button type="submit" className="btn-primary" disabled={addLoading} style={{ flex: 1 }}>{addLoading ? 'Ekleniyor...' : 'Ekle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenle Modalı */}
      {editUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 style={{ margin: 0 }}>Kullanıcı Düzenle</h2>
              <button onClick={() => setEditUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>{editUser.email}</p>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Ad Soyad</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input required style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={iconStyle} />
                  <select style={inputStyle} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                    {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>{ROLE_HINTS[editForm.role]}</p>
              </div>
              <div>
                <label style={labelStyle}>Yeni Şifre (boş = değişmez)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={iconStyle} />
                  <input type="password" minLength={6} style={inputStyle} value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isActive" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <label htmlFor="isActive" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Hesap aktif</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditUser(null)} style={cancelBtn}>İptal</button>
                <button type="submit" className="btn-primary" disabled={editLoading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={16} /> {editLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onayı */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 380, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: 'var(--status-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Kullanıcıyı Sil</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) hesabı kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDeleteTarget(null)} style={cancelBtn}>Vazgeç</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'var(--status-error)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' };
const iconStyle = { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' };
const inputStyle = {
  width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
};
const cancelBtn = { flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' };
