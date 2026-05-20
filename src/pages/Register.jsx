import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';

export default function Register() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  /* 'done'    → mostra mensagem de sucesso antes de redirecionar
     'confirm' → e-mail de confirmação necessário (não há sessão imediata) */
  const [state, setState] = useState('form'); // 'form' | 'done' | 'confirm'

  /* Se o usuário já estava logado, manda direto para a Home */
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { setError('Preencha todos os campos.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }

    setError('');
    setLoading(true);

    try {
      const data = await signUp({ name, email, password });

      if (data?.session) {
        /*
         * Sessão retornada → confirmação de e-mail está DESABILITADA no Supabase.
         * onAuthStateChange vai disparar e atualizar o contexto.
         * O useEffect acima vai detectar user != null e redirecionar para /.
         * Mostramos a tela de sucesso por 1,2s para o usuário ver o feedback.
         */
        setState('done');
      } else {
        /*
         * Sem sessão → confirmação de e-mail está HABILITADA.
         * O usuário precisa clicar no link enviado para o e-mail.
         */
        setState('confirm');
      }
    } catch (err) {
      if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
        setError('Este e-mail já está cadastrado.');
      } else if (err.message?.includes('Password should be')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Tela: e-mail de confirmação necessário ── */
  if (state === 'confirm') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '48px 36px', textAlign: 'center',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>📧</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Confirme seu e-mail</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Enviamos um link de confirmação para{' '}
            <strong style={{ color: 'var(--purple-light)' }}>{email}</strong>.
            <br />Clique no link para ativar sua conta e fazer login.
          </p>
          <Link to="/login" style={{
            display: 'inline-block', marginTop: 28,
            background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
            color: '#fff', borderRadius: 10, padding: '11px 28px',
            fontSize: 14, fontWeight: 700,
          }}>
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  /* ── Tela: conta criada com sucesso (com sessão) ── */
  if (state === 'done') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '48px 36px', textAlign: 'center',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', fontSize: 28,
          }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#4ade80', marginBottom: 8 }}>
            Bem-vindo ao Nakama, {name}!
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Conta criada com sucesso. Redirecionando...
          </p>
          <div style={{
            width: 32, height: 32, margin: '16px auto 0',
            border: '3px solid rgba(124,58,237,0.2)',
            borderTop: '3px solid var(--purple)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  /* ── Formulário principal ── */
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      {/* Glow de fundo */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
      }} />

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '40px 36px',
        position: 'relative', animation: 'fadeIn 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 54, height: 54,
            background: 'linear-gradient(135deg, var(--purple), #4f46e5)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          }}>
            <Sparkles size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>Nakama</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

          {/* Nome */}
          <Field label="Nome de exibição">
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Seu nome" autoComplete="name" autoFocus
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>

          {/* E-mail */}
          <Field label="E-mail">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" autoComplete="email"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>

          {/* Senha */}
          <Field label="Senha">
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <EyeToggle show={showPw} toggle={() => setShowPw(v => !v)} />
            </div>
          </Field>

          {/* Confirmar senha */}
          <Field label="Confirmar senha">
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a senha" autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: confirm && confirm !== password
                    ? 'rgba(248,113,113,0.5)'
                    : 'var(--border)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                onBlur={e => e.target.style.borderColor =
                  confirm && confirm !== password ? 'rgba(248,113,113,0.5)' : 'var(--border)'
                }
              />
              <EyeToggle show={showPw} toggle={() => setShowPw(v => !v)} />
            </div>
          </Field>

          {/* Erro */}
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171',
            }}>
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit" disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(90deg, var(--purple), #4f46e5)',
              color: '#fff', borderRadius: 10, padding: '12px',
              fontSize: 14, fontWeight: 700, marginTop: 4,
              cursor: loading ? 'default' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {loading
              ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <><UserPlus size={16} /> Criar conta</>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Já tem uma conta?{' '}
          <Link to="/login" style={{ color: 'var(--purple-light)', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Helpers internos ── */
const inputStyle = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
};

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function EyeToggle({ show, toggle }) {
  return (
    <button
      type="button" onClick={toggle}
      style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-muted)', display: 'flex', padding: 2, transition: 'color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
    >
      {show
        ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );
}
