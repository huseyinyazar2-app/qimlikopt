import { useState, useEffect } from 'react';
import { Plus, Pause, Play } from 'lucide-react';
import axios from 'axios';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ company_name: '', prefix: '', webhook_url: '', api_key: '' });

  const fetchClients = async () => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:3303/api/admin/clients`);
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://${window.location.hostname}:3303/api/admin/clients`, newClient);
      setShowModal(false);
      fetchClients();
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`http://${window.location.hostname}:3303/api/admin/clients/${id}/toggle`, { is_active: !currentStatus });
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text">Müşteri Yönetimi</h1>
          <p className="text-muted">Sistemi kullanan firmaları (B2B) ve Prefix'lerini yönetin.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Yeni Müşteri
        </button>
      </header>

      <div className="glass-card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Firma Adı</th>
                <th>Prefix</th>
                <th>Webhook URL</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td className="text-muted">#{c.id}</td>
                  <td style={{ fontWeight: 500 }}>{c.company_name}</td>
                  <td><span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{c.prefix}</span></td>
                  <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.webhook_url}
                  </td>
                  <td>
                    <span className={`badge ${c.is_active ? 'success' : 'error'}`}>
                      {c.is_active ? 'Aktif' : 'Askıda'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(c.id, c.is_active)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}
                      title={c.is_active ? "Askıya Al" : "Aktifleştir"}
                    >
                      {c.is_active ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Kayıtlı müşteri bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Basic Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 400 }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni Müşteri Ekle</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input placeholder="Firma Adı" required style={inputStyle} onChange={e => setNewClient({...newClient, company_name: e.target.value})} />
              <input placeholder="Ön Ek (Örn: QMLK)" required style={inputStyle} onChange={e => setNewClient({...newClient, prefix: e.target.value})} />
              <input placeholder="Webhook URL" required style={inputStyle} onChange={e => setNewClient({...newClient, webhook_url: e.target.value})} />
              <input placeholder="API Key (Müşteri için)" required style={inputStyle} onChange={e => setNewClient({...newClient, api_key: e.target.value})} />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none'
};
