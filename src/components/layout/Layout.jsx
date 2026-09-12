import { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileTabBar from './MobileTabBar';
import MoreSheet from './MoreSheet';
import { useSidebar } from '../../context/SidebarContext';

/*
 * Casco responsivo: sidebar fixa a partir de md (768px+, tablet e
 * desktop); abaixo disso, tab bar inferior + sheet "Mais" (passo 10).
 * `main` reflui em qualquer largura, sem depender de zoom.
 */
export default function Layout() {
  const { pathname } = useLocation();
  const { close } = useSidebar();

  // Fecha o sheet "Mais" sempre que a rota muda.
  useEffect(() => { close(); }, [pathname, close]);

  return (
    <div className="min-h-screen w-full bg-[var(--bg)]">
      <Sidebar />
      <div className="flex min-h-screen flex-col pb-16 md:ml-64 md:pb-0">
        <header className="flex items-center gap-2.5 px-4 py-3 md:hidden">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-6 w-auto" />
            <span className="bg-gradient-to-r from-purple to-blue bg-clip-text text-base font-extrabold tracking-tight text-transparent">
              Nakama
            </span>
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 py-2 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
      <MoreSheet />
    </div>
  );
}
