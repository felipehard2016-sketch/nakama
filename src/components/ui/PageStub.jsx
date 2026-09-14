import { useTitle } from '../../hooks/useTitle';

/**
 * Placeholder de página usado no passo 2 (layout) — só existe para validar
 * a navegação/responsividade antes de qualquer tela com dado real entrar
 * (AniList, Supabase). Cada rota vira uma tela de verdade nos passos 5/6.
 */
export default function PageStub({ title, description }) {
  useTitle(title);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-2 py-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">{title}</h1>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
    </div>
  );
}
