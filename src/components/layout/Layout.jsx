import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSidebar } from '../../context/SidebarContext';

/*
 * Casco responsivo da aplicação: sidebar fixa a partir de md (768px+,
 * cobre tablet e desktop) e, abaixo disso, Topbar com hamburger + gaveta.
 * `main` reflui em qualquer largura, sem depender de zoom.
 */
export default function Layout() {
  const { pathname } = useLocation();
  const { close } = useSidebar();

  // Fecha a gaveta mobile sempre que a rota muda.
  useEffect(() => { close(); }, [pathname, close]);

  return (
    <div className="min-h-screen w-full bg-[var(--bg)]">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:ml-64">
        <Topbar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
