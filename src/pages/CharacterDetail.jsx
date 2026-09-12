import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Cake, Droplet } from 'lucide-react';
import { queryAniList, CHARACTER_DETAILS } from '../lib/anilist';
import { preferredTitle } from '../lib/mediaList';
import { parseCharacterBio } from '../lib/format';
import { iconForStatLabel } from '../lib/characterIcons';
import Formatted from '../components/ui/Formatted';
import LazyImg from '../components/ui/LazyImg';
import { useTitle } from '../hooks/useTitle';

const ROLE_LABELS = { MAIN: 'Principal', SUPPORTING: 'Coadjuvante', BACKGROUND: 'Participação' };
const GENDER_LABELS = { Male: 'Masculino', Female: 'Feminino', 'Non-binary': 'Não-binário' };

function StatChip({ icon: Icon, children }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--text-secondary)]">
      {Icon && <Icon size={12} />} {children}
    </span>
  );
}

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

  const { stats, paragraphs } = parseCharacterBio(character.description);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      {/* Faixa com glow de marca atrás do cabeçalho — mesma linguagem visual do resto do app */}
      <div className="relative overflow-hidden rounded-2xl border border-purple/20 bg-gradient-to-br from-purple/15 via-[var(--bg-card)] to-blue/10 p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <img
            src={character.image?.large}
            alt={character.name?.full}
            className="mx-auto h-56 w-40 shrink-0 rounded-xl object-cover shadow-[0_8px_32px_rgba(124,58,237,0.35)] sm:mx-0"
          />

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text)]">{character.name?.full}</h1>
            {character.name?.native && <p className="text-sm text-[var(--text-muted)]">{character.name.native}</p>}

            {character.name?.alternative?.filter(Boolean).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {character.name.alternative.filter(Boolean).map(alt => (
                  <span key={alt} className="rounded-full bg-purple/15 px-2.5 py-0.5 text-[11px] text-purple-light">{alt}</span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {character.favourites != null && (
                <StatChip icon={Heart}>{character.favourites.toLocaleString('pt-BR')} favoritos</StatChip>
              )}
              {character.age && <StatChip>Idade: {character.age}</StatChip>}
              {birthLabel && <StatChip icon={Cake}>{birthLabel}</StatChip>}
              {character.bloodType && <StatChip icon={Droplet}>Tipo {character.bloodType}</StatChip>}
              {character.gender && <StatChip>{GENDER_LABELS[character.gender] || character.gender}</StatChip>}
            </div>
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:grid-cols-3">
          {stats.map(s => {
            const Icon = iconForStatLabel(s.label);
            return (
              <div key={s.label} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple/15 text-purple-light">
                  {Icon ? <Icon size={14} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{s.label}</dt>
                  <dd className="mt-0.5 text-xs text-[var(--text)]"><Formatted text={s.value} /></dd>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {paragraphs.length > 0 && (
        <div className="flex flex-col gap-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
              <Formatted text={p} />
            </p>
          ))}
        </div>
      )}

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
