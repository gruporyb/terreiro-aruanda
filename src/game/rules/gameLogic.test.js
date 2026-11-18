import { describe, expect, it } from "vitest";
import { RULES } from "../../config/constants.js";
import { CARD_CATALOG, ELEMENT, PASSE } from "../../data/cardCatalog.js";
import { DIFFICULTIES, DIFFICULTY } from "../../data/difficulties.js";
import { createSeededRandom } from "../../utils/random.js";
import {
  GAME_STATUS,
  canPlayCard,
  createGame,
  drawCards,
  endTurn,
  getDemandAttack,
  playCard,
} from "./gameLogic.js";

const makeCard = (overrides = {}) => ({
  id: "teste#1",
  name: "Carta de teste",
  element: ELEMENT.MATA, // neutra: não sofre efeito de elemento
  cost: 2,
  power: 4,
  defense: 3,
  passe: { type: PASSE.NONE, amount: 0 },
  ...overrides,
});

const withHand = (state, hand) => ({ ...state, hand });
const newGame = (options) => createGame(createSeededRandom(42), options);
const normal = DIFFICULTIES[DIFFICULTY.NORMAL].ruleset;

describe("createGame", () => {
  it("compra a mão inicial e mantém todas as cartas no baralho", () => {
    const state = newGame();
    expect(state.hand).toHaveLength(RULES.handSize);
    expect(state.hand.length + state.drawPile.length).toBe(CARD_CATALOG.length * RULES.copiesPerCard);
    expect(state.axe).toBe(normal.startingAxe);
    expect(state.status).toBe(GAME_STATUS.PLAYING);
  });

  it("aplica o ruleset da dificuldade escolhida", () => {
    for (const { ruleset } of Object.values(DIFFICULTIES)) {
      const state = newGame({ ruleset });
      expect(state.harmony).toBe(ruleset.maxHarmony);
      expect(state.demand.health).toBe(ruleset.demand.health);
      expect(state.demand.maxHealth).toBe(ruleset.demand.health);
    }
  });

  it("quanto mais difícil, mais vida da demanda e menos Harmonia", () => {
    const easy = newGame({ ruleset: DIFFICULTIES[DIFFICULTY.EASY].ruleset });
    const hard = newGame({ ruleset: DIFFICULTIES[DIFFICULTY.HARD].ruleset });
    expect(hard.demand.health).toBeGreaterThan(easy.demand.health);
    expect(hard.harmony).toBeLessThan(easy.harmony);
  });
});

describe("elemento da demanda", () => {
  const demandOf = (element) => ({ ...newGame({ demandElement: element }) });
  const play = (element, card) =>
    playCard({ ...withHand(demandOf(element), [makeCard(card)]), axe: 6 }, "teste#1");
  const damageDealt = (element, card) => demandOf(element).demand.health - play(element, card).demand.health;

  it("sorteia um dos quatro elementos ao iniciar", () => {
    const seen = new Set();
    for (let seed = 1; seed <= 60; seed++) seen.add(createGame(createSeededRandom(seed)).demand.element);
    expect([...seen].sort()).toEqual([ELEMENT.AGUA, ELEMENT.AR, ELEMENT.FOGO, ELEMENT.TERRA].sort());
  });

  it("demanda de Fogo: Água causa +30% (para baixo)", () => {
    expect(damageDealt(ELEMENT.FOGO, { element: ELEMENT.AGUA, power: 10 })).toBe(13);
    expect(damageDealt(ELEMENT.FOGO, { element: ELEMENT.AGUA, power: 5 })).toBe(6); // 6,5 -> 6
    expect(damageDealt(ELEMENT.FOGO, { element: ELEMENT.AGUA, power: 3 })).toBe(3); // 3,9 -> 3
  });

  it("demanda de Fogo: Terra causa metade (para baixo)", () => {
    expect(damageDealt(ELEMENT.FOGO, { element: ELEMENT.TERRA, power: 6 })).toBe(3);
    expect(damageDealt(ELEMENT.FOGO, { element: ELEMENT.TERRA, power: 5 })).toBe(2); // 2,5 -> 2
    expect(damageDealt(ELEMENT.FOGO, { element: ELEMENT.TERRA, power: 1 })).toBe(0); // 0,5 -> 0
  });

  it("demanda de Fogo: Fogo, Ar e Mata causam dano normal", () => {
    for (const element of [ELEMENT.FOGO, ELEMENT.AR, ELEMENT.MATA]) {
      expect(damageDealt(ELEMENT.FOGO, { element, power: 6 })).toBe(6);
    }
  });

  it("o ciclo vale para as outras demandas (Água > Fogo > Terra > Ar > Água)", () => {
    expect(damageDealt(ELEMENT.TERRA, { element: ELEMENT.FOGO, power: 10 })).toBe(13);
    expect(damageDealt(ELEMENT.TERRA, { element: ELEMENT.AR, power: 10 })).toBe(5);
    expect(damageDealt(ELEMENT.AR, { element: ELEMENT.TERRA, power: 10 })).toBe(13);
    expect(damageDealt(ELEMENT.AR, { element: ELEMENT.AGUA, power: 10 })).toBe(5);
    expect(damageDealt(ELEMENT.AGUA, { element: ELEMENT.AR, power: 10 })).toBe(13);
    expect(damageDealt(ELEMENT.AGUA, { element: ELEMENT.FOGO, power: 10 })).toBe(5);
  });

  it("o elemento não altera defesa nem passe", () => {
    const next = play(ELEMENT.FOGO, { element: ELEMENT.TERRA, power: 4, defense: 3 });
    expect(next.shield).toBe(3);
  });
});

