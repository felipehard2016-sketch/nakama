import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllMedia } from '../lib/storage';
import { uploadAvatar, uploadBanner, saveProfileMeta } from '../lib/profile';
import { getUserPersonality, saveUserPersonality } from '../lib/personality';
import {
  LogOut, Trophy, Target, Tv, BookOpen,
  Clock, Star, Heart, CheckCircle2, Zap,
  Camera, ImagePlus, Sparkles, ChevronDown, Save,
} from 'lucide-react';

/* ════════════════════════════════════════
   DADOS DE PERSONALIDADE
════════════════════════════════════════ */
const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
];

const MBTI_DESC = {
  INTJ:'Estrategista', INTP:'Lógico',      ENTJ:'Comandante',   ENTP:'Debatedor',
  INFJ:'Advogado',     INFP:'Mediador',     ENFJ:'Protagonista', ENFP:'Ativista',
  ISTJ:'Logístico',    ISFJ:'Defensor',     ESTJ:'Executivo',    ESFJ:'Cônsul',
  ISTP:'Virtuoso',     ISFP:'Aventureiro',  ESTP:'Empreendedor', ESFP:'Animador',
};

const ZODIAC_SIGNS = [
  '♈ Áries','♉ Touro','♊ Gêmeos','♋ Câncer','♌ Leão','♍ Virgem',
  '♎ Libra','♏ Escorpião','♐ Sagitário','♑ Capricórnio','♒ Aquário','♓ Peixes',
];

/* ════════════════════════════════════════
   SISTEMA DE NÍVEL
   10 eps = 1 XP  |  100 XP = 1 nível
════════════════════════════════════════ */
const LEVEL_NAMES = [
  '', 'Iniciante', 'Aprendiz', 'Explorador', 'Veterano',
  'Especialista', 'Mestre', 'Grão-Mestre', 'Lendário',
  'Imortal', 'Transcendente',
];

function calcLevel(totalEps) {
  const xp       = Math.floor(totalEps / 10);
  const level    = Math.floor(xp / 100) + 1;
  const xpInLv   = xp % 100;
  const xpToNext = 100 - xpInLv;
  const name     = LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)];
  return { level, xp, xpInLv, xpToNext, pct: xpInLv, name };
}

/* ════════════════════════════════════════
   CONQUISTAS
════════════════════════════════════════ */
const ACHIEVEMENTS_DEF = [
  {
    id: 'first_step', icon: '🎬', title: 'Primeiro Passo',
    desc: 'Adicione o primeiro anime à lista',
    check: ({ animeCount }) => animeCount >= 1,
  },
  {
    id: 'marathoner', icon: '🔥', title: 'Maratonista',
    desc: 'Assista 500 episódios',
    check: ({ totalEps }) => totalEps >= 500,
    progress: ({ totalEps }) => ({ current: Math.min(500, totalEps), total: 500 }),
  },
  {
    id: 'centurion', icon: '💯', title: 'Centurião',
    desc: 'Complete 100 animes',
    check: ({ completedCount }) => completedCount >= 100,
    progress: ({ completedCount }) => ({ current: Math.min(100, completedCount), total: 100 }),
  },
  {
    id: 'no_social', icon: '⚡', title: 'Sem Vida Social',
    desc: 'Assista 1000 episódios',
    check: ({ totalEps }) => totalEps >= 1000,
    progress: ({ totalEps }) => ({ current: Math.min(1000, totalEps), total: 1000 }),
  },
  {
    id: 'legend', icon: '👑', title: 'Lenda do Anime',
    desc: 'Assista 5000 episódios',
    check: ({ totalEps }) => totalEps >= 5000,
    progress: ({ totalEps }) => ({ current: Math.min(5000, totalEps), total: 5000 }),
  },
  {
    id: 'manga_reader', icon: '📚', title: 'Leitor Dedicado',
    desc: 'Leia 1000 capítulos de mangá',
    check: ({ mangaChapters }) => mangaChapters >= 1000,
    progress: ({ mangaChapters }) => ({ current: Math.min(1000, mangaChapters), total: 1000 }),
  },
  {
    id: 'hardcore_fan', icon: '❤️', title: 'Fã Hardcore',
    desc: 'Favorite 20 títulos',
    check: ({ favCount }) => favCount >= 20,
    progress: ({ favCount }) => ({ current: Math.min(20, favCount), total: 20 }),
  },
  {
    id: 'collector', icon: '🏆', title: 'Colecionador',
    desc: 'Tenha 50 títulos na lista',
    check: ({ totalCount }) => totalCount >= 50,
    progress: ({ totalCount }) => ({ current: Math.min(50, totalCount), total: 50 }),
  },
  {
    id: 'perfectionist', icon: '✅', title: 'Perfeccionista',
    desc: 'Complete 30 títulos',
    check: ({ completedCount }) => completedCount >= 30,
    progress: ({ completedCount }) => ({ current: Math.min(30, completedCount), total: 30 }),
  },
  {
    id: 'otaku_roots', icon: '🌟', title: 'Otaku Raiz',
    desc: 'Complete 50 títulos',
    check: ({ completedCount }) => completedCount >= 50,
    progress: ({ completedCount }) => ({ current: Math.min(50, completedCount), total: 50 }),
  },
  {
    id: 'critic', icon: '🎯', title: 'Crítico',
    desc: 'Rastreie 20 títulos diferentes',
    check: ({ totalCount }) => totalCount >= 20,
    progress: ({ totalCount }) => ({ current: Math.min(20, totalCount), total: 20 }),
  },
  {
    id: 'no_sleep', icon: '🕐', title: 'Sem Dormir',
    desc: '100 horas assistidas',
    check: ({ totalHours }) => totalHours >= 100,
    progress: ({ totalHours }) => ({ current: Math.min(100, totalHours), total: 100 }),
  },
  {
    id: 'no_life', icon: '💀', title: 'Sem Vida',
    desc: '500 horas assistidas',
    check: ({ totalHours }) => totalHours >= 500,
    progress: ({ totalHours }) => ({ current: Math.min(500, totalHours), total: 500 }),
  },
  {
    id: 'god_level', icon: '🐉', title: 'Nível Deus',
    desc: 'Chegue ao nível 50',
    check: ({ levelNum }) => levelNum >= 50,
    progress: ({ levelNum }) => ({ current: Math.min(50, levelNum), total: 50 }),
  },
];

