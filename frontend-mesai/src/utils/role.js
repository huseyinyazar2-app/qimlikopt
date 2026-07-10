// Rol kademeleri (yüksekten düşüğe): owner > manager > operator > viewer
// owner  = Sahip (her şey)
// manager= Yönetici (Kullanıcılar hariç her şey)
// operator=Operatör (günlük işlemler; Ayarlar ve Bordro kapalı)
// viewer = İzleyici (salt-okunur)

const TIERS = ['viewer', 'operator', 'manager', 'owner'];

export const ROLE_LABELS = {
  owner: 'Sahip',
  manager: 'Yönetici',
  operator: 'Operatör',
  viewer: 'İzleyici',
};

// Rol rozeti için renkler
export const ROLE_COLORS = {
  owner: { bg: 'rgba(139, 92, 246, 0.15)', fg: '#7c3aed' },
  manager: { bg: 'rgba(14, 165, 233, 0.15)', fg: '#0284c7' },
  operator: { bg: 'rgba(16, 185, 129, 0.15)', fg: '#059669' },
  viewer: { bg: 'rgba(100, 116, 139, 0.15)', fg: '#475569' },
};

// localStorage'dan aktif rolü oku. Yoksa eski oturum uyumu için 'owner' varsay.
export function getRole() {
  const r = localStorage.getItem('mesai_role');
  return r && TIERS.includes(r) ? r : 'owner';
}

export function setRole(role) {
  if (role && TIERS.includes(role)) localStorage.setItem('mesai_role', role);
  else localStorage.removeItem('mesai_role');
}

export function clearRole() {
  localStorage.removeItem('mesai_role');
}

function tierOf(role) {
  const i = TIERS.indexOf(role);
  return i === -1 ? TIERS.indexOf('owner') : i;
}

// role en az min kademesinde mi? (owner >= manager >= operator >= viewer)
export function hasTier(min, role = getRole()) {
  return tierOf(role) >= tierOf(min);
}

export function isReadOnly(role = getRole()) {
  return role === 'viewer';
}

export function isOwner(role = getRole()) {
  return role === 'owner';
}

// Ayarlar ve Bordro operatörden gizlenir
export function canSeeSettings(role = getRole()) {
  return role !== 'operator';
}

export function canSeePayroll(role = getRole()) {
  return role !== 'operator';
}

export function canManageUsers(role = getRole()) {
  return role === 'owner';
}
