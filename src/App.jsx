import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MarathonProvider } from './context/MarathonContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

/* ── Páginas carregadas de forma síncrona (pequenas / críticas) ── */
import Home    from './pages/Home';
import Search  from './pages/Search';
import Login   from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';

/* ── Páginas carregadas sob demanda (lazy) ── */
const AnimeDetail     = lazy(() => import('./pages/AnimeDetail'));
const CharacterDetail = lazy(() => import('./pages/CharacterDetail'));
const MyList          = lazy(() => import('./pages/MyList'));
const Favorites       = lazy(() => import('./pages/Favorites'));
const Stats           = lazy(() => import('./pages/Stats'));
const Calendar        = lazy(() => import('./pages/Calendar'));
const Profile         = lazy(() => import('./pages/Profile'));
const Discover        = lazy(() => import('./pages/Discover'));
const StudioPage      = lazy(() => import('./pages/StudioPage'));
const Wrapped         = lazy(() => import('./pages/Wrapped'));
const Achievements    = lazy(() => import('./pages/Achievements'));
const Rankings        = lazy(() => import('./pages/Rankings'));
const Lists           = lazy(() => import('./pages/Lists'));

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

export default function App() {
  return (
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
                <Route index                  element={<Home />} />
                <Route path="search"          element={<Search />} />
                <Route path="anime/:id"       element={<AnimeDetail />} />
                <Route path="character/:id"   element={<CharacterDetail />} />
                <Route path="calendar"        element={<Calendar />} />
                <Route path="discover"        element={<Discover />} />
                <Route path="studio/:id"      element={<StudioPage />} />
                <Route path="wrapped"         element={<Wrapped />} />
                <Route path="achievements"    element={<Achievements />} />
                <Route path="rankings"        element={<Rankings />} />
                <Route path="lists"           element={<Lists />} />

                {/* Protegidas — exigem login */}
                <Route path="my-list"   element={guard(<MyList />)} />
                <Route path="favorites" element={guard(<Favorites />)} />
                <Route path="stats"     element={guard(<Stats />)} />
                <Route path="profile"   element={guard(<Profile />)} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </MarathonProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
