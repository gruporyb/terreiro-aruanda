import { describe, expect, it } from "vitest";
import { RULES } from "../../config/constants.js";
import { PASSE } from "../../data/cardCatalog.js";
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
  element: "Terra",
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
    expect(state.hand.length + state.drawPile.length).toBe(24);
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
