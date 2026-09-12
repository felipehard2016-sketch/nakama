import { describe, it, expect } from 'vitest';
import { stripHtml, cleanAniListText, parseCharacterBio, formatCountdown } from './format';

describe('stripHtml', () => {
  it('troca <br> por quebra de linha', () => {
    expect(stripHtml('linha 1<br>linha 2<br/>linha 3')).toBe('linha 1\nlinha 2\nlinha 3');
  });

  it('remove outras tags sem deixar rastro', () => {
    expect(stripHtml('<i>itálico</i> e <b>negrito</b>')).toBe('itálico e negrito');
  });

  it('não quebra com string vazia ou undefined', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml(undefined)).toBe('');
  });
});

describe('cleanAniListText', () => {
  it('remove marcadores de spoiler mas mantém o texto visível', () => {
    expect(cleanAniListText('Ele descobre que ~!é o vilão!~ no final.'))
      .toBe('Ele descobre que é o vilão no final.');
  });

  it('remove spoiler que atravessa múltiplas linhas', () => {
    const raw = 'Início.\n~!Segredo\nem duas linhas!~\nFim.';
    expect(cleanAniListText(raw)).toBe('Início.\nSegredo\nem duas linhas\nFim.');
  });
});

describe('parseCharacterBio', () => {
  it('separa o bloco de stats (__Rótulo:__ valor) do resto da bio', () => {
    const raw = '__Altura:__ 180cm\n__Idade:__ 25\n\nEle é o protagonista da história.';
    const { stats, paragraphs } = parseCharacterBio(raw);
    expect(stats).toEqual([
      { label: 'Altura', value: '180cm' },
      { label: 'Idade', value: '25' },
    ]);
    expect(paragraphs).toEqual(['Ele é o protagonista da história.']);
  });

  it('lida com bio sem nenhum stat (só prosa)', () => {
    const { stats, paragraphs } = parseCharacterBio('Só um parágrafo solto, sem ficha.');
    expect(stats).toEqual([]);
    expect(paragraphs).toEqual(['Só um parágrafo solto, sem ficha.']);
  });

  it('para de coletar stats assim que a primeira linha não bate no formato', () => {
    // Regressão: uma linha de prosa que por acaso contém "__" no meio
    // não pode ser lida como stat nem "vazar" pro bloco de stats.
    const raw = '__Altura:__ 180cm\nDepois disso, ele __nunca__ mais foi o mesmo.';
    const { stats, paragraphs } = parseCharacterBio(raw);
    expect(stats).toEqual([{ label: 'Altura', value: '180cm' }]);
    expect(paragraphs).toEqual(['Depois disso, ele __nunca__ mais foi o mesmo.']);
  });

  it('bio vazia ou nula retorna listas vazias, nunca quebra', () => {
    expect(parseCharacterBio('')).toEqual({ stats: [], paragraphs: [] });
    expect(parseCharacterBio(null)).toEqual({ stats: [], paragraphs: [] });
    expect(parseCharacterBio(undefined)).toEqual({ stats: [], paragraphs: [] });
  });

  it('separa parágrafos em linhas em branco duplas', () => {
    const raw = 'Parágrafo um.\n\nParágrafo dois.\n\n\nParágrafo três.';
    const { paragraphs } = parseCharacterBio(raw);
    expect(paragraphs).toEqual(['Parágrafo um.', 'Parágrafo dois.', 'Parágrafo três.']);
  });
});

describe('formatCountdown', () => {
  it('retorna "no ar" quando já passou do horário (segundos <= 0)', () => {
    expect(formatCountdown(0)).toBe('no ar');
    expect(formatCountdown(-30)).toBe('no ar');
  });

  it('formata em dias e horas quando falta mais de um dia', () => {
    // 2 dias e 3 horas
    expect(formatCountdown(2 * 86400 + 3 * 3600)).toBe('em 2d 3h');
  });

  it('formata em horas e minutos quando falta menos de um dia', () => {
    // 4 horas e 30 minutos
    expect(formatCountdown(4 * 3600 + 30 * 60)).toBe('em 4h 30min');
  });

  it('não conta minutos/segundos residuais como um dia inteiro', () => {
    // 23h59min — deve ficar em "horas", não virar "1d"
    expect(formatCountdown(23 * 3600 + 59 * 60)).toBe('em 23h 59min');
  });
});
