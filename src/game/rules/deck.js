import { RULES } from "../../config/constants.js";
import { CARD_CATALOG } from "../../data/cardCatalog.js";
import { shuffle } from "../../utils/random.js";

const createCard = (template, copy) => ({
  ...template,
  id: `${template.id}#${copy}`,
  templateId: template.id,
});

/** Baralho completo (cópias de cada carta), embaralhado. */
export function buildDeck(rng = Math.random) {
  const cards = CARD_CATALOG.flatMap((template) =>
    Array.from({ length: RULES.copiesPerCard }, (_, index) => createCard(template, index + 1)),
  );
  return shuffle(cards, rng);
}

/** Baralho em ordem fixa (uma cópia por id), usado pelo tutorial. */
export function buildDeckFromTemplates(templateIds) {
  return templateIds.map((templateId) => {
    const template = CARD_CATALOG.find((card) => card.id === templateId);
    if (!template) throw new Error(`Carta desconhecida: "${templateId}"`);
    return createCard(template, 1);
  });
}
