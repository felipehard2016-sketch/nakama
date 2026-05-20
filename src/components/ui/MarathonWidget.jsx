import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarathon } from '../../context/MarathonContext';
import { Play, Pause, Square, Tv, Coffee, X, Clock, Film } from 'lucide-react';

function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

function fmtTimeClock(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const EP_DURATION_SEC = 24 * 60; // ~24 min
const PAUSE_SUGGEST_AFTER = 3;   // sugerir pausa após X eps de tempo

/* ─── Modal de resumo da sessão ─── */
function SummaryModal({ summary, onClose }) {
  const { title, totalSec, estEps } = summary;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.25s ease',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 24, padding: '32px', maxWidth: 380, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Sessão Encerrada!</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{title}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
            <Clock size={18} color="var(--purple-light)" style={{ marginBottom: 6 }} />
            <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--purple-light)', letterSpacing: '-0.03em' }}>{fmtTime(totalSec)}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Tempo total</p>
          </div>
          <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
            <Film size={18} color="#60a5fa" style={{ marginBottom: 6 }} />
            <p style={{ fontSize: 22, fontWeight: 900, color: '#60a5fa', letterSpacing: '-0.03em' }}>~{estEps}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Eps estimados</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20 }}>
          {estEps >= 5
            ? '🔥 Maratonista de verdade! Descanse um pouco.'
            : estEps >= 3
            ? '⭐ Boa sessão! Continua assim.'
            : '🌱 Cada episódio conta. Volte amanhã!'}
        </p>

        <button onClick={onClose} style={{
          width: '100%', padding: '13px 0',
          background: 'linear-gradient(135deg, var(--purple), #4f46e5)',
          borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          Fechar
        </button>
      </div>
    </div>
  );
}

/* ─── Widget ─── */
export default function MarathonWidget() {
  const { session, elapsedSec, running, paused, stopMarathon, togglePause } = useMarathon();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  if (!running && !summary) return null;

  /* Show summary modal after stopping */
  if (!running && summary) {
    return <SummaryModal summary={summary} onClose={() => setSummary(null)} />;
  }

  const estEpsWatched = Math.floor(elapsedSec / EP_DURATION_SEC);
  const suggestPause  = elapsedSec > 0 && elapsedSec % (PAUSE_SUGGEST_AFTER * EP_DURATION_SEC) < 30 && !paused && elapsedSec > 60;

  const handleStop = () => {
    setSummary({
      title:    session.animeTitle,
      totalSec: elapsedSec,
      estEps:   estEpsWatched,
    });
    stopMarathon();
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(16px)',
      border: `1px solid ${paused ? 'rgba(251,191,36,0.35)' : 'rgba(124,58,237,0.4)'}`,
      borderRadius: 18, padding: '16px 20px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${paused ? 'rgba(251,191,36,0.1)' : 'rgba(124,58,237,0.15)'}`,
      zIndex: 9999, width: 280,
      animation: 'fadeIn 0.3s ease',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: paused
            ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.1))'
            : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
          border: `1px solid ${paused ? 'rgba(251,191,36,0.35)' : 'rgba(124,58,237,0.4)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
        }}>
          {paused ? <Coffee size={16} color="#fbbf24" /> : <Tv size={16} color="var(--purple-light)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: paused ? '#fbbf24' : 'var(--purple-light)', marginBottom: 1, transition: 'color 0.3s' }}>
            {paused ? '☕ Em Pausa' : '▶ Modo Maratona'}
          </p>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.animeTitle}
          </p>
        </div>
      </div>

      {/* Timer */}
      <div style={{
        textAlign: 'center', marginBottom: 14,
        background: paused ? 'rgba(251,191,36,0.06)' : 'rgba(124,58,237,0.08)',
        border: `1px solid ${paused ? 'rgba(251,191,36,0.2)' : 'rgba(124,58,237,0.2)'}`,
        borderRadius: 12, padding: '10px 0',
        transition: 'all 0.3s',
      }}>
        <p style={{
          fontSize: 34, fontWeight: 900, letterSpacing: '-0.04em',
          color: paused ? '#fbbf24' : 'var(--purple-light)',
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.3s',
        }}>
          {fmtTimeClock(elapsedSec)}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          ≈ {estEpsWatched} ep{estEpsWatched !== 1 ? 's' : ''} assistido{estEpsWatched !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Sugestão de pausa */}
      {suggestPause && (
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 10, padding: '8px 12px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Coffee size={13} color="#fbbf24" />
          <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 500 }}>
            {estEpsWatched} eps seguidos — uma pausa?
          </p>
        </div>
      )}

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={togglePause} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 0', borderRadius: 10,
          background: paused ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${paused ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: paused ? 'var(--purple-light)' : 'var(--text-secondary)',
          fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
        }}>
          {paused ? <Play size={13} /> : <Pause size={13} />}
          {paused ? 'Retomar' : 'Pausar'}
        </button>
        <button onClick={handleStop} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 14px', borderRadius: 10,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          color: '#f87171', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}>
          <Square size={12} /> Encerrar
        </button>
      </div>

      {/* Link */}
      <button onClick={() => navigate(`/anime/${session.animeId}`)} style={{
        width: '100%', textAlign: 'center', marginTop: 10,
        fontSize: 11, color: 'var(--text-muted)', textDecoration: 'underline',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        Voltar ao anime
      </button>
    </div>
  );
}
