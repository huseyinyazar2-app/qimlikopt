import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Devices from './pages/Devices';
import Logs from './pages/Logs';
import Webhooks from './pages/Webhooks';
import Settings from './pages/Settings';

function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('qimlik_admin_token');
    const savedUser = localStorage.getItem('qimlik_admin_username');
    if (savedToken) {
      setToken(savedToken);
      setUsername(savedUser || 'admin');
    }
  }, []);

  const handleLogin = (authToken, user) => {
    setToken(authToken);
    setUsername(user);
    localStorage.setItem('qimlik_admin_token', authToken);
    localStorage.setItem('qimlik_admin_username', user);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername('');
    localStorage.removeItem('qimlik_admin_token');
    localStorage.removeItem('qimlik_admin_username');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout username={username} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="devices" element={<Devices />} />
          <Route path="logs" element={<Logs />} />
          <Route path="webhooks" element={<Webhooks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
