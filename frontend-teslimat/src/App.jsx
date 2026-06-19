import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Couriers from './pages/Couriers';
import Packages from './pages/Packages';
import DeliverPage from './pages/DeliverPage';
import TrackPage from './pages/TrackPage';

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
  };

  return (
    <BrowserRouter>
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
