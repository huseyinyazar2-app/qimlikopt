import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCheck, BellRing, Inbox } from 'lucide-react';
import { getApiUrl } from '../config';

// Yoklama aralığı (45 saniye)
const POLL_INTERVAL = 45000;

// Göreli zaman metni (Türkçe). Örn: "az önce", "5 dk önce", "3 sa önce", "2 gün önce".
function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const dk = Math.floor(diff / 60000);
  if (dk < 1) return 'az önce';
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const gun = Math.floor(sa / 24);
  if (gun < 7) return `${gun} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR');
}

export default function NotificationCenter({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // Görülen en yüksek bildirim id'si; ilk yüklemedekiler "yeni" sayılmaz.
  const maxSeenIdRef = useRef(0);
  const firstLoadRef = useRef(true);
  const wrapRef = useRef(null);

  const host = getApiUrl();
  const token = user?.token;

  // Tarayıcı bildirimi gönder (izin granted ise). Tıklanınca pencereye odaklan + yönlendir.
  const fireBrowserNotification = useCallback((n) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const note = new Notification(n.title || 'Yeni bildirim', { body: n.body || '' });
      note.onclick = () => {
        window.focus();
        if (n.link) navigate(n.link);
        note.close();
      };
    } catch {
      // Bildirim oluşturulamazsa sessizce geç
    }
  }, [navigate]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${host}/api/teslimat/company/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
      setNotifications(list);
      setUnread(typeof res.data?.unread === 'number' ? res.data.unread : list.filter(n => !n.is_read).length);

      const maxId = list.reduce((m, n) => Math.max(m, n.id || 0), 0);
      if (firstLoadRef.current) {
        // İlk yükleme: mevcut bildirimleri "yeni" saymadan referansı ayarla
        maxSeenIdRef.current = maxId;
        firstLoadRef.current = false;
      } else {
        // Önceki max id'den büyük ve okunmamış olanlar gerçekten yeni
        const fresh = list
          .filter(n => (n.id || 0) > maxSeenIdRef.current && !n.is_read)
          .sort((a, b) => (a.id || 0) - (b.id || 0));
        fresh.slice(0, 3).forEach(fireBrowserNotification);
        maxSeenIdRef.current = Math.max(maxSeenIdRef.current, maxId);
      }
    } catch {
      // Sunucu erişilemezse sessizce geç
    }
  }, [host, token, fireBrowserNotification]);

  // İlk yükleme + 45 sn'de bir yoklama
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Panel açıkken dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
    } catch {
      // Sessizce geç
    }
  };

  const handleItemClick = async (n) => {
    setOpen(false);
    if (!n.is_read) {
      // İyimser güncelleme
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
      setUnread(u => Math.max(0, u - 1));
      try {
        await axios.put(`${host}/api/teslimat/company/notifications/${n.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Sessizce geç
      }
    }
    if (n.link) navigate(n.link);
  };

  const handleReadAll = async () => {
    setNotifications(prev => prev.map(x => ({ ...x, is_read: 1 })));
    setUnread(0);
    try {
      await axios.put(`${host}/api/teslimat/company/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Sessizce geç
    }
    fetchNotifications();
  };

  const badgeText = unread > 9 ? '9+' : String(unread);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Zil butonu */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Bildirimler"
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.8rem 1rem',
          background: open ? 'rgba(15, 23, 42, 0.05)' : 'transparent',
          border: '1px solid var(--glass-border)',
          borderRadius: 8,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.95rem',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <Bell size={20} />
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -8,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 999,
                background: 'var(--status-error)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                lineHeight: '16px',
                textAlign: 'center',
                boxShadow: '0 0 0 2px var(--sidebar-bg)',
              }}
            >
              {badgeText}
            </span>
          )}
        </span>
        Bildirimler
      </button>

      {/* Açılır panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: 'min(340px, calc(100vw - 32px))',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* Başlık */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Bildirimler</strong>
            {unread > 0 && (
              <button
                onClick={handleReadAll}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <CheckCheck size={14} /> Tümünü okundu
              </button>
            )}
          </div>

          {/* Tarayıcı bildirimi izni */}
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '0.7rem 1rem',
                background: 'rgba(14, 165, 233, 0.08)',
                border: 'none',
                borderBottom: '1px solid var(--glass-border)',
                color: 'var(--brand-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <BellRing size={16} /> Tarayıcı bildirimlerini aç
            </button>
          )}

          {/* Liste */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '2.5rem 1rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                <Inbox size={32} />
                <span style={{ fontSize: '0.85rem' }}>Henüz bildirim yok</span>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.8rem 1rem',
                    background: n.is_read ? 'transparent' : 'rgba(14, 165, 233, 0.06)',
                    border: 'none',
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: n.link ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {!n.is_read && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--brand-primary)',
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: n.is_read ? 500 : 700,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}
                      >
                        {n.title}
                      </div>
                      {n.body && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {n.body}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {relativeTime(n.created_at)}
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
