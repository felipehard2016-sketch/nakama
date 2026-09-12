import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import MyList from './pages/MyList';
import Stats from './pages/Stats';
import Calendar from './pages/Calendar';
import Achievements from './pages/Achievements';
import CharacterCompare from './pages/CharacterCompare';
import Profile from './pages/Profile';

/*
 * Passo 2 — layout base responsivo: sidebar fixa a partir de tablet,
 * gaveta em mobile. Rotas apontam para páginas placeholder (PageStub);
 * dado real só entra a partir do passo 5.
 */
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
                  <Route path="buscar" element={<Search />} />
                  <Route path="minha-lista" element={<MyList />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="calendario" element={<Calendar />} />
                  <Route path="conquistas" element={<Achievements />} />
                  <Route path="comparador" element={<CharacterCompare />} />
                  <Route path="perfil" element={<Profile />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SidebarProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
