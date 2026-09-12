import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

/*
 * Passo 1 — estrutura do projeto (Vite + React + Tailwind + PWA).
 * Esta tela é só uma checagem visual: confirma que o tema escuro, as
 * cores de marca e o service worker estão de pé antes de construir o
 * layout de verdade (sidebar fixa + rotas) no passo 2.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[var(--bg)] px-6 text-center">
            <img src="/favicon.svg" alt="Nakama" className="h-16 w-auto drop-shadow-[0_0_24px_var(--purple-glow)]" />
            <div>
              <h1 className="bg-gradient-to-r from-purple to-blue bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                Nakama
              </h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Estrutura do projeto pronta — Vite + React + Tailwind + PWA.
              </p>
            </div>
          </div>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
