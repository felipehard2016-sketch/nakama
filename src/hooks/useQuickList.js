import { useCallback, useEffect, useState } from 'react';
import { getUserList } from '../lib/mediaList';

/**
 * Carrega a lista pessoal do usuário UMA vez por página e monta um mapa
 * `external_id (string) -> entry` — é o que permite o botão de "adicionar
 * à lista" aparecer em cada card de um grid sem fazer uma consulta por
 * card (ensureMediaItem/getListEntry por card seria uma escrita/leitura
 * a mais no banco pra cada pôster que aparece na tela).
 *
 * `onChanged` deve ser chamado pelos componentes que alteram a lista
 * (QuickAddControl) pra manter esse mapa em dia sem precisar recarregar
 * a página inteira.
 */
export function useQuickList(userId) {
  const [map, setMap] = useState(new Map());
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    if (!userId) { setMap(new Map()); setLoaded(true); return; }
    getUserList(userId).then(({ data, error }) => {
      if (error) { setLoaded(true); return; }
      const next = new Map();
      for (const entry of data || []) {
        if (entry.media_items) next.set(String(entry.media_items.external_id), entry);
      }
      setMap(next);
      setLoaded(true);
    });
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);

  /** Atualização otimista local — evita recarregar a lista inteira a cada clique. */
  const applyChange = useCallback((externalId, newEntry) => {
    setMap(prev => {
      const next = new Map(prev);
      if (newEntry) next.set(String(externalId), newEntry);
      else next.delete(String(externalId));
      return next;
    });
  }, []);

  return { listMap: map, listLoaded: loaded, reloadList: reload, applyListChange: applyChange };
}
