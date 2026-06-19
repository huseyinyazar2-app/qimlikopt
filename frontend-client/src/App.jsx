import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import ApiDocs from './pages/ApiDocs';
import IntegrationGuide from './pages/IntegrationGuide';
import PopupGuide from './pages/PopupGuide';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('qimlik_client_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('qimlik_client_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qimlik_client_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard user={user} />} />
          <Route path="logs" element={<Logs user={user} />} />
          <Route path="api" element={<ApiDocs user={user} onLogout={handleLogout} />} />
          <Route path="integration" element={<IntegrationGuide user={user} />} />
          <Route path="popup-guide" element={<PopupGuide user={user} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
