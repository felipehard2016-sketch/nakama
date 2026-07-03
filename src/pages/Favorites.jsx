import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites } from '../lib/storage';
import { useTitle } from '../hooks/useTitle';
import { Heart, Star, Search, SlidersHorizontal, ChevronDown, Compass, Clock } from 'lucide-react';

/* ─── Maps ───────────────────────────────────── */
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

const MANGA_FORMATS  = new Set(['MANGA', 'ONE_SHOT', 'NOVEL']);
const isManga        = m => MANGA_FORMATS.has(m.format);

const SORT_OPTIONS = [
  { key: 'recent', label: 'Adicionado recentemente', icon: Clock },
  { key: 'score',  label: 'Melhor nota',             icon: Star },
  { key: 'az',     label: 'Título A–Z',              icon: null },
];

/* ─── Card ───────────────────────────────────── */
function FavCard({ item }) {
  const navigate = useNavigate();
  const title    = item.title?.english || item.title?.romaji || 'Sem título';
  const score    = item.averageScore ? (item.averageScore / 10).toFixed(1) : null;
  const sColor   = STATUS_COLOR[item.listStatus];
  const sLabel   = STATUS_LABEL[item.listStatus];
  const cover    = item.coverImage?.extraLarge || item.coverImage?.large;
  const type     = item.format ? item.format.replace(/_/g, ' ') : '—';
  const year     = item.seasonYear || '—';

  return (
    <div
      onClick={() => navigate(`/anime/${item.id}`)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform    = 'translateY(-4px)';
        e.currentTarget.style.boxShadow   = '0 16px 40px rgba(0,0,0,0.5)';
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform    = 'none';
        e.currentTarget.style.boxShadow   = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* ── Capa 200px ── */}
      <div style={{ position: 'relative', height: 200, flexShrink: 0, overflow: 'hidden' }}>
        {cover ? (
          <img
            src={cover} alt={title} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.4s ease' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg,#1e1b4b,#0f172a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={32} color="rgba(124,58,237,0.3)" strokeWidth={1.5} />
          </div>
        )}

        {/* Gradiente inferior */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to top, rgba(10,10,15,0.92) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Score — canto superior esquerdo */}
        {score && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
            borderRadius: 6, padding: '3px 8px',
            fontSize: 11, fontWeight: 800, color: '#fbbf24',
            display: 'flex', alignItems: 'center', gap: 3,
            border: '1px solid rgba(251,191,36,0.25)',
          }}>
            <Star size={9} fill="#fbbf24" color="#fbbf24" /> {score}
          </div>
        )}

        {/* Coração — canto superior direito */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(239,68,68,0.2)',
          border: '1px solid rgba(239,68,68,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}>
          <Heart size={13} fill="#f87171" color="#f87171" />
        </div>

        {/* Status badge — dentro do gradiente, embaixo */}
        {sColor && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: `${sColor}22`,
            border: `1px solid ${sColor}55`,
            borderRadius: 5, padding: '2px 8px',
            fontSize: 9.5, fontWeight: 700, color: sColor,
            backdropFilter: 'blur(4px)',
          }}>
            {sLabel}
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div style={{ padding: '10px 12px 13px', flex: 1 }}>
        <p style={{
          fontSize: 12.5, fontWeight: 700, lineHeight: 1.35, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: 5,
        }}>{title}</p>
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
          {type} · {year}
        </p>
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────── */
function EmptyState({ tab }) {
  const navigate = useNavigate();
  const isPersonagens = tab === 'personagens';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 20px', gap: 18, textAlign: 'center',
    }}>
      {/* Ícone com glow */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: -16,
          borderRadius: '50%', background: isPersonagens
            ? 'rgba(124,58,237,0.08)'
            : 'rgba(239,68,68,0.08)',
          filter: 'blur(16px)',
        }} />
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: isPersonagens ? 'rgba(124,58,237,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${isPersonagens ? 'rgba(124,58,237,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Heart size={34} color={isPersonagens ? 'var(--purple-light)' : '#f87171'} strokeWidth={1.5} />
        </div>
      </div>

      <div>
        <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          {isPersonagens ? 'Em breve' : 'Nenhum favorito ainda'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320 }}>
          {isPersonagens
            ? 'A aba de personagens favoritos está sendo desenvolvida. Em breve você poderá salvar seus personagens preferidos aqui!'
            : tab === 'mangas'
              ? 'Abra qualquer mangá e clique em "Favoritar" para salvar aqui.'
              : 'Abra qualquer anime e clique em "Favoritar" para salvar aqui.'
          }
        </p>
      </div>

      {!isPersonagens && (
        <button
          onClick={() => navigate('/search')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: 10, padding: '11px 22px',
            color: 'var(--purple-light)', fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'; }}
        >
          <Compass size={16} /> Explorar animes
        </button>
      )}
    </div>
  );
}

