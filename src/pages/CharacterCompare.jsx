import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchCharacters } from '../lib/characters';
import { useTitle } from '../hooks/useTitle';

function CharacterPicker({ label, onPick, initialTerm = '' }) {
  const [term, setTerm]       = useState(initialTerm);
  const [results, setResults] = useState([]);
  const [picked, setPicked]   = useState(null);

  useEffect(() => {
    if (!term.trim()) { setResults([]); return; }
    const t = setTimeout(() => searchCharacters(term).then(setResults), 300);
    return () => clearTimeout(t);
  }, [term]);

  // Auto-seleciona se vier de um link com nome exato (ex.: da página de anime).
  useEffect(() => {
    if (!initialTerm) return;
    searchCharacters(initialTerm).then(res => {
      setResults(res);
      if (res[0]) { setPicked(res[0]); onPick(res[0]); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTerm]);

  if (picked) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        {picked.image_url && <img src={picked.image_url} alt="" className="h-32 w-24 rounded-lg object-cover" />}
        <div className="text-center">
          <p className="font-semibold text-[var(--text)]">{picked.name}</p>
          {picked.source_title && <p className="text-xs text-[var(--text-muted)]">{picked.source_title}</p>}
        </div>
        <div className="flex gap-2 text-xs">
          {picked.mbti && <span className="rounded-full bg-purple/15 px-2.5 py-1 text-purple-light">{picked.mbti}</span>}
          {picked.enneagram && <span className="rounded-full bg-blue/15 px-2.5 py-1 text-blue-light">Eneagrama {picked.enneagram}</span>}
        </div>
        <button onClick={() => { setPicked(null); setTerm(''); }} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <input
        type="text"
        value={term}
        onChange={e => setTerm(e.target.value)}
        placeholder="Nome do personagem…"
        className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-purple"
      />
      {results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map(c => (
            <li key={c.id}>
              <button
                onClick={() => { setPicked(c); onPick(c); }}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text)]"
              >
                {c.name} {c.source_title && <span className="text-[var(--text-muted)]">· {c.source_title}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {term.trim() && results.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">Nada encontrado — o dataset de personagens ainda pode estar sendo importado.</p>
      )}
    </div>
  );
}

export default function CharacterCompare() {
  useTitle('Comparador de Personagens');
  const [params] = useSearchParams();
  const initialName = params.get('nome') || '';

  const [a, setA] = useState(null);
  const [b, setB] = useState(null);

  const match = a && b && a.mbti && a.mbti === b.mbti;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Comparador de Personagens</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Compare MBTI e eneagrama entre dois personagens.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CharacterPicker label="Personagem A" onPick={setA} initialTerm={initialName} />
        <CharacterPicker label="Personagem B" onPick={setB} />
      </div>

      {a && b && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-center">
          {match ? (
            <p className="text-sm text-purple-light">✨ Mesmo tipo MBTI: {a.mbti}!</p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              {a.name} ({a.mbti || '?'}) vs {b.name} ({b.mbti || '?'})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
