# Nakama v2

Plataforma pessoal de tracking de animes, mangás e (fase futura) jogos —
inspirada em MyAnimeList, AniList e TV Time.

Esta é a reconstrução (v2) do projeto: a v1 tinha funcionalidades validadas,
mas problemas estruturais de layout/responsividade que não deram para
corrigir incrementalmente. O código da v1 continua disponível no histórico
do Git (branch `main`) para referência ao recriar cada funcionalidade.

## Stack

- **Frontend:** React + Vite
- **Estilização:** Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Backend/DB/Auth:** Supabase
- **Dados de anime/mangá:** AniList GraphQL API
- **Hospedagem:** Vercel (deploy automático a cada push)
- **PWA:** vite-plugin-pwa, configurado desde o início

## Identidade visual

- Dark mode cinematográfico, estética "game UI"
- Cores de marca: roxo `#7c3aed` e azul `#2563eb` (tokens Tailwind `purple` / `blue`)
- Logo: chapéu de palha estilizado

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencher com as chaves do Supabase
npm run dev
```

```bash
npm run build     # build de produção
npm run preview   # servir o build localmente
npm run lint      # ESLint
```

## Ordem de construção (roadmap)

1. **Estrutura do projeto** — Vite + React + Tailwind + PWA ✅
2. **Layout base responsivo** — sidebar fixa desktop/tablet ✅
3. **Schema completo no Supabase** ✅
4. **Autenticação** (Supabase Auth: signup/login/logout, rotas protegidas) ✅
5. **Módulo anime/mangá** — busca AniList, tracking, progresso, nota, favoritos ✅
6. **Calendário, stats, conquistas (27 badges), streak, Wrapped, comparador de personagens** ✅
7. **Módulo de jogos** — cadastro manual (sem chave RAWG/IGDB ainda) ⚠️ escopo reduzido
8. **Companion** (arcos/notas de teoria, com spoiler) ✅
9. **Builds** — caderno de build por jogo, sem árvore de passivas visual ⚠️ escopo reduzido
10. **Navegação mobile** — tab bar inferior + sheet "Mais" ✅

### Limitações conhecidas desta leva (passos 4–10)

- **Sem chave de API do RAWG/IGDB**: `/jogos` é cadastro manual, sem busca de
  catálogo nem capa automática. `VITE_RAWG_API_KEY` já está no `.env.example`
  pra quando decidir integrar.
- **`/builds`** é um caderno (nome, skills em texto livre, notas) — não uma
  árvore de passivas visual/interativa. Isso pede dado por jogo que nenhuma
  API oficial fornece (teria que ser modelado ou importado de fontes tipo
  maxroll/poe2db por jogo, um esforço à parte).
- **Testado nesta sessão**: build de produção, `supabase/schema.sql` contra
  um Postgres local (schema novo, upgrade a partir da versão anterior, e
  idempotência — três cenários, todos OK) e navegação/UI via Playwright.
  **Não testado end-to-end**: chamadas reais à AniList e ao Supabase — o
  sandbox de desenvolvimento bloqueia egress pra `graphql.anilist.co` por
  política de rede, e não há credenciais do Supabase neste ambiente. A
  lógica é a mesma já validada na v1 (AniList) ou nova contra o schema v2
  (Supabase), mas vale um teste manual no deploy do Vercel — que já tem as
  variáveis de ambiente configuradas — antes de considerar fechado.
- **Lint**: `npm run lint` acusa alguns `react-hooks/set-state-in-effect`
  (regra nova, sinaliza o padrão comum "reseta estado, busca dado async" em
  vários componentes) e 3 erros pré-existentes da v1 em arquivos mantidos.
  Nenhum afeta o build ou o funcionamento — fica registrado para uma
  limpeza futura.

## Banco de dados (Supabase)

O schema completo da v2 está em [`supabase/schema.sql`](supabase/schema.sql) —
um arquivo único, idempotente (seguro rodar mais de uma vez). Para aplicar:

1. Abra o projeto em https://supabase.com/dashboard → **SQL Editor** → **New query**
2. Cole o conteúdo de `supabase/schema.sql` inteiro e rode

Tabelas: `profiles`, `media_items` (catálogo compartilhado anime/manga/game),
`user_media_list`, `achievements` (seed com as 27 conquistas), `user_achievements`,
`streaks`, `characters`, `reviews`, `arc_notes` (companion) e `game_builds`.

Se você já rodou uma versão anterior deste arquivo (antes do passo 4), pode
rodar esta de novo sem medo — ela faz upgrade in-place: converte
`achievements.id` de serial pra texto (as 27 conquistas usam slug, ex.
`'eps_500'`, porque a regra de desbloqueio vive em `src/lib/achievements.js`)
e adiciona `'platinum'` como status válido em `user_media_list` (usado só
por jogos). Nada é apagado nesse processo.

> **Nota sobre a v1:** o projeto Supabase é o mesmo da v1
> (`gelekeybpxjcltjwmpqf.supabase.co`). A tabela `user_media_list` antiga
> tinha um formato incompatível com a v2 (dado denormalizado, sem catálogo
> compartilhado) — o script renomeia ela para `user_media_list_legacy_v1`
> em vez de apagar, então nenhum dado é perdido. As demais tabelas da v1
> (`character_personality`, `user_profiles`, `episode_progress`,
> `anime_reviews`, `review_votes`) não conflitam com a v2 e ficam como
> estão, sem uso pelo código novo, até você decidir remover.
>
> `src/lib/storage.js`, `reviews.js`, `personality.js` e outros arquivos da
> v1 que apontavam pras tabelas antigas foram removidos nos passos 5/6/8 —
> substituídos por `mediaList.js`, `stats.js`, `achievements.js`,
> `streaks.js`, `characters.js` e `arcNotes.js`, todos contra o schema v2.
> Nada se perde: continuam no histórico do Git.

## Estrutura de pastas

```
src/
  components/
    auth/        # ProtectedRoute
    layout/       # Sidebar (desktop), MobileTabBar + MoreSheet (mobile), Layout
    media/        # TrackingPanel, ArcNotes (companion)
    ui/           # MediaCard, GenreBars, PageStub, LazyImg, ErrorBoundary
  context/        # Auth, Toast, Sidebar (estado do sheet "Mais")
  hooks/          # useTheme, useTitle
  lib/            # AniList, Supabase, mediaList, stats, achievements, streaks,
                  # characters, arcNotes, games, builds, leveling
  pages/          # uma por rota
  App.jsx
  main.jsx
  index.css       # Tailwind + tokens de marca + tema claro/escuro
```

## Ambiente existente (reaproveitado)

- Repositório: github.com/felipehard2016-sketch/nakama
- Projeto Supabase: gelekeybpxjcltjwmpqf.supabase.co
- Site publicado: nakama-roan.vercel.app
