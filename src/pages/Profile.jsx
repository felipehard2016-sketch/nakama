import { useEffect, useState } from 'react';
import { LogOut, Flame, Trophy, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getStreak } from '../lib/streaks';
import { labelForLevel } from '../lib/leveling';
import { useTitle } from '../hooks/useTitle';

export default function Profile() {
  useTitle('Perfil');
  const { user, profile, signOut, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState(profile?.username || '');
  const [streak, setStreak]     = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => setUsername(profile?.username || ''), [profile]);
  useEffect(() => { if (user) getStreak(user.id).then(setStreak); }, [user]);

  const handleSaveUsername = async () => {
    setSaving(true);
    const { error } = await updateProfile({ username: username.trim() });
    setSaving(false);
    showToast(error ? 'Não deu para salvar.' : 'Nome atualizado!', error ? 'error' : 'success');
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
        <label className="text-xs text-[var(--text-muted)]">Nome de usuário</label>
        <div className="flex gap-2">
          <input
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

      <button
        onClick={signOut}
        className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-red-400/40 hover:text-red-400"
      >
        <LogOut size={15} /> Sair
      </button>
    </div>
  );
}
