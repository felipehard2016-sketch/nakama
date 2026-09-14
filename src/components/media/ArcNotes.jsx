import { useEffect, useState } from 'react';
import { EyeOff, Eye, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getArcNotes, addArcNote, deleteArcNote } from '../../lib/arcNotes';

/*
 * Companion: timeline de arcos / notas de teoria ligada a um item de
 * mídia. Privada do autor (RLS em arc_notes só libera dono); is_spoiler
 * só borra o texto até o próprio autor clicar pra revelar.
 */
function NoteCard({ note, onDelete }) {
  const [revealed, setRevealed] = useState(!note.is_spoiler);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{note.arc_name}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {new Date(note.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {note.is_spoiler && (
            <button
              onClick={() => setRevealed(r => !r)}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label={revealed ? 'Esconder spoiler' : 'Revelar spoiler'}
            >
              {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
          <button onClick={() => onDelete(note.id)} className="text-[var(--text-muted)] hover:text-red-400" aria-label="Excluir nota">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <p className={`mt-2 whitespace-pre-line text-sm text-[var(--text-secondary)] ${revealed ? '' : 'select-none blur-sm'}`}>
        {revealed ? note.content : 'Spoiler oculto — clique no olho para revelar.'}
      </p>
    </div>
  );
}

export default function ArcNotes({ mediaId }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [arcName, setArcName] = useState('');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getArcNotes(user.id, mediaId).then(({ data }) => {
      setNotes(data || []);
      setLoading(false);
    });
  }, [user, mediaId]);

  if (!user) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!arcName.trim() || !content.trim()) return;
    setSaving(true);
    const { data, error } = await addArcNote(user.id, mediaId, { arcName: arcName.trim(), content: content.trim(), isSpoiler });
    setSaving(false);
    if (error) { showToast('Não deu para salvar a nota.', 'error'); return; }
    setNotes(n => [...n, data]);
    setArcName(''); setContent(''); setIsSpoiler(true); setOpen(false);
  };

  const handleDelete = async (id) => {
    setNotes(n => n.filter(x => x.id !== id));
    const { error } = await deleteArcNote(id);
    if (error) showToast('Não deu para excluir.', 'error');
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text)]">Arcos & notas de teoria</h2>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 rounded-lg bg-purple/15 px-3 py-1.5 text-xs font-medium text-purple-light hover:bg-purple/25"
        >
          <Plus size={14} /> Nova nota
        </button>
      </div>

      {open && (
        <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <input
            type="text"
            required
            placeholder="Nome do arco (ex.: Arco de Marineford)"
            value={arcName}
            onChange={e => setArcName(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
          />
          <textarea
            required
            rows={3}
            placeholder="Sua teoria, anotação ou resumo…"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="resize-y rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
          />
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" checked={isSpoiler} onChange={e => setIsSpoiler(e.target.checked)} />
            Contém spoiler
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-1 self-start rounded-lg bg-gradient-to-r from-purple to-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar nota'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Carregando notas…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nenhuma nota ainda — só você vê essa seção.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(n => <NoteCard key={n.id} note={n} onDelete={handleDelete} />)}
        </div>
      )}
    </section>
  );
}
