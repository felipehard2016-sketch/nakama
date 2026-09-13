import { useCallback, useEffect, useState } from 'react';
import { getUserList } from '../lib/mediaList';
import { queryAniList, CALENDAR_SCHEDULE } from '../lib/anilist';
import { getNotifications, markAllNotificationsRead, markNotificationRead, createEpisodeNotification } from '../lib/notifications';

// Evita bater na AniList a cada navegação — só checa de novo depois
// desse intervalo (guardado no localStorage, por aparelho/navegador).
const LAST_CHECK_KEY = 'nakama_notif_last_check';
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Sino de notificação (v1, in-app): quando alguém com sessão aberta usa
 * o app, compara o progresso da lista "assistindo" contra o último
 * episódio já lançado na AniList (id_in: uma chamada só pra tudo que
 * está "assistindo", não uma por anime) e cria um aviso pra cada
 * episódio novo ainda não avisado.
 *
 * Isso NÃO é push de verdade — não avisa com o app fechado. Pra isso
 * precisaria de infraestrutura de servidor rodando sozinha (cron), que
 * o projeto não tem hoje; ver decisão registrada na conversa.
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    if (!userId) { setNotifications([]); setLoaded(true); return; }
    getNotifications(userId).then(({ data, error }) => {
      if (!error) setNotifications(data || []);
      setLoaded(true);
    });
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!userId) return;
    const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
    if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await getUserList(userId);
        if (error || cancelled) return;

        const watching = (data || []).filter(e => e.status === 'watching' && e.media_items?.type === 'anime');
        if (watching.length === 0) { localStorage.setItem(LAST_CHECK_KEY, String(Date.now())); return; }

        const ids = watching.map(e => Number(e.media_items.external_id));
        const result = await queryAniList(CALENDAR_SCHEDULE, { ids }, { cache: false });
        const byId = new Map(result.Page.media.map(m => [m.id, m]));

        let createdAny = false;
        for (const entry of watching) {
          const m = byId.get(Number(entry.media_items.external_id));
          if (!m) continue;
          // nextAiringEpisode.episode é o PRÓXIMO a sair — o último que
          // já saiu é esse menos 1. Sem próximo episódio agendado (anime
          // finalizado ou hiato sem data), usa o total de episódios.
          const lastAired = m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : m.episodes;
          if (lastAired && lastAired > entry.progress) {
            const { error: createError } = await createEpisodeNotification(
              userId, entry.media_items.id, lastAired,
              `Episódio ${lastAired} de ${entry.media_items.title} já saiu!`,
            );
            if (!createError) createdAny = true;
          }
        }
        localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
        if (createdAny && !cancelled) reload();
      } catch {
        // Checagem de fundo, não uma ação que o usuário pediu — uma
        // falha aqui (AniList fora do ar, etc.) não deve virar erro na
        // tela; só tenta de novo no próximo intervalo.
      }
    })();
    return () => { cancelled = true; };
  }, [userId, reload]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    await markAllNotificationsRead(userId);
  };

  const markRead = async (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    await markNotificationRead(id);
  };

  return { notifications, unreadCount, loaded, markAllRead, markRead };
}
