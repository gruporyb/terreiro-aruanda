import { CARD_CATALOG, ELEMENT } from "../../data/cardCatalog.js";
import { TUTORIAL_RULESET } from "../../data/difficulties.js";
import { buildDeckFromTemplates } from "../rules/deck.js";
import { createGame } from "../rules/gameLogic.js";

/** Mão inicial fixa: cada carta ensina uma ideia do jogo. */
const OPENING_HAND = [
  "ze-do-coco",
  "pai-joaquim",
  "vovo-maria-conga",
  "ere-cosminho",
  "caboclo-sete-matas",
];

export function createTutorialGame(rng = Math.random) {
  const others = CARD_CATALOG.map((card) => card.id).filter((id) => !OPENING_HAND.includes(id));
  const deck = buildDeckFromTemplates([...OPENING_HAND, ...others]);
  const game = createGame(rng, { ruleset: TUTORIAL_RULESET, deck, demandElement: ELEMENT.FOGO });
  return { ...game, message: "Siga as dicas do tutorial." };
}
