import { describe, expect, it } from "vitest";
import { PASSE } from "../data/cardCatalog.js";
import { getCardStats } from "./cardStats.js";

const card = (overrides = {}) => ({
  power: 4,
  defense: 3,
  passe: { type: PASSE.CURA, amount: 2 },
  ...overrides,
});

describe("getCardStats", () => {
  it("devolve ataque, defesa e passe, nessa ordem", () => {
    const [attack, defense, passe] = getCardStats(card());
    expect(attack).toEqual({ icon: "attack", value: "4", isActive: true });
    expect(defense).toEqual({ icon: "defense", value: "3", isActive: true });
    expect(passe).toEqual({ icon: "cura", value: "+2", isActive: true });
  });

  it("atributos zerados ficam inativos", () => {
    const [attack, defense] = getCardStats(card({ power: 0, defense: 0 }));
    expect(attack.isActive).toBe(false);
    expect(defense.isActive).toBe(false);
  });

  it("cada tipo de passe tem ícone e sinal próprios", () => {
    expect(getCardStats(card({ passe: { type: PASSE.GUIA, amount: 1 } }))[2]).toEqual({ icon: "guia", value: "+1", isActive: true });
    expect(getCardStats(card({ passe: { type: PASSE.DESCARREGO, amount: 1 } }))[2]).toEqual({ icon: "descarrego", value: "-1", isActive: true });
  });

  it("sem passe mostra um traço esmaecido e sem ícone", () => {
    expect(getCardStats(card({ passe: { type: PASSE.NONE, amount: 0 } }))[2]).toEqual({ icon: null, value: "—", isActive: false });
  });
});
