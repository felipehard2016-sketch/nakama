import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserList, STATUS_LABELS, STATUS_ORDER } from '../lib/mediaList';
import { useTitle } from '../hooks/useTitle';
import MediaCard from '../components/ui/MediaCard';

// Mesmo corte usado nos chips de passo do mockup aprovado — reaproveitado
// aqui nos filtros de status.
const FILTER_CUT = 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)';

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ clipPath: FILTER_CUT }}
      className={`border px-3.5 py-1.5 font-mono text-xs font-medium transition-colors ${
        active
          ? 'border-[var(--edge-after,var(--border))] bg-purple/20 text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );
}

export default function MyList() {
  useTitle('Minha Lista');
  const { user } = useAuth();
  const [entries, setEntries] = useState(null);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    if (!user) return;
    getUserList(user.id).then(({ data }) => setEntries(data || []));
  }, [user]);

  const filtered = entries?.filter(e => filter === 'all' || e.status === filter) ?? [];

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = entries?.filter(e => e.status === s).length ?? 0;
    return acc;
  }, {});

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Minha Lista</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{entries?.length ?? 0} itens</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          Tudo ({entries?.length ?? 0})
        </FilterChip>
        {STATUS_ORDER.map(s => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]} ({counts[s]})
          </FilterChip>
        ))}
      </div>

      {entries === null && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      )}

      {entries?.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Sua lista está vazia — <Link to="/buscar" className="text-purple-light hover:underline">busque algo</Link> pra adicionar.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map(entry => {
            const m = entry.media_items;
            return (
              <MediaCard
                key={entry.id}
                media={{
                  id: m.external_id,
                  title: { romaji: m.title },
                  coverImage: { large: m.cover_url },
                  averageScore: entry.rating != null ? entry.rating * 10 : null,
                }}
                subtitle={`${STATUS_LABELS[entry.status]} · ep. ${entry.progress}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
