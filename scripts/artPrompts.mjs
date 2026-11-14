/**
 * Prompts das ilustrações. As entidades da Umbanda são figuras sagradas:
 * os prompts pedem representações dignas e respeitosas, sem caricatura.
 * Chave = id da carta em src/data/cardCatalog.js.
 */

export const STYLE_GUIDE = [
  "Illustration style: hand-painted digital illustration with soft watercolor texture and clean shapes,",
  "warm earthy palette, gentle natural light, a single centered character portrait (waist-up),",
  "simple atmospheric background, wide landscape composition (3:2).",
  "Dignified, respectful and reverent tone; no caricature, no mockery.",
  "Absolutely no text, no letters, no numbers, no logos, no watermark, no card frame or border.",
].join(" ");

export const ENTITY_PROMPTS = {
  "caboclo-sete-matas":
    "Caboclo spirit guide of Brazilian Umbanda, an Indigenous-inspired guardian of the forest: green and ochre feather headdress, calm determined gaze, standing among dense Atlantic forest trees (mata). Element: Earth.",
  "vovo-maria-conga":
    "Preta Velha, an elderly African-Brazilian spirit grandmother of Umbanda, seated on a small wooden stool: white headscarf and white cotton dress, holding a wooden pipe (cachimbo) and a rosary, warm gentle smile, a calm river behind her. Element: Water.",
  "ere-cosminho":
    "Erê, a joyful child spirit of Umbanda, playing with colorful candies and a spinning top, kites dancing in the wind, bright playful colors, innocent and cheerful. Element: Air.",
  "exu-sete-encruzilhadas":
    "Exu, guardian of the crossroads in Umbanda, depicted as a noble protector (not demonic, no horns): elegant black cape and top hat, red and black attire, standing at a crossroads at dusk among lit candles and warm flames. Element: Fire.",
  "cigana-esmeralda":
    "A Cigana spirit guide (Povo Cigano of Umbanda): emerald-green shawl, gold coin jewelry, holding a crystal ball and a deck of cards, scarves moving in the wind, starry night. Element: Air.",
  "ze-da-boiada":
    "Boiadeiro spirit of Umbanda, a Brazilian sertão cattle herder: leather hat and vest, holding a berrante horn and a lasso, cattle on dry plains at sunset, earthy browns. Element: Earth.",
  "martim-pescador":
    "Marinheiro spirit of Umbanda, a sailor in a white and blue uniform, calm sea at dawn, a small wooden boat and fishing net, a kingfisher bird (martim-pescador) perched nearby. Element: Water.",
  "ze-do-coco":
    "Baiano spirit of Umbanda, a cheerful northeastern Brazilian man from Bahia: straw hat, holding a fresh green coconut, a warm bonfire with glowing sparks behind him, festive but respectful. Element: Fire.",
  "caboclo-sete-flechas":
    "Caboclo spirit archer of Umbanda, an Indigenous-inspired forest guardian with a bow and a quiver holding seven arrows, feathered headdress, focused gaze, deep green forest. Element: Forest.",
  "pai-joaquim":
    "Preto Velho, an elderly wise African-Brazilian spirit of Umbanda, white beard and white clothes, seated on a wooden stool with a cane, a pipe (cachimbo) and a rosary, serene kind expression, earthy tones. Element: Earth.",
  "caboclo-pena-branca":
    "Caboclo Pena Branca of Umbanda, an Indigenous-inspired healer with a white feather headdress, holding healing herbs in a forest clearing, serene and wise. Element: Forest.",
  "exu-tranca-ruas":
    "Exu Tranca-Ruas, guardian of the streets in Umbanda, depicted as a noble protector (not demonic, no horns): black and red cape, holding a cane, standing firm at a crossroads gate with lit candles. Element: Fire.",
};
