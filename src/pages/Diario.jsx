import { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { queryAniList, SEARCH_CHARACTERS } from '../lib/anilist';
import { DIARY_ANIME_LIST, CHARACTER_DIARIES } from '../data/characterDiaries';
import { useTitle } from '../hooks/useTitle';

/*
 * Não guardamos ID nem foto fixa por personagem — só o nome exato pra
 * buscar (`anilistSearch`). Reaproveita a mesma query/cache de
 * `queryAniList` usada no resto do app (memória 5min + localStorage 1h),
 * então folhear pra frente e voltar não dispara uma chamada nova toda
 * vez. Se a busca não achar nada (ou falhar), a página não quebra — só
 * mostra um espaço em branco no lugar da foto, o texto do diário
 * continua de pé sozinho.
 */
/*
 * Hash simples e determinístico (mesma label sempre gera a mesma
 * "aleatoriedade") — sem isso, a rotação de cada artefato mudaria a
 * cada render e o efeito colado-à-mão viraria tremedeira visual.
 */
function hashNum(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rotationFor(label, spread = 8) {
  return (hashNum(label) % (spread * 2 + 1)) - spread;
}

/*
 * 7 posições fixas pros artefatos — nunca no meio da página (a altura do
 * texto varia demais de personagem pra personagem pra confiar nisso), só
 * grudadas em referências de tamanho fixo: o topo/rodapé do próprio
 * caderno (`area: 'card'`) ou a caixa da polaroide (`area: 'photo'`,
 * sempre a mesma proporção 3:4, não importa quanto texto o personagem
 * tem). Um artefato com ícone 'Quote' sempre cai no último slot (a
 * "notinha" maior, sozinha no rodapé); o resto preenche os 6 primeiros
 * na ordem em que aparece no array de `artifacts`.
 *
 * Duas armadilhas que já pegaram uma primeira versão disso (ver QA):
 * 1) `top`/`bottom` negativo faz a caixa CRESCER pra dentro do card, não
 *    só "encostar na borda" — um item de 90px de altura com `bottom: -10`
 *    invade ~80px pra cima. Por isso só a notinha (sozinha) bleeda pela
 *    borda de baixo do card, e o card ganhou um `pb-*` bem folgado como
 *    colchão pro parágrafo final nunca chegar perto dela.
 * 2) Empilhar vários artefatos de largura fixa (em px) na mesma faixa
 *    horizontal do card não escala: a soma das larguras pode passar da
 *    largura do card num celular estreito e um acaba em cima do outro —
 *    foi o que aconteceu quando 3 deles dividiam o rodapé. Por isso a
 *    maioria vive grudada na polaroide (inclusive sangrando pro lado
 *    direito dela — cabe no `gap-8` até a coluna de texto) em vez de
 *    disputar espaço na borda do card.
 */
const ARTIFACT_SLOTS = [
  { area: 'photo', variant: 'doodle',  style: { top: '38%', left: -32 } },
  { area: 'card',  variant: 'sticker', style: { top: -30, left: '4%' } },
  { area: 'card',  variant: 'tag',     style: { top: -46, right: '2%' } },
  { area: 'photo', variant: 'doodle',  style: { bottom: -14, left: -10 } },
  { area: 'photo', variant: 'sticker', style: { top: '22%', right: -28 } },
  { area: 'photo', variant: 'tag',     style: { bottom: -22, right: -26 } },
  { area: 'card',  variant: 'note',    style: { bottom: -10, left: '50%' }, center: true },
];
const NON_QUOTE_SLOT_ORDER = [0, 1, 2, 3, 4, 5];

/*
 * Recorte de foto real do material de origem (wiki oficial do anime),
 * nunca ícone de biblioteca nem texto/chip — só o `variant` do slot
 * muda o FORMATO do recorte (redondo, "rasgado", retângulo com borda
 * irregular), pra dar variedade sem inventar nada. Enquanto a imagem
 * não foi enviada (ver public/artifacts/<anime>/), ou se o arquivo
 * falhar ao carregar, mostra um cartão "aguardando foto" — nunca um
 * ícone genérico no lugar, isso é estado de obra em andamento, não
 * design final.
 */
const CUTOUT_SIZE = {
  doodle: 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]',
  sticker: 'h-24 w-24 sm:h-28 sm:w-28',
  tag: 'h-20 w-28 sm:h-24 sm:w-32',
};
const CUTOUT_SHAPE_CLASS = {
  doodle: 'diary-cutout-round',
  sticker: 'diary-cutout-torn',
  tag: 'diary-cutout-tag',
};

/** Um "artefato" solto — foto real recortada, presa numa das bordas
 * fixas do caderno (ver ARTIFACT_SLOTS). A frase de efeito (`icon:
 * 'Quote'`) é a única exceção: é texto por natureza, vira a "notinha". */
function ArtifactMark({ artifact, slot }) {
  const [broken, setBroken] = useState(false);
  const rotate = rotationFor(artifact.label, slot.variant === 'note' ? 4 : 8);
  const transform = [slot.center ? 'translateX(-50%)' : null, `rotate(${rotate}deg)`].filter(Boolean).join(' ');

  if (slot.variant === 'note') {
    return (
      <div
        className="diary-sticker absolute z-10 w-52 rounded-md p-3.5 text-base sm:w-60"
        style={{ ...slot.style, transform, fontFamily: 'var(--font-hand-title)' }}
        title={artifact.label}
      >
        {artifact.label}
      </div>
    );
  }

  const shapeClass = `absolute z-10 ${CUTOUT_SIZE[slot.variant]} ${CUTOUT_SHAPE_CLASS[slot.variant]}`;

  if (!artifact.image || broken) {
    return (
      <div
        className={`diary-artifact-pending flex items-center justify-center p-1.5 text-center text-[9px] leading-tight text-[#8a7b5c] ${shapeClass}`}
        style={{ ...slot.style, transform }}
        title={`Aguardando foto: ${artifact.label}`}
      >
        aguardando foto
      </div>
    );
  }

  return (
    <div className={shapeClass} style={{ ...slot.style, transform }} title={artifact.label}>
      <img
        src={`/artifacts/${artifact.image}`}
        alt={artifact.label}
        onError={() => setBroken(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

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

  // Distribui os artefatos nos slots fixos (ver ARTIFACT_SLOTS acima) —
  // "Quote" sempre vai pro slot 'note' (por variant, não por índice fixo,
  // pra não repetir o bug de ficar hardcoded num número que já mudou uma
  // vez quando os slots foram reordenados); o resto ocupa
  // NON_QUOTE_SLOT_ORDER na ordem em que aparece no array de `artifacts`.
  const marks = [];
  if (entry) {
    const quote = entry.artifacts.find(a => a.icon === 'Quote');
    if (quote) marks.push({ artifact: quote, slot: ARTIFACT_SLOTS.find(s => s.variant === 'note') });
    entry.artifacts
      .filter(a => a.icon !== 'Quote')
      .forEach((a, i) => {
        const slot = ARTIFACT_SLOTS[NON_QUOTE_SLOT_ORDER[i]];
        if (slot) marks.push({ artifact: a, slot });
      });
  }
  const photoMarks = marks.filter(m => m.slot.area === 'photo');
  const cardMarks  = marks.filter(m => m.slot.area === 'card');

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
          className="diary-paper diary-page-enter relative rounded-2xl p-6 pb-24 shadow-2xl sm:p-10 sm:pb-28"
        >
          <div className="diary-stain h-24 w-28" style={{ top: -20, right: 40 }} />
          <div className="diary-stain h-16 w-20" style={{ bottom: 10, left: -10 }} />
          <div className="diary-tape absolute -top-3 left-[45%] h-6 w-16 -rotate-3" />
          <div className="diary-torn-corner absolute bottom-0 right-0" />

          {/* Artefatos soltos, grudados nas bordas fixas do caderno — nunca
              no meio do texto (ver ARTIFACT_SLOTS). */}
          {cardMarks.map(({ artifact, slot }) => (
            <ArtifactMark key={artifact.label} artifact={artifact} slot={slot} />
          ))}

          <div className="relative flex flex-col gap-8 sm:flex-row">
            {/* w-44/sm:w-48 igual à polaroide (não `flex-1`) e `sm:self-start`
                pra não esticar com a altura da coluna de texto — sem isso,
                os artefatos "colados na foto" (slots 0 e 3) acabavam
                grudados na altura errada, lá embaixo do texto. */}
            <div className="relative mx-auto w-44 shrink-0 sm:mx-0 sm:w-48 sm:self-start">
              <div className="diary-tape absolute -top-3 left-8 h-6 w-16 -rotate-6" />
              <div className="diary-tape absolute -bottom-2 right-4 h-6 w-14 rotate-3" />
              <DiaryPhoto searchTerm={entry.anilistSearch} rotate={index % 2 === 0 ? -3 : 2} />
              {photoMarks.map(({ artifact, slot }) => (
                <ArtifactMark key={artifact.label} artifact={artifact} slot={slot} />
              ))}
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
