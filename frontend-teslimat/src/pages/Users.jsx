import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Plus, Mail, User, KeyRound, ShieldCheck, Crown, Pencil, Trash2, X } from 'lucide-react';
import { getApiUrl } from '../config';
import { roleLabel } from '../utils/role';
import EmptyState from '../components/EmptyState';

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Yönetici', hint: 'Günlük işlemler + tam yazma yetkisi' },
  { value: 'operator', label: 'Operatör', hint: 'Günlük işlemler (kurye/paket)' },
  { value: 'viewer', label: 'İzleyici', hint: 'Salt-okunur, aksiyon yok' },
];

const ROLE_BADGE_CLASS = {
  owner: 'primary',
  manager: 'success',
  operator: 'secondary',
  viewer: 'warning',
};

export default function Users({ user }) {
  const [owner, setOwner] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // düzenlenen kullanıcı objesi

  // Ekleme formu
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [saving, setSaving] = useState(false);

  // Düzenleme formu
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('operator');
  const [editPassword, setEditPassword] = useState('');
  const [editActive, setEditActive] = useState(true);

  const host = getApiUrl();
  const token = user?.token;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${host}/api/teslimat/company/users`, { headers });
      setOwner(res.data.owner);
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetAddForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('operator');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (String(password).length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${host}/api/teslimat/company/users`, { name, email, password, role }, { headers });
      toast.success('Kullanıcı oluşturuldu.');
      setShowAddModal(false);
      resetAddForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kullanıcı oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditPassword('');
    setEditActive(!!u.is_active);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editPassword && String(editPassword).length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      const body = { name: editName, role: editRole, is_active: editActive };
      if (editPassword) body.password = editPassword;
      await axios.put(`${host}/api/teslimat/company/users/${editUser.id}`, body, { headers });
      toast.success('Kullanıcı güncellendi.');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Güncelleme başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`${u.name} adlı kullanıcıyı silmek istediğinize emin misiniz?`)) return;
    try {
      await axios.delete(`${host}/api/teslimat/company/users/${u.id}`, { headers });
      toast.success('Kullanıcı silindi.');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Silme başarısız.');
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="gradient-text">Kullanıcı & Rol Yönetimi</h1>
          <p className="text-muted">Firmanıza personel ekleyin ve yetki seviyelerini (rol) belirleyin. Bu ekranı yalnızca firma sahibi görür.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          <Plus size={18} /> Yeni Personel Ekle
        </button>
      </header>

      {/* Sahip (owner) kartı — düzenlenemez */}
      {owner && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Crown size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{owner.name}</span>
              <span className="badge primary">Sahip</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>
              {owner.login_hint || 'Telefon ile giriş'}{owner.email ? ` · ${owner.email}` : ''}
            </div>
          </div>
          <span className="text-muted" style={{ fontSize: '0.78rem' }}>Birincil hesap — düzenlenemez</span>
        </div>
      )}

      {/* Alt kullanıcı tablosu */}
      <div className="glass-card">
        {loading ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '2.5rem' }}>Yükleniyor...</div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={40} />}
            title="Henüz personel yok"
            description="Firmanıza ek kullanıcı ekleyin. Her personele bir rol (Yönetici, Operatör veya İzleyici) atayarak yetki seviyesini belirleyebilirsiniz."
            actionLabel="Yeni Personel Ekle"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE_CLASS[u.role] || 'secondary'}`}>{roleLabel(u.role)}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'success' : 'error'}`}>{u.is_active ? 'Aktif' : 'Pasif'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEdit(u)}
                          className="btn-outline"
                          style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Pencil size={13} /> Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn-outline"
                          style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        >
                          <Trash2 size={13} /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ekleme Modalı */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>Yeni Personel Ekle</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Ad Soyad</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Ayşe Kaya" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>E-posta</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={iconStyle} />
                  <input required type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@firma.com" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Şifre (en az 6 karakter)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={iconStyle} />
                  <input required type="password" minLength={6} style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Rol</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={selectStyle}>
                  {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} — {o.hint}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={cancelBtnStyle}>İptal</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {editUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>Personeli Düzenle</h2>
              <button onClick={() => setEditUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>{editUser.email}</p>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Ad Soyad</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={iconStyle} />
                  <input required style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Rol</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)} style={selectStyle}>
                  {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} — {o.hint}</option>)}
                </select>
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Yeni Şifre (boş bırakılırsa değişmez)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={iconStyle} />
                  <input type="password" style={inputStyle} value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                Hesap aktif
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setEditUser(null)} style={cancelBtnStyle}>İptal</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Kaydediliyor...' : 'Güncelle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};

const iconStyle = {
  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'
};

const cancelBtnStyle = {
  flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer'
};
