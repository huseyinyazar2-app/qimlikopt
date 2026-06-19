import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Locations from './pages/Locations';
import Employees from './pages/Employees';
import CheckPage from './pages/CheckPage';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('qimlik_mesai_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('qimlik_mesai_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qimlik_mesai_user');
  };

  return (
    <BrowserRouter>
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
