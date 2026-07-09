const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname.endsWith('qimlik.com')
    ? 'https://api.qimlik.com'
    : `http://${window.location.hostname}:3303`);

export const getApiUrl = () => API_URL;
export default API_URL;
