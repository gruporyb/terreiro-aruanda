import { ELEMENT } from "../../data/cardCatalog.js";

/** Elementos que uma demanda pode ter (Mata é neutra: não vence nem perde para ninguém). */
export const DEMAND_ELEMENTS = Object.freeze([ELEMENT.FOGO, ELEMENT.AR, ELEMENT.TERRA, ELEMENT.AGUA]);

export const MATCHUP = Object.freeze({ STRONG: "strong", WEAK: "weak", NEUTRAL: "neutral" });

/** Texto exibido (cartas e HUD) para cada confronto. */
export const MATCHUP_LABEL = Object.freeze({ strong: "+30%", weak: "½" });

/**
 * Ciclo de elementos: a chave "vence" o valor.
 *   Água vence Fogo, Fogo vence Terra, Terra vence Ar, Ar vence Água.
 * Contra uma demanda de elemento D:
 *   - entidade que vence D causa +30% de dano (arredondado para baixo);
 *   - entidade que perde para D (D a vence) causa metade (arredondado para baixo).
 */
const BEATS = Object.freeze({
  [ELEMENT.AGUA]: ELEMENT.FOGO,
  [ELEMENT.FOGO]: ELEMENT.TERRA,
  [ELEMENT.TERRA]: ELEMENT.AR,
  [ELEMENT.AR]: ELEMENT.AGUA,
});

export function getMatchup(attackerElement, demandElement) {
  if (BEATS[attackerElement] === demandElement) return MATCHUP.STRONG;
  if (BEATS[demandElement] === attackerElement) return MATCHUP.WEAK;
  return MATCHUP.NEUTRAL;
}

/** Dano real de uma entidade contra a demanda. Sempre arredonda para baixo. */
export function effectiveDamage(power, attackerElement, demandElement) {
  switch (getMatchup(attackerElement, demandElement)) {
    case MATCHUP.STRONG:
      return Math.floor((power * 13) / 10); // +30%, em aritmética inteira (sem erro de ponto flutuante)
    case MATCHUP.WEAK:
      return Math.floor(power / 2);
    default:
      return power;
  }
}

/** Quem a demanda teme e quem ela resiste. Ex.: Fogo -> { weakTo: "Água", resists: "Terra" }. */
export function getMatchupSummary(demandElement) {
  const weakTo = Object.keys(BEATS).find((element) => BEATS[element] === demandElement);
  return { weakTo, resists: BEATS[demandElement] };
}

export const pickDemandElement = (rng = Math.random) =>
  DEMAND_ELEMENTS[Math.floor(rng() * DEMAND_ELEMENTS.length)];
