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

export default API_URL;
