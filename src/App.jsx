import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import AnimeDetail from './pages/AnimeDetail';
import MyList from './pages/MyList';
import Stats from './pages/Stats';
import Calendar from './pages/Calendar';
import Achievements from './pages/Achievements';
import CharacterCompare from './pages/CharacterCompare';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Wrapped from './pages/Wrapped';
import Games from './pages/Games';
import Builds from './pages/Builds';

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
                  <Route path="comparador" element={<CharacterCompare />} />
                  <Route path="minha-lista" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
                  <Route path="stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                  <Route path="calendario" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                  <Route path="conquistas" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                  <Route path="wrapped" element={<ProtectedRoute><Wrapped /></ProtectedRoute>} />
                  <Route path="jogos" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                  <Route path="builds" element={<ProtectedRoute><Builds /></ProtectedRoute>} />
                  <Route path="perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SidebarProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
