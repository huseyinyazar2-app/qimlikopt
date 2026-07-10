import L from 'leaflet';

// Leaflet'in varsayılan işaretçi ikonu paketleyici (Vite) altında kırılır:
// ikon PNG yollarını çalışma anında kendi kendine kurar. Bunun yerine tüm
// işaretçileri CSS ile çizilen divIcon olarak üretiyoruz — hiç varlık dosyası yok.

export function dotIcon(color, size = 16) {
  return L.divIcon({
    className: 'qmlk-pin',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,0.25)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Sıra numarası taşıyan rota işaretçisi
export function numberedIcon(color, number, size = 24) {
  return L.divIcon({
    className: 'qmlk-pin',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,0.25);color:#fff;font-size:${Math.round(size * 0.46)}px;font-weight:700;line-height:1">${number}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Damla biçimli konum iğnesi (şantiye / makine merkezi gibi sabit noktalar)
export function pinIcon(color, size = 30) {
  const w = size * 0.72;
  return L.divIcon({
    className: 'qmlk-pin',
    html: `<span style="display:block;width:${w}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 0 0 1.5px rgba(0,0,0,0.25)"></span>`,
    iconSize: [w, size],
    iconAnchor: [w / 2, size],
  });
}

// Türkiye merkezi — hiç nokta yoksa haritanın açılacağı yer
export const DEFAULT_CENTER = [39.0, 35.0];
export const DEFAULT_ZOOM = 6;
