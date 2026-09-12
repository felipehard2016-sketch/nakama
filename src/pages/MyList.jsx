import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserList, STATUS_LABELS, STATUS_ORDER } from '../lib/mediaList';
import { useTitle } from '../hooks/useTitle';

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
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium ${filter === 'all' ? 'bg-purple/20 text-[var(--text)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}
        >
          Tudo ({entries?.length ?? 0})
        </button>
        {STATUS_ORDER.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium ${filter === s ? 'bg-purple/20 text-[var(--text)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}
          >
            {STATUS_LABELS[s]} ({counts[s]})
          </button>
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
              <Link key={entry.id} to={`/anime/${m.external_id}`} className="group flex flex-col gap-2">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[var(--bg-card)]">
                  <img src={m.cover_url} alt="" className="h-full w-full object-cover" />
                  {entry.rating != null && (
                    <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" /> {entry.rating}
                    </div>
                  )}
                </div>
                <p className="line-clamp-2 text-[13px] font-medium text-[var(--text)] group-hover:text-purple-light">{m.title}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{STATUS_LABELS[entry.status]} · ep. {entry.progress}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
