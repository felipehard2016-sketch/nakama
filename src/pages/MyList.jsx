import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getByListStatus, getAllMedia } from '../lib/storage';
import { useTitle } from '../hooks/useTitle';
import { List, Star, Search, LayoutGrid, AlignJustify, Download } from 'lucide-react';

/* ─── Exportar lista ─── */
function exportList(format) {
  const all = getAllMedia().filter(m => m.listStatus);
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'nakama-lista.json'; a.click();
    URL.revokeObjectURL(url);
  } else {
    const headers = ['id','title_romaji','title_english','format','status','listStatus','progress','episodes','chapters','averageScore','userScore','favorited','seasonYear','addedAt'];
    const rows = all.map(m => [
      m.id,
      `"${(m.title?.romaji || '').replace(/"/g,'""')}"`,
      `"${(m.title?.english || '').replace(/"/g,'""')}"`,
      m.format || '',
      m.status || '',
      m.listStatus || '',
      m.progress || 0,
      m.episodes || '',
      m.chapters || '',
      m.averageScore || '',
      m.userScore || '',
      m.favorited ? 'true' : 'false',
      m.seasonYear || '',
      m.addedAt ? new Date(m.addedAt).toISOString().split('T')[0] : '',
    ].join(','));
    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'nakama-lista.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

/* ─── Menu de exportação ─── */
function ExportMenu({ total }) {
  const [open, setOpen] = useState(false);
  if (!total) return null;
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Exportar lista"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          height: 34, padding: '0 10px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
        <Download size={13} /> Exportar
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden', minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {[
              { fmt: 'csv',  label: 'Exportar como CSV' },
              { fmt: 'json', label: 'Exportar como JSON' },
            ].map(({ fmt, label }) => (
              <button key={fmt} onClick={() => { exportList(fmt); setOpen(false); }} style={{
                width: '100%', padding: '10px 16px', textAlign: 'left',
                fontSize: 13, color: 'var(--text-secondary)',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TABS = [
  { value: 'WATCHING',      label: 'Assistindo',  color: '#a78bfa' },
  { value: 'COMPLETED',     label: 'Completo',    color: '#4ade80' },
  { value: 'ON_HOLD',       label: 'Em Pausa',    color: '#fbbf24' },
  { value: 'DROPPED',       label: 'Abandonado',  color: '#f87171' },
  { value: 'PLAN_TO_WATCH', label: 'Planejado',   color: '#60a5fa' },
];

function MediaCard({ item, tabColor }) {
  const navigate = useNavigate();
  const title    = item.title?.english || item.title?.romaji || 'Sem título';
  const score    = item.averageScore ? (item.averageScore / 10).toFixed(1) : null;
  const isAnime  = !['MANGA', 'NOVEL', 'ONE_SHOT'].includes(item.format);
  const total    = isAnime ? item.episodes : item.chapters;
  const unit     = isAnime ? 'ep' : 'cap';
  const pct      = total ? Math.min(100, Math.round((item.progress / total) * 100)) : 0;

  return (
    <div
      onClick={() => navigate(`/anime/${item.id}`)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.18s, transform 0.18s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${tabColor}55`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Capa */}
      <div style={{ position: 'relative', paddingBottom: '55%', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={item.coverImage?.extraLarge || item.coverImage?.large}
          alt={title}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Gradiente */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,15,0.85) 0%, transparent 55%)',
        }} />

        {/* Score */}
        {score && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            borderRadius: 6, padding: '2px 7px',
            fontSize: 11, fontWeight: 700, color: '#fbbf24',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Star size={9} fill="#fbbf24" color="#fbbf24" /> {score}
          </div>
        )}

        {/* Progresso sobre a imagem (bottom) */}
        <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: tabColor }}>
              {item.progress} / {total || '?'} {unit}s
            </span>
            {total && (
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>{pct}%</span>
            )}
          </div>
          {/* Barra */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: tabColor,
              borderRadius: 2,
            }} />
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', flex: 1 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, lineHeight: 1.35, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: 5,
        }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.format}</span>
          {item.seasonYear && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {item.seasonYear}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ tabLabel, tabColor }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: `${tabColor}14`, border: `1px solid ${tabColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <List size={28} color={tabColor} strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600 }}>Nenhum item em "{tabLabel}"</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Adicione animes na página de detalhes.</p>
      <button
        onClick={() => navigate('/search')}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: `${tabColor}18`, border: `1px solid ${tabColor}35`,
          borderRadius: 10, padding: '10px 20px',
          color: tabColor, fontSize: 13.5, fontWeight: 600,
        }}
      >
        <Search size={15} /> Explorar
      </button>
    </div>
  );
}

/* ─── Modo lista compacta ─── */
function ListRow({ item, tabColor }) {
  const navigate = useNavigate();
  const title    = item.title?.english || item.title?.romaji || 'Sem título';
  const isAnime  = !['MANGA', 'NOVEL', 'ONE_SHOT'].includes(item.format);
  const total    = isAnime ? item.episodes : item.chapters;
  const unit     = isAnime ? 'ep' : 'cap';
  const pct      = total ? Math.min(100, Math.round((item.progress / total) * 100)) : null;
  const score    = item.averageScore ? (item.averageScore / 10).toFixed(1) : null;

  return (
    <div
      onClick={() => navigate(`/anime/${item.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        transition: 'border-color 0.15s, background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${tabColor}55`; e.currentTarget.style.background = `${tabColor}08`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      <img
        src={item.coverImage?.large}
        alt={title}
        loading="lazy"
        style={{ width: 38, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
          {title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: tabColor, fontWeight: 600 }}>
            {item.progress}/{total || '?'} {unit}s
          </span>
          {pct !== null && (
            <div style={{ flex: 1, maxWidth: 120, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: tabColor, borderRadius: 2 }} />
            </div>
          )}
        </div>
      </div>
      {score && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <Star size={10} fill="#fbbf24" color="#fbbf24" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{score}</span>
        </div>
      )}
    </div>
  );
}

export default function MyList() {
  useTitle('Minha Lista');
  const [activeTab, setActiveTab] = useState('WATCHING');
  const [search, setSearch]       = useState('');
  const [items, setItems]         = useState([]);
  const [viewMode, setViewMode]   = useState(() =>
    localStorage.getItem('nakama_list_view') || 'grid'
  );

  useEffect(() => {
    setItems(getByListStatus(activeTab));
    setSearch('');
  }, [activeTab]);

  const tab      = TABS.find(t => t.value === activeTab);
  const filtered = search
    ? items.filter(m => (m.title?.english || m.title?.romaji || '').toLowerCase().includes(search.toLowerCase()))
    : items;

  const counts = Object.fromEntries(TABS.map(t => [t.value, getByListStatus(t.value).length]));
  const total  = getAllMedia().filter(m => m.listStatus).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        padding: '36px 40px 0',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Minha Lista</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {total} {total === 1 ? 'título' : 'títulos'} salvos
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {items.length > 0 && (
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filtrar..."
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 12px 8px 30px',
                    color: 'var(--text)', fontSize: 13, outline: 'none', width: 180,
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            )}
            {/* Exportar */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <ExportMenu total={total} />
            </div>

            {/* Toggle grid/lista */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { mode: 'grid', Icon: LayoutGrid, title: 'Grade' },
                { mode: 'list', Icon: AlignJustify, title: 'Lista' },
              ].map(({ mode, Icon, title }) => (
                <button
                  key={mode}
                  title={title}
                  onClick={() => { setViewMode(mode); localStorage.setItem('nakama_list_view', mode); }}
                  style={{
                    width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: viewMode === mode ? 'var(--purple-light)' : 'var(--text-muted)',
                    background: viewMode === mode ? 'rgba(124,58,237,0.15)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', whiteSpace: 'nowrap',
                borderBottom: activeTab === t.value ? `2px solid ${t.color}` : '2px solid transparent',
                background: activeTab === t.value ? `${t.color}0d` : 'transparent',
                color: activeTab === t.value ? t.color : 'var(--text-muted)',
                fontWeight: activeTab === t.value ? 600 : 400,
                fontSize: 13.5, transition: 'all 0.15s',
                borderRadius: '8px 8px 0 0',
              }}
            >
              {t.label}
              <span style={{
                fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'center',
                background: activeTab === t.value ? `${t.color}22` : 'rgba(255,255,255,0.06)',
                color: activeTab === t.value ? t.color : 'var(--text-muted)',
                borderRadius: 10, padding: '1px 7px',
              }}>{counts[t.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid 3 colunas */}
      <div style={{ padding: '28px 40px 60px' }}>
        {items.length === 0 ? (
          <EmptyTab tabLabel={tab.label} tabColor={tab.color} />
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum resultado para "{search}".</p>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {filtered.map(item => <MediaCard key={item.id} item={item} tabColor={tab.color} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(item => <ListRow key={item.id} item={item} tabColor={tab.color} />)}
          </div>
        )}
      </div>
    </div>
  );
}
