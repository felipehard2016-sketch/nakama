import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Cake, Droplet, Sparkles } from 'lucide-react';
import { queryAniList, CHARACTER_DETAILS } from '../lib/anilist';
import { preferredTitle } from '../lib/mediaList';
import { parseCharacterBio } from '../lib/format';
import { iconForStatLabel } from '../lib/characterIcons';
import Formatted from '../components/ui/Formatted';
import LazyImg from '../components/ui/LazyImg';
import { useTitle } from '../hooks/useTitle';

const ROLE_LABELS = { MAIN: 'Principal', SUPPORTING: 'Coadjuvante', BACKGROUND: 'Participação' };
const GENDER_LABELS = { Male: 'Masculino', Female: 'Feminino', 'Non-binary': 'Não-binário' };

// Ordem de prioridade pra escolher os 3 traços em destaque — poder/fruta
// primeiro (o mais "marcante" na maioria das obras), depois arma, depois
// recompensa/item de assinatura. O resto da ficha some pro grid comum.
const HIGHLIGHT_PRIORITY = [
  /devil fruit|quirk|\bnen\b|bankai|\bstand\b|jutsu|technique|ability|power|magic/i,
  /weapon|sword|blade|katana|zanpakut/i,
  /bounty|reward|wanted|signature|artifact|relic/i,
];

function pickHighlights(stats) {
  const picked = [];
  for (const re of HIGHLIGHT_PRIORITY) {
    const found = stats.find(s => re.test(s.label) && !picked.includes(s));
    if (found) picked.push(found);
  }
  for (const s of stats) {
    if (picked.length >= 3) break;
    if (!picked.includes(s)) picked.push(s);
  }
  return picked.slice(0, 3);
}

// Posições/rotações fixas pras capas "espalhadas" no fundo do herói —
// só decorativas, escondidas em telas pequenas pra não poluir o mobile.
const SCATTER_STYLE = [
  { className: 'left-[6%] top-[8%] h-24 w-16 rotate-[-10deg]' },
  { className: 'right-[10%] top-[14%] h-28 w-20 rotate-[8deg]' },
  { className: 'right-[24%] bottom-[6%] h-20 w-14 rotate-[-6deg]' },
];

function StatChip({ icon: Icon, children }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
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
  const highlights = pickHighlights(stats);
  const restStats = stats.filter(s => !highlights.includes(s));
  const appearances = character.media?.edges || [];
  const scatterCovers = appearances.map(e => e.node.coverImage?.large).filter(Boolean).slice(0, 3);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      {/* ── Herói: capas de outras obras espalhadas + retrato borrado no fundo ── */}
      <div className="relative isolate overflow-hidden rounded-2xl bg-black">
        <div className="absolute inset-0">
          {character.image?.large && (
            <img src={character.image.large} alt="" className="h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-purple/20" />
          {scatterCovers.map((cover, i) => (
            <img
              key={cover}
              src={cover}
              alt=""
              className={`absolute hidden rounded-lg object-cover opacity-30 shadow-2xl ring-1 ring-white/10 sm:block ${SCATTER_STYLE[i].className}`}
            />
          ))}
        </div>

        <div className="relative flex flex-col items-center gap-5 px-6 pb-7 pt-12 sm:flex-row sm:items-end sm:px-10">
          {character.image?.large && (
            <img
              src={character.image.large}
              alt={character.name?.full}
              className="h-60 w-44 shrink-0 rounded-xl object-cover shadow-[0_16px_48px_rgba(0,0,0,0.6)] ring-2 ring-purple/50 transition-transform duration-300 hover:-rotate-2 hover:scale-105"
            />
          )}

          <div className="flex-1 text-center sm:pb-2 sm:text-left">
            <h1 className="text-3xl font-black italic tracking-tight text-white drop-shadow-[0_2px_12px_rgba(124,58,237,0.6)] sm:text-4xl">
              {character.name?.full}
            </h1>
            {character.name?.native && <p className="mt-0.5 text-sm text-white/60">{character.name.native}</p>}

            {character.name?.alternative?.filter(Boolean).length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {character.name.alternative.filter(Boolean).map(alt => (
                  <span key={alt} className="rounded-full bg-purple/25 px-2.5 py-0.5 text-[11px] text-purple-light">{alt}</span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {character.favourites != null && (
                <StatChip icon={Heart}>{character.favourites.toLocaleString('pt-BR')}</StatChip>
              )}
              {character.age && <StatChip>Idade: {character.age}</StatChip>}
              {birthLabel && <StatChip icon={Cake}>{birthLabel}</StatChip>}
              {character.bloodType && <StatChip icon={Droplet}>Tipo {character.bloodType}</StatChip>}
              {character.gender && <StatChip>{GENDER_LABELS[character.gender] || character.gender}</StatChip>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Traços marcantes: os campos mais icônicos da bio, em destaque ── */}
      {highlights.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {highlights.map((s, i) => {
            const Icon = iconForStatLabel(s.label) || Sparkles;
            return (
              <div
                key={s.label}
                className="relative overflow-hidden border-l-4 border-purple bg-gradient-to-br from-purple/25 via-[var(--bg-card)] to-blue/10 p-4 [clip-path:polygon(0_0,100%_0,100%_100%,4%_100%)]"
                style={{ animation: 'fadeIn .4s ease both', animationDelay: `${i * 90}ms` }}
              >
                <Icon size={22} className="text-purple-light" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-purple-light">{s.label}</p>
                <p className="text-sm font-semibold leading-snug text-white"><Formatted text={s.value} /></p>
              </div>
            );
          })}
        </div>
      )}

      {restStats.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:grid-cols-3">
          {restStats.map(s => {
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

      {appearances.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Aparições</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {appearances.map(({ node, characterRole, voiceActors }) => (
              <Link
                key={node.id}
                to={`/anime/${node.id}`}
                className="group flex flex-col gap-1.5 transition-transform duration-200 hover:-translate-y-1 hover:rotate-1"
              >
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-[var(--bg-card)] shadow-lg">
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
