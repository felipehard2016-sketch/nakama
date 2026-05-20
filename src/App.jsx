import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MarathonProvider } from './context/MarathonContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

/* ── Páginas carregadas de forma síncrona (pequenas / críticas) ── */
import Home    from './pages/Home';
import Search  from './pages/Search';
import Login   from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';

/* ──────────────────────────────────────────────────────────────
   lazyWithRetry — tenta importar o chunk UMA vez extra se falhar.
   Evita erros transitórios de rede ao navegar pela primeira vez.
────────────────────────────────────────────────────────────── */
function lazyWithRetry(factory) {
  return lazy(() =>
    factory().catch(err => {
      console.warn('[Nakama] Chunk falhou, tentando novamente…', err?.message);
      return factory();
    })
  );
}

/* ── Páginas carregadas sob demanda (lazy + retry automático) ── */
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

/* ── Fallback de carregamento ── */
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

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

/* Atalho "/" → abre busca */
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

/* ──────────────────────────────────────────────────────────────
   Wrapper de rota com ErrorBoundary individual.
   Isola falhas: uma rota quebrando não derruba as outras.
────────────────────────────────────────────────────────────── */
function RouteErrorBoundary({ children }) {
  return (
    <ErrorBoundary key={children?.type?.displayName || Math.random()}>
      {children}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    /* ErrorBoundary mais externo — captura qualquer erro não tratado */
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <MarathonProvider>
            <BrowserRouter>
              <KeyboardShortcuts />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Rotas públicas (sem sidebar) */}
                  <Route path="/login"           element={<Login />} />
                  <Route path="/register"        element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password"  element={<ResetPassword />} />

                  {/* Rotas com layout */}
                  <Route path="/" element={<Layout />}>
                    {/* Públicas */}
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

                    {/* Protegidas — exigem login */}
                    <Route path="my-list"   element={guard(<RouteErrorBoundary><MyList /></RouteErrorBoundary>)} />
                    <Route path="favorites" element={guard(<RouteErrorBoundary><Favorites /></RouteErrorBoundary>)} />
                    <Route path="stats"     element={guard(<RouteErrorBoundary><Stats /></RouteErrorBoundary>)} />
                    <Route path="profile"   element={guard(<RouteErrorBoundary><Profile /></RouteErrorBoundary>)} />
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
