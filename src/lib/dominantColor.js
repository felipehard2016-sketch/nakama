/*
 * Extrai a cor dominante de uma imagem (client-side, via canvas) pra
 * dar identidade visual própria a cada personagem — em vez de todo
 * mundo usar o mesmo roxo genérico da marca. Sem servidor, sem API:
 * amostra os pixels da própria imagem do personagem.
 *
 * Se a imagem não permitir leitura de pixels por CORS (a maioria dos
 * CDNs de imagem não libera isso pra qualquer origem) ou falhar por
 * qualquer outro motivo, resolve pra null — quem chamar cai de volta
 * no roxo padrão da marca.
 */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToHex(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function extractDominantColor(imageUrl) {
  return new Promise(resolve => {
    if (!imageUrl) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 32; // amostra pequena — só pra pegar o "clima" de cor, não precisão
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue; // pixels transparentes não contam
          r += data[i]; g += data[i + 1]; b += data[i + 2];
          count += 1;
        }
        if (!count) { resolve(null); return; }
        r /= count; g /= count; b /= count;

        // Média de pixel costuma sair acinzentada — realça saturação e
        // trava a luminosidade numa faixa que funciona bem como acento
        // de UI (nem escura demais, nem lavada) nos dois temas.
        const { h, s } = rgbToHsl(r, g, b);
        resolve(hslToHex(h, Math.max(s, 0.5), 0.56));
      } catch {
        resolve(null); // canvas "contaminado" por CORS, ou qualquer outro erro
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