describe("canPlayCard", () => {
  it("recusa carta mais cara que o Axé disponível", () => {
    const state = { ...withHand(newGame(), [makeCard({ cost: 3 })]), axe: 2 };
    expect(canPlayCard(state, "teste#1").ok).toBe(false);
  });

  it("aceita carta com Axé suficiente", () => {
    expect(canPlayCard(withHand(newGame(), [makeCard()]), "teste#1").ok).toBe(true);
  });
});

describe("playCard", () => {
  it("gasta Axé, causa dano, dá proteção e aplica cura", () => {
    const state = withHand({ ...newGame(), harmony: 20 }, [
      makeCard({ passe: { type: PASSE.CURA, amount: 2 } }),
    ]);
    const next = playCard(state, "teste#1");
    expect(next.axe).toBe(normal.startingAxe - 2);
    expect(next.demand.health).toBe(normal.demand.health - 4);
    expect(next.shield).toBe(3);
    expect(next.harmony).toBe(22);
    expect(next.hand).toHaveLength(0);
    expect(next.discardPile).toHaveLength(1);
  });

  it("não ultrapassa a Harmonia máxima da dificuldade", () => {
    const ruleset = DIFFICULTIES[DIFFICULTY.EASY].ruleset;
    const state = withHand(newGame({ ruleset }), [
      makeCard({ passe: { type: PASSE.CURA, amount: 5 } }),
    ]);
    expect(playCard(state, "teste#1").harmony).toBe(ruleset.maxHarmony);
  });

  it("vence quando a demanda chega a zero", () => {
    const base = newGame();
    const state = withHand({ ...base, demand: { ...base.demand, health: 4 } }, [makeCard()]);
    const next = playCard(state, "teste#1");
    expect(next.status).toBe(GAME_STATUS.WON);
    expect(next.demand.health).toBe(0);
  });

  it("descarrego reduz o ataque da demanda", () => {
    const state = withHand(newGame(), [
      makeCard({ passe: { type: PASSE.DESCARREGO, amount: 2 } }),
    ]);
    expect(getDemandAttack(playCard(state, "teste#1"))).toBe(getDemandAttack(state) - 2);
  });

  it("guia compra cartas extras", () => {
    const state = withHand(newGame(), [
      makeCard({ passe: { type: PASSE.GUIA, amount: 1 } }),
    ]);
    const next = playCard(state, "teste#1");
    expect(next.hand).toHaveLength(1);
    expect(next.hand[0].id === "teste#1").toBe(false);
  });

  it("ignora jogadas inválidas", () => {
    const state = { ...withHand(newGame(), [makeCard()]), axe: 0 };
    expect(playCard(state, "teste#1")).toBe(state);
  });
});

describe("endTurn", () => {
  it("a proteção absorve parte do ataque e o novo giro reabastece Axé e mão", () => {
    const state = { ...newGame(), shield: 3, hand: [] };
    const next = endTurn(state, createSeededRandom(1));
    expect(next.harmony).toBe(normal.maxHarmony - (normal.demand.baseAttack - 3));
    expect(next.turn).toBe(2);
    expect(next.axe).toBe(normal.startingAxe + 1);
    expect(next.shield).toBe(0);
    expect(next.hand).toHaveLength(RULES.handSize);
  });

  it("perde quando a Harmonia chega a zero", () => {
    expect(endTurn({ ...newGame(), harmony: 3 }).status).toBe(GAME_STATUS.LOST);
  });

  it("o ataque cresce a cada giro conforme a dificuldade", () => {
    const turn3 = { ...newGame(), turn: 3 };
    expect(getDemandAttack(turn3)).toBe(normal.demand.baseAttack + normal.demand.attackGrowth * 2);
  });
});

describe("drawCards", () => {
  it("reembaralha o descarte quando o baralho acaba", () => {
    const state = {
      ...newGame(),
      hand: [],
      drawPile: [],
      discardPile: [makeCard({ id: "a" }), makeCard({ id: "b" })],
    };
    const next = drawCards(state, 2, createSeededRandom(7));
    expect(next.hand).toHaveLength(2);
    expect(next.discardPile).toHaveLength(0);
  });

  it("respeita o limite de cartas na mão", () => {
    expect(drawCards(newGame(), 20).hand).toHaveLength(RULES.handLimit);
  });
});
