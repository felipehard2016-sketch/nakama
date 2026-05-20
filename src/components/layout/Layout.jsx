import { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import Sidebar from './Sidebar';
import MarathonWidget from '../ui/MarathonWidget';
import { Menu, ArrowUp } from 'lucide-react';

/* ── Back to top ── */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    const main = document.querySelector('main[data-scroll]');
    if (!main) return;
    const handler = () => setVisible(main.scrollTop > 400);
    main.addEventListener('scroll', handler);
    return () => main.removeEventListener('scroll', handler);
  }, []);

  const scrollTop = () => {
    document.querySelector('main[data-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return visible ? (
    <button
      onClick={scrollTop}
      aria-label="Voltar ao topo"
      style={{
        position: 'fixed', bottom: 100, right: 28, zIndex: 500,
        width: 40, height: 40, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--purple), #4f46e5)',
        boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.2s, transform 0.2s',
        animation: 'fadeIn 0.25s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      <ArrowUp size={17} color="#fff" strokeWidth={2.5} />
    </button>
  ) : null;
}

/* ── Mobile hamburger button ── */
function HamburgerButton() {
  const { toggle, open } = useSidebar();
  return (
    <button
      onClick={toggle}
      aria-label="Menu"
      className="hamburger-btn"
      style={{
        position: 'fixed', top: 16, left: 16, zIndex: 201,
        width: 40, height: 40, borderRadius: 10,
        background: open ? 'rgba(124,58,237,0.25)' : 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'none', /* hidden on desktop, shown via CSS */
        alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}
    >
      <Menu size={18} color="var(--text)" />
    </button>
  );
}

/* ── Overlay backdrop ── */
function Overlay() {
  const { open, close } = useSidebar();
  return open ? (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 199,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.2s ease',
      }}
      className="mobile-overlay"
    />
  ) : null;
}

/* ── Inner layout that can access SidebarContext ── */
function LayoutInner() {
  const { open } = useSidebar();
  const location = useLocation();

  /* Close sidebar on route change */
  const { close } = useSidebar();
  useEffect(() => { close(); }, [location.pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <HamburgerButton />
      <Overlay />
      <Sidebar mobileOpen={open} />
      <main
        data-scroll
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          minHeight: '100vh',
          overflow: 'auto',
        }}
        className="main-content"
      >
        <Outlet />
      </main>
      <BackToTop />
      <MarathonWidget />
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
