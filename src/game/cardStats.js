import { PASSE } from "../data/cardCatalog.js";

const PASSE_ICON = {
  [PASSE.CURA]: "cura",
  [PASSE.GUIA]: "guia",
  [PASSE.DESCARREGO]: "descarrego",
};

const PASSE_SIGN = {
  [PASSE.CURA]: "+",
  [PASSE.GUIA]: "+",
  [PASSE.DESCARREGO]: "-",
};

/**
 * Atributos da carta como colunas ícone + valor, sempre na ordem
 * ataque, defesa, passe. `isActive` falso = atributo zerado (exibido esmaecido).
 * @returns {{ icon: string | null, value: string, isActive: boolean }[]}
 */
export function getCardStats(card) {
  const { type, amount } = card.passe;
  const hasPasse = type in PASSE_ICON;

  return [
    { icon: "attack", value: String(card.power), isActive: card.power > 0 },
    { icon: "defense", value: String(card.defense), isActive: card.defense > 0 },
    hasPasse
      ? { icon: PASSE_ICON[type], value: `${PASSE_SIGN[type]}${amount}`, isActive: true }
      : { icon: null, value: "—", isActive: false },
  ];
}
