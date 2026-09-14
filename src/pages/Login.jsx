import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTitle } from '../hooks/useTitle';

export default function Login() {
  useTitle('Entrar');
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, username);

    setBusy(false);

    if (error) {
      showToast(error.message || 'Não deu para completar. Tenta de novo.', 'error');
      return;
    }

    if (mode === 'signup') {
      showToast('Conta criada! Confirme seu e-mail se for pedido, e entre.', 'success');
      setMode('login');
      return;
    }

    showToast('Bem-vindo de volta!', 'success');
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/favicon.svg" alt="" className="h-12 w-auto" />
        <h1 className="bg-gradient-to-r from-purple to-blue bg-clip-text text-2xl font-extrabold text-transparent">
          {mode === 'login' ? 'Entrar no Nakama' : 'Criar conta'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Nome de usuário"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
          />
        )}
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-lg bg-gradient-to-r from-purple to-blue px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple/25 transition-opacity disabled:opacity-60"
        >
          {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
        <button
          onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
          className="font-semibold text-purple-light hover:underline"
        >
          {mode === 'login' ? 'Criar conta' : 'Entrar'}
        </button>
      </p>

      <Link to="/" className="text-center text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
        ← Voltar sem entrar
      </Link>
    </div>
  );
}
