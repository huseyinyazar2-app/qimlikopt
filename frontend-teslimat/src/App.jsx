import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Couriers from './pages/Couriers';
import Packages from './pages/Packages';
import FailedDeliveries from './pages/FailedDeliveries';
import Scorecard from './pages/Scorecard';
import Users from './pages/Users';
import DeliverPage from './pages/DeliverPage';
import TrackPage from './pages/TrackPage';
import { isOwner } from './utils/role';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('qimlik_teslimat_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('qimlik_teslimat_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qimlik_teslimat_user');
    localStorage.removeItem('teslimat_role');
  };

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
          },
        }}
      />
      <Routes>
        {/* Public Courier Delivery Scan & Signature Screen */}
        <Route path="/deliver/:packageId" element={<DeliverPage user={user} />} />
        
        {/* Public Package Tracking Screen */}
        <Route path="/track/:packageCode" element={<TrackPage />} />

        {/* Authenticated Routes */}
        {user ? (
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="couriers" element={user.role === 'company' ? <Couriers user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="packages" element={user.role === 'company' ? <Packages user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="basarisiz" element={user.role === 'company' ? <FailedDeliveries user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="karne" element={user.role === 'company' ? <Scorecard user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="kullanicilar" element={user.role === 'company' && isOwner() ? <Users user={user} /> : <Navigate to="/dashboard" />} />
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
