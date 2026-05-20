import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryAniList, SEASONAL_ANIME } from '../lib/anilist';
import { getAllMedia } from '../lib/storage';
import { useTitle } from '../hooks/useTitle';
import { Calendar as CalIcon, Clock, Star, Wifi, List, CalendarPlus } from 'lucide-react';

/* ─── Gera link do Google Calendar ─── */
function makeGoogleCalLink(anime) {
  const airingAt = anime.nextAiringEpisode?.airingAt;
  if (!airingAt) return null;
  const title   = anime.title?.english || anime.title?.romaji || 'Anime';
  const ep      = anime.nextAiringEpisode?.episode;
  const start   = new Date(airingAt * 1000);
  const end     = new Date(start.getTime() + 30 * 60 * 1000); // +30min
  const fmt     = d => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  const params  = new URLSearchParams({
    action: 'TEMPLATE',
    text:   `${title} — Ep ${ep}`,
    dates:  `${fmt(start)}/${fmt(end)}`,
    details: `Episódio ${ep} de ${title} no ar!`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ── Dias da semana Seg→Dom ── */
const WEEK = [
  { short: 'Seg', full: 'Segunda',  jsDay: 1 },
  { short: 'Ter', full: 'Terça',    jsDay: 2 },
  { short: 'Qua', full: 'Quarta',   jsDay: 3 },
  { short: 'Qui', full: 'Quinta',   jsDay: 4 },
  { short: 'Sex', full: 'Sexta',    jsDay: 5 },
  { short: 'Sáb', full: 'Sábado',   jsDay: 6 },
  { short: 'Dom', full: 'Domingo',  jsDay: 0 },
];

const SEASON_NAMES = { WINTER: 'Inverno', SPRING: 'Primavera', SUMMER: 'Verão', FALL: 'Outono' };

const STATUS_COLOR = {
  WATCHING:      '#a78bfa',
  COMPLETED:     '#4ade80',
  ON_HOLD:       '#fbbf24',
  DROPPED:       '#f87171',
  PLAN_TO_WATCH: '#60a5fa',
};
const STATUS_LABEL = {
  WATCHING:      'Assistindo',
  COMPLETED:     'Completo',
  ON_HOLD:       'Em Pausa',
  DROPPED:       'Abandonado',
  PLAN_TO_WATCH: 'Planejado',
};

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return 'WINTER';
  if (m <= 6) return 'SPRING';
  if (m <= 9) return 'SUMMER';
  return 'FALL';
}

function getAiringDay(anime) {
  if (anime.nextAiringEpisode?.airingAt)
    return new Date(anime.nextAiringEpisode.airingAt * 1000).getDay();
  const nodes = anime.airingSchedule?.nodes;
  if (nodes?.length)
    return new Date(nodes[0].airingAt * 1000).getDay();
  return null;
}

function getAiringTime(anime) {
  const ts = anime.nextAiringEpisode?.airingAt ?? anime.airingSchedule?.nodes?.[0]?.airingAt;
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getNextEp(anime) {
  return anime.nextAiringEpisode?.episode
    ?? anime.airingSchedule?.nodes?.[0]?.episode
    ?? null;
}

/* ─── Card ─── */
function CalCard({ anime, listStatus }) {
  const navigate = useNavigate();
  const title    = anime.title.english || anime.title.romaji;
  const score    = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const time     = getAiringTime(anime);
  const nextEp   = getNextEp(anime);
  const inList   = !!listStatus;
  const lsColor  = STATUS_COLOR[listStatus];

  return (
    <div
      onClick={() => navigate(`/anime/${anime.id}`)}
      style={{
        background: inList ? `${lsColor}0e` : 'var(--bg-card)',
        border: `1px solid ${inList ? `${lsColor}55` : 'var(--border)'}`,
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = inList ? lsColor : 'rgba(124,58,237,0.55)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = inList ? `${lsColor}55` : 'var(--border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Capa */}
      <div style={{ position: 'relative', paddingBottom: '138%', overflow: 'hidden' }}>
        <img
          src={anime.coverImage.large} alt={title} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 55%)',
        }} />

        {/* Badge da lista (canto superior esquerdo) */}
        {inList && (
          <div style={{
            position: 'absolute', top: 5, left: 5,
            background: `${lsColor}cc`, backdropFilter: 'blur(4px)',
            borderRadius: 5, padding: '2px 6px',
            fontSize: 9, fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <List size={8} /> {STATUS_LABEL[listStatus]}
          </div>
        )}

        {/* Badges inferiores */}
        <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {nextEp != null && (
            <span style={{
              background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(4px)',
              borderRadius: 5, padding: '2px 7px',
              fontSize: 10, fontWeight: 700, color: '#fff',
            }}>EP {nextEp}</span>
          )}
          {score && (
            <span style={{
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
              borderRadius: 5, padding: '2px 7px', marginLeft: 'auto',
              fontSize: 10, fontWeight: 700, color: '#fbbf24',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Star size={8} fill="#fbbf24" color="#fbbf24" /> {score}
            </span>
          )}
        </div>
      </div>

      {/* Título + horário */}
      <div style={{ padding: '7px 9px 9px' }}>
        <p style={{
          fontSize: 11, fontWeight: 600, lineHeight: 1.35,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: time ? 4 : 0,
        }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          {time && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)' }}>
              <Clock size={8} /> {time}
            </p>
          )}
          {/* Google Calendar link */}
          {anime.nextAiringEpisode?.airingAt && (() => {
            const gcal = makeGoogleCalLink(anime);
            return gcal ? (
              <a href={gcal} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title="Adicionar ao Google Calendar"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285f4'; e.currentTarget.style.color = '#4285f4'; e.currentTarget.style.background = 'rgba(66,133,244,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
                <CalendarPlus size={11} />
              </a>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
}

function ColSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2].map(i => (
        <div key={i} className="skeleton" style={{ height: 170, borderRadius: 10 }} />
      ))}
    </div>
  );
}

/* ─── Legenda da lista ─── */
function ListLegend() {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Minha lista:</span>
      {Object.entries(STATUS_LABEL).map(([k, label]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLOR[k] }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Página ─── */
export default function Calendar() {
  useTitle('Calendário');
  const [animes, setAnimes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const season  = getCurrentSeason();
  const year    = new Date().getFullYear();
  const todayJS = new Date().getDay();

  /* IDs na lista do usuário */
  const myListMap = useMemo(() => {
    const map = {};
    getAllMedia().forEach(m => {
      if (m.listStatus) map[m.id] = m.listStatus;
    });
    return map;
  }, []);

  useEffect(() => {
    queryAniList(SEASONAL_ANIME, { season, year, page: 1, perPage: 50 })
      .then(data => setAnimes(data.Page.media))
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, []);

  /* Agrupar por dia */
  const byDay = WEEK.map(({ jsDay }) =>
    animes
      .filter(a => getAiringDay(a) === jsDay)
      .sort((a, b) => {
        const ta = a.nextAiringEpisode?.airingAt ?? a.airingSchedule?.nodes?.[0]?.airingAt ?? 0;
        const tb = b.nextAiringEpisode?.airingAt ?? b.airingSchedule?.nodes?.[0]?.airingAt ?? 0;
        return ta - tb;
      })
  );

  const withDay    = animes.filter(a => getAiringDay(a) !== null).length;
  const noSchedule = animes.filter(a => getAiringDay(a) === null);
  const myListInCal = animes.filter(a => myListMap[a.id]).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        padding: '36px 40px 24px',
        background: 'linear-gradient(180deg,rgba(124,58,237,0.07) 0%,transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <CalIcon size={20} color="var(--purple-light)" />
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Calendário</h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {SEASON_NAMES[season]} {year}
              {!loading && !apiError && (
                <> · <span>{animes.length} animes</span>
                {myListInCal > 0 && <> · <span style={{ color: 'var(--purple-light)', fontWeight: 600 }}>{myListInCal} na sua lista</span></>}
                </>
              )}
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 8, padding: '7px 14px',
            fontSize: 12, color: 'var(--purple-light)', fontWeight: 600,
          }}>
            <Wifi size={13} />
            Hoje: {WEEK.find(d => d.jsDay === todayJS)?.full || '—'}
          </div>
        </div>

        {/* Legenda */}
        {!loading && !apiError && myListInCal > 0 && <ListLegend />}
      </div>

      <div style={{ padding: '28px 40px 60px' }}>

        {/* Erro de API */}
        {apiError && (
          <div style={{
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#fbbf24' }}>AniList API temporariamente indisponível</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                O calendário voltará quando a API se recuperar. Tente recarregar em alguns minutos.
              </p>
            </div>
            <button onClick={() => window.location.reload()} style={{
              marginLeft: 'auto', flexShrink: 0, background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '7px 14px',
              color: '#fbbf24', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
            }}>Recarregar</button>
          </div>
        )}

        {/* Grade 7 colunas */}
        <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 12 }}>
          {WEEK.map(({ short, full, jsDay }, wi) => {
            const isToday   = jsDay === todayJS;
            const dayAnimes = byDay[wi];

            return (
              <div key={full}>
                {/* Cabeçalho do dia */}
                <div style={{
                  textAlign: 'center', padding: '9px 4px', marginBottom: 10,
                  background: isToday
                    ? 'linear-gradient(135deg,rgba(124,58,237,0.22),rgba(37,99,235,0.14))'
                    : 'var(--bg-card)',
                  border: `1px solid ${isToday ? 'rgba(124,58,237,0.55)' : 'var(--border)'}`,
                  borderRadius: 9, position: 'relative',
                }}>
                  <p style={{
                    fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em',
                    color: isToday ? 'var(--purple-light)' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}>{short}</p>
                  {isToday && (
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--purple)', margin: '4px auto 0',
                      boxShadow: '0 0 6px var(--purple)',
                    }} />
                  )}
                  {!loading && dayAnimes.length > 0 && (
                    <div style={{
                      position: 'absolute', top: -7, right: -7,
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--purple)',
                      fontSize: 9, fontWeight: 800, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {dayAnimes.length}
                    </div>
                  )}
                </div>

                {/* Cards do dia */}
                {loading ? (
                  wi < 4 ? <ColSkeleton /> : null
                ) : dayAnimes.length === 0 ? (
                  <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: '20px 0', opacity: 0.4 }}>—</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {dayAnimes.map(anime => (
                      <CalCard
                        key={anime.id}
                        anime={anime}
                        listStatus={myListMap[anime.id] || null}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sem horário confirmado */}
        {!loading && !apiError && noSchedule.length > 0 && (
          <div style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Dia não confirmado · {noSchedule.length} animes
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
              {noSchedule.map(anime => (
                <CalCard key={anime.id} anime={anime} listStatus={myListMap[anime.id] || null} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
