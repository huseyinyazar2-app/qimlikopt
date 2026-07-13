const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname.endsWith('qimlik.com')
    ? 'https://api.qimlik.com'
    : `http://${window.location.hostname}:3303`);

export const getApiUrl = () => API_URL;

// Panel adresini uret: uretimde <subdomain>.qimlik.com, yerelde port.
export const getPanelUrl = (subdomain, port) =>
  window.location.hostname.endsWith('qimlik.com')
    ? `https://${subdomain}.qimlik.com`
    : `http://${window.location.hostname}:${port || 5173}`;

// Qimlik'in kendi gateway SIM numarasi: demo (/dene), kayit + panellerde varsayilan.
// Musteriler kendi gateway numaralarini panelden ayarlar. VITE_GATEWAY_PHONE ile override edilebilir.
export const GATEWAY_PHONE = import.meta.env.VITE_GATEWAY_PHONE || '905404234000';
export const GATEWAY_PHONE_DISPLAY = '+90 540 423 40 00';

export default API_URL;
