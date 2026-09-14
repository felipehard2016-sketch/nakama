/*
 * Lista de artefatos a buscar — (personagem, anime, wiki, termo de busca,
 * arquivo de destino). `wiki` é o subdomínio da Fandom (ex.: "onepiece"
 * → onepiece.fandom.com). `filename` é relativo a public/artifacts/ e
 * precisa bater com o campo `image` já cadastrado em
 * src/data/characterDiaries.js — o script só BAIXA o arquivo pro caminho
 * certo, não mexe nos dados do personagem.
 *
 * Comece sempre pelo lote de um personagem por vez (ver
 * fetchArtifactImages.js --manifest), pra revisar a qualidade antes de
 * rodar em escala.
 */

export const LUFFY_ARTIFACTS = [
  {
    character: 'Monkey D. Luffy',
    anime: 'One Piece',
    wiki: 'onepiece',
    artifactLabel: 'Chapéu de palha, emprestado do Shanks',
    searchTerm: 'Straw Hat',
    filename: 'one-piece/chapeu-palha.png',
  },
  {
    character: 'Monkey D. Luffy',
    anime: 'One Piece',
    wiki: 'onepiece',
    artifactLabel: 'Fruta Gomu Gomu (Hito Hito no Mi, Modelo Nika)',
    searchTerm: 'Gomu Gomu no Mi',
    filename: 'one-piece/fruta-gomu-gomu.png',
  },
  {
    character: 'Monkey D. Luffy',
    anime: 'One Piece',
    wiki: 'onepiece',
    artifactLabel: 'Cicatriz embaixo do olho esquerdo',
    // Não é item, é marca no corpo — não deve ter página própria.
    // Usa a página do personagem como melhor tentativa; se a imagem
    // principal não mostrar a cicatriz claramente, fica pendente.
    searchTerm: 'Monkey D. Luffy',
    filename: 'one-piece/cicatriz-olho.png',
    lowConfidence: true,
  },
  {
    character: 'Monkey D. Luffy',
    anime: 'One Piece',
    wiki: 'onepiece',
    artifactLabel: 'Cicatriz em X no peito, de Marineford',
    searchTerm: 'Monkey D. Luffy',
    filename: 'one-piece/cicatriz-peito.png',
    lowConfidence: true,
  },
  {
    character: 'Monkey D. Luffy',
    anime: 'One Piece',
    wiki: 'onepiece',
    artifactLabel: 'Sandálias — nunca usou outro tipo de calçado',
    searchTerm: 'Sandals',
    filename: 'one-piece/sandalias.png',
    lowConfidence: true,
  },
  {
    character: 'Monkey D. Luffy',
    anime: 'One Piece',
    wiki: 'onepiece',
    artifactLabel: 'Os copos quebrados do juramento com Ace e Sabo',
    searchTerm: 'Sworn Brothers',
    filename: 'one-piece/copos-juramento.png',
    lowConfidence: true,
  },
];

/** Registro central — cada personagem novo entra aqui como uma chave. */
export const MANIFESTS = {
  luffy: LUFFY_ARTIFACTS,
};
