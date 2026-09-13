import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

function timeAgo(dateStr) {
  const diffSec = Math.max(0, (Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return `${Math.floor(diffSec / 86400)}d`;
}

/** Sino de notificação — mora na Sidebar (desktop) e no header mobile. */
export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={unreadCount > 0 ? `Notificações — ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Notificações'}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--bg-sidebar)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 max-h-96 w-72 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
            <span className="text-xs font-semibold text-[var(--text)]">Notificações</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-purple-light hover:underline">
                Marcar tudo como lido
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-[var(--text-muted)]">
              Nenhuma notificação ainda — avisamos quando um anime "Assistindo" lançar episódio novo.
            </p>
          )}

          {notifications.map(n => (
            <Link
              key={n.id}
              to={n.media_items?.external_id ? `/anime/${n.media_items.external_id}` : '#'}
              onClick={() => { markRead(n.id); setOpen(false); }}
              className={`flex items-start gap-2.5 border-b border-[var(--border)] px-3 py-2.5 last:border-0 hover:bg-white/5 ${!n.read ? 'bg-purple/5' : ''}`}
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-purple-light'}`} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs text-[var(--text)]">{n.message}</p>
                <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">{timeAgo(n.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