/* ════════════════════════════════════════
   COMPONENTES
════════════════════════════════════════ */
function AchievementCard({ def, stats }) {
  const unlocked = def.check(stats);
  const prog     = def.progress?.(stats);
  const pct      = prog ? Math.round((prog.current / prog.total) * 100) : 0;

  return (
    <div style={{
      background: unlocked ? 'rgba(124,58,237,0.09)' : 'var(--bg-card)',
      border: `1px solid ${unlocked ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
      borderRadius: 14, padding: '16px 18px',
      transition: 'transform 0.18s, box-shadow 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Ícone */}
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: unlocked ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${unlocked ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.06)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: unlocked ? 22 : 18,
          filter: unlocked ? 'none' : 'grayscale(1)',
          opacity: unlocked ? 1 : 0.5,
        }}>
          {unlocked ? def.icon : '🔒'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{
              fontSize: 13.5, fontWeight: 700,
              color: unlocked ? 'var(--text)' : 'var(--text-muted)',
            }}>{def.title}</p>
            {unlocked && <CheckCircle2 size={13} color="#4ade80" />}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{def.desc}</p>
        </div>
      </div>

      {/* Barra de progresso — sempre visível quando há total */}
      {prog && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: unlocked ? 'var(--purple-light)' : 'var(--text-muted)' }}>
              {prog.current.toLocaleString()} / {prog.total.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: unlocked ? 'var(--purple-light)' : 'var(--text-muted)' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 2,
              background: unlocked
                ? 'linear-gradient(90deg,var(--purple),var(--blue-light))'
                : 'rgba(255,255,255,0.15)',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({ icon: Icon, label, current, goal, unit }) {
  const pct  = Math.min(100, Math.round((current / goal) * 100));
  const done = current >= goal;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
      borderRadius: 14, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: done ? 'rgba(74,222,128,0.12)' : 'rgba(124,58,237,0.1)',
          border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : 'rgba(124,58,237,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color={done ? '#4ade80' : 'var(--purple-light)'} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{label}</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>Meta: {goal} {unit}</p>
        </div>
        {done && <CheckCircle2 size={18} color="#4ade80" />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-end' }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: done ? '#4ade80' : 'var(--text)' }}>
          {current.toLocaleString()}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', paddingBottom: 3 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 3, transition: 'width 0.8s ease',
          background: done
            ? 'linear-gradient(90deg,#4ade80,#22d3ee)'
            : 'linear-gradient(90deg,var(--purple),var(--blue))',
        }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   PÁGINA
════════════════════════════════════════ */
export default function Profile() {
  const { displayName, user, signOut } = useAuth();
  const navigate = useNavigate();

  /* URLs de imagem — lê dos metadados do usuário */
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || null
  );
  const [bannerUrl, setBannerUrl] = useState(
    user?.user_metadata?.banner_url || null
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerHover, setBannerHover]         = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  /* ── Minha Personalidade ── */
  const [personality, setPersonality] = useState({
    mbti: '', enneagram: '', zodiac: '',
    fav_anime: '', fav_manga: '', bio: '',
  });
  const [savingPersonality, setSavingPersonality] = useState(false);
  const [personalitySaved,  setPersonalitySaved]  = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserPersonality(user.id).then(data => {
      if (data) setPersonality({
        mbti:       data.mbti       || '',
        enneagram:  data.enneagram  || '',
        zodiac:     data.zodiac     || '',
        fav_anime:  data.fav_anime  || '',
        fav_manga:  data.fav_manga  || '',
        bio:        data.bio        || '',
      });
    });
  }, [user]);

  const handleSavePersonality = async () => {
    if (!user) return;
    setSavingPersonality(true);
    try {
      await saveUserPersonality(user.id, personality);
      setPersonalitySaved(true);
      setTimeout(() => setPersonalitySaved(false), 2500);
    } catch (e) {
      console.error('Erro ao salvar personalidade:', e);
      alert('Erro ao salvar. Verifique se a tabela user_profiles existe no Supabase.');
    } finally {
      setSavingPersonality(false);
    }
  };

  /* ── Upload de avatar ── */
  const handleAvatarUpload = async e => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) { alert('Imagem muito grande. Máximo: 8MB'); return; }
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
      await saveProfileMeta({ avatar_url: url });
    } catch (err) {
      console.error('Avatar upload falhou:', err);
      alert('Erro ao enviar imagem. Verifique se o bucket "profiles" existe no Supabase.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  /* ── Upload de banner ── */
  const handleBannerUpload = async e => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 15 * 1024 * 1024) { alert('Imagem muito grande. Máximo: 15MB'); return; }
    setUploadingBanner(true);
    try {
      const url = await uploadBanner(user.id, file);
      setBannerUrl(url);
      await saveProfileMeta({ banner_url: url });
    } catch (err) {
      console.error('Banner upload falhou:', err);
      alert('Erro ao enviar imagem. Verifique se o bucket "profiles" existe no Supabase.');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  /* ── Dados da lista ── */
  const all = useMemo(() => getAllMedia(), []);

  const stats = useMemo(() => {
    const isManga = m => ['MANGA', 'ONE_SHOT', 'NOVEL'].includes(m.format);

    const animeCount    = all.filter(m => !isManga(m) && m.listStatus).length;
    const mangaCount    = all.filter(m =>  isManga(m) && m.listStatus).length;
    const completedCount = all.filter(m => m.listStatus === 'COMPLETED').length;
    const favCount      = all.filter(m => m.favorited).length;
    const totalCount    = all.filter(m => m.listStatus || m.favorited).length;

    const totalEps = all.reduce((a, m) => a + (m.progress || 0), 0);

    /* Horas: usa a duração real de cada anime armazenada (minutos/ep) */
    const totalMinutes = all.reduce((acc, m) => {
      if (isManga(m) || !m.progress) return acc;
      return acc + (m.progress * (m.duration || 24));
    }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    /* Capítulos de mangá */
    const mangaChapters = all
      .filter(m => isManga(m))
      .reduce((a, m) => a + (m.progress || 0), 0);

    const levelNum = calcLevel(totalEps).level;

    return { animeCount, mangaCount, completedCount, favCount, totalCount,
             totalEps, totalHours, mangaChapters, levelNum };
  }, [all]);

  const lv = useMemo(() => calcLevel(stats.totalEps), [stats.totalEps]);

  const unlockedCount = ACHIEVEMENTS_DEF.filter(d => d.check(stats)).length;

  /* Metas anuais */
  const thisYear    = new Date().getFullYear();
  const addedYear   = all.filter(m => m.addedAt && new Date(m.addedAt).getFullYear() === thisYear);
  const animeGoal   = addedYear.filter(m => !['MANGA','ONE_SHOT','NOVEL'].includes(m.format)).length;
  const mangaGoal   = addedYear.filter(m =>  ['MANGA','ONE_SHOT','NOVEL'].includes(m.format)).length;

  /* Avatar: iniciais limpas (sem caracteres inválidos) */
  const cleanName = (displayName || '').replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim() || 'U';
  const initials  = cleanName.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Recentemente';

  const handleLogout = async () => { await signOut(); navigate('/login'); };

  /* helper para selects */
  const SelectField = ({ label, value, onChange, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={onChange}
          style={{
            width: '100%', appearance: 'none',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 9, padding: '10px 34px 10px 13px',
            color: value ? 'var(--text)' : 'var(--text-muted)',
            fontSize: 13.5, cursor: 'pointer', outline: 'none',
          }}
        >
          {children}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      </div>
    </div>
  );

  const TextField = ({ label, value, onChange, placeholder }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '10px 13px',
          color: 'var(--text)', fontSize: 13.5, outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', animation: 'fadeIn 0.4s ease' }}>

      {/* inputs de arquivo ocultos */}
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
      <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />

      {/* ══════════════════════════════════════
          BANNER — ponta a ponta, 200px
      ══════════════════════════════════════ */}
      <div style={{ position: 'relative', height: 200 }}>

        {/* Fundo clicável */}
        <div
          style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
          onMouseEnter={() => setBannerHover(true)}
          onMouseLeave={() => setBannerHover(false)}
        >
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#3b0764 0%,#1e1b4b 45%,#0c1445 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -40, right: 120, width: 280, height: 280, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', filter: 'blur(60px)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: 200, width: 200, height: 200, borderRadius: '50%', background: 'rgba(79,70,229,0.18)', filter: 'blur(50px)' }} />
              <div style={{ position: 'absolute', top: 30, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(40px)' }} />
            </div>
          )}
          {/* overlay edição */}
          <div style={{
            position: 'absolute', inset: 0,
            background: bannerHover ? 'rgba(0,0,0,0.4)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            {(bannerHover || uploadingBanner) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '10px 18px',
                color: '#fff', fontSize: 13.5, fontWeight: 600,
              }}>
                {uploadingBanner
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Enviando...</>
                  : <><ImagePlus size={16} />Editar banner</>}
              </div>
            )}
          </div>
        </div>

        {/* Avatar — metade dentro / metade fora do banner */}
        <div style={{ position: 'absolute', bottom: -52, left: 40, zIndex: 10 }}>
          <div style={{ position: 'relative', width: 104, height: 104 }}>
            <div style={{
              width: 104, height: 104, borderRadius: '50%',
              border: '4px solid var(--bg)',
              boxShadow: '0 0 0 2px var(--purple), 0 0 28px rgba(124,58,237,0.55)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg,var(--purple),#4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#fff',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : uploadingAvatar
                  ? <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : initials}
            </div>
            <button
              onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
              title="Editar foto"
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--purple)', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.15s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--purple-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--purple)'}
            >
              <Camera size={13} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ZONA DE CABEÇALHO (ao lado do avatar)
          paddingLeft = 40 avatar_left + 104 avatar_w + 20 gap
      ══════════════════════════════════════ */}
      <div style={{ padding: '0 32px', minHeight: 68 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          paddingLeft: 164,   /* clear avatar */
          paddingTop: 10,
          paddingBottom: 20,
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {cleanName || 'Usuário'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Membro desde {memberSince}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 10, padding: '9px 18px',
              color: '#f87171', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'; }}
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CORPO — duas colunas
      ══════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 24,
        padding: '0 32px 72px',
        alignItems: 'start',
      }}>

        {/* ─────────────── COLUNA ESQUERDA ─────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Nível + XP */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 15, flexShrink: 0,
                background: 'linear-gradient(135deg,var(--purple),#4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(124,58,237,0.45)',
              }}>
                <Zap size={24} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 2 }}>Nível {lv.level}</p>
                <p style={{ fontSize: 21, fontWeight: 800, color: 'var(--purple-light)' }}>{lv.name}</p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ fontSize: 24, fontWeight: 800 }}>
                  {lv.xp.toLocaleString()}
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}> XP</span>
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>+{lv.xpToNext} XP para nível {lv.level + 1}</p>
              </div>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${lv.pct}%`, borderRadius: 4,
                background: 'linear-gradient(90deg,var(--purple),var(--blue))',
                boxShadow: '0 0 10px rgba(124,58,237,0.5)', transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{lv.xpInLv} / 100 XP neste nível</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>1 XP = 10 episódios</span>
            </div>
          </div>

          {/* Conquistas */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <Trophy size={18} color="var(--purple-light)" />
              <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Conquistas</h2>
              <span style={{
                fontSize: 11.5, fontWeight: 700,
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 20, padding: '2px 10px', color: 'var(--purple-light)',
              }}>
                {unlockedCount} / {ACHIEVEMENTS_DEF.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
              {ACHIEVEMENTS_DEF.map(def => (
                <AchievementCard key={def.id} def={def} stats={stats} />
              ))}
            </div>
          </section>

          {/* Minha Personalidade */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <Sparkles size={18} color="var(--purple-light)" />
              <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Minha Personalidade</h2>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '26px 26px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 18 }}>

                <SelectField label="MBTI" value={personality.mbti} onChange={e => setPersonality(p => ({ ...p, mbti: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {MBTI_TYPES.map(t => <option key={t} value={t}>{t} — {MBTI_DESC[t]}</option>)}
                </SelectField>

                <SelectField label="Eneagrama" value={personality.enneagram} onChange={e => setPersonality(p => ({ ...p, enneagram: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={String(n)}>Tipo {n}</option>)}
                </SelectField>

                <SelectField label="Signo" value={personality.zodiac} onChange={e => setPersonality(p => ({ ...p, zodiac: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectField>

                <TextField label="Anime favorito de todos os tempos" value={personality.fav_anime}
                  onChange={e => setPersonality(p => ({ ...p, fav_anime: e.target.value }))}
                  placeholder="Ex: Fullmetal Alchemist: Brotherhood" />

                <TextField label="Mangá favorito de todos os tempos" value={personality.fav_manga}
                  onChange={e => setPersonality(p => ({ ...p, fav_manga: e.target.value }))}
                  placeholder="Ex: Berserk" />
              </div>

              {/* Bio */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                  Frase / Bio pessoal
                </label>
                <textarea
                  value={personality.bio}
                  onChange={e => setPersonality(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Escreva algo sobre você..."
                  rows={3}
                  style={{
                    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 9, padding: '10px 13px',
                    color: 'var(--text)', fontSize: 13.5, outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSavePersonality}
                  disabled={savingPersonality}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 24px',
                    background: personalitySaved ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,var(--purple),#4f46e5)',
                    border: 'none', borderRadius: 10, color: '#fff',
                    fontSize: 13.5, fontWeight: 700,
                    cursor: savingPersonality ? 'not-allowed' : 'pointer',
                    opacity: savingPersonality ? 0.7 : 1,
                    transition: 'background 0.3s, opacity 0.2s',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                  }}
                >
                  {savingPersonality
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Salvando...</>
                    : personalitySaved ? '✓ Salvo!' : <><Save size={15} />Salvar personalidade</>}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ─────────────── COLUNA DIREITA ─────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Stats — grid 3×2 */}
          <section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { icon: Tv,           label: 'Animes',     value: stats.animeCount,                       color: '#a78bfa' },
                { icon: BookOpen,     label: 'Mangás',     value: stats.mangaCount,                       color: '#60a5fa' },
                { icon: CheckCircle2, label: 'Completos',  value: stats.completedCount,                   color: '#4ade80' },
                { icon: Star,         label: 'Episódios',  value: stats.totalEps.toLocaleString(),        color: '#fbbf24' },
                { icon: Heart,        label: 'Favoritos',  value: stats.favCount,                         color: '#f87171' },
                { icon: Clock,        label: 'Horas',      value: `${stats.totalHours.toLocaleString()}h`, color: '#fb923c' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '16px 14px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <s.icon size={18} color={s.color} />
                  <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Metas anuais */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <Target size={17} color="var(--purple-light)" />
              <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Metas de {thisYear}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <GoalCard icon={Tv}       label={`Animes em ${thisYear}`}   current={animeGoal}        goal={12}  unit="animes"    />
              <GoalCard icon={BookOpen} label={`Mangás em ${thisYear}`}   current={mangaGoal}        goal={6}   unit="mangás"    />
              <GoalCard icon={Star}     label="Episódios assistidos"      current={stats.totalEps}   goal={365} unit="episódios" />
              <GoalCard icon={Clock}    label="Horas assistidas"          current={stats.totalHours} goal={100} unit="horas"     />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
