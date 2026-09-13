import { useEffect, useRef, useState } from 'react';
import { LogOut, Flame, Trophy, BarChart2, Upload, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getStreak } from '../lib/streaks';
import { labelForLevel } from '../lib/leveling';
import { importFromAniList, importFromMalXml } from '../lib/importList';
import { useTitle } from '../hooks/useTitle';

/** Barra de progresso simples (não a segmentada da identidade HUD — aqui é um andamento contínuo de verdade, não um "quanto falta pra próximo episódio"). */
function ImportProgress({ label, done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between font-mono text-[11px] text-[var(--text-muted)]">
        <span>{label}</span>
        <span>{done} / {total}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-purple to-blue transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Profile() {
  useTitle('Perfil');
  const { user, profile, signOut, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState(profile?.username || '');
  const [streak, setStreak]     = useState(null);
  const [saving, setSaving]     = useState(false);

  const [aniListUsername, setAniListUsername] = useState('');
  const [importing, setImporting] = useState(null); // null | 'anilist' | 'mal'
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => setUsername(profile?.username || ''), [profile]);
  useEffect(() => { if (user) getStreak(user.id).then(setStreak); }, [user]);

  const handleSaveUsername = async () => {
    setSaving(true);
    const { error } = await updateProfile({ username: username.trim() });
    setSaving(false);
    showToast(error ? 'Não deu para salvar.' : 'Nome atualizado!', error ? 'error' : 'success');
  };

  const handleImportAniList = async () => {
    if (!aniListUsername.trim() || importing) return;
    setImporting('anilist');
    setImportProgress({ done: 0, total: 0 });
    try {
      const { imported, total } = await importFromAniList(
        user.id, aniListUsername.trim(),
        (done, t) => setImportProgress({ done, total: t }),
      );
      if (total === 0) showToast('Não achei essa lista — confira o nome de usuário (e se ela é pública).', 'error');
      else showToast(`Importados ${imported} de ${total} itens da AniList.`, imported > 0 ? 'success' : 'error');
    } catch {
      showToast('Não deu para importar agora. Tenta de novo em instantes.', 'error');
    } finally {
      setImporting(null);
    }
  };

  const handleImportMalFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!file || importing) return;
    setImporting('mal');
    setImportProgress({ done: 0, total: 0 });
    try {
      const text = await file.text();
      const { imported, total } = await importFromMalXml(
        user.id, text,
        (done, t) => setImportProgress({ done, total: t }),
      );
      if (total === 0) showToast('Não achei nenhum item nesse arquivo — confira se é o export de anime/mangá do MAL.', 'error');
      else showToast(`Importados ${imported} de ${total} itens do MAL.`, imported > 0 ? 'success' : 'error');
    } catch {
      showToast('Não deu para ler esse arquivo.', 'error');
    } finally {
      setImporting(null);
    }
  };

  const levelLabel = labelForLevel(profile?.level);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple to-blue text-xl font-bold text-white">
          {(profile?.username || user?.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">{profile?.username || 'Usuário'}</h1>
          <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
          <Flame size={16} className="mx-auto mb-1 text-orange-400" />
          <p className="text-lg font-bold text-[var(--text)]">{streak?.current_streak ?? 0}</p>
          <p className="text-[10px] text-[var(--text-muted)]">streak atual</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
          <Trophy size={16} className="mx-auto mb-1 text-yellow-400" />
          <p className="text-lg font-bold text-[var(--text)]">Nv. {profile?.level ?? 1}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{levelLabel}</p>
        </div>
        <Link to="/stats" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center transition-colors hover:border-purple/40">
          <BarChart2 size={16} className="mx-auto mb-1 text-blue-light" />
          <p className="text-[11px] font-medium text-[var(--text)]">Ver stats</p>
        </Link>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <label htmlFor="profile-username" className="text-xs text-[var(--text-muted)]">Nome de usuário</label>
        <div className="flex gap-2">
          <input
            id="profile-username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-purple"
          />
          <button
            onClick={handleSaveUsername}
            disabled={saving || username.trim() === profile?.username}
            className="rounded-md bg-purple/20 px-4 text-sm font-medium text-[var(--text)] disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Importar lista</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Traga seu histórico de outro tracker. Itens já na sua lista atualizam status/progresso/nota.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="import-anilist-username" className="text-xs text-[var(--text-muted)]">
            Usuário da AniList (lista precisa ser pública)
          </label>
          <div className="flex gap-2">
            <input
              id="import-anilist-username"
              value={aniListUsername}
              onChange={e => setAniListUsername(e.target.value)}
              placeholder="seu-usuario-na-anilist"
              disabled={!!importing}
              className="flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple disabled:opacity-50"
            />
            <button
              onClick={handleImportAniList}
              disabled={!!importing || !aniListUsername.trim()}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-purple/20 px-3.5 text-sm font-medium text-[var(--text)] disabled:opacity-40"
            >
              <Download size={14} /> Importar
            </button>
          </div>
        </div>

        {importing === 'anilist' && <ImportProgress label="Importando da AniList…" {...importProgress} />}

        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Export XML do MyAnimeList</p>
              <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Um arquivo por vez — anime e mangá são exportados separados pelo próprio MAL.</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!importing}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-purple/20 px-3.5 py-2 text-xs font-medium text-[var(--text)] disabled:opacity-40"
            >
              <Upload size={13} /> Escolher arquivo
            </button>
            <input ref={fileInputRef} type="file" accept=".xml" onChange={handleImportMalFile} className="hidden" />
          </div>
          {importing === 'mal' && <div className="mt-3"><ImportProgress label="Importando do MAL…" {...importProgress} /></div>}
        </div>
      </div>

      <button
        onClick={signOut}
        className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-red-400/40 hover:text-red-400"
      >
        <LogOut size={15} /> Sair
      </button>
    </div>
  );
}
