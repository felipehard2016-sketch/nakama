# Nakama

Tracker pessoal de anime, mangá e (parcialmente) jogos, em PT-BR. Uso
próprio — não é um produto multiusuário no sentido de "SaaS": qualquer
pessoa pode criar conta, mas não há billing, onboarding guiado ou suporte,
e o roadmap segue as necessidades de quem mantém o projeto.

Esta é a v2 do projeto: a v1 (branch `main`) tinha funcionalidades
validadas mas problemas estruturais de layout/responsividade que não
davam para corrigir incrementalmente, então foi refeita do zero.

## Stack técnica

- **Frontend:** React 19 + Vite 8, roteamento com React Router 7
  (code-splitting por rota via `React.lazy`, exceto Home/Login que entram
  no bundle inicial)
- **Estilização:** Tailwind CSS v4 (`@tailwindcss/vite`, tokens de marca em
  `@theme`), tema claro/escuro
- **Backend/DB/Auth:** Supabase (Postgres + Auth por e-mail/senha + Row
  Level Security) — schema único e idempotente em `supabase/schema.sql`
- **Dados de anime/mangá:** AniList GraphQL API (`graphql.anilist.co`),
  consumida direto do client, sem backend próprio
- **Hospedagem:** Vercel, deploy automático a cada push
- **PWA:** `vite-plugin-pwa`, service worker cacheia fontes/ícones/CSS
  (JS e HTML sempre vêm da rede, ver comentário em `vite.config.js`)
- **Testes:** Vitest, cobrindo a lógica pura de `src/lib/*.js` (sem DOM)

## Funcionalidades implementadas

Isto é o que está de fato no ar, não o que foi planejado.

**Conta e autenticação**
- Cadastro/login/logout via Supabase Auth (e-mail/senha)
- Rotas protegidas (`ProtectedRoute`) para tudo que exige usuário logado

**Tracking de anime/mangá**
- Status (assistindo/lendo, completo, planejado, abandonado, platinado —
  este último só para jogos), progresso de episódio/capítulo, nota e
  favorito
- Botão de adicionar/trocar status direto em qualquer grid de card
  (`QuickAddControl`), sem precisar abrir a página de detalhe

**Home**
- Trending e Top 10 (dados AniList)
- "Continuar assistindo/lendo" com avanço de episódio/capítulo inline,
  sem sair da Home
- Recomendações simples: gêneros mais frequentes da própria lista,
  cruzados com nota da comunidade na AniList, excluindo o que já está
  na lista

**Busca e Minha Lista**
- Busca com filtros de gênero, ano, formato e status
- Minha Lista com os mesmos filtros mais nota mínima, exportação em CSV e
  JSON

**Detalhe de anime/mangá**
- Sinopse, estúdio, staff, dubladores/atores de voz, obras relacionadas
  (prequel/sequel/adaptação etc., rotuladas em PT-BR), trailer do YouTube
  embutido

**Calendário de lançamentos** — próximos episódios/capítulos do que está
na lista

**Estatísticas automáticas** — horas assistidas, episódios, completos,
top gêneros, calculadas a partir da lista real (`src/lib/stats.js`)

**Sistema de conquistas** — 27 badges (`src/lib/achievements.js`) mais
streak diário (`src/lib/streaks.js`)

**Wrapped anual** — resumo do ano ao estilo Spotify Wrapped, sobre a
própria lista

**Comparador de personagens** — busca dois personagens da AniList e
compara lado a lado

**Companion** — notas de arco/teoria por anime/mangá, com marcação e
ocultação de spoiler (`ArcNotes`)

**Notificações in-app** — sino no header/sidebar avisa quando um item da
lista tem episódio novo desde a última checagem (checagem throttled no
próprio client, sem push real — ver "fora de escopo")

**Exportar lista** — CSV e JSON, a partir da Minha Lista

**Importar lista**
- De um usuário público da AniList (`MediaListCollection`, sem OAuth)
- De um export XML do MyAnimeList (parser próprio em
  `src/lib/importList.js`)
- Ambos fazem upsert em lote: item já existente na lista é atualizado, não
  duplicado

**Perfil público opcional** (`/u/:username`) — nível, conquistas e streak
sempre visíveis; lista completa e estatísticas só se o dono ativar "lista
pública" no perfil (controlado por RLS no Postgres, não só na UI — ver
`supabase/schema.sql`)

**Navegação mobile responsiva** — tab bar inferior com sheet "Mais" para
o resto das rotas

## Fora de escopo por enquanto

