import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Home            from './pages/Home';
import Search          from './pages/Search';
import AnimeDetail     from './pages/AnimeDetail';
import CharacterDetail from './pages/CharacterDetail';
import MyList          from './pages/MyList';
import Favorites       from './pages/Favorites';
import Stats           from './pages/Stats';
import Calendar        from './pages/Calendar';
import Profile         from './pages/Profile';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

/* Atalho "/" → abre busca (não dispara quando foco está em input/textarea) */
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
        <BrowserRouter>
          <KeyboardShortcuts />
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

              {/* Protegidas — exigem login */}
              <Route path="my-list"   element={guard(<MyList />)} />
              <Route path="favorites" element={guard(<Favorites />)} />
              <Route path="stats"     element={guard(<Stats />)} />
              <Route path="profile"   element={guard(<Profile />)} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
