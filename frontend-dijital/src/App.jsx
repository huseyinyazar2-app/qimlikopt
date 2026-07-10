import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Forms from './pages/Forms';
import Technicians from './pages/Technicians';
import WorkOrders from './pages/WorkOrders';
import Users from './pages/Users';
import MachineMap from './pages/MachineMap';
import PublicMachine from './pages/PublicMachine';
import { isOwner, clearRole } from './utils/role';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('qimlik_dijital_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('qimlik_dijital_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qimlik_dijital_user');
    clearRole();
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Route for scanning Machine QR */}
        <Route path="/m/:code" element={<PublicMachine user={user} />} />

        {/* Authenticated Dashboard Routes */}
        {user ? (
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="forms" element={user.role === 'company' ? <Forms user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="technicians" element={user.role === 'company' ? <Technicians user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="kullanicilar" element={user.role === 'company' && isOwner() ? <Users user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="is-emirleri" element={<WorkOrders user={user} />} />
            <Route path="harita" element={user.role === 'company' ? <MachineMap user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="logs" element={<Logs user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
