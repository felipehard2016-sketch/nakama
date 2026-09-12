import { NavLink } from 'react-router-dom';
import { BarChart2, Calendar, Scale, Trophy, Sparkles, Gamepad2, Swords, X } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

const MORE_ITEMS = [
  { to: '/stats',      icon: BarChart2, label: 'Stats' },
  { to: '/calendario', icon: Calendar,  label: 'Calendário' },
  { to: '/comparador', icon: Scale,     label: 'Comparador' },
  { to: '/conquistas', icon: Trophy,    label: 'Conquistas' },
  { to: '/wrapped',    icon: Sparkles,  label: 'Wrapped' },
  { to: '/jogos',      icon: Gamepad2,  label: 'Jogos' },
  { to: '/builds',     icon: Swords,    label: 'Builds' },
];

/** Sheet do "Mais" mobile — acesso ao resto da navegação que não cabe na tab bar. */
export default function MoreSheet() {
  const { open, close } = useSidebar();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg-sidebar)] p-4 transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">Mais</p>
          <button onClick={close} className="text-[var(--text-muted)] hover:text-[var(--text)]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {MORE_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={close}
              className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-center text-[11px] text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text)]"
            >
              <item.icon size={20} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
