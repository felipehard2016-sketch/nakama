import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BUILD_GAMES, getUserBuilds, addBuild, deleteBuild } from '../lib/builds';
import { useTitle } from '../hooks/useTitle';

export default function Builds() {
  useTitle('Builds');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [builds, setBuilds]   = useState(null);
  const [game, setGame]       = useState(BUILD_GAMES[0].value);
  const [buildName, setBuildName] = useState('');
  const [skills, setSkills]   = useState('');
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);

  const reload = () => getUserBuilds(user.id).then(({ data }) => setBuilds(data || []));
  useEffect(() => {
    if (user) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!buildName.trim()) return;
    setSaving(true);
    const { error } = await addBuild(user.id, {
      game, buildName: buildName.trim(), notes: notes.trim(),
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (error) { showToast('Não deu para salvar a build.', 'error'); return; }
    setBuildName(''); setSkills(''); setNotes('');
    reload();
  };

  const handleDelete = async (id) => {
    setBuilds(b => b.filter(x => x.id !== id));
    await deleteBuild(id);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Builds</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Caderno de builds por jogo — sem árvore de passivas visual ainda, isso é a próxima etapa.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <select
          value={game}
          onChange={e => setGame(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none"
        >
          {BUILD_GAMES.map(g => <option key={g.value} value={g.value} className="bg-[var(--bg-card)]">{g.label}</option>)}
        </select>
        <input
          value={buildName}
          onChange={e => setBuildName(e.target.value)}
          placeholder="Nome da build (ex.: Minion Necro Endgame)"
          className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
        />
        <input
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="Skills/passivas principais, separadas por vírgula"
          className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
        />
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas (prioridade de itens, rotação, etc.)"
          className="resize-y rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
        />
        <button
          type="submit"
          disabled={saving}
          className="mt-1 flex items-center justify-center gap-1.5 self-start rounded-lg bg-gradient-to-r from-purple to-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Plus size={14} /> Salvar build
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {builds?.length === 0 && <p className="py-6 text-center text-sm text-[var(--text-muted)]">Nenhuma build salva ainda.</p>}
        {builds?.map(b => (
          <div key={b.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{b.build_name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{BUILD_GAMES.find(g => g.value === b.game)?.label}</p>
              </div>
              <button onClick={() => handleDelete(b.id)} className="text-[var(--text-muted)] hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
            {b.skill_tree?.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {b.skill_tree.skills.map(s => (
                  <span key={s} className="rounded-full bg-purple/15 px-2 py-0.5 text-[11px] text-purple-light">{s}</span>
                ))}
              </div>
            )}
            {b.notes && <p className="mt-2 text-xs text-[var(--text-secondary)]">{b.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
