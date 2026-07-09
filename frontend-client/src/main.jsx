import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Intercept axios requests to add auth header
axios.interceptors.request.use((config) => {
  try {
    const savedUser = localStorage.getItem('qimlik_client_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user && user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
    }
  } catch (e) {
    console.error('Failed to parse client user for auth header', e);
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
