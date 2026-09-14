import { NavLink } from 'react-router-dom';
import { Home, Search, List, User, Menu } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const TABS = [
  { to: '/',            icon: Home,   label: 'Home' },
  { to: '/buscar',      icon: Search, label: 'Buscar' },
  { to: '/minha-lista', icon: List,   label: 'Lista' },
  { to: '/perfil',      icon: User,   label: 'Perfil' },
];

/** Tab bar inferior mobile (passo 10) — Home/Buscar/Minha Lista/Perfil + "Mais". */
export default function MobileTabBar() {
  const { toggle, open } = useSidebar();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-[var(--border)] bg-[var(--bg-sidebar)]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive ? 'text-purple-light' : 'text-[var(--text-muted)]'
            }`
          }
        >
          <tab.icon size={20} strokeWidth={1.8} />
          {tab.label}
        </NavLink>
      ))}
      <button
        onClick={toggle}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
          open ? 'text-purple-light' : 'text-[var(--text-muted)]'
        }`}
      >
        <Menu size={20} strokeWidth={1.8} />
        Mais
      </button>
    </nav>
  );
}
