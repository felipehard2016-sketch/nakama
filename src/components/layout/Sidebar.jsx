import { NavLink } from 'react-router-dom';
import { Home, Search, List, BarChart2, Calendar, Trophy, Scale, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { labelForLevel } from '../../lib/leveling';

/*
 * Sidebar fixa de desktop/tablet (a partir de md, 768px) com os 8 itens
 * definidos no briefing. Mobile usa a tab bar inferior (MobileTabBar +
 * MoreSheet, passo 10) em vez desta sidebar.
 */
const NAV_ITEMS = [
  { to: '/',            icon: Home,      label: 'Home' },
  { to: '/buscar',      icon: Search,    label: 'Buscar' },
  { to: '/minha-lista', icon: List,      label: 'Minha Lista' },
  { to: '/stats',       icon: BarChart2, label: 'Stats' },
  { to: '/calendario',  icon: Calendar,  label: 'Calendário' },
  { to: '/conquistas',  icon: Trophy,    label: 'Conquistas' },
  { to: '/comparador',  icon: Scale,     label: 'Comparador de Personagens' },
  { to: '/perfil',      icon: User,      label: 'Perfil' },
];

// Item ativo ganha um chip com canto cortado (em vez da borda esquerda
// reta) + um traço em degradê à esquerda + glow sutil — identidade HUD
// aprovada. Itens inativos continuam retangulares (sem clip-path), já
// que aqui não há necessidade de "destaque", só de leitura rápida.
function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `relative mx-3 flex items-center gap-3 py-2.5 pl-5 pr-4 text-sm transition-colors ${
          isActive
            ? 'font-semibold text-[var(--text)]'
            : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text)]'
        }`
      }
      style={({ isActive }) =>
        isActive
          ? {
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
              background: 'linear-gradient(100deg, rgba(124,58,237,0.28), rgba(37,99,235,0.08) 85%)',
              filter: 'drop-shadow(0 0 10px var(--purple-glow))',
            }
          : undefined
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-purple-light to-blue-light transition-[height] duration-200"
            style={{ height: isActive ? '60%' : '0%' }}
          />
          <Icon size={18} strokeWidth={1.8} className={`shrink-0 ${isActive ? 'text-purple-light' : ''}`} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { profile } = useAuth();

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:border-[var(--border)] md:bg-[var(--bg-sidebar)]">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <img src="/favicon.svg" alt="" className="h-8 w-auto" />
        <span className="bg-gradient-to-r from-purple to-blue bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
          Nakama
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pb-6">
        {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {profile && (
        <div
          className="mx-3 mb-4 flex items-center justify-between border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Nível</span>
          <b className="font-mono text-[12px] font-bold text-purple-light">
            {profile.level ?? 1} · {labelForLevel(profile.level ?? 1)}
          </b>
        </div>
      )}
    </aside>
  );
}
