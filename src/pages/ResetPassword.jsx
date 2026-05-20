import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!password || !confirm) { setError('Preencha todos os campos.'); return; }
    if (password.length < 6)   { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm)  { setError('As senhas não coincidem.'); return; }

    setError('');
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '40px 36px',
        animation: 'fadeIn 0.4s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 54, height: 54,
            background: 'linear-gradient(135deg, var(--purple), #4f46e5)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          }}>
            <Sparkles size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Nova senha</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Escolha uma senha forte</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 26,
            }}>✓</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#4ade80' }}>Senha atualizada!</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Nova senha', val: password, set: setPassword, ph: 'Mínimo 6 caracteres', ac: 'new-password' },
              { label: 'Confirmar senha', val: confirm, set: setConfirm, ph: 'Repita a senha', ac: 'new-password' },
            ].map(({ label, val, set, ph, ac }) => (
              <div key={label}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={val} onChange={e => set(e.target.value)}
                    placeholder={ph} autoComplete={ac}
                    style={{
                      width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '11px 42px 11px 14px', color: 'var(--text)',
                      fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', padding: 2 }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(90deg, var(--purple), #4f46e5)',
              color: '#fff', borderRadius: 10, padding: '12px',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.35)', marginTop: 4,
            }}>
              {loading
                ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : 'Salvar nova senha'
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
