// Panel kullanıcı rolleri (Faz 3 — çok kullanıcılı yetkilendirme).
// Hiyerarşi: owner > manager > operator > viewer (salt-okunur).
// Rol, girişte localStorage'a 'teslimat_role' anahtarıyla yazılır.

const TIERS = {
  viewer: 1,
  operator: 2,
  manager: 3,
  owner: 4,
};

// Aktif rolü döndürür. Kayıt yoksa (örn. eski oturum) güvenli varsayılan 'owner'.
export function getRole() {
  return localStorage.getItem('teslimat_role') || 'owner';
}

// Aktif rol, verilen minimum seviyeye eşit veya üstünde mi?
// Örn: hasTier('operator') -> operator, manager, owner için true.
export function hasTier(min) {
  return (TIERS[getRole()] || 0) >= (TIERS[min] || 0);
}

// Salt-okunur (viewer) mı? true ise tüm yazma aksiyonları gizlenmeli.
export function isReadOnly() {
  return getRole() === 'viewer';
}

// Sadece sahip (owner) mı? Kullanıcı yönetimi bu koşula bağlıdır.
export function isOwner() {
  return getRole() === 'owner';
}

// Rol rozetinde gösterilecek Türkçe etiket.
export const ROLE_LABELS = {
  owner: 'Sahip',
  manager: 'Yönetici',
  operator: 'Operatör',
  viewer: 'İzleyici',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}
