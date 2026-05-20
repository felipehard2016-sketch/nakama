import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { queryAniList, CHARACTER_DETAILS } from '../lib/anilist';
import { getCharacterVotes, voteCharacterPersonality, lookupCharacterCatalog } from '../lib/personality';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Heart, User, Droplets, CalendarDays,
  Sparkles, ChevronDown,
} from 'lucide-react';

/* ─── Constantes ─────────────────────────────── */
const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
];

const MBTI_COLORS = {
  INTJ:'#7c3aed', INTP:'#6d28d9', ENTJ:'#4f46e5', ENTP:'#2563eb',
  INFJ:'#0891b2', INFP:'#0d9488', ENFJ:'#059669', ENFP:'#65a30d',
  ISTJ:'#ca8a04', ISFJ:'#d97706', ESTJ:'#dc2626', ESFJ:'#db2777',
  ISTP:'#9333ea', ISFP:'#7c3aed', ESTP:'#f97316', ESFP:'#eab308',
};

const MBTI_DESC = {
  INTJ:'Estrategista',  INTP:'Lógico',       ENTJ:'Comandante',   ENTP:'Debatedor',
  INFJ:'Advogado',      INFP:'Mediador',      ENFJ:'Protagonista', ENFP:'Ativista',
  ISTJ:'Logístico',     ISFJ:'Defensor',      ESTJ:'Executivo',    ESFJ:'Cônsul',
  ISTP:'Virtuoso',      ISFP:'Aventureiro',   ESTP:'Empreendedor', ESFP:'Animador',
};

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function getZodiac(month, day) {
  if (!month || !day) return null;
  const m = month, d = day;
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return '♈ Áries';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return '♉ Touro';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return '♊ Gêmeos';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return '♋ Câncer';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return '♌ Leão';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return '♍ Virgem';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return '♎ Libra';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return '♏ Escorpião';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return '♐ Sagitário';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return '♑ Capricórnio';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return '♒ Aquário';
  return '♓ Peixes';
}

/* ─── Componentes auxiliares ─────────────────── */
function InfoPill({ label, value, accent }) {
  if (!value) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: accent || 'var(--text)' }}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
      {Icon && <Icon size={17} color="var(--purple-light)" />}
      <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{children}</h2>
    </div>
  );
}

function TopBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{value} voto{value !== 1 ? 's' : ''} · {pct}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────── */
export default function CharacterDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [char,         setChar]         = useState(null);
  const [votes,        setVotes]        = useState({ mbtiTally: {}, enneagramTally: {}, myVote: null });
  const [catalogEntry, setCatalogEntry] = useState(undefined); // undefined=carregando, null=não encontrado
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [expanded,     setExpanded]     = useState(false);

  /* voto do usuário */
  const [selectedMbti,       setSelectedMbti]       = useState('');
  const [selectedEnneagram,  setSelectedEnneagram]  = useState('');
  const [voting,             setVoting]             = useState(false);
  const [voteSaved,          setVoteSaved]          = useState(false);

  /* carrega dados */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setCatalogEntry(undefined);

    async function load() {
      try {
        const data = await queryAniList(CHARACTER_DETAILS, { id: Number(id) });
        if (!alive) return;
        const character = data.Character;
        setChar(character);

        // Busca paralela: votos da comunidade + catálogo CSV
        const animeNames = (character.media?.edges || []).flatMap(e => [
          e.node?.title?.romaji,
          e.node?.title?.english,
        ]).filter(Boolean);

        const [v, catalog] = await Promise.all([
          getCharacterVotes(character.id, user?.id),
          lookupCharacterCatalog(character.name.full, animeNames),
        ]);

        if (!alive) return;
        setVotes(v);
        setCatalogEntry(catalog ?? null); // null = não encontrado

        // Pré-preenche o formulário de voto: prioriza voto existente, depois catálogo
        if (v.myVote) {
          setSelectedMbti(v.myVote.mbti || '');
          setSelectedEnneagram(v.myVote.enneagram || '');
        } else if (catalog) {
          setSelectedMbti(catalog.mbti || '');
          setSelectedEnneagram(catalog.enneagram || '');
        }
      } catch (e) {
        console.error('CharacterDetail:', e);
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id, user?.id]);

  /* calcula dados derivados */
  const info = useMemo(() => {
    if (!char) return {};
    const dob = char.dateOfBirth;
    const birthday = dob?.month
      ? `${dob.day ? dob.day + ' de ' : ''}${MONTH_NAMES[(dob.month || 1) - 1]}${dob.year ? ' de ' + dob.year : ''}`
      : null;
    const zodiac = dob?.month ? getZodiac(dob.month, dob.day) : null;

    /* voz principal japonesa (pega o VA do primeiro edge que tiver) */
    const vaEdge = char.media?.edges?.find(e => e.voiceActors?.length > 0);
    const va     = vaEdge?.voiceActors?.[0] || null;

    /* todas as mídias sem duplicatas */
    const seenIds = new Set();
    const mediaList = (char.media?.edges || [])
      .map(e => e.node)
      .filter(n => { if (seenIds.has(n.id)) return false; seenIds.add(n.id); return true; });

    /* bio */
    const desc = char.description?.replace(/~![\s\S]*?!~/g, '[spoiler]').trim() || '';
    const shortDesc = desc.slice(0, 500);
    const needsExpand = desc.length > 500;

    /* top mbti */
    const mbtiEntries = Object.entries(votes.mbtiTally).sort((a, b) => b[1] - a[1]);
    const totalMbtiVotes = mbtiEntries.reduce((s, [, v]) => s + v, 0);
    const enneagramEntries = Object.entries(votes.enneagramTally).sort((a, b) => b[1] - a[1]);
    const totalEnnVotes = enneagramEntries.reduce((s, [, v]) => s + v, 0);

    return { birthday, zodiac, va, mediaList, desc, shortDesc, needsExpand,
             mbtiEntries, totalMbtiVotes, enneagramEntries, totalEnnVotes };
  }, [char, votes]);

  const handleVote = async () => {
    if (!user) { alert('Faça login para votar.'); return; }
    if (!selectedMbti && !selectedEnneagram) { alert('Selecione pelo menos MBTI ou Eneagrama.'); return; }
    setVoting(true);
    try {
      await voteCharacterPersonality(char.id, user.id, { mbti: selectedMbti || null, enneagram: selectedEnneagram || null });
      const v = await getCharacterVotes(char.id, user.id);
      setVotes(v);
      setVoteSaved(true);
      setTimeout(() => setVoteSaved(false), 2500);
    } catch (e) {
      console.error('Voto falhou:', e);
      alert('Erro ao salvar voto. Tente novamente.');
    } finally {
      setVoting(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(124,58,237,0.3)', borderTop: '3px solid var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  /* ── Erro ── */
  if (error || !char) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
        {error ? `Erro: ${error}` : 'Personagem não encontrado.'}
      </p>
      <button onClick={() => navigate(-1)} style={{ color: 'var(--purple-light)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={16} /> Voltar
      </button>
    </div>
  );

  const topMbti       = info.mbtiEntries?.[0];
  const topEnneagram  = info.enneagramEntries?.[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', animation: 'fadeIn 0.35s ease' }}>

      {/* ── Cabeçalho hero ── */}
      <div style={{ position: 'relative', minHeight: 320, background: 'linear-gradient(135deg,#1a0533 0%,#0f172a 60%,#0a0a0f 100%)', overflow: 'hidden' }}>
        {/* glow de fundo */}
        <div style={{ position: 'absolute', top: -60, left: -60, width: 350, height: 350, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(79,70,229,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* botão voltar */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 20, left: 20, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 14px',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} /> Voltar
        </button>

        {/* Conteúdo do hero */}
        <div style={{ display: 'flex', gap: 36, padding: '56px 40px 40px', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>

          {/* Foto grande */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 180, height: 240, borderRadius: 16, overflow: 'hidden',
              border: '3px solid rgba(124,58,237,0.5)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.2)',
              background: 'var(--bg-card)',
            }}>
              {char.image?.large ? (
                <img src={char.image.large} alt={char.name.full}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={48} color="rgba(255,255,255,0.2)" />
                </div>
              )}
            </div>
          </div>

          {/* Nomes + chips */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            {char.name.native && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.05em' }}>
                {char.name.native}
              </p>
            )}
            <h1 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 10 }}>
              {char.name.full}
            </h1>
            {char.name.alternative?.filter(Boolean).length > 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
                Também conhecido como: {char.name.alternative.filter(Boolean).join(', ')}
              </p>
            )}

            {/* ── Chips de personalidade ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {/* Catálogo CSV — fonte mais confiável */}
              {catalogEntry?.mbti && (
                <span style={{
                  background: `${MBTI_COLORS[catalogEntry.mbti] || 'var(--purple)'}22`,
                  border: `1px solid ${MBTI_COLORS[catalogEntry.mbti] || 'var(--purple)'}66`,
                  color: MBTI_COLORS[catalogEntry.mbti] || 'var(--purple-light)',
                  borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {catalogEntry.mbti}
                  <span style={{ opacity: 0.75, fontWeight: 500 }}>· {MBTI_DESC[catalogEntry.mbti] || ''}</span>
                </span>
              )}
              {catalogEntry?.enneagram && (
                <span style={{
                  background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)',
                  color: '#fbbf24', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 800,
                }}>
                  {catalogEntry.enneagram}
                </span>
              )}
              {/* Se não está no catálogo e tem votos da comunidade, mostra o top */}
              {!catalogEntry && topMbti && (
                <span style={{
                  background: `${MBTI_COLORS[topMbti[0]] || 'var(--purple)'}18`,
                  border: `1px solid ${MBTI_COLORS[topMbti[0]] || 'var(--purple)'}44`,
                  color: MBTI_COLORS[topMbti[0]] || 'var(--purple-light)',
                  borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700,
                }}>
                  {topMbti[0]} · {MBTI_DESC[topMbti[0]] || ''}
                </span>
              )}
              {!catalogEntry && topEnneagram && (
                <span style={{
                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                  color: '#fbbf24', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700,
                }}>
                  Eneagrama {topEnneagram[0]}
                </span>
              )}
              {/* Não catalogado */}
              {catalogEntry === null && !topMbti && (
                <span style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-muted)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 500,
                }}>
                  Não catalogado
                </span>
              )}
              {char.favourites > 0 && (
                <span style={{
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Heart size={11} fill="#f87171" /> {char.favourites.toLocaleString()} favoritos
                </span>
              )}
            </div>

            {/* pills de info */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {char.gender     && <InfoPill label="Gênero"      value={char.gender}        />}
              {char.age        && <InfoPill label="Idade"       value={char.age}           />}
              {info.birthday   && <InfoPill label="Aniversário" value={info.birthday} icon={CalendarDays} />}
              {info.zodiac     && <InfoPill label="Signo"       value={info.zodiac}  accent="var(--purple-light)" />}
              {char.bloodType  && <InfoPill label="Tipo sanguíneo" value={char.bloodType} icon={Droplets} />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 36 }}>

          {/* Coluna esquerda */}
          <div>

            {/* ── Biografia ── */}
            {info.desc && (
              <section style={{ marginBottom: 40 }}>
                <SectionTitle icon={User}>Biografia</SectionTitle>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                    {expanded ? info.desc : info.shortDesc}
                    {info.needsExpand && !expanded && '…'}
                  </p>
                  {info.needsExpand && (
                    <button
                      onClick={() => setExpanded(e => !e)}
                      style={{ marginTop: 12, fontSize: 13, color: 'var(--purple-light)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                    >
                      {expanded ? 'Ver menos' : 'Ver mais'} <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* ── Seiyuu ── */}
            {info.va && (
              <section style={{ marginBottom: 40 }}>
                <SectionTitle>Seiyuu (Dublador Japonês)</SectionTitle>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '16px 20px',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    border: '2px solid rgba(124,58,237,0.4)',
                    background: 'var(--bg)',
                  }}>
                    {info.va.image?.large ? (
                      <img src={info.va.image.large} alt={info.va.name.full}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} color="rgba(255,255,255,0.2)" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>{info.va.name.full}</p>
                    {info.va.name.native && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{info.va.name.native}</p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--purple-light)', marginTop: 4, fontWeight: 600 }}>japonês</p>
                  </div>
                </div>
              </section>
            )}

            {/* ── Aparições ── */}
            {info.mediaList?.length > 0 && (
              <section>
                <SectionTitle>Aparições em Animes / Mangás</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
                  {info.mediaList.slice(0, 16).map(m => (
                    <Link key={m.id} to={`/anime/${m.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                      >
                        <div style={{ aspectRatio: '3/4', overflow: 'hidden' }}>
                          {m.coverImage?.large ? (
                            <img src={m.coverImage.large} alt={m.title.romaji}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'var(--bg)' }} />
                          )}
                        </div>
                        <div style={{ padding: '6px 7px 8px' }}>
                          <p style={{
                            fontSize: 10.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {m.title.romaji || m.title.english}
                          </p>
                          <p style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 3 }}>
                            {m.type === 'ANIME' ? '🎬 Anime' : '📖 Mangá'} · {m.format}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Coluna direita — catálogo + votos */}
          <div>

            {/* ── Card do catálogo CSV ── */}
            <section style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Sparkles size={15} color="var(--purple-light)" />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Personalidade</span>
                <span style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em',
                  background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                  color: 'var(--purple-light)', borderRadius: 4, padding: '2px 7px',
                }}>DATASET</span>
              </div>

              {/* Ainda carregando */}
              {catalogEntry === undefined && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px' }}>
                  <div style={{ height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 6, width: '60%', marginBottom: 10 }} />
                  <div style={{ height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 6, width: '40%' }} />
                </div>
              )}

              {/* Encontrado no catálogo */}
              {catalogEntry && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.05))',
                  border: '1px solid rgba(124,58,237,0.35)',
                  borderRadius: 14, padding: '18px 18px',
                }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    {/* MBTI */}
                    {catalogEntry.mbti && (
                      <div style={{
                        flex: 1, background: `${MBTI_COLORS[catalogEntry.mbti] || '#7c3aed'}18`,
                        border: `1px solid ${MBTI_COLORS[catalogEntry.mbti] || '#7c3aed'}44`,
                        borderRadius: 10, padding: '12px 10px', textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 20, fontWeight: 900, color: MBTI_COLORS[catalogEntry.mbti] || 'var(--purple-light)', marginBottom: 3 }}>
                          {catalogEntry.mbti}
                        </p>
                        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {MBTI_DESC[catalogEntry.mbti] || ''}
                        </p>
                      </div>
                    )}
                    {/* Eneagrama */}
                    {catalogEntry.enneagram && (
                      <div style={{
                        flex: 1, background: 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.3)',
                        borderRadius: 10, padding: '12px 10px', textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', marginBottom: 3 }}>
                          {catalogEntry.enneagram}
                        </p>
                        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>Eneagrama</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                    <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                      Fonte: dataset de 5.159 personagens
                      {catalogEntry.anime_name && ` · ${catalogEntry.anime_name}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Não encontrado */}
              {catalogEntry === null && (
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '16px 18px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>🔍</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Não catalogado ainda</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Este personagem não está no nosso dataset. Vote abaixo para ajudar a comunidade!
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ── Resultado dos votos da comunidade ── */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Votos da Comunidade</span>
              </div>

              {/* MBTI mais votado */}
              {info.mbtiEntries?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
                  <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    MBTI · {info.totalMbtiVotes} voto{info.totalMbtiVotes !== 1 ? 's' : ''}
                  </p>
                  {info.mbtiEntries.slice(0, 4).map(([type, count]) => (
                    <TopBar key={type} label={`${type} — ${MBTI_DESC[type] || ''}`} value={count} total={info.totalMbtiVotes} color={MBTI_COLORS[type] || 'var(--purple)'} />
                  ))}
                </div>
              )}

              {/* Eneagrama mais votado */}
              {info.enneagramEntries?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
                  <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Eneagrama · {info.totalEnnVotes} voto{info.totalEnnVotes !== 1 ? 's' : ''}
                  </p>
                  {info.enneagramEntries.slice(0, 5).map(([enn, count]) => (
                    <TopBar key={enn} label={`Tipo ${enn}`} value={count} total={info.totalEnnVotes} color="var(--purple)" />
                  ))}
                </div>
              )}

              {info.mbtiEntries?.length === 0 && info.enneagramEntries?.length === 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Nenhum voto da comunidade ainda. Seja o primeiro!
                </p>
              )}
            </section>

            {/* ── Formulário de voto ── */}
            <section>
              <SectionTitle>Qual é o tipo deste personagem?</SectionTitle>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 18px 20px' }}>

                {/* MBTI select */}
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>MBTI</label>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <select
                    value={selectedMbti}
                    onChange={e => setSelectedMbti(e.target.value)}
                    style={{
                      width: '100%', appearance: 'none',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '9px 36px 9px 12px',
                      color: selectedMbti ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 13.5, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="">Selecionar MBTI...</option>
                    {MBTI_TYPES.map(t => (
                      <option key={t} value={t}>{t} — {MBTI_DESC[t]}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>

                {/* Eneagrama select */}
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Eneagrama</label>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <select
                    value={selectedEnneagram}
                    onChange={e => setSelectedEnneagram(e.target.value)}
                    style={{
                      width: '100%', appearance: 'none',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '9px 36px 9px 12px',
                      color: selectedEnneagram ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 13.5, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="">Selecionar Eneagrama...</option>
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <option key={n} value={String(n)}>Tipo {n}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>

                {!user && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>
                    <Link to="/login" style={{ color: 'var(--purple-light)' }}>Faça login</Link> para votar.
                  </p>
                )}

                <button
                  onClick={handleVote}
                  disabled={voting || !user}
                  style={{
                    width: '100%', padding: '11px 0',
                    background: voteSaved
                      ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                      : 'linear-gradient(135deg,var(--purple),#4f46e5)',
                    border: 'none', borderRadius: 9, color: '#fff',
                    fontSize: 13.5, fontWeight: 700, cursor: voting || !user ? 'not-allowed' : 'pointer',
                    opacity: !user ? 0.5 : 1,
                    transition: 'background 0.3s, opacity 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {voting
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Salvando...</>
                    : voteSaved ? '✓ Voto salvo!' : votes.myVote ? 'Atualizar meu voto' : 'Enviar voto'
                  }
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
