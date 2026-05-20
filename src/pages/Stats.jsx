import { useState, useEffect } from 'react';
import { getAllMedia, getMonthlyActivity } from '../lib/storage';
import { useNavigate } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';
import { BarChart2, Clock, Tv, BookOpen, Star, TrendingUp, Search, CalendarDays } from 'lucide-react';

const AVG_EP_MINUTES = 24;

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: `${color || 'var(--purple)'}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={color || 'var(--purple-light)'} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em', color: color || 'var(--text)' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function GenreBar({ genre, count, max }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', width: 120, flexShrink: 0, textAlign: 'right' }}>
        {genre}
      </span>
      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--purple), var(--blue-light))',
          borderRadius: 4, transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>
        {count}
      </span>
    </div>
  );
}

function MiniCard({ item }) {
  const navigate = useNavigate();
  const title = item.title?.english || item.title?.romaji || '—';
  const isAnime = !['MANGA', 'NOVEL', 'ONE_SHOT'].includes(item.format);
  const total = isAnime ? item.episodes : item.chapters;
  return (
    <div
      onClick={() => navigate(`/anime/${item.id}`)}
      style={{
        display: 'flex', gap: 10, alignItems: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <img src={item.coverImage?.large} alt="" style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
          {item.progress} / {total || '?'} {isAnime ? 'eps' : 'caps'}
        </p>
      </div>
      <div style={{
        flexShrink: 0, fontSize: 13, fontWeight: 800,
        color: 'var(--purple-light)',
        background: 'rgba(124,58,237,0.12)',
        borderRadius: 8, padding: '4px 10px',
      }}>
        {item.progress} {isAnime ? 'ep' : 'cap'}
      </div>
    </div>
  );
}

function EmptyStats() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'rgba(124,58,237,0.08)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BarChart2 size={32} color="var(--purple-light)" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Nenhum dado ainda</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}>
        Adicione animes e mangás à sua lista para ver suas estatísticas.
      </p>
      <button
        onClick={() => navigate('/search')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: 10, padding: '10px 20px',
          color: 'var(--purple-light)', fontSize: 13.5, fontWeight: 600,
        }}
      >
        <Search size={15} /> Explorar animes
      </button>
    </div>
  );
}

export default function Stats() {
  useTitle('Estatísticas');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const all = getAllMedia();
    if (all.length === 0) { setStats(null); return; }

    const completed  = all.filter(m => m.listStatus === 'COMPLETED');
    const watching   = all.filter(m => m.listStatus === 'WATCHING');
    const inList     = all.filter(m => m.listStatus);

    const animes     = inList.filter(m => !['MANGA', 'NOVEL', 'ONE_SHOT'].includes(m.format));
    const mangas     = inList.filter(m => ['MANGA', 'NOVEL', 'ONE_SHOT'].includes(m.format));

    /* Episódios totais assistidos */
    const totalEps = inList.reduce((acc, m) => {
      const isAnime = !['MANGA', 'NOVEL', 'ONE_SHOT'].includes(m.format);
      if (!isAnime) return acc;
      if (m.listStatus === 'COMPLETED' && m.episodes) return acc + m.episodes;
      return acc + (m.progress || 0);
    }, 0);

    /* Capítulos lidos */
    const totalChaps = inList.reduce((acc, m) => {
      const isManga = ['MANGA', 'NOVEL', 'ONE_SHOT'].includes(m.format);
      if (!isManga) return acc;
      if (m.listStatus === 'COMPLETED' && m.chapters) return acc + m.chapters;
      return acc + (m.progress || 0);
    }, 0);

    /* Horas */
    const totalMinutes = totalEps * AVG_EP_MINUTES;
    const hours = Math.floor(totalMinutes / 60);
    const days  = (totalMinutes / 60 / 24).toFixed(1);

    /* Gêneros */
    const genreCount = {};
    inList.forEach(m => {
      (m.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; });
    });
    const genres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    /* Formatos */
    const formatCount = {};
    inList.forEach(m => { formatCount[m.format] = (formatCount[m.format] || 0) + 1; });

    /* Mais maratonados (maior progresso absoluto) */
    const mostWatched = [...inList]
      .filter(m => (m.progress || 0) > 0)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 5);

    /* Score médio */
    const scored = inList.filter(m => m.averageScore);
    const avgScore = scored.length
      ? (scored.reduce((a, m) => a + m.averageScore, 0) / scored.length / 10).toFixed(1)
      : null;

    const monthly = getMonthlyActivity(6);

    setStats({ totalEps, totalChaps, hours, days, genres, mostWatched, avgScore, animes, mangas, completed, watching, inList, monthly });
  }, []);

  if (!stats) return (
    <div style={{ padding: '36px 40px 0', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Estatísticas</h1>
      <EmptyStats />
    </div>
  );

  const { totalEps, totalChaps, hours, days, genres, mostWatched, avgScore, animes, mangas, completed, inList, monthly } = stats;
  const maxGenre = genres[0]?.[1] || 1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '36px 40px 32px',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Estatísticas</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {inList.length} título{inList.length !== 1 ? 's' : ''} na lista · atualizado agora
        </p>
      </div>

      <div style={{ padding: '32px 40px 60px' }}>

        {/* Cards de resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 44 }}>
          <StatCard icon={Tv}        label="Episódios Assistidos"  value={totalEps.toLocaleString()}  sub={`${hours}h assistidas · ${days} dias`} color="#a78bfa" />
          <StatCard icon={BookOpen}  label="Capítulos Lidos"       value={totalChaps.toLocaleString()} color="#60a5fa" />
          <StatCard icon={Clock}     label="Horas Assistidas"      value={`${hours}h`}                 sub={`${days} dias de anime`}               color="#4ade80" />
          <StatCard icon={Star}      label="Nota Média (AniList)"  value={avgScore || '—'}             sub="dos títulos na sua lista"              color="#fbbf24" />
          <StatCard icon={Tv}        label="Animes na Lista"       value={animes.length}               sub={`${completed.filter(m => !['MANGA','NOVEL','ONE_SHOT'].includes(m.format)).length} completos`} color="#a78bfa" />
          <StatCard icon={BookOpen}  label="Mangás na Lista"       value={mangas.length}               color="#60a5fa" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Gêneros */}
          <section style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
              <BarChart2 size={16} color="var(--purple-light)" />
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Gêneros Favoritos</h2>
            </div>
            {genres.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados suficientes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {genres.map(([genre, count]) => (
                  <GenreBar key={genre} genre={genre} count={count} max={maxGenre} />
                ))}
              </div>
            )}
          </section>

          {/* Mais maratonados */}
          <section style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
              <TrendingUp size={16} color="var(--purple-light)" />
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Mais Assistidos</h2>
            </div>
            {mostWatched.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem progresso registrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mostWatched.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 20, fontSize: 13, fontWeight: 800, flexShrink: 0, textAlign: 'center',
                      color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)',
                    }}>{i + 1}</span>
                    <MiniCard item={item} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Status distribution */}
        {inList.length > 0 && (
          <section style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Distribuição por Status</h2>
            <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              {[
                { status: 'WATCHING',      label: 'Assistindo',  color: '#a78bfa' },
                { status: 'COMPLETED',     label: 'Completo',    color: '#4ade80' },
                { status: 'ON_HOLD',       label: 'Pausado',     color: '#fbbf24' },
                { status: 'DROPPED',       label: 'Abandonado',  color: '#f87171' },
                { status: 'PLAN_TO_WATCH', label: 'Planejado',   color: '#60a5fa' },
              ].map(({ status, label, color }) => {
                const count = inList.filter(m => m.listStatus === status).length;
                const pct   = Math.round((count / inList.length) * 100);
                if (!count) return null;
                return (
                  <div key={status} title={`${label}: ${count} (${pct}%)`} style={{
                    flex: count, background: color, borderRadius: 4,
                    transition: 'flex 0.5s',
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { status: 'WATCHING',      label: 'Assistindo',  color: '#a78bfa' },
                { status: 'COMPLETED',     label: 'Completo',    color: '#4ade80' },
                { status: 'ON_HOLD',       label: 'Pausado',     color: '#fbbf24' },
                { status: 'DROPPED',       label: 'Abandonado',  color: '#f87171' },
                { status: 'PLAN_TO_WATCH', label: 'Planejado',   color: '#60a5fa' },
              ].map(({ status, label, color }) => {
                const count = inList.filter(m => m.listStatus === status).length;
                if (!count) return null;
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {label} <strong style={{ color: 'var(--text)' }}>{count}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Gráfico mensal */}
        {inList.length > 0 && monthly && (
          <section style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <CalendarDays size={16} color="var(--purple-light)" />
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Títulos Adicionados por Mês</h2>
            </div>

            {monthly.every(m => m.count === 0) ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Adicione mais títulos para ver o histórico mensal.</p>
            ) : (() => {
              const maxCount = Math.max(...monthly.map(m => m.count), 1);
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
                  {monthly.map(({ label, count }, i) => {
                    const heightPct = Math.round((count / maxCount) * 100);
                    const isLast = i === monthly.length - 1;
                    return (
                      <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                        {/* Valor */}
                        <span style={{ fontSize: 11, fontWeight: 700, color: count > 0 ? (isLast ? 'var(--purple-light)' : 'var(--text-secondary)') : 'transparent' }}>
                          {count}
                        </span>
                        {/* Barra */}
                        <div style={{
                          width: '100%', borderRadius: '5px 5px 0 0', minHeight: 4,
                          height: `${Math.max(heightPct, 3)}%`,
                          background: count === 0
                            ? 'rgba(255,255,255,0.05)'
                            : isLast
                              ? 'linear-gradient(180deg, var(--purple-light), var(--purple))'
                              : 'linear-gradient(180deg, rgba(124,58,237,0.6), rgba(124,58,237,0.3))',
                          transition: 'height 0.5s ease',
                          boxShadow: (count > 0 && isLast) ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                        }} />
                        {/* Label */}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}
      </div>
    </div>
  );
}
