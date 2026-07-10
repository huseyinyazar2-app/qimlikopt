import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Locations from './pages/Locations';
import Employees from './pages/Employees';
import CheckPage from './pages/CheckPage';
import Settings from './pages/Settings';
import Payroll from './pages/Payroll';
import Users from './pages/Users';
import MapPage from './pages/MapPage';
import { setRole, clearRole, canSeeSettings, canSeePayroll, canManageUsers } from './utils/role';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('qimlik_mesai_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      // Eski oturum uyumu: rol objede varsa localStorage ile senkronla.
      if (parsed?.mesaiRole) setRole(parsed.mesaiRole);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('qimlik_mesai_user', JSON.stringify(userData));
    if (userData?.mesaiRole) setRole(userData.mesaiRole);
    else clearRole();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qimlik_mesai_user');
    clearRole();
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Route for scanning location QR code to check-in/out */}
        <Route path="/check/:locationId" element={<CheckPage user={user} />} />

        {/* Authenticated Dashboard Routes */}
        {user ? (
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="locations" element={user.role === 'company' ? <Locations user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="employees" element={user.role === 'company' ? <Employees user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="harita" element={user.role === 'company' ? <MapPage user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="bordro" element={user.role === 'company' && canSeePayroll() ? <Payroll user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="logs" element={<Logs user={user} />} />
            <Route path="settings" element={user.role === 'company' && canSeeSettings() ? <Settings user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="kullanicilar" element={user.role === 'company' && canManageUsers() ? <Users user={user} /> : <Navigate to="/dashboard" />} />
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
