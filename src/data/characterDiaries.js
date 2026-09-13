/*
 * Conteúdo editorial do "Diário de Personagens" — texto narrativo em
 * primeira pessoa, artefatos, tudo escrito à mão por nós. Isso NÃO vem
 * da AniList (ela não tem biografia em 1ª pessoa nem "artefatos") e por
 * isso é um arquivo de dados estático, não uma tabela no Supabase: é
 * conteúdo curado, igual pra todo mundo, sem necessidade de escrita em
 * runtime nem de RLS. A única coisa que ainda vem "ao vivo" é a FOTO de
 * cada personagem — buscada na AniList pelo nome (`anilistSearch`, ver
 * Diario.jsx) — pra não precisarmos hospedar imagem com direito autoral
 * por conta própria.
 *
 * Escopo: 10 animes x 5 personagens = 50 entradas, sendo escrito aos
 * poucos (um anime por vez, pra revisão). Anime sem entradas ainda
 * aparece na prateleira como "em breve" em vez de sumir da lista — os
 * 10 títulos abaixo são o total planejado, `CHARACTER_DIARIES` é só o
 * que já foi escrito e revisado.
 */

export const DIARY_ANIME_LIST = [
  { slug: 'one-piece',       title: 'One Piece',                       accent: '#d97706' },
  { slug: 'naruto',          title: 'Naruto',                          accent: '#ea580c' },
  { slug: 'attack-on-titan', title: 'Attack on Titan',                 accent: '#57534e' },
  { slug: 'death-note',      title: 'Death Note',                      accent: '#18181b' },
  { slug: 'demon-slayer',    title: 'Demon Slayer',                    accent: '#0d9488' },
  { slug: 'jujutsu-kaisen',  title: 'Jujutsu Kaisen',                  accent: '#1e3a8a' },
  { slug: 'mha',             title: 'My Hero Academia',                accent: '#16a34a' },
  { slug: 'fmab',            title: 'Fullmetal Alchemist: Brotherhood', accent: '#991b1b' },
  { slug: 'bleach',          title: 'Bleach',                          accent: '#0369a1' },
  { slug: 'dbz',             title: 'Dragon Ball Z',                   accent: '#ca8a04' },
];

/**
 * Cada entrada: { id, name, role, anilistSearch, entry, artifacts }
 *   - anilistSearch: nome exato a buscar na AniList só pra pegar a foto
 *   - entry: texto em 1ª pessoa, parágrafos separados por linha em branco
 *   - artifacts: 3-5 itens { icon (nome de ícone lucide-react já
 *     importado em Diario.jsx), label }. Um artefato com icon: 'Quote'
 *     ganha destaque visual maior (vira a "nota" central da página).
 */
