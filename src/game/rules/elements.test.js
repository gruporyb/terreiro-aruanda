import { describe, expect, it } from "vitest";
import { ELEMENT } from "../../data/cardCatalog.js";
import { createSeededRandom } from "../../utils/random.js";
import {
  DEMAND_ELEMENTS,
  MATCHUP,
  effectiveDamage,
  getMatchup,
  getMatchupSummary,
  pickDemandElement,
} from "./elements.js";

describe("elementos", () => {
  it("regra do Fogo: Água forte, Terra fraca, demais neutros", () => {
    expect(getMatchup(ELEMENT.AGUA, ELEMENT.FOGO)).toBe(MATCHUP.STRONG);
    expect(getMatchup(ELEMENT.TERRA, ELEMENT.FOGO)).toBe(MATCHUP.WEAK);
    expect(getMatchup(ELEMENT.AR, ELEMENT.FOGO)).toBe(MATCHUP.NEUTRAL);
    expect(getMatchup(ELEMENT.FOGO, ELEMENT.FOGO)).toBe(MATCHUP.NEUTRAL);
    expect(getMatchup(ELEMENT.MATA, ELEMENT.FOGO)).toBe(MATCHUP.NEUTRAL);
  });

  it("cada elemento de demanda tem exatamente um forte e um fraco", () => {
    for (const demand of DEMAND_ELEMENTS) {
      const results = Object.values(ELEMENT).map((e) => getMatchup(e, demand));
      expect(results.filter((r) => r === MATCHUP.STRONG)).toHaveLength(1);
      expect(results.filter((r) => r === MATCHUP.WEAK)).toHaveLength(1);
    }
  });

  it("resumo para a interface", () => {
    expect(getMatchupSummary(ELEMENT.FOGO)).toEqual({ weakTo: ELEMENT.AGUA, resists: ELEMENT.TERRA });
  });

  it("arredonda sempre para baixo, sem erro de ponto flutuante", () => {
    for (const power of [0, 1, 2, 3, 4, 5, 6, 7, 10, 20, 30]) {
      expect(effectiveDamage(power, ELEMENT.AGUA, ELEMENT.FOGO)).toBe(Math.floor((power * 13) / 10));
      expect(effectiveDamage(power, ELEMENT.TERRA, ELEMENT.FOGO)).toBe(Math.floor(power / 2));
    }
    expect(effectiveDamage(10, ELEMENT.AGUA, ELEMENT.FOGO)).toBe(13);
    expect(effectiveDamage(30, ELEMENT.AGUA, ELEMENT.FOGO)).toBe(39);
  });

  it("sorteia só elementos válidos", () => {
    const rng = createSeededRandom(1);
    for (let i = 0; i < 50; i++) expect(DEMAND_ELEMENTS.includes(pickDemandElement(rng))).toBe(true);
  });
});
