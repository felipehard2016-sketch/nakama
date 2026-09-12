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

1. **Estrutura do projeto** — Vite + React + Tailwind + PWA ✅ (você está aqui)
2. Layout base responsivo (sidebar fixa desktop, testado em várias resoluções)
3. Schema completo no Supabase
4. Autenticação (Supabase Auth) e rotas (React Router)
5. Módulo anime/mangá: AniList, tracking, progresso, notas, favoritos
6. Calendário, estatísticas, conquistas, streak, Wrapped, comparador de personagens
7. Módulo de jogos + dashboard cruzado
8. Camada de "companion" (arcos/notas de teoria) nos itens de mídia
9. Calculadora/simulador de builds (PoE 2, Diablo 4, Last Epoch, Warframe, Genshin)
10. Navegação mobile (tab bar híbrida)

## Estrutura de pastas

```
src/
  components/    # componentes reutilizáveis (ErrorBoundary, LazyImg, ...)
  context/       # React context (Auth, Toast, ...)
  hooks/         # hooks utilitários (useTheme, useTitle)
  lib/           # integrações (AniList, Supabase, achievements, ...)
  pages/         # páginas/rotas (a partir do passo 2)
  App.jsx
  main.jsx
  index.css      # Tailwind + tokens de marca + tema claro/escuro
```

## Ambiente existente (reaproveitado)

- Repositório: github.com/felipehard2016-sketch/nakama
- Projeto Supabase: gelekeybpxjcltjwmpqf.supabase.co
- Site publicado: nakama-roan.vercel.app
