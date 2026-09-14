import { AlertTriangle } from 'lucide-react';

/**
 * Estado de erro reutilizável (mensagem + "tentar de novo"), pra não
 * repetir a mesma marcação em toda página que busca dado externo.
 * Usar sempre que uma falha de rede/API for tratada como erro de
 * verdade — nunca disfarçada de "lista vazia".
 */
export default function ErrorState({ message = 'Não deu para carregar os dados agora.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertTriangle size={20} className="text-red-400" />
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-white/5 px-4 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-white/10"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
