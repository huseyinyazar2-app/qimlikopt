import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCheck, BellRing, X } from 'lucide-react';
import { getApiUrl } from '../config';

const POLL_MS = 45000;
const MAX_POPUPS = 3;

// SQLite "YYYY-MM-DD HH:MM:SS" (UTC) veya ISO tarih -> ms
function parseDate(v) {
  if (!v) return NaN;
  if (typeof v === 'number') return v;
  let s = String(v);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T') + 'Z';
  return new Date(s).getTime();
}

// Göreli zaman etiketi (Türkçe)
function timeAgo(v) {
  const t = parseDate(v);
  if (isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'az önce';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(t).toLocaleDateString('tr-TR');
}

export default function NotificationBell({ token }) {
  const navigate = useNavigate();
  const host = getApiUrl();

  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const maxSeenRef = useRef(0);       // görülen en yüksek bildirim id'si
  const initializedRef = useRef(false); // ilk yükleme popup üretmesin
  const permissionRef = useRef(permission);
  const wrapRef = useRef(null);

  useEffect(() => { permissionRef.current = permission; }, [permission]);

  const showBrowserPopups = useCallback((fresh) => {
    if (permissionRef.current !== 'granted' || typeof Notification === 'undefined') return;
    fresh.slice(0, MAX_POPUPS).forEach((n) => {
      try {
        const notif = new Notification(n.title || 'Yeni bildirim', {
          body: n.body || '',
          icon: '/favicon.svg',
          tag: `mesai-${n.id}`,
        });
        notif.onclick = () => {
          window.focus();
          if (n.link) navigate(n.link);
          notif.close();
        };
      } catch { /* bazı tarayıcılar new Notification desteklemez */ }
    });
  }, [navigate]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${host}/api/mesai/company/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
      setItems(list);
      setUnread(Number(res.data?.unread) || 0);

      const maxId = list.reduce((mx, n) => Math.max(mx, Number(n.id) || 0), 0);
      if (!initializedRef.current) {
        maxSeenRef.current = maxId;
        initializedRef.current = true;
      } else if (maxId > maxSeenRef.current) {
        const fresh = list
          .filter((n) => Number(n.id) > maxSeenRef.current && !n.is_read)
          .sort((a, b) => Number(a.id) - Number(b.id));
        showBrowserPopups(fresh);
        maxSeenRef.current = maxId;
      }
    } catch {
      /* sunucuya erişilemezse sessizce geç, zil olduğu gibi kalsın */
    }
  }, [host, token, showBrowserPopups]);

  // Yoklama: ilk yükleme + 45 sn'de bir
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Panel dışına tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const markRead = async (id) => {
    try {
      await axios.put(`${host}/api/mesai/company/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* yut */ }
  };

  const handleItemClick = async (n) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markRead(n.id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleReadAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
    setUnread(0);
    try {
      await axios.put(`${host}/api/mesai/company/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* yut */ }
  };

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
    } catch { /* yut */ }
  };

  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <div ref={wrapRef} style={{ position: 'fixed', top: '1.25rem', right: '1.5rem', zIndex: 900 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Bildirimler"
        style={{
          position: 'relative', width: 42, height: 42, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-color)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 700, color: '#fff',
            background: 'var(--status-error)', borderRadius: 999, lineHeight: 1,
          }}>
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 50, right: 0, width: 340, maxWidth: '90vw',
          maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)', borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}>
          {/* Başlık */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.85rem 1rem', borderBottom: '1px solid var(--glass-border)',
          }}>
            <span style={{ fontWeight: 700 }}>Bildirimler</span>
            <button
              onClick={handleReadAll}
              disabled={unread === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem',
                background: 'transparent', border: 'none', cursor: unread === 0 ? 'default' : 'pointer',
                color: unread === 0 ? 'var(--text-muted)' : 'var(--brand-primary)', fontWeight: 600,
                padding: 0, opacity: unread === 0 ? 0.6 : 1,
              }}
            >
              <CheckCheck size={15} /> Tümünü okundu
            </button>
          </div>

          {/* Tarayıcı bildirimi izni */}
          {permission !== 'unsupported' && (
            <div style={{
              padding: '0.6rem 1rem', borderBottom: '1px solid var(--glass-border)',
              fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              {permission === 'granted' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontWeight: 600 }}>
                  <BellRing size={14} /> Tarayıcı bildirimleri açık
                </span>
              ) : permission === 'denied' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <X size={14} /> Tarayıcı bildirimleri engelli
                </span>
              ) : (
                <>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Masaüstü bildirimi al</span>
                  <button
                    onClick={requestPermission}
                    style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: 8,
                      background: 'var(--brand-gradient)', color: '#fff', border: 'none', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Aç
                  </button>
                </>
              )}
            </div>
          )}

          {/* Liste */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Bildirim yok
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '0.75rem 1rem', border: 'none',
                    borderBottom: '1px solid var(--glass-border)',
                    background: n.is_read ? 'transparent' : 'rgba(14,165,233,0.07)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {!n.is_read && (
                      <span style={{ marginTop: 6, width: 8, height: 8, borderRadius: 999, background: 'var(--brand-primary)', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {n.title}
                      </div>
                      {n.body && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {n.body}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
