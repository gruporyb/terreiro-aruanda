/** Catálogo de cartas. Cada carta é um modelo; o baralho cria cópias com ids únicos. */

export const ELEMENT = Object.freeze({
  TERRA: "Terra",
  AGUA: "Água",
  FOGO: "Fogo",
  AR: "Ar",
  MATA: "Mata",
});

/** Passe: efeito extra ao jogar a carta. */
export const PASSE = Object.freeze({
  NONE: "none",
  CURA: "cura", // restaura Harmonia
  GUIA: "guia", // compra cartas
  DESCARREGO: "descarrego", // enfraquece o ataque da demanda
});

const card = (id, name, element, cost, power, defense, type = PASSE.NONE, amount = 0) =>
  Object.freeze({
    id,
    name,
    element,
    cost,
    power,
    defense,
    passe: Object.freeze({ type, amount }),
  });

export const CARD_CATALOG = Object.freeze([
  card("caboclo-sete-matas", "Caboclo Sete Matas", ELEMENT.TERRA, 2, 4, 3, PASSE.CURA, 2),
  card("vovo-maria-conga", "Vovó Maria Conga", ELEMENT.AGUA, 1, 0, 2, PASSE.CURA, 3),
  card("ere-cosminho", "Erê Cosminho", ELEMENT.AR, 1, 2, 0, PASSE.GUIA, 1),
  card("exu-sete-encruzilhadas", "Exu Sete Encruzilhadas", ELEMENT.FOGO, 3, 7, 1, PASSE.DESCARREGO, 1),
  card("cigana-esmeralda", "Cigana Esmeralda", ELEMENT.AR, 2, 3, 1, PASSE.GUIA, 1),
  card("ze-da-boiada", "Zé da Boiada", ELEMENT.TERRA, 2, 5, 2),
  card("martim-pescador", "Martim Pescador", ELEMENT.AGUA, 2, 3, 2, PASSE.CURA, 1),
  card("ze-do-coco", "Zé do Coco", ELEMENT.FOGO, 1, 3, 0),
  card("caboclo-sete-flechas", "Caboclo Sete Flechas", ELEMENT.MATA, 3, 6, 2, PASSE.DESCARREGO, 1),
  card("pai-joaquim", "Pai Joaquim", ELEMENT.TERRA, 1, 1, 3, PASSE.CURA, 1),
  card("caboclo-pena-branca", "Caboclo Pena Branca", ELEMENT.MATA, 2, 3, 2, PASSE.CURA, 2),
  card("exu-tranca-ruas", "Exu Tranca-Ruas", ELEMENT.FOGO, 2, 4, 3),
]);
