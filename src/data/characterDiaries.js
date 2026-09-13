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
        { icon: 'Crown',      label: 'Chapéu de palha, emprestado do Shanks' },
        { icon: 'Sparkles',   label: 'Fruta Gomu Gomu (na verdade, Hito Hito no Mi, Modelo Nika)' },
        { icon: 'Bandage',    label: 'Cicatriz embaixo do olho esquerdo' },
        { icon: 'Flame',      label: 'Cicatriz em X no peito, de Marineford' },
        { icon: 'Footprints', label: 'Sandálias — nunca usou outro tipo de calçado' },
        { icon: 'Wine',       label: 'Os copos quebrados do juramento com Ace e Sabo' },
        { icon: 'Quote',      label: '"Eu serei o Rei dos Piratas!"' },
      ],
    },
    {
      id: 'zoro',
      name: 'Roronoa Zoro',
      role: 'Espadachim dos Chapéus de Palha · futuro maior espadachim do mundo',
      anilistSearch: 'Roronoa Zoro',
      entry: `
Não sou de escrever. Vou fazer isso do jeito que treino: sem enrolação.

Comecei a usar espada cedo, no dojo do mestre Koshiro. Tinha uma rival lá, a Kuina — a única pessoa que me derrotava, todas as vezes, durante anos. Prometemos um dia descobrir qual de nós dois seria o maior espadachim do mundo. Ela morreu antes disso, caiu de uma escada, um jeito idiota e sem sentido de morrer pra alguém tão forte. Peguei a espada dela, a Wado Ichimonji, e decidi carregar o sonho pelos dois. Não é sobre mim mais. Nunca mais vou perder uma luta — prometi isso pro corpo dela, e prometo de novo toda vez que empunho essa lâmina.

O Luffy me achou amarrado numa base da Marinha, prestes a ser executado por um capitão corrupto. Eu tinha me rendido de propósito pra proteger uma garotinha, a Rika, e não ia explicar isso pra ninguém — não faço as coisas por reconhecimento. Ele me soltou sem perguntar muito. Foi o primeiro a entrar no bando dele. Continuo sendo o primeiro imediato, o que segura a linha quando ele faz alguma idiotice (o que é sempre).

Em Thriller Bark, recebi no meu corpo todo o dano que o Kuma tinha causado no Luffy — quase morri fazendo isso. Quando o Chopper perguntou o que tinha acontecido comigo, falei que não tinha acontecido nada. Não foi orgulho. É que dizer a verdade não ia mudar o resultado, só ia fazer os outros sofrerem por mim também.

Uso três espadas ao mesmo tempo — Santoryu, um estilo que inventei porque duas mãos nunca me pareceram suficiente. Tenho uma cicatriz enorme no peito, de ombro a quadril, que o Mihawk me deu de propósito, sem nem se esforçar, só pra eu entender a distância entre nós. Vou fechar essa distância. Não é ambição, é uma dívida com a Kuina que ainda não terminei de pagar.
      `,
      artifacts: [
        { icon: 'Sword',  label: 'Wado Ichimonji, a espada da Kuina' },
        { icon: 'Swords', label: 'Santoryu, o estilo de três espadas' },
        { icon: 'Shirt',  label: 'Haramaki verde na cintura' },
        { icon: 'Shield', label: 'Bandana preta, amarrada no braço antes de brigas sérias' },
        { icon: 'Bandage', label: 'Cicatriz de ombro a quadril, dada pelo Mihawk' },
        { icon: 'Quote',  label: '"Nada aconteceu."' },
      ],
    },
    {
      id: 'nami',
      name: 'Nami',
      role: 'Navegadora dos Chapéus de Palha',
      anilistSearch: 'Nami',
      entry: `
Vou escrever isso rápido antes que alguém tente me cobrar por usar o papel.

Cresci em Cocoyasi com a Bell-mère, uma ex-fuzileira que me adotou junto com minha irmã Nojiko, sem nunca fazer diferença entre nós duas terem ou não o mesmo sangue dela. Quando o Arlong e a tripulação dele tomaram a vila, a Bell-mère morreu na nossa frente pra nos proteger — e eu tive que sorrir e trabalhar pro homem que matou minha mãe por oito anos, desenhando mapas pra ele, fingindo lealdade, roubando de outros piratas por trás dele, tudo pra juntar cem milhões de berries e comprar a liberdade da minha vila de volta. Ninguém sabia que era esse o meu plano. Deixei todo mundo achar que eu tinha virado uma pirata de verdade, sem coração.

Quando o dinheiro finalmente ficou perto do suficiente, o Arlong descobriu e rasgou o mapa que eu tinha desenhado da vila, rindo, dizendo que aquele sonho nunca ia valer nada contra ele. Foi aí que gritei por ajuda — de verdade, pela primeira vez em anos — e o Luffy apareceu.

Depois que o Arlong caiu, tirei a marca que ele tinha me obrigado a tatuar e coloquei uma tangerina com um cata-vento no lugar, o símbolo da Bell-mère. Entrei pro bando chorando, pedindo desculpa por ter mentido pra eles a viagem inteira. O Luffy só riu e disse que tanto fazia.

Hoje desenho o mapa do mundo inteiro, não só de uma vila. Cobro todo mundo do bando por qualquer coisa (é hábito, não me julguem) e ainda cuido do pomar de tangerinas que a Bell-mère plantou, agora dentro do nosso navio. Cada fruta que colho de lá é prova de que consegui: ninguém tira mais nada de mim à força de novo.
      `,
      artifacts: [
        { icon: 'Wand2',    label: 'Bastão Clima-Tact, que controla o clima' },
        { icon: 'Palette',  label: 'Tatuagem de tangerina e cata-vento no ombro' },
        { icon: 'Compass',  label: 'Mapa do mundo inteiro, sempre em construção' },
        { icon: 'Citrus',   label: 'Pomar de tangerinas da Bell-mère, replantado no navio' },
        { icon: 'Banknote', label: 'A bolsa de berries — ela cobra por tudo' },
        { icon: 'Quote',    label: '"Me ajudem... por favor!"' },
      ],
    },
    {
      id: 'usopp',
      name: 'Usopp',
      role: 'Atirador dos Chapéus de Palha · autoproclamado "Rei Atirador"',
      anilistSearch: 'Usopp',
      entry: `
Escutem bem, porque isso aqui vai ser contado por ninguém menos que o grande capitão Usopp, líder de oitenta mil hom— tá, tá bom, sou só eu, o Usopp, mentindo de novo. É hábito antigo.

Meu pai, o Yasopp, é atirador da tripulação do Shanks. Ele foi embora pro mar quando eu era pequeno, e eu esperava ele voltar sentado no píer da Vila de Syrup, inventando histórias absurdas sobre piratas pra qualquer um que passasse — principalmente pra minha mãe, a Banchina, que estava doente e nunca contei que sabia que ela não ia melhorar. Mentir virou meu jeito de fazer as pessoas sorrirem quando a verdade era demais pra aguentar.

Quero ser um "guerreiro corajoso do mar", só que sou covarde de nascença — tremo, choro, tento fugir. A diferença é que aprendi a fazer a coisa certa mesmo tremendo. Isso não sai em nenhuma história que eu conto sobre mim mesmo, mas é a parte verdadeira.

Em Water 7, discordei do Luffy sobre abandonar o Going Merry — aquele navio tinha me visto virar alguém, não ia deixar barato. Brigamos de verdade, saí do bando por orgulho, virei o "Sogeking" atrás de uma máscara pra poder voltar a ajudar sem admitir que tinha errado. Voltei. Ele nunca cobrou nada por isso.

Uso um estilingue, o Kabuto, com munição que eu mesmo invento. Ninguém no bando é páreo pra minha mira, mesmo que todo mundo zoe meu nariz e minhas histórias mirabolantes. Um dia, esse nariz vai estar em livro de história de verdade — dessa vez sem exagero nenhum.
      `,
      artifacts: [
        { icon: 'Target',  label: 'Estilingue Kabuto e as munições que ele mesmo cria' },
        { icon: 'Drama',   label: 'Máscara do "Sogeking, o Rei Atirador"' },
        { icon: 'Star',    label: 'O nariz comprido — orgulho e piada favorita da tripulação' },
        { icon: 'Flag',    label: 'Bandeira pirata que desenhou ainda criança, em Syrup Village' },
        { icon: 'Feather', label: 'Lembrança do pai, Yasopp, atirador do bando do Shanks' },
        { icon: 'Quote',   label: '"Sou um covarde... mas um covarde corajoso!"' },
      ],
    },
    {
      id: 'sanji',
      name: 'Sanji',
      role: 'Cozinheiro dos Chapéus de Palha · em busca do All Blue',
      anilistSearch: 'Sanji Vinsmoke',
      entry: `
Uma senhora nunca deveria ter que ler um diário de um homem chorando, então vou escrever isso rápido e com classe.

Fiquei preso no mar, aos nove anos, numa rocha, sem comida, por 85 dias, com o Zeff — dono do restaurante flutuante Baratie. Ele tinha comida escondida o bastante pra um de nós sobreviver. Me deu tudo. Cortou a própria perna depois, pra não morrer de fome sem me contar, só pra eu não sentir culpa de ter comido a parte dele. Devo minha vida inteira a esse velho teimoso, e passei anos cozinhando de graça no Baratie só pra tentar, sem nunca conseguir, pagar essa dívida de volta.

Meu sonho é achar o All Blue — o mar lendário onde os peixes dos quatro oceanos se encontram. Todo cozinheiro do mundo ri quando eu falo isso. Não me importo.

Luto só com as pernas. Nunca com as mãos — são ferramenta de cozinheiro, não de briga, e eu não misturo as duas coisas. E tem uma regra que não abro exceção nenhuma: nunca levanto a mão pra uma mulher, custe o que custar, e nunca deixo ninguém com fome sair da minha cozinha de estômago vazio. São as únicas duas coisas no mundo que considero realmente sagradas.

Fumo demais, tenho a sobrancelha enrolada de um jeito que ninguém mais na minha família tem (a família de sangue, os Vinsmoke — outra história, mais triste, que não vou escrever hoje), e sim, eu flerto com qualquer mulher que aparece na minha frente. O Zoro me chama de idiota por isso. Ele que tente cozinhar pra oito pessoas depois de perder uma perna aos nove anos e ver no que dá.
      `,
      artifacts: [
        { icon: 'Flame',      label: 'Perna Negra — chutes que, mais tarde, pegam fogo de verdade (Diable Jambe)' },
        { icon: 'Cigarette',  label: 'Cigarro sempre aceso' },
        { icon: 'Sparkles',   label: 'Sobrancelha em espiral' },
        { icon: 'Shirt',      label: 'Terno impecável, mesmo no meio de uma briga' },
        { icon: 'Heart',      label: 'A perna que o Zeff sacrificou por ele' },
        { icon: 'Quote',      label: '"Um homem nunca levanta a mão pra uma mulher."' },
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
