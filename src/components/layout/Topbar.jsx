import { Menu } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';

/** Barra superior visível só abaixo de md (768px) — abre a gaveta de navegação. */
export default function Topbar() {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-sidebar)]/95 px-4 py-3 backdrop-blur md:hidden">
      <button
        onClick={toggle}
        className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>
      <img src="/favicon.svg" alt="" className="h-6 w-auto" />
      <span className="bg-gradient-to-r from-purple to-blue bg-clip-text text-base font-extrabold tracking-tight text-transparent">
        Nakama
      </span>
    </header>
  );
}
