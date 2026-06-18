import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Intercept axios requests to rewrite base URL in production (qimlik.com)
axios.interceptors.request.use((config) => {
  if (config.url && config.url.includes(':3303')) {
    if (window.location.hostname.endsWith('qimlik.com')) {
      config.url = config.url.replace(`http://${window.location.hostname}:3303`, 'https://api.qimlik.com');
    }
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
