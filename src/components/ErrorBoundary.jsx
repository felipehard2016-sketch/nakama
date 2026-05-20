import { Component } from 'react';

/* ─────────────────────────────────────────────────────────────
   ErrorBoundary global
   Captura dois tipos de erro:

   1. ChunkLoadError — chunk JS não encontrado após novo deploy.
      Sintomas: "Failed to fetch dynamically imported module" /
                "Loading chunk X failed".
      Solução: recarregar a página UMA vez (proteção anti-loop
               via sessionStorage).

   2. Erro de runtime React (TypeError, ReferenceError etc.)
      Solução: mostrar tela amigável com botão de reload e link
               para voltar ao início.
───────────────────────────────────────────────────────────── */

const RELOAD_FLAG = 'nakama_chunk_reload';

function isChunkError(error) {
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Importing a module script failed') ||
    error.name === 'ChunkLoadError'
  );
}

/* ─── Tela de erro genérico ─── */
function ErrorScreen({ error, onReset }) {
  const isDev = import.meta.env.DEV;
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20,
      background: 'var(--bg, #0a0a0f)',
      padding: 32, textAlign: 'center',
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
      }}>
        ⚠️
      </div>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text, #fff)', marginBottom: 8 }}>
          Algo deu errado
        </h1>
        <p style={{ color: 'var(--text-muted, #888)', fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
          Ocorreu um erro inesperado. Tente recarregar a página ou voltar para o início.
        </p>
        {isDev && error && (
          <pre style={{
            marginTop: 16,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '12px 16px',
            fontSize: 11.5, color: '#f87171',
            textAlign: 'left', maxWidth: 480,
            overflow: 'auto', maxHeight: 160,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {error.toString()}
          </pre>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '11px 22px', borderRadius: 10,
            background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
            color: '#fff', fontSize: 13.5, fontWeight: 700,
            boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          🔄 Recarregar página
        </button>

        <button
          onClick={() => { window.location.href = '/'; }}
          style={{
            padding: '11px 22px', borderRadius: 10,
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            color: 'var(--text-secondary, #aaa)', fontSize: 13.5, fontWeight: 600,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border, rgba(255,255,255,0.1))'}
        >
          ← Voltar ao início
        </button>

        {onReset && (
          <button
            onClick={onReset}
            style={{
              padding: '11px 22px', borderRadius: 10,
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
              color: 'var(--text-secondary, #aaa)', fontSize: 13.5,
            }}
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Tela de chunk error (nova versão disponível) ─── */
function UpdateScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
      background: 'var(--bg, #0a0a0f)',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'rgba(124,58,237,0.15)',
        border: '1px solid rgba(124,58,237,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
      }}>
        🚀
      </div>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text, #fff)', marginBottom: 8 }}>
          Nova versão disponível
        </h1>
        <p style={{ color: 'var(--text-muted, #888)', fontSize: 13.5, maxWidth: 340, lineHeight: 1.6 }}>
          O Nakama foi atualizado. Recarregando para aplicar as novidades…
        </p>
      </div>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(124,58,237,0.2)',
        borderTop: '3px solid #7c3aed',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

/* ════════════════════════════════════════
   CLASSE ERROR BOUNDARY
════════════════════════════════════════ */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunk: false };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      isChunk: isChunkError(error),
    };
  }

  componentDidCatch(error, info) {
    console.error('[Nakama] ErrorBoundary capturou:', error);
    console.error('[Nakama] Componente stack:', info?.componentStack);

    if (isChunkError(error)) {
      /* Proteção anti-loop: só recarrega uma vez a cada 10s */
      const last = sessionStorage.getItem(RELOAD_FLAG);
      if (!last || Date.now() - Number(last) > 10_000) {
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        /* Pequeno delay para a tela de "atualizando" aparecer */
        setTimeout(() => window.location.reload(), 1200);
      }
    }
  }

  reset = () => this.setState({ hasError: false, error: null, isChunk: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.isChunk) {
      const last = sessionStorage.getItem(RELOAD_FLAG);
      const recentlyReloaded = last && Date.now() - Number(last) < 10_000;

      /* Se já recarregou recentemente e ainda deu chunk error → erro real */
      if (recentlyReloaded) {
        return (
          <ErrorScreen
            error={this.state.error}
            onReset={this.reset}
          />
        );
      }
      return <UpdateScreen />;
    }

    return (
      <ErrorScreen
        error={this.state.error}
        onReset={this.reset}
      />
    );
  }
}
