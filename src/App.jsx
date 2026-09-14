import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';

/*
 * Code-splitting por rota: só Home e Login (as duas telas mais
 * prováveis de ser a primeira que alguém vê) entram no bundle inicial.
 * O resto carrega sob demanda, um chunk por página — o Suspense que
 * mostra o spinner enquanto isso baixa fica em Layout.jsx, dentro do
 * <main>, pra sidebar/tab bar nunca sumirem durante a troca de rota.
 */
const Search           = lazy(() => import('./pages/Search'));
const AnimeDetail      = lazy(() => import('./pages/AnimeDetail'));
const CharacterDetail  = lazy(() => import('./pages/CharacterDetail'));
const MyList           = lazy(() => import('./pages/MyList'));
const Stats            = lazy(() => import('./pages/Stats'));
const Calendar         = lazy(() => import('./pages/Calendar'));
const Achievements     = lazy(() => import('./pages/Achievements'));
const CharacterCompare = lazy(() => import('./pages/CharacterCompare'));
const Profile          = lazy(() => import('./pages/Profile'));
const Wrapped          = lazy(() => import('./pages/Wrapped'));
const Games            = lazy(() => import('./pages/Games'));
const Builds           = lazy(() => import('./pages/Builds'));
const PublicProfile    = lazy(() => import('./pages/PublicProfile'));
const Diario           = lazy(() => import('./pages/Diario'));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SidebarProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="login" element={<Login />} />
                  <Route path="buscar" element={<Search />} />
                  <Route path="anime/:id" element={<AnimeDetail />} />
                  <Route path="personagem/:id" element={<CharacterDetail />} />
                  <Route path="comparador" element={<CharacterCompare />} />
                  <Route path="diario" element={<Diario />} />
                  <Route path="minha-lista" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
                  <Route path="stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                  <Route path="calendario" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                  <Route path="conquistas" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                  <Route path="wrapped" element={<ProtectedRoute><Wrapped /></ProtectedRoute>} />
                  <Route path="jogos" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                  <Route path="builds" element={<ProtectedRoute><Builds /></ProtectedRoute>} />
                  <Route path="perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="u/:username" element={<PublicProfile />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SidebarProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
