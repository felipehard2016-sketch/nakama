import { NavLink } from 'react-router-dom';
import { Home, Search, List, BarChart2, Calendar, Trophy, Scale, User } from 'lucide-react';

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

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `mx-3 flex items-center gap-3 rounded-lg border-l-2 px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'border-purple bg-purple/15 font-semibold text-[var(--text)]'
            : 'border-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text)]'
        }`
      }
    >
      <Icon size={18} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
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
    </aside>
  );
}
