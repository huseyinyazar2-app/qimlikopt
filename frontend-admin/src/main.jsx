import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'

// Intercept axios requests to add auth header
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('qimlik_admin_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#0f172a',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)',
        },
      }}
    />
  </React.StrictMode>,
)
