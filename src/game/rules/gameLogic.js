import { RULES } from "../../config/constants.js";
import { PASSE } from "../../data/cardCatalog.js";
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "../../data/difficulties.js";
import { shuffle } from "../../utils/random.js";
import { buildDeck } from "./deck.js";

/**
 * Regras do jogo como funções puras: (estado, ação) -> novo estado.
 * Nada aqui conhece Pixi ou React, o que torna tudo testável.
 */

export const GAME_STATUS = Object.freeze({
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
});

const INITIAL_MESSAGE = "Arraste uma carta até a gira para chamar a entidade.";

/** Compra até `count` cartas, respeitando o limite de mão e reembaralhando o descarte. */
export function drawCards(state, count, rng = Math.random) {
  let { hand, drawPile, discardPile } = state;

  for (let drawn = 0; drawn < count && hand.length < RULES.handLimit; drawn++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile = shuffle(discardPile, rng);
      discardPile = [];
    }
    hand = [...hand, drawPile[0]];
    drawPile = drawPile.slice(1);
  }

  return { ...state, hand, drawPile, discardPile };
}

const drawUpToHandSize = (state, rng) =>
  drawCards(state, Math.max(0, RULES.handSize - state.hand.length), rng);

/**
 * @param {() => number} [rng]
 * @param {{ ruleset?: object, deck?: object[] | null }} [options]
 *   `ruleset`: regras da dificuldade; `deck`: baralho em ordem fixa (tutorial)
 */
export function createGame(
  rng = Math.random,
  { ruleset = DIFFICULTIES[DEFAULT_DIFFICULTY].ruleset, deck = null } = {},
) {
  const initialState = {
    ruleset,
    status: GAME_STATUS.PLAYING,
    turn: 1,
    harmony: ruleset.maxHarmony,
    shield: 0,
    weakened: 0,
    axe: ruleset.startingAxe,
    maxAxe: ruleset.startingAxe,
    demand: {
      name: ruleset.demand.name,
      health: ruleset.demand.health,
      maxHealth: ruleset.demand.health,
    },
    hand: [],
    drawPile: deck ?? buildDeck(rng),
    discardPile: [],
    message: INITIAL_MESSAGE,
  };
  return drawUpToHandSize(initialState, rng);
}

/** Dano que a demanda causará ao fim do giro atual (antes da proteção). */
export function getDemandAttack(state) {
  const { baseAttack, attackGrowth } = state.ruleset.demand;
  const attack = baseAttack + attackGrowth * (state.turn - 1) - state.weakened;
  return Math.max(0, attack);
}

/** @returns {{ ok: true } | { ok: false, reason: string }} */
export function canPlayCard(state, cardId) {
  if (state.status !== GAME_STATUS.PLAYING) {
    return { ok: false, reason: "A partida terminou." };
  }
  const card = state.hand.find((c) => c.id === cardId);
  if (!card) return { ok: false, reason: "Essa carta não está na sua mão." };
  if (card.cost > state.axe) {
    return {
      ok: false,
      reason: `Axé insuficiente: ${card.name} custa ${card.cost} e você tem ${state.axe}.`,
    };
  }
  return { ok: true };
}

function applyPasse(state, { type, amount }, rng) {
  switch (type) {
    case PASSE.CURA:
      return { ...state, harmony: Math.min(state.ruleset.maxHarmony, state.harmony + amount) };
    case PASSE.GUIA:
      return drawCards(state, amount, rng);
    case PASSE.DESCARREGO:
      return { ...state, weakened: state.weakened + amount };
    default:
      return state;
  }
}

const PASSE_MESSAGES = {
  [PASSE.CURA]: (amount) => `cura +${amount}`,
  [PASSE.GUIA]: (amount) => `guia +${amount} carta(s)`,
  [PASSE.DESCARREGO]: (amount) => `descarrego -${amount} no ataque`,
};

function describePlay(card) {
  const parts = [];
  if (card.power > 0) parts.push(`-${card.power} na demanda`);
  if (card.defense > 0) parts.push(`+${card.defense} de proteção`);
  const describePasse = PASSE_MESSAGES[card.passe.type];
  if (describePasse) parts.push(describePasse(card.passe.amount));
  return `${card.name}: ${parts.join(", ") || "firmou presença na gira"}.`;
}

export function playCard(state, cardId, rng = Math.random) {
  if (!canPlayCard(state, cardId).ok) return state;

  const card = state.hand.find((c) => c.id === cardId);
  const afterCost = {
    ...state,
    axe: state.axe - card.cost,
    hand: state.hand.filter((c) => c.id !== cardId),
    discardPile: [...state.discardPile, card],
    shield: state.shield + card.defense,
    demand: {
      ...state.demand,
      health: Math.max(0, state.demand.health - card.power),
    },
  };
  const next = applyPasse(afterCost, card.passe, rng);

  if (next.demand.health === 0) {
    return {
      ...next,
      status: GAME_STATUS.WON,
      message: `${card.name} desfez a demanda!`,
    };
  }
  return { ...next, message: describePlay(card) };
}

export function endTurn(state, rng = Math.random) {
  if (state.status !== GAME_STATUS.PLAYING) return state;

  const attack = getDemandAttack(state);
  const blocked = Math.min(state.shield, attack);
  const damage = attack - blocked;
  const harmony = Math.max(0, state.harmony - damage);

  if (harmony === 0) {
    return {
      ...state,
      harmony,
      shield: 0,
      status: GAME_STATUS.LOST,
      message: `A demanda atacou com ${attack} e a Harmonia se esgotou.`,
    };
  }

  const maxAxe = Math.min(RULES.maxAxe, state.maxAxe + 1);
  const nextTurn = {
    ...state,
    harmony,
    shield: 0,
    turn: state.turn + 1,
    maxAxe,
    axe: maxAxe,
    message: `A demanda atacou com ${attack}; sua proteção bloqueou ${blocked}. Harmonia -${damage}.`,
  };
  return drawUpToHandSize(nextTurn, rng);
}
