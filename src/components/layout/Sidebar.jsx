import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Search, List, Star, BarChart2, Calendar, User, Tv,
  LogIn, LogOut, ChevronRight, Compass, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllMedia } from '../../lib/storage';

const MAIN_LINKS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Buscar' },
  { to: '/discover', icon: Compass, label: 'Descobrir' },
  { to: '/calendar', icon: Calendar, label: 'Calendário' },
];

const ACCOUNT_LINKS = [
  { to: '/my-list',  icon: List,     label: 'Minha Lista' },
  { to: '/favorites', icon: Star,    label: 'Favoritos' },
  { to: '/stats',    icon: BarChart2, label: 'Estatísticas' },
  { to: '/wrapped',  icon: Sparkles, label: 'Wrapped' },
  { to: '/profile',  icon: User,     label: 'Perfil' },
];

/* Calcula nível pelo total de episódios/capítulos assistidos */
function getLevel(allMedia) {
  const eps = allMedia.reduce((acc, m) => acc + (m.progress || 0), 0);
  if (eps >= 6000) return { level: 7, label: 'Otaku' };
  if (eps >= 3000) return { level: 6, label: 'Mestre' };
  if (eps >= 1500) return { level: 5, label: 'Veterano' };
  if (eps >= 700)  return { level: 4, label: 'Experiente' };
  if (eps >= 300)  return { level: 3, label: 'Intermediário' };
  if (eps >= 100)  return { level: 2, label: 'Iniciante' };
  return { level: 1, label: 'Novato' };
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '9px 16px',
        margin: '1px 8px',
        borderRadius: 10,
        color: isActive ? '#fff' : 'var(--text-secondary)',
        background: isActive
          ? 'linear-gradient(90deg, rgba(124,58,237,0.22), rgba(124,58,237,0.08))'
          : 'transparent',
        borderLeft: isActive ? '2px solid var(--purple)' : '2px solid transparent',
        fontWeight: isActive ? 600 : 400,
        fontSize: 13.5,
        transition: 'all 0.15s',
        letterSpacing: '0.01em',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.classList.contains('active'))
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.classList.contains('active'))
          e.currentTarget.style.background = 'transparent';
      }}
    >
      <Icon size={16} strokeWidth={1.8} />
      {label}
    </NavLink>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      padding: '18px 24px 6px',
    }}>
      {children}
    </div>
  );
}

export default function Sidebar({ mobileOpen = false }) {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const allMedia = getAllMedia();
  const { label: levelLabel, level } = getLevel(allMedia);

  /* Iniciais do avatar */
  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'N';

  const handleFooterClick = () => {
    if (user) navigate('/profile');
    else navigate('/login');
  };

  const handleSignOut = async e => {
    e.stopPropagation();
    await signOut();
    navigate('/login');
  };

  return (
    <aside
      className="sidebar"
      style={{
        width: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0,
        zIndex: 200,
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, var(--purple) 0%, #4f46e5 100%)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(124,58,237,0.5)',
          }}>
            <Tv size={16} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.4px', color: 'var(--text)' }}>
              Nakama
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -1 }}>
              Anime Tracker
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <SectionLabel>Principal</SectionLabel>
        <nav>
          {MAIN_LINKS.map(l => <NavItem key={l.to} {...l} />)}
        </nav>

        <SectionLabel>Minha Conta</SectionLabel>
        <nav>
          {ACCOUNT_LINKS.map(l => <NavItem key={l.to} {...l} />)}
        </nav>

        <div style={{ margin: '16px 16px 0', borderTop: '1px solid var(--border-subtle)' }} />
      </div>

      {/* Rodapé — Avatar ou Login */}
      {user ? (
        <div
          onClick={handleFooterClick}
          style={{
            margin: '0 10px 12px',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
        >
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, color: '#fff',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(124,58,237,0.4)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--purple-light), var(--blue-light))',
              }} />
              <span style={{ fontSize: 11, color: 'var(--purple-light)', fontWeight: 500 }}>
                Nível {level} · {levelLabel}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            style={{
              display: 'flex', alignItems: 'center',
              color: 'var(--text-muted)', padding: 4, borderRadius: 6,
              transition: 'color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => navigate('/login')}
          style={{
            margin: '0 10px 12px',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={16} color="var(--purple-light)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Entrar</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Faça login para salvar</div>
          </div>
          <LogIn size={14} color="var(--text-muted)" />
        </div>
      )}
    </aside>
  );
}
