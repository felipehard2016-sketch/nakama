import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MarathonProvider } from './context/MarathonContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home   from './pages/Home';
import Search from './pages/Search';

function lazyWithRetry(factory) {
  return lazy(() =>
    factory().catch(err => {
      console.warn('[Nakama] Chunk falhou, tentando novamente…', err?.message);
      return factory();
    })
  );
}

const AnimeDetail     = lazyWithRetry(() => import('./pages/AnimeDetail'));
const CharacterDetail = lazyWithRetry(() => import('./pages/CharacterDetail'));
const MyList          = lazyWithRetry(() => import('./pages/MyList'));
const Favorites       = lazyWithRetry(() => import('./pages/Favorites'));
const Stats           = lazyWithRetry(() => import('./pages/Stats'));
const Calendar        = lazyWithRetry(() => import('./pages/Calendar'));
const Profile         = lazyWithRetry(() => import('./pages/Profile'));
const Discover        = lazyWithRetry(() => import('./pages/Discover'));
const StudioPage      = lazyWithRetry(() => import('./pages/StudioPage'));
const Wrapped         = lazyWithRetry(() => import('./pages/Wrapped'));
const Achievements    = lazyWithRetry(() => import('./pages/Achievements'));
const Rankings        = lazyWithRetry(() => import('./pages/Rankings'));
const Lists           = lazyWithRetry(() => import('./pages/Lists'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(124,58,237,0.2)',
        borderTop: '3px solid var(--purple)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Carregando…</p>
    </div>
  );
}

function KeyboardShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = e => {
      if (e.key === '/' && !e.target.matches('input,textarea,[contenteditable]') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
  return null;
}

function RouteErrorBoundary({ children }) {
  return (
    <ErrorBoundary key={children?.type?.displayName || Math.random()}>
      {children}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <MarathonProvider>
            <BrowserRouter>
              <KeyboardShortcuts />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index                element={<Home />} />
                    <Route path="search"        element={<Search />} />
                    <Route path="anime/:id"     element={<RouteErrorBoundary><AnimeDetail /></RouteErrorBoundary>} />
                    <Route path="character/:id" element={<RouteErrorBoundary><CharacterDetail /></RouteErrorBoundary>} />
                    <Route path="calendar"      element={<RouteErrorBoundary><Calendar /></RouteErrorBoundary>} />
                    <Route path="discover"      element={<RouteErrorBoundary><Discover /></RouteErrorBoundary>} />
                    <Route path="studio/:id"    element={<RouteErrorBoundary><StudioPage /></RouteErrorBoundary>} />
                    <Route path="wrapped"       element={<RouteErrorBoundary><Wrapped /></RouteErrorBoundary>} />
                    <Route path="achievements"  element={<RouteErrorBoundary><Achievements /></RouteErrorBoundary>} />
                    <Route path="rankings"      element={<RouteErrorBoundary><Rankings /></RouteErrorBoundary>} />
                    <Route path="lists"         element={<RouteErrorBoundary><Lists /></RouteErrorBoundary>} />
                    <Route path="my-list"       element={<RouteErrorBoundary><MyList /></RouteErrorBoundary>} />
                    <Route path="favorites"     element={<RouteErrorBoundary><Favorites /></RouteErrorBoundary>} />
                    <Route path="stats"         element={<RouteErrorBoundary><Stats /></RouteErrorBoundary>} />
                    <Route path="profile"       element={<RouteErrorBoundary><Profile /></RouteErrorBoundary>} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </MarathonProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
