import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, Clock, CalendarClock } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';

// SQLite UTC zaman damgasını ("YYYY-MM-DD HH:MM:SS") güvenli parse et
const parseUtc = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z') : null);

// Göreli zaman (örn: "5 dk önce")
function timeAgo(s) {
  const d = parseUtc(s);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return d.toLocaleDateString('tr-TR');
}

// Bildirim türüne göre ikon
const TYPE_ICON = {
  incident: <AlertTriangle size={16} color="#ef4444" />,
  sla_overdue: <Clock size={16} color="#f59e0b" />,
  maintenance_due: <CalendarClock size={16} color="#0ea5e9" />,
};

export default function NotificationBell({ user }) {
  const host = getApiUrl();
  const token = user?.token;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  // Görülen en büyük bildirim id'si — sadece bunun üstündekiler "yeni" sayılır.
  const maxIdRef = useRef(0);
  // İlk yükleme tamamlandı mı? İlk gelenler için tarayıcı bildirimi çıkmaz.
  const initializedRef = useRef(false);
  const wrapperRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${host}/api/dijital/company/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data?.notifications || [];
      setItems(list);
      setUnread(res.data?.unread ?? list.filter((n) => !n.is_read).length);

      // Tarayıcı bildirimi: sadece ilk yüklemeden sonra gelen, önceki max id'den
      // büyük ve okunmamış olanlar için (en fazla 3 tane).
      if (
        initializedRef.current &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const fresh = list
          .filter((n) => !n.is_read && n.id > maxIdRef.current)
          .sort((a, b) => a.id - b.id)
          .slice(-3);
        fresh.forEach((n) => {
          try {
            const notif = new Notification(n.title, { body: n.body || '' });
            notif.onclick = () => {
              window.focus();
              if (n.link) navigate(n.link);
              notif.close();
            };
          } catch {
            /* sessiz geç */
          }
        });
      }

      // Görülen max id'yi güncelle.
      maxIdRef.current = list.reduce((m, n) => Math.max(m, n.id || 0), maxIdRef.current);
      initializedRef.current = true;
    } catch {
      // Sunucu erişilemezse sessizce geç.
    }
  }, [host, token, navigate]);

  // İlk yükleme + ~45 sn yoklama.
  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 45000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // Dışarı tıklayınca paneli kapat.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleItemClick = async (n) => {
    try {
      if (!n.is_read) {
        await axios.put(
          `${host}/api/dijital/company/notifications/${n.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      /* sessiz geç */
    }
    setOpen(false);
    if (n.link) navigate(n.link);
    fetchNotifications();
  };

  const markAllRead = async () => {
    try {
      await axios.put(
        `${host}/api/dijital/company/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      /* sessiz geç */
    }
    fetchNotifications();
  };

  const enableBrowserNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
    } catch {
      /* sessiz geç */
    }
  };

  const badgeText = unread > 9 ? '9+' : String(unread);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginLeft: 'auto' }}>
      {/* Zil butonu */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Bildirimler"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          borderRadius: 10,
          background: open ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              borderRadius: 9,
              background: 'var(--status-error)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px var(--sidebar-bg)',
            }}
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Açılır panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: 340,
            maxWidth: '85vw',
            maxHeight: 460,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
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
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Bildirimler
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <CheckCheck size={15} /> Tümünü okundu
              </button>
            )}
          </div>

          {/* Tarayıcı bildirimi izni */}
          {permission === 'default' && (
            <button
              onClick={enableBrowserNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                width: '100%',
                padding: '0.6rem 1rem',
                background: 'rgba(14, 165, 233, 0.08)',
                border: 'none',
                borderBottom: '1px solid var(--glass-border)',
                color: 'var(--brand-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Bell size={15} /> Tarayıcı bildirimlerini aç
            </button>
          )}

          {/* Liste */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                Henüz bildirim yok.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    background: n.is_read ? 'transparent' : 'rgba(14, 165, 233, 0.06)',
                    border: 'none',
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {TYPE_ICON[n.type] || <Bell size={16} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: n.is_read ? 500 : 700,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {n.title}
                    </div>
                    {n.body && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          marginBottom: 3,
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span
                      style={{
                        flexShrink: 0,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--brand-primary)',
                        marginTop: 6,
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