- **Notificação push real** (fora da aba aberta). O sino atual é 100%
  client-side: checa a AniList quando a página está aberta e guarda o
  resultado no `localStorage`. Push de verdade (service worker + Web
  Push) exige um servidor/cron que dispare a checagem periodicamente e
  guarde subscriptions — infraestrutura que o projeto não tem hoje (só
  client + Supabase + Vercel, sem backend próprio nem jobs agendados).
- **Importar lista privada da AniList.** A importação atual só lê listas
  públicas via `MediaListCollection` (sem autenticação). Lista privada
  exige OAuth2 da AniList, o que significa registrar uma aplicação no
  próprio site da AniList e guardar client id/secret — uma decisão e uma
  ação que cabem a quem for usar essa conta, não algo que dá para
  resolver só no código.
- **Módulo de jogos (`/jogos`) e builds (`/builds`) — cadastro manual,
  não o sistema originalmente cogitado.** `/jogos` não tem busca de
  catálogo nem capa automática: cada jogo é digitado manualmente e vira
  uma entrada nova em `media_items` (sem id externo estável, então
  títulos repetidos não deduplicam sozinhos). Isso porque não há
  integração com RAWG/IGDB — `VITE_RAWG_API_KEY` existe no
  `.env.example` para o dia em que isso for implementado, mas hoje não é
  usada em lugar nenhum do código. `/builds` é um caderno por jogo (nome,
  skills em texto livre, notas), não uma árvore de passivas visual/
  interativa — dado de árvore de passiva não vem de nenhuma API oficial,
  precisaria ser modelado ou importado por jogo (ex. maxroll/poe2db), o
  que é um esforço à parte por título.

## Rodando localmente

Variáveis de ambiente (copie `.env.example` para `.env`):

```bash
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SUA_CHAVE_ANON_PUBLICA

# Opcional, não usada em nenhum lugar do código ainda (ver "fora de escopo")
VITE_RAWG_API_KEY=
```

Sem as duas primeiras, o app sobe mas a autenticação fica desabilitada
(aviso no console) — só a leitura pública de AniList continua funcionando.

Banco de dados: abra o projeto Supabase → **SQL Editor** → **New query**,
cole o conteúdo inteiro de [`supabase/schema.sql`](supabase/schema.sql) e
rode. O arquivo é idempotente — pode rodar de novo a qualquer momento
(upgrade in-place, nunca apaga dado existente) — então serve tanto para
provisionar um projeto novo quanto para aplicar migrações num já
existente.

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm run build       # build de produção
npm run preview     # servir o build localmente
npm run lint         # ESLint
npm test              # Vitest (roda uma vez)
npm run test:watch    # Vitest em modo watch
```

## Banco de dados

Tabelas em `supabase/schema.sql`: `profiles`, `media_items` (catálogo
compartilhado anime/mangá/jogo, deduplicado por `external_id` + `type`),
`user_media_list`, `achievements` (seed com as 27 conquistas),
`user_achievements`, `streaks`, `characters`, `reviews`, `arc_notes`
(Companion), `game_builds` e `notifications`.

RLS está ativo em todas as tabelas com dado de usuário. `profiles`,
`user_achievements` e `streaks` são de leitura pública por design (usado
pelo perfil público); `user_media_list` tem uma política adicional que
libera leitura de uma lista de outra pessoa apenas quando
`profiles.public_list = true` para o dono dela.

## Estrutura de pastas

```
src/
  components/
    auth/        # ProtectedRoute
    layout/      # Layout, Sidebar (desktop), MobileTabBar + MoreSheet (mobile)
    media/       # TrackingPanel, ArcNotes (Companion), EpisodeGrid
    ui/          # MediaCard, MediaRow, QuickAddControl, NotificationBell,
                 # ErrorState, GenreBars, LazyImg, PageStub, Formatted
  context/       # AuthContext, ToastContext, SidebarContext
  hooks/         # useTheme, useTitle, useQuickList, useNotifications
  lib/           # anilist, jikan, supabase, mediaList, stats, achievements,
                 # streaks, characters, arcNotes, games, builds, leveling,
                 # notifications, publicProfile, exportList, importList,
                 # recommendations, format, dominantColor, characterIcons
                 # (arquivos .test.js ao lado dos módulos correspondentes)
  pages/         # uma por rota (Home, Search, AnimeDetail, CharacterDetail,
                 # CharacterCompare, MyList, Stats, Calendar, Achievements,
                 # Wrapped, Games, Builds, Profile, PublicProfile, Login)
  App.jsx
  main.jsx
  index.css      # Tailwind + tokens de marca + tema claro/escuro
supabase/
  schema.sql     # schema completo, idempotente
```

## Ambiente existente

- Repositório: github.com/felipehard2016-sketch/nakama
- Projeto Supabase: gelekeybpxjcltjwmpqf.supabase.co
- Site publicado: nakama-roan.vercel.app
