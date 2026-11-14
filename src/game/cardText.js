import { PASSE } from "../data/cardCatalog.js";

const PASSE_LABELS = {
  [PASSE.CURA]: (amount) => `Cura +${amount}`,
  [PASSE.GUIA]: (amount) => `Guia +${amount}`,
  [PASSE.DESCARREGO]: (amount) => `Descarrego -${amount}`,
};

export function describePasse({ type, amount }) {
  const label = PASSE_LABELS[type];
  return label ? label(amount) : "—";
}

/** Texto de atributos exibido na carta. */
export function formatStats(card) {
  return [
    `Força: ${card.power}`,
    `Defesa: ${card.defense}`,
    `Passe: ${describePasse(card.passe)}`,
  ].join("\n");
}
