import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Cake, Droplet } from 'lucide-react';
import { queryAniList, CHARACTER_DETAILS } from '../lib/anilist';
import { preferredTitle } from '../lib/mediaList';
import { stripHtml } from '../lib/format';
import LazyImg from '../components/ui/LazyImg';
import { useTitle } from '../hooks/useTitle';

const ROLE_LABELS = { MAIN: 'Principal', SUPPORTING: 'Coadjuvante', BACKGROUND: 'Participação' };

export default function CharacterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useTitle(character?.name?.full);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    queryAniList(CHARACTER_DETAILS, { id: Number(id) })
      .then(data => { if (!cancelled) setCharacter(data.Character); })
      .catch(() => { if (!cancelled) setError('Não deu para carregar esse personagem agora.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple/25 border-t-purple" />
    </div>;
  }

  if (error || !character) {
    return <p className="py-10 text-center text-sm text-red-400">{error || 'Personagem não encontrado.'}</p>;
  }

  const birth = character.dateOfBirth;
  const birthLabel = birth?.month && birth?.day
    ? `${String(birth.day).padStart(2, '0')}/${String(birth.month).padStart(2, '0')}`
    : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <img
          src={character.image?.large}
          alt={character.name?.full}
          className="mx-auto h-64 w-48 shrink-0 rounded-lg object-cover shadow-lg sm:mx-0"
        />

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text)]">{character.name?.full}</h1>
          {character.name?.native && <p className="text-sm text-[var(--text-muted)]">{character.name.native}</p>}

          {character.name?.alternative?.filter(Boolean).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {character.name.alternative.filter(Boolean).map(alt => (
                <span key={alt} className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-[var(--text-secondary)]">{alt}</span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
            {character.favourites != null && (
              <span className="flex items-center gap-1"><Heart size={13} className="fill-pink-400 text-pink-400" /> {character.favourites.toLocaleString('pt-BR')}</span>
            )}
            {character.age && <span>Idade: {character.age}</span>}
            {birthLabel && <span className="flex items-center gap-1"><Cake size={13} /> {birthLabel}</span>}
            {character.bloodType && <span className="flex items-center gap-1"><Droplet size={13} /> Tipo {character.bloodType}</span>}
            {character.gender && <span className="rounded bg-white/5 px-2 py-0.5">{character.gender}</span>}
          </div>

          {character.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
              {stripHtml(character.description)}
            </p>
          )}
        </div>
      </div>

      {character.media?.edges?.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Aparições</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {character.media.edges.map(({ node, characterRole, voiceActors }) => (
              <Link key={node.id} to={`/anime/${node.id}`} className="group flex flex-col gap-1.5">
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-[var(--bg-card)]">
                  <LazyImg src={node.coverImage?.large} alt="" style={{ width: '100%', height: '100%' }} />
                </div>
                <p className="line-clamp-2 text-[12px] font-medium text-[var(--text)] group-hover:text-purple-light">
                  {preferredTitle(node.title)}
                </p>
                {characterRole && (
                  <p className="text-[10px] text-[var(--text-muted)]">{ROLE_LABELS[characterRole] || characterRole}</p>
                )}
                {voiceActors?.[0] && (
                  <p className="truncate text-[10px] text-[var(--text-muted)]">🎙️ {voiceActors[0].name?.full}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
