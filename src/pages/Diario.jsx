import { useEffect, useState } from 'react';
import {
  BookOpen, ChevronLeft, ChevronRight,
  Crown, Sparkles, Bandage, Wine, Quote, Shield, Orbit, Flame, Shirt, Swords, Feather, Brush,
  Sword, Wand2, Palette, Compass, Citrus, Banknote, Target, Drama, Star, Flag, Cigarette,
  Heart, Footprints,
} from 'lucide-react';
import { queryAniList, SEARCH_CHARACTERS } from '../lib/anilist';
import { DIARY_ANIME_LIST, CHARACTER_DIARIES } from '../data/characterDiaries';
import { useTitle } from '../hooks/useTitle';

const ARTIFACT_ICONS = {
  Crown, Sparkles, Bandage, Wine, Quote, Shield, Orbit, Flame, Shirt, Swords, Feather, Brush,
  Sword, Wand2, Palette, Compass, Citrus, Banknote, Target, Drama, Star, Flag, Cigarette,
  Heart, Footprints,
};

/*
 * Não guardamos ID nem foto fixa por personagem — só o nome exato pra
 * buscar (`anilistSearch`). Reaproveita a mesma query/cache de
 * `queryAniList` usada no resto do app (memória 5min + localStorage 1h),
 * então folhear pra frente e voltar não dispara uma chamada nova toda
 * vez. Se a busca não achar nada (ou falhar), a página não quebra — só
 * mostra um espaço em branco no lugar da foto, o texto do diário
 * continua de pé sozinho.
 */
function DiaryPhoto({ searchTerm, rotate }) {
  const [state, setState] = useState({ status: 'loading', url: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', url: null });
    queryAniList(SEARCH_CHARACTERS, { search: searchTerm, page: 1, perPage: 1 })
      .then(data => {
        if (cancelled) return;
        const url = data?.Page?.characters?.[0]?.image?.large;
        setState(url ? { status: 'ok', url } : { status: 'empty', url: null });
      })
      .catch(() => { if (!cancelled) setState({ status: 'error', url: null }); });
    return () => { cancelled = true; };
  }, [searchTerm]);

  return (
    <div className="diary-polaroid mx-auto w-44 shrink-0 sm:mx-0 sm:w-48" style={{ transform: `rotate(${rotate}deg)` }}>
      <div className="aspect-[3/4] w-full overflow-hidden bg-[#e7dcc4]">
        {state.status === 'ok' && <img src={state.url} alt="" className="h-full w-full object-cover" />}
        {state.status === 'loading' && <div className="skeleton h-full w-full" />}
        {(state.status === 'error' || state.status === 'empty') && (
          <div className="flex h-full w-full items-center justify-center text-[#8a7b5c]">
            <BookOpen size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Diario() {
  useTitle('Diário de Personagens');
  const [animeSlug, setAnimeSlug] = useState('one-piece');
  const [index, setIndex] = useState(0);

  const anime      = DIARY_ANIME_LIST.find(a => a.slug === animeSlug);
  const characters = CHARACTER_DIARIES[animeSlug] || [];
  const entry      = characters[index];

  function selectAnime(slug) {
    setAnimeSlug(slug);
    setIndex(0);
  }

  function goTo(i) {
    if (!characters.length) return;
    setIndex((i + characters.length) % characters.length);
  }

  const featuredArtifact = entry?.artifacts?.find(a => a.icon === 'Quote');
  const otherArtifacts   = entry?.artifacts?.filter(a => a.icon !== 'Quote') || [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text)]">
          <BookOpen size={22} className="text-purple-light" /> Diário de Personagens
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Um caderno pessoal dos protagonistas mais icônicos do anime — na voz deles, não numa ficha técnica.
          Em construção: 10 animes, 5 personagens cada, escritos aos poucos.
        </p>
      </div>

      {/* ── Prateleira de animes ── */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {DIARY_ANIME_LIST.map(a => {
          const count  = (CHARACTER_DIARIES[a.slug] || []).length;
          const active = a.slug === animeSlug;
          return (
            <button
              key={a.slug}
              onClick={() => selectAnime(a.slug)}
              className={`flex shrink-0 items-center gap-2 rounded-t-md border-b-[3px] px-3.5 py-2 text-xs font-medium transition-colors ${
                active ? 'bg-[var(--bg-card)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
              style={{ borderColor: active ? a.accent : 'transparent' }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.accent }} />
              {a.title}
              <span className="text-[10px] text-[var(--text-muted)]">{count > 0 ? `${count}/5` : 'em breve'}</span>
            </button>
          );
        })}
      </div>

      {/* ── O caderno em si ── */}
      {!entry ? (
        <div className="diary-paper relative overflow-hidden rounded-2xl p-10 text-center">
          <div className="diary-stain h-20 w-24" style={{ top: -10, left: 30 }} />
          <p className="relative text-lg" style={{ fontFamily: 'var(--font-hand)' }}>
            Ainda não escrevi as páginas de {anime.title} — em breve.
          </p>
        </div>
      ) : (
        <div
          key={`${animeSlug}-${index}`}
          className="diary-paper diary-page-enter relative overflow-hidden rounded-2xl p-6 shadow-2xl sm:p-10"
        >
          <div className="diary-stain h-24 w-28" style={{ top: -20, right: 40 }} />
          <div className="diary-stain h-16 w-20" style={{ bottom: 10, left: -10 }} />

          <div className="relative flex flex-col gap-8 sm:flex-row">
            <div className="relative">
              <div className="diary-tape absolute -top-3 left-8 h-6 w-16 -rotate-6" />
              <div className="diary-tape absolute -bottom-2 right-4 h-6 w-14 rotate-3" />
              <DiaryPhoto searchTerm={entry.anilistSearch} rotate={index % 2 === 0 ? -3 : 2} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a6f4a]">{anime.title}</p>
              <h2 className="text-4xl leading-none" style={{ fontFamily: 'var(--font-hand-title)' }}>{entry.name}</h2>
              <p className="mt-1 text-sm text-[#6b5a42]">{entry.role}</p>

              <div className="diary-lines mt-5 flex flex-col gap-3 text-[15px] leading-7" style={{ fontFamily: 'var(--font-hand)' }}>
                {entry.entry.trim().split('\n\n').map((p, i) => <p key={i}>{p.trim()}</p>)}
              </div>
            </div>
          </div>

          {featuredArtifact && (
            <div
              className="diary-sticker relative mt-6 max-w-sm rounded-md p-4 text-lg"
              style={{ fontFamily: 'var(--font-hand-title)', transform: 'rotate(-1.5deg)' }}
            >
              {featuredArtifact.label}
            </div>
          )}

          {otherArtifacts.length > 0 && (
            <div className="relative mt-6 flex flex-wrap gap-3">
              {otherArtifacts.map((a, i) => {
                const Icon = ARTIFACT_ICONS[a.icon] || Sparkles;
                return (
                  <div
                    key={a.label}
                    className="diary-sticker flex items-center gap-2 rounded-md px-3 py-2 text-xs"
                    style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 2}deg)` }}
                  >
                    <Icon size={14} className="shrink-0 text-[#6b5a42]" />
                    <span>{a.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Folhear: anterior / próximo ── */}
      {characters.length > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Personagem anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] hover:bg-[var(--bg-card-hover)]"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {index + 1} / {characters.length} · {anime.title}
          </span>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Próximo personagem"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] hover:bg-[var(--bg-card-hover)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
