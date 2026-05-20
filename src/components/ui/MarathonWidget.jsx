import { useNavigate } from 'react-router-dom';
import { useMarathon } from '../../context/MarathonContext';
import { Play, Pause, Square, Tv, Coffee } from 'lucide-react';

function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const EP_DURATION_SEC = 24 * 60; // ~24 min
const PAUSE_SUGGEST_AFTER = 3;   // sugerir pausa após 3 eps

export default function MarathonWidget() {
  const { session, elapsedSec, epsThisSession, running, paused, stopMarathon, togglePause } = useMarathon();
  const navigate = useNavigate();

  if (!running || !session) return null;

  const showPauseSuggestion = epsThisSession > 0 && epsThisSession % PAUSE_SUGGEST_AFTER === 0 && !paused;
  const estEpsWatched = Math.floor(elapsedSec / EP_DURATION_SEC);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(124,58,237,0.4)',
      borderRadius: 18, padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.15)',
      zIndex: 9999, width: 280,
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
          border: '1px solid rgba(124,58,237,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {paused ? <Coffee size={16} color="#fbbf24" /> : <Tv size={16} color="var(--purple-light)" style={{ animation: paused ? 'none' : undefined }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--purple-light)', marginBottom: 1 }}>
            {paused ? 'Em Pausa' : 'Modo Maratona'}
          </p>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.animeTitle}
          </p>
        </div>
      </div>

      {/* Timer */}
      <div style={{
        textAlign: 'center', marginBottom: 14,
        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 12, padding: '10px 0',
      }}>
        <p style={{
          fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em',
          color: paused ? '#fbbf24' : 'var(--purple-light)',
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.3s',
        }}>
          {fmtTime(elapsedSec)}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          ≈ {estEpsWatched} ep{estEpsWatched !== 1 ? 's' : ''} estimado{estEpsWatched !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Sugestão de pausa */}
      {showPauseSuggestion && (
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 10, padding: '8px 12px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Coffee size={13} color="#fbbf24" />
          <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 500 }}>
            Que tal uma pausa? Você assistiu {epsThisSession} eps!
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
        <button onClick={() => {
          const t = fmtTime(elapsedSec);
          stopMarathon();
        }} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 14px', borderRadius: 10,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          color: '#f87171', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}>
          <Square size={12} /> Encerrar
        </button>
      </div>

      {/* Link para voltar ao anime */}
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
