import { NavLink } from 'react-router-dom';
import { Home, Search, List, BarChart2, Calendar, Trophy, Scale, User, X } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

/*
 * Itens da sidebar desktop (definidos no briefing do projeto). A tab bar
 * mobile com "Mais" é um passo futuro (10) — por enquanto, mobile usa
 * esta mesma lista dentro de uma gaveta acionada pelo Topbar.
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

function NavItem({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
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

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-6 py-6">
        <img src="/favicon.svg" alt="" className="h-8 w-auto" />
        <span className="bg-gradient-to-r from-purple to-blue bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
          Nakama
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pb-6">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>
    </>
  );
}

export default function Sidebar() {
  const { open, close } = useSidebar();

  return (
    <>
      {/* Desktop/tablet: sidebar fixa, sempre visível a partir de md (768px) */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:border-[var(--border)] md:bg-[var(--bg-sidebar)]">
        <SidebarContent />
      </aside>

      {/* Mobile: overlay escurecendo o fundo quando a gaveta está aberta */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile: gaveta deslizante com os mesmos itens */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)] transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={close}
          className="absolute right-3 top-5 rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
        <SidebarContent onNavigate={close} />
      </aside>
    </>
  );
}