/* ─── Sort dropdown ───────────────────────────── */
function SortMenu({ sort, setSort }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.key === sort);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--bg-card)', border: `1px solid ${open ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
          borderRadius: 9, padding: '8px 14px',
          color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', transition: 'border-color 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <SlidersHorizontal size={14} />
        {current?.label}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <>
          {/* overlay para fechar */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 4,
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 10, minWidth: 210,
          }}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => { setSort(opt.key); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                  padding: '9px 12px', borderRadius: 7, textAlign: 'left',
                  background: sort === opt.key ? 'rgba(124,58,237,0.12)' : 'transparent',
                  color: sort === opt.key ? 'var(--purple-light)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: sort === opt.key ? 600 : 400,
                  cursor: 'pointer', transition: 'background 0.12s',
                  border: 'none',
                }}
                onMouseEnter={e => { if (sort !== opt.key) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (sort !== opt.key) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt.icon && <opt.icon size={13} />}
                {opt.label}
                {sort === opt.key && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Página ──────────────────────────────────── */
const TABS = [
  { key: 'animes',      label: 'Animes' },
  { key: 'mangas',      label: 'Mangás' },
  { key: 'personagens', label: 'Personagens', soon: true },
];

export default function Favorites() {
  useTitle('Favoritos');
  const [all,    setAll]    = useState([]);
  const [tab,    setTab]    = useState('animes');
  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState('recent');

  useEffect(() => { setAll(getFavorites()); }, []);

  /* Contagens por aba */
  const counts = useMemo(() => ({
    animes:      all.filter(m => !isManga(m)).length,
    mangas:      all.filter(m =>  isManga(m)).length,
    personagens: 0,
  }), [all]);

  /* Lista filtrada + ordenada */
  const displayed = useMemo(() => {
    let list = tab === 'animes'
      ? all.filter(m => !isManga(m))
      : tab === 'mangas'
        ? all.filter(m =>  isManga(m))
        : [];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => (m.title?.english || m.title?.romaji || '').toLowerCase().includes(q));
    }

    if (sort === 'recent') list = [...list].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    else if (sort === 'score') list = [...list].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    else if (sort === 'az')    list = [...list].sort((a, b) => {
      const ta = (a.title?.english || a.title?.romaji || '').toLowerCase();
      const tb = (b.title?.english || b.title?.romaji || '').toLowerCase();
      return ta.localeCompare(tb);
    });

    return list;
  }, [all, tab, search, sort]);

  const totalFav = all.length;
  const isPersonagens = tab === 'personagens';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', animation: 'fadeIn 0.35s ease' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '36px 24px 0',
        background: 'linear-gradient(180deg, rgba(239,68,68,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          {/* Título */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Heart size={17} fill="#f87171" color="#f87171" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Favoritos</h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 2 }}>
              {totalFav} título{totalFav !== 1 ? 's' : ''} favoritado{totalFav !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Controles direita */}
          {!isPersonagens && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Busca */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar favorito..."
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 9, padding: '8px 12px 8px 30px',
                    color: 'var(--text)', fontSize: 13, outline: 'none', width: 200,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              {/* Sort */}
              <SortMenu sort={sort} setSort={setSort} />
            </div>
          )}
        </div>

        {/* ── Abas ── */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch(''); }}
                style={{
                  position: 'relative', padding: '10px 20px',
                  background: 'none', border: 'none',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13.5, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', transition: 'color 0.15s',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                {t.label}
                {/* contagem */}
                {counts[t.key] > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    background: active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${active ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: active ? 'var(--purple-light)' : 'var(--text-muted)',
                    borderRadius: 20, padding: '1px 7px',
                    transition: 'all 0.15s',
                  }}>
                    {counts[t.key]}
                  </span>
                )}
                {/* badge "em breve" */}
                {t.soon && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 700,
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    color: 'var(--purple-light)',
                    borderRadius: 4, padding: '1px 6px', letterSpacing: '0.04em',
                  }}>
                    EM BREVE
                  </span>
                )}
                {/* linha ativa */}
                {active && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 16, right: 16,
                    height: 2, borderRadius: 2,
                    background: 'linear-gradient(90deg,var(--purple),var(--blue-light))',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div style={{ padding: '28px 24px 64px' }}>
        {isPersonagens ? (
          <EmptyState tab="personagens" />
        ) : displayed.length === 0 ? (
          search
            ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Nenhum resultado para "{search}"</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tente um título diferente.</p>
              </div>
            )
            : <EmptyState tab={tab} />
        ) : (
          <>
            {/* Subtítulo com contagem */}
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 }}>
              {displayed.length} {tab === 'animes' ? 'anime' : 'mangá'}{displayed.length !== 1 ? 's' : ''} favoritado{displayed.length !== 1 ? 's' : ''}
              {search && ` · filtrando por "${search}"`}
            </p>

            {/* Grid 4 colunas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16,
            }}>
              {displayed.map(item => <FavCard key={item.id} item={item} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
