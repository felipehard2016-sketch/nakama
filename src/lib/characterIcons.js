import {
  Sword, Sparkles, Banknote, Ruler, Weight, Cake, Droplet, Users,
  Briefcase, PawPrint, Palette, Tag, Shield, Gem,
} from 'lucide-react';

/*
 * Mapeia o RÓTULO de um campo da ficha (ex.: "Devil Fruit", "Bounty",
 * "Weapon") pra um ícone temático, por palavra-chave — não por
 * personagem específico, já que esses campos vêm de texto livre de
 * cada bio na AniList e variam por obra (fruta do diabo é coisa de
 * One Piece, quirk é de My Hero Academia, nen é de Hunter x Hunter...).
 * Só funciona pra campos já estruturados na bio ("__Rótulo:__ valor");
 * itens só citados no texto corrido (tipo o chapéu de palha do Luffy)
 * não têm como ser detectados assim.
 */
const RULES = [
  [/weapon|sword|blade|katana|zanpakut|spear|staff|bow\b/i, Sword],
  [/devil fruit|quirk|\bnen\b|bankai|\bstand\b|jutsu|technique|ability|power|magic|spell/i, Sparkles],
  [/bounty|reward|wanted/i, Banknote],
  [/signature|artifact|relic|treasure/i, Gem],
  [/height/i, Ruler],
  [/weight/i, Weight],
  [/birth|\bage\b/i, Cake],
  [/blood/i, Droplet],
  [/affiliat|crew|guild|clan|faction|allegiance|organization/i, Users],
  [/occupation|role|title|rank|position|class\b/i, Briefcase],
  [/species|race/i, PawPrint],
  [/hair|eye/i, Palette],
  [/nickname|alias|epithet|a\.k\.a/i, Tag],
  [/status/i, Shield],
];

export function iconForStatLabel(label) {
  const match = RULES.find(([pattern]) => pattern.test(label));
  return match?.[1] || null;
}