export const CHARACTER_DIARIES = {
  'one-piece': [
    {
      id: 'luffy',
      name: 'Monkey D. Luffy',
      role: 'Capitão dos Chapéus de Palha · futuro Rei dos Piratas',
      anilistSearch: 'Monkey D. Luffy',
      entry: `
Ei, sou eu, o Luffy! A Robin disse que eu deveria escrever as coisas que penso antes que eu esqueça — e eu esqueço bastante coisa mesmo, então lá vou eu.

Eu não escolhi virar pirata pensando em tesouro. Escolhi porque, quando eu era pequeno, um cara chamado Shanks salvou minha vida e perdeu o braço fazendo isso. Ele riu depois, como se não fosse nada. Não foi o tesouro dele que me deixou de queixo caído, foi ver que dava pra ser livre daquele jeito — sem medo de perder as coisas, contanto que você proteja o que importa. Ele me deu esse chapéu de palha e disse "devolve pra mim um dia, quando você for um pirata tão grande quanto eu". Uso ele até hoje. Não tiro nem pra dormir direito.

Comi a fruta Gomu Gomu sem querer, achando que era só uma fruta esquisita (é horrível, aliás, toda Fruta do Diabo é). Só bem depois descobri que na verdade é a Hito Hito no Mi, Modelo Nika — o Guerreiro da Libertação, dizem. Faz sentido: a única coisa que eu quero de verdade é que ninguém precise ficar preso a nada, nem meus nakama, nem eu. Ah, e essa cicatriz embaixo do meu olho? Fiz eu mesmo, com uma faca, pra provar pros homens do Shanks que eu não tinha medo de dor. Foi burrice. Não me arrependo.

Tenho dois irmãos, Ace e Sabo. A gente bebeu de uns copos e depois quebrou eles, pra selar que aquilo não tinha volta — irmão de sangue não é força maior, é escolha. Perdi o Ace em Marineford. Não consigo escrever direito sobre isso, só sei que gritei até não sobrar voz e fiquei um tempo sem rir de verdade. Mas ele não ia querer isso. Ia querer que eu continuasse comendo, rindo e indo atrás do que quero.

Meu bando é minha família. Não me importo com o quanto o mar é grande ou quantos Yonkou existem no caminho — eu vou achar o One Piece e vou ser o Rei dos Piratas. Não porque eu preciso do título. Porque isso significa que ninguém no mundo vai ser mais livre do que eu.

P.S.: alguém comeu minha carne de novo enquanto eu escrevia isso e juro que vou descobrir quem foi.
      `,
      artifacts: [
        { icon: 'Crown',    label: 'Chapéu de palha, emprestado do Shanks' },
        { icon: 'Sparkles', label: 'Fruta Gomu Gomu (na verdade, Hito Hito no Mi, Modelo Nika)' },
        { icon: 'Bandage',  label: 'Cicatriz embaixo do olho esquerdo' },
        { icon: 'Wine',     label: 'Os copos quebrados do juramento com Ace e Sabo' },
        { icon: 'Quote',    label: '"Eu serei o Rei dos Piratas!"' },
      ],
    },
  ],

  naruto: [
    {
      id: 'naruto',
      name: 'Naruto Uzumaki',
      role: 'Ninja da Vila da Folha · futuro Hokage',
      anilistSearch: 'Naruto Uzumaki',
      entry: `
Diário, oi, sou eu de novo — o Naruto! Prometi pro Iruka-sensei que ia tentar escrever quando as coisas ficassem grandes demais pra guardar só na cabeça, então aqui vou eu, dattebayo.

Nasci na noite em que a Raposa de Nove Caudas atacou a Vila da Folha. Meu pai, o Quarto Hokage, selou ela dentro de mim pra salvar todo mundo — e morreu fazendo isso, junto com minha mãe. Eu não sabia de nada disso quando era criança, só sabia que os adultos olhavam pra mim como se eu fosse um monstro, não um menino. Fazia bagunça, pichava o monumento dos Hokage, só pra alguém — qualquer um — olhar pra mim de verdade. O Iruka-sensei foi o primeiro. Ele me deu minha bandana no dia da formatura e, sei lá, foi a primeira vez que eu senti que pertencia a algum lugar.

O Sasuke é meu melhor amigo, mesmo que ele não admita isso hoje (nem eu, até acho). A gente brigou mais do que qualquer dupla de ninja deveria brigar. Ele foi atrás de poder pra vingança contra o próprio irmão; eu fui atrás dele porque não aceito perder as pessoas importantes duas vezes. O Jiraiya-sensei me ensinou o Rasengan e um monte de coisa sobre como ser homem (a maioria péssimos conselhos, sendo sincero), e morreu tentando parar o Pain sozinho. Jurei terminar o que ele começou.

Quando o Pain destruiu a vila inteira, tive vontade de matar ele. Ele tinha motivo — perdeu tudo pra guerra, quase do jeito que eu quase perdi tudo pra solidão. Escolhi não matar. Escolhi acreditar que dava pra quebrar esse ciclo de ódio sem virar mais um elo dele. Não sei se foi a decisão mais forte que já tomei ou a mais idiota, mas foi a mais minha.

Meu sonho sempre foi virar Hokage — não pelo cargo, mas porque, se a vila inteira reconhecer o garoto que ela mesma tentou ignorar, isso prova que ninguém precisa nascer sozinho pra sempre. Eu nunca volto atrás com minha palavra. Esse é o meu jeito ninja, dattebayo.
      `,
      artifacts: [
        { icon: 'Shield', label: 'Bandana da Vila da Folha, presente do Iruka-sensei' },
        { icon: 'Orbit',  label: 'Rasengan, ensinado pelo Jiraiya-sensei' },
        { icon: 'Flame',  label: 'Selo da Kurama, a Raposa de Nove Caudas' },
        { icon: 'Shirt',  label: 'Jaqueta laranja e preta' },
        { icon: 'Quote',  label: '"Esse é o meu jeito ninja: eu nunca volto atrás com minha palavra!"' },
      ],
    },
  ],

  'attack-on-titan': [
    {
      id: 'levi',
      name: 'Levi Ackerman',
      role: 'Capitão do Esquadrão de Operações Especiais',
      anilistSearch: 'Levi Ackerman',
      entry: `
Não tenho o hábito de escrever isso aqui. Vou ser breve.

Cresci na cidade subterrânea, embaixo dos muros, onde ninguém te dá nada de graça e o ar já é meio podre antes de você nascer. Não tive infância, tive sobrevivência. Furlan e Isabel foram a única coisa parecida com família que eu escolhi ter lá embaixo — os dois confiavam em mim mais do que eu merecia. O Erwin nos recrutou, ou melhor, nos chantageou pra entrar no Esquadrão de Exploração como espiões. Na nossa primeira expedição, os dois morreram. Culpei o Erwin por muito tempo. Devia ter culpado os titãs, ou o mundo, mas era mais fácil odiar um rosto específico.

Fiquei. Não sei explicar direito por quê — talvez porque, se eu saísse, a morte deles não teria significado nada. Virei o que chamam de "soldado mais forte da humanidade". Não é elogio que eu peça, é resultado de treino e de não ter escolha. Uso o equipamento de manobra tridimensional e duas lâminas como extensão do próprio braço; é a única coisa nesse mundo que responde exatamente do jeito que eu mando.

Tem um dia que não sai da minha cabeça: tive que escolher entre salvar o Erwin ou usar o soro no Armin. O Erwin passou a vida toda querendo ver com os próprios olhos o que tinha no porão do pai do Eren, e mesmo assim escolhi contra o que ele mais queria. Os outros votaram pelo Armin. Eu só executei. Não durmo bem pensando se foi certo — durmo, no fim, porque limpar alguma coisa (a lâmina, o quarto, não importa) me ajuda a não pensar demais.

Uso um lenço branco no pescoço desde que virei soldado; não é vaidade, é hábito que virou identidade. A capa com as asas da liberdade pesa mais do que parece. A única coisa que a gente tem permissão de fazer, no fim, é acreditar que não vai se arrepender da escolha que fez. Escolhi acreditar nisso. Não tenho garantia nenhuma de que está certo.
      `,
      artifacts: [
        { icon: 'Swords', label: 'Equipamento de manobra tridimensional e as lâminas gêmeas' },
        { icon: 'Shirt',  label: 'Lenço branco no pescoço, usado desde que virou soldado' },
        { icon: 'Feather', label: 'Capa da Legião de Reconhecimento, as Asas da Liberdade' },
        { icon: 'Brush',  label: 'O hábito (quase obsessivo) de limpar tudo ao redor' },
        { icon: 'Quote',  label: '"A única coisa que temos permissão de fazer é acreditar que não vamos nos arrepender da escolha que fizemos."' },
      ],
    },
  ],
};
