import { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Plus, Trash, Check, HelpCircle, Edit, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../config';
import EmptyState from '../components/EmptyState';

export default function Forms({ user }) {
  const [forms, setForms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // New/Edit Form states
  const [editingFormId, setEditingFormId] = useState(null);
  const [previewFormId, setPreviewFormId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([
    { id: 'notes', label: 'Genel Notlar', type: 'text', required: true }
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const host = getApiUrl();
  const token = user?.token;

  const fetchForms = async () => {
    try {
      const res = await axios.get(`${host}/api/dijital/forms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForms(res.data);
    } catch (err) {
      console.error('Kontrol formları alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const addField = () => {
    const newId = `field_${Math.random().toString(36).substr(2, 9)}`;
    setFields([...fields, { id: newId, label: '', type: 'text', options: '', required: false }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const updateField = (index, key, val) => {
    const updated = [...fields];
    updated[index][key] = val;
    setFields(updated);
  };

  const handleOpenNew = () => {
    setEditingFormId(null);
    setTitle('');
    setFields([{ id: 'notes', label: 'Genel Notlar', type: 'text', required: true }]);
    setShowModal(true);
  };

  const handleEdit = (form) => {
    setEditingFormId(form.id);
    setTitle(form.title);
    
    // Map existing fields
    const mappedFields = form.fields.map(f => {
      if (f.type === 'select' && Array.isArray(f.options)) {
        return { ...f, options: f.options.join(', ') };
      }
      return { ...f };
    });

    setFields(mappedFields);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // Validate fields
    if (fields.some(f => !f.label.trim())) {
      setError('Lütfen tüm dinamik alan başlıklarını doldurun.');
      return;
    }

    setLoading(true);

    try {
      // Process fields: split options by comma if select type
      const processedFields = fields.map(f => {
        if (f.type === 'select') {
          return {
            ...f,
            options: f.options.split(',').map(o => o.trim()).filter(o => o)
          };
        }
        return f;
      });

      const payload = { title, fields: processedFields };

      if (editingFormId) {
        await axios.put(
          `${host}/api/dijital/forms/${editingFormId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${host}/api/dijital/forms`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      setShowModal(false);
      setTitle('');
      setFields([{ id: 'notes', label: 'Genel Notlar', type: 'text', required: true }]);
      fetchForms();
    } catch (err) {
      setError(err.response?.data?.error || 'Kontrol formu kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-text">Dinamik Kontrol Formları</h1>
          <p className="text-muted">Farklı makine tipleriniz için teknisyenlerin sahada dolduracağı özel form şablonları tasarlayın.</p>
        </div>
        <button 
          onClick={handleOpenNew} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Yeni Şablon Oluştur
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {forms.map(f => (
          <div key={f.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--brand-primary)' }}>
                <ClipboardList size={22} />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{f.title}</h3>
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {f.fields.map((field, idx) => (
                  <li key={idx}>
                    <strong>{field.label}:</strong> {field.type === 'text' ? 'Metin' : field.type === 'number' ? 'Sayı' : field.type === 'boolean' ? 'Onay (Evet/Hayır)' : 'Çoktan Seçmeli'}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => setPreviewFormId(previewFormId === f.id ? null : f.id)} 
                  className="btn-outline" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  {previewFormId === f.id ? <><EyeOff size={14}/> Gizle</> : <><Eye size={14}/> Gör</>}
                </button>
                <button 
                  onClick={() => handleEdit(f)} 
                  className="btn-outline" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Edit size={14} /> Düzenle
                </button>
              </div>

              {previewFormId === f.id && (
                <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--brand-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Teknisyen Ekranı Önizlemesi</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {f.fields.map(field => (
                      <div key={field.id}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>{field.label}</label>
                        {field.type === 'text' && <input disabled style={{...inputStyle, padding: '0.5rem', fontSize: '0.8rem'}} placeholder="Metin girin..." />}
                        {field.type === 'number' && <input disabled type="number" style={{...inputStyle, padding: '0.5rem', fontSize: '0.8rem'}} placeholder="Sayı girin..." />}
                        {field.type === 'boolean' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input disabled type="checkbox" /> <span style={{fontSize: '0.8rem'}}>Evet / Doğrulandı</span>
                          </div>
                        )}
                        {field.type === 'select' && (
                          <select disabled style={{...selectStyle, padding: '0.5rem', fontSize: '0.8rem'}}>
                            <option>Seçim yapın...</option>
                            {field.options && field.options.map((opt, i) => <option key={i}>{opt}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Oluşturma: {new Date(f.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}

        {forms.length === 0 && (
          <EmptyState
            fullSpan
            icon={ClipboardList}
            title="Henüz form şablonu yok"
            description="Farklı makine tipleriniz için teknisyenlerin sahada dolduracağı kontrol formlarını tasarlayın. Oluşturduğunuz şablonu makinelere bağlayabilirsiniz."
            actionLabel="Yeni Şablon Oluştur"
            onAction={handleOpenNew}
          />
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: 550, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>{editingFormId ? 'Şablonu Düzenle' : 'Bakım Şablon Tasarımcısı'}</h2>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Teknisyenin sahada doldurmasını istediğiniz veri alanlarını ekleyin.</p>

            {error && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Şablon Başlığı</label>
                <input required style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Jeneratör Haftalık Bakım Raporu" />
              </div>

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Kontrol Alanları</label>
                  <button type="button" onClick={addField} className="btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    + Alan Ekle
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {fields.map((field, index) => (
                    <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.7)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                      <div style={{ flex: 2 }}>
                        <input 
                          required 
                          style={{ ...inputStyle, paddingLeft: '0.5rem' }} 
                          value={field.label} 
                          onChange={e => updateField(index, 'label', e.target.value)} 
                          placeholder="Alan Adı (Örn: Motor Yağ Seviyesi)" 
                        />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <select 
                          style={selectStyle} 
                          value={field.type} 
                          onChange={e => updateField(index, 'type', e.target.value)}
                        >
                          <option value="text">Metin Girişi</option>
                          <option value="number">Sayı Girişi</option>
                          <option value="boolean">Evet/Hayır Anahtarı</option>
                          <option value="select">Çoktan Seçmeli (Dropdown)</option>
                        </select>
                      </div>

                      {field.type === 'select' && (
                        <div style={{ flex: 1.5 }}>
                          <input 
                            required
                            style={{ ...inputStyle, paddingLeft: '0.5rem' }} 
                            value={field.options || ''} 
                            onChange={e => updateField(index, 'options', e.target.value)} 
                            placeholder="Seçenekler (Virgülle ayırın)" 
                          />
                        </div>
                      )}

                      <button 
                        type="button" 
                        onClick={() => removeField(index)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8 }}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer' }}>İptal</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Kaydediliyor...' : 'Şablonu Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: '#ffffff', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
};
