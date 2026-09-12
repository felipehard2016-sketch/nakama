import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Cake, Droplet, Sparkles, Crown } from 'lucide-react';
import { queryAniList, CHARACTER_DETAILS } from '../lib/anilist';
import { preferredTitle } from '../lib/mediaList';
import { parseCharacterBio } from '../lib/format';
import { iconForStatLabel } from '../lib/characterIcons';
import { extractDominantColor } from '../lib/dominantColor';
import Formatted from '../components/ui/Formatted';
import LazyImg from '../components/ui/LazyImg';
import { useTitle } from '../hooks/useTitle';

const ROLE_LABELS = { MAIN: 'Principal', SUPPORTING: 'Coadjuvante', BACKGROUND: 'Participação' };
const GENDER_LABELS = { Male: 'Masculino', Female: 'Feminino', 'Non-binary': 'Não-binário' };
const DEFAULT_ACCENT = '#7c3aed'; // roxo da marca — usado se a extração de cor falhar

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
  const [accent, setAccent] = useState(DEFAULT_ACCENT);

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

  // Extrai a cor dominante do retrato — dá uma identidade visual própria
  // pra cada personagem em vez do roxo genérico de sempre. Se falhar
  // (CORS, imagem ausente, etc.), fica no roxo padrão da marca.
  useEffect(() => {
    if (!character?.image?.large) return;
    let cancelled = false;
    extractDominantColor(character.image.large).then(color => {
      if (!cancelled && color) setAccent(color);
    });
    return () => { cancelled = true; };
  }, [character?.image?.large]);

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
  const topAppearance = appearances[0];
  const isProtagonist = topAppearance?.characterRole === 'MAIN';
  const heroBanner = topAppearance?.node?.bannerImage;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8" style={{ '--char-accent': accent }}>
      {/* ── Herói: banner cinematográfico do anime mais popular dele, cor de destaque própria ── */}
      <div className="relative isolate overflow-hidden rounded-2xl bg-black">
        <div className="absolute inset-0">
          {heroBanner ? (
            <img src={heroBanner} alt="" className="h-full w-full object-cover opacity-45" />
          ) : character.image?.large ? (
            <img src={character.image.large} alt="" className="h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/60 to-[var(--char-accent)]/25" />
        </div>

        <div className="relative flex flex-col items-center gap-5 px-6 pb-7 pt-12 sm:flex-row sm:items-end sm:px-10">
          {character.image?.large && (
            <img
              src={character.image.large}
              alt={character.name?.full}
              className="h-60 w-44 shrink-0 rounded-xl object-cover ring-2 ring-[var(--char-accent)] transition-transform duration-300 hover:-rotate-2 hover:scale-105"
              style={{ boxShadow: `0 16px 48px ${accent}70` }}
            />
          )}

          <div className="flex-1 text-center sm:pb-2 sm:text-left">
            {isProtagonist && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black"
                style={{ background: accent }}>
                <Crown size={11} /> Protagonista
              </span>
            )}
            <h1 className="text-3xl font-black italic tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] sm:text-4xl">
              {character.name?.full}
            </h1>
            {character.name?.native && <p className="mt-0.5 text-sm text-white/60">{character.name.native}</p>}

            {character.name?.alternative?.filter(Boolean).length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {character.name.alternative.filter(Boolean).map(alt => (
                  <span key={alt} className="rounded-full px-2.5 py-0.5 text-[11px]" style={{ background: `${accent}30`, color: accent }}>
                    {alt}
                  </span>
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
                className="relative overflow-hidden bg-[var(--bg-card)] p-4 [clip-path:polygon(0_0,100%_0,100%_100%,4%_100%)]"
                style={{
                  borderLeft: `4px solid ${accent}`,
                  background: `linear-gradient(135deg, ${accent}25, var(--bg-card) 60%)`,
                  animation: 'fadeIn .4s ease both',
                  animationDelay: `${i * 90}ms`,
                }}
              >
                <Icon size={22} style={{ color: accent }} />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>{s.label}</p>
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
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${accent}22`, color: accent }}>
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
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>Biografia</p>
          <div className="flex flex-col gap-3">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`whitespace-pre-line leading-relaxed text-[var(--text-secondary)] ${
                  i === 0
                    ? 'text-base first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-5xl first-letter:font-black first-letter:leading-[0.8] first-letter:text-[var(--char-accent)]'
                    : 'text-sm'
                }`}
              >
                <Formatted text={p} />
              </p>
            ))}
          </div>
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
