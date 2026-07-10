// Panel (şirket) kullanıcı rolleri için yardımcılar.
// Hiyerarşi: owner > manager > operator > viewer (salt-okunur).
// Not: Teknisyen (reverse-OTP ile giren saha personeli) bu sistemin DIŞINDADIR.

const TIERS = { viewer: 1, operator: 2, manager: 3, owner: 4 };

export const ROLE_LABELS = {
  owner: 'Sahip',
  manager: 'Yönetici',
  operator: 'Operatör',
  viewer: 'İzleyici',
};

// Rol rozeti için görsel sınıf (index.css badge renkleri)
export const ROLE_BADGE = {
  owner: 'success',
  manager: '',
  operator: 'warning',
  viewer: 'error',
};

// Aktif panel rolü. Kayıtlı değilse örtük 'owner' (mevcut şirket hesabı).
export function getRole() {
  return localStorage.getItem('dijital_role') || 'owner';
}

// En az belirtilen seviyede yetki var mı? (örn. hasTier('operator'))
export function hasTier(min) {
  return (TIERS[getRole()] || 0) >= (TIERS[min] || 0);
}

// Salt-okunur (izleyici) mi?
export function isReadOnly() {
  return getRole() === 'viewer';
}

// Sadece sahip mi? (kullanıcı yönetimi vb.)
export function isOwner() {
  return getRole() === 'owner';
}

export function setRole(role) {
  if (role) localStorage.setItem('dijital_role', role);
}

export function clearRole() {
  localStorage.removeItem('dijital_role');
}
