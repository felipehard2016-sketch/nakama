import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addGameToList, getUserGames, GAME_STATUS_LABELS, GAME_STATUS_ORDER } from '../lib/games';
import { upsertListEntry } from '../lib/mediaList';
import ErrorState from '../components/ui/ErrorState';
import { useTitle } from '../hooks/useTitle';

export default function Games() {
  useTitle('Jogos');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [entries, setEntries] = useState(null);
  const [error, setError]     = useState(false);
  const [title, setTitle]     = useState('');
  const [saving, setSaving]   = useState(false);

  const reload = () => {
    setError(false);
    getUserGames(user.id).then(({ data, error: err }) => {
      if (err) { setError(true); return; }
      setEntries(data);
    });
  };

  useEffect(() => {
    if (user) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const { error: addError } = await addGameToList(user.id, { title });
    setSaving(false);
    if (addError) { showToast('Não deu para adicionar.', 'error'); return; }
    setTitle('');
    reload();
  };

  const handleStatusChange = async (entry, status) => {
    const { error: updateError } = await upsertListEntry(user.id, entry.media_items.id, { status });
    if (updateError) { showToast('Não deu para atualizar o status.', 'error'); return; }
    reload();
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Jogos</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Backlog manual — busca automática via RAWG/IGDB chega quando a chave de API for configurada.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Nome do jogo…"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple to-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus size={16} /> Adicionar
        </button>
      </form>

      {error && <ErrorState message="Não deu para carregar seu backlog agora." onRetry={reload} />}

      {!error && entries === null && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      )}

      {!error && entries?.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhum jogo no backlog ainda — adicione um acima.</p>
      )}

      <div className="flex flex-col gap-2">
        {entries?.map(entry => (
          <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3">
            <p className="text-sm font-medium text-[var(--text)]">{entry.media_items.title}</p>
            <select
              value={entry.status}
              onChange={e => handleStatusChange(entry, e.target.value)}
              className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--text)] outline-none"
            >
              {GAME_STATUS_ORDER.map(s => (
                <option key={s} value={s} className="bg-[var(--bg-card)]">{GAME_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
