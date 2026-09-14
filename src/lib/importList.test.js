import { describe, it, expect } from 'vitest';
import { parseMalXml, ANILIST_STATUS_MAP, MAL_STATUS_MAP } from './importList';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<myanimelist>
  <anime>
    <series_animedb_id>16498</series_animedb_id>
    <series_title><![CDATA[Shingeki no Kyojin]]></series_title>
    <my_watched_episodes>25</my_watched_episodes>
    <my_score>9</my_score>
    <my_status>Completed</my_status>
  </anime>
  <anime>
    <series_animedb_id>1</series_animedb_id>
    <series_title><![CDATA[Cowboy Bebop]]></series_title>
    <my_watched_episodes>0</my_watched_episodes>
    <my_score>0</my_score>
    <my_status>Plan to Watch</my_status>
  </anime>
  <manga>
    <series_mangadb_id>656</series_mangadb_id>
    <series_title><![CDATA[Fullmetal Alchemist]]></series_title>
    <my_read_chapters>108</my_read_chapters>
    <my_score>10</my_score>
    <my_status>Reading</my_status>
  </manga>
</myanimelist>`;

describe('parseMalXml', () => {
  it('extrai anime e mangá do mesmo arquivo', () => {
    const parsed = parseMalXml(SAMPLE_XML);
    expect(parsed).toHaveLength(3);
    expect(parsed.filter(e => e.type === 'anime')).toHaveLength(2);
    expect(parsed.filter(e => e.type === 'manga')).toHaveLength(1);
  });

  it('decodifica CDATA no título', () => {
    const [first] = parseMalXml(SAMPLE_XML);
    expect(first.title).toBe('Shingeki no Kyojin');
  });

  it('mapeia status do MAL pro status do app corretamente por tipo', () => {
    const parsed = parseMalXml(SAMPLE_XML);
    expect(parsed.find(e => e.malId === 16498).status).toBe('completed');
    expect(parsed.find(e => e.malId === 1).status).toBe('planned');
    expect(parsed.find(e => e.malId === 656).status).toBe('watching'); // "Reading" -> watching
  });

  it('nota 0 (sem nota no MAL) vira 0, não é tratada aqui como null — quem decide isso é o import', () => {
    const parsed = parseMalXml(SAMPLE_XML);
    expect(parsed.find(e => e.malId === 1).score).toBe(0);
  });

  it('progresso lê episódios pra anime e capítulos pra mangá', () => {
    const parsed = parseMalXml(SAMPLE_XML);
    expect(parsed.find(e => e.malId === 16498).progress).toBe(25);
    expect(parsed.find(e => e.malId === 656).progress).toBe(108);
  });

  it('entrada sem id de MAL (malformada) é descartada em vez de virar um item quebrado', () => {
    const xml = `<myanimelist><anime><series_title>Sem id</series_title></anime></myanimelist>`;
    expect(parseMalXml(xml)).toEqual([]);
  });

  it('arquivo vazio ou sem entradas não quebra', () => {
    expect(parseMalXml('<myanimelist></myanimelist>')).toEqual([]);
    expect(parseMalXml('')).toEqual([]);
  });

  it('status desconhecido/ausente cai em "planned" em vez de undefined', () => {
    const xml = `<myanimelist><anime><series_animedb_id>5</series_animedb_id><series_title>X</series_title><my_status>Rewatching</my_status></anime></myanimelist>`;
    expect(parseMalXml(xml)[0].status).toBe('planned');
  });
});

describe('mapas de status', () => {
  it('ANILIST_STATUS_MAP cobre os 6 status reais da AniList', () => {
    for (const s of ['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING']) {
      expect(ANILIST_STATUS_MAP[s]).toBeTruthy();
    }
  });

  it('MAL_STATUS_MAP tem conjuntos diferentes pra anime (Watching) e mangá (Reading)', () => {
    expect(MAL_STATUS_MAP.anime.Watching).toBe('watching');
    expect(MAL_STATUS_MAP.manga.Reading).toBe('watching');
    expect(MAL_STATUS_MAP.anime.Reading).toBeUndefined();
  });
});
