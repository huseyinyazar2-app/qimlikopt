import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollManager from './components/ScrollManager';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import ProductPage from './pages/ProductPage';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Kvkk from './pages/legal/Kvkk';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="giris" element={<Login />} />
          <Route path="kayit" element={<Register />} />
          <Route path="urunler/:slug" element={<ProductPage />} />
          <Route path="fiyatlandirma" element={<Pricing />} />
          <Route path="hakkimizda" element={<About />} />
          <Route path="iletisim" element={<Contact />} />
          <Route path="sss" element={<FAQ />} />
          <Route path="kvkk" element={<Kvkk />} />
          <Route path="gizlilik" element={<Privacy />} />
          <Route path="kullanim-sartlari" element={<Terms />} />
        </Route>
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
