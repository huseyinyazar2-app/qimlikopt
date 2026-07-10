import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../utils/mapIcons';

// Verilen noktalara göre haritayı otomatik yakınlaştırır.
// points: [[lat, lng], ...]
function FitBounds({ points, maxZoom = 17 }) {
  const map = useMap();
  const key = JSON.stringify(points);

  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], Math.min(16, maxZoom));
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// Haritaya tıklanınca koordinat seçtirir (lokasyon/makine konumu atama)
function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Kapsayıcı kutunun boyutu sonradan değişirse (sekme/modal açılışı) harita gri kalır.
function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapView({
  children,
  fitPoints,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = 520,
  onPick,
  maxZoom = 17,
  style,
}) {
  return (
    // z-index: 0 ile yeni bir yığılma bağlamı açıyoruz. Aksi halde Leaflet'in
    // katmanları (z-index: 400) modal ve bildirim panelinin üstüne taşar.
    <div style={{ position: 'relative', zIndex: 0, height, borderRadius: 12, overflow: 'hidden', ...style }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ResizeFix />
        {fitPoints && fitPoints.length > 0 && <FitBounds points={fitPoints} maxZoom={maxZoom} />}
        {onPick && <ClickPicker onPick={onPick} />}
        {children}
      </MapContainer>
    </div>
  );
}

// Harita üstüne yerleşen küçük gösterge kutusu (renk açıklamaları)
export function MapLegend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem' }}>
      {items.map(it => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: it.color, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.2)' }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
