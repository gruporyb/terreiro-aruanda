import { RULES } from "../../config/constants.js";
import { PASSE } from "../../data/cardCatalog.js";
import { shuffle } from "../../utils/random.js";
import { buildDeck } from "../rules/deck.js";
import { MATCHUP, effectiveDamage, getMatchup, pickDemandElement } from "../rules/elements.js";
import { drawCards } from "../rules/gameLogic.js";
import { PVP_RULES, ROLE, axeForRound, opponentOf } from "./pvpRules.js";

/**
 * Regras do duelo online como funções puras: (duelo, ação) -> novo duelo.
 * Quem chama (o servidor) valida o tempo; aqui só valem as regras do jogo.
 *
 * Toda ação devolve `{ ok: true, duel, events }` ou `{ ok: false, error }`.
 * `events` descreve o que aconteceu, para o cliente animar e narrar.
 */

export const DUEL_PHASE = Object.freeze({ MULLIGAN: "mulligan", PLAYING: "playing", ENDED: "ended" });
export const END_REASON = Object.freeze({ LIFE: "life", ABANDON: "abandon" });

const fail = (error) => ({ ok: false, error });
const succeed = (duel, events) => ({ ok: true, duel, events });
const withPlayer = (duel, role, player) => ({
  ...duel,
  players: { ...duel.players, [role]: player },
});

/** Dados públicos de uma carta (o que o adversário pode ver ao ser jogada). */
const publicCard = ({ id, templateId, name, element, cost, power, defense, passe }) => ({
  id,
  templateId,
  name,
  element,
  cost,
  power,
  defense,
  passe,
});

function createPlayer(role, rng, rules) {
  const dealt = drawCards({ hand: [], drawPile: buildDeck(rng), discardPile: [] }, RULES.handSize, rng);
  return {
    role,
    life: rules.maxLife,
    maxLife: rules.maxLife,
    shield: 0,
    axe: 0,
    maxAxe: 0,
    hand: dealt.hand,
    drawPile: dealt.drawPile,
    discardPile: [],
    mulliganDone: false,
  };
}

/**
 * Novo duelo, já na fase de troca de cartas. Cada jogador tem seu baralho
 * embaralhado e 5 cartas; a Demanda recebe um elemento sorteado.
 */
export function createDuel(rng = Math.random, rules = PVP_RULES, { demandElement = null } = {}) {
  return {
    rules,
    phase: DUEL_PHASE.MULLIGAN,
    round: 1,
    active: null,
    demandElement: demandElement ?? pickDemandElement(rng),
    players: {
      [ROLE.TERREIRO]: createPlayer(ROLE.TERREIRO, rng, rules),
      [ROLE.DEMANDA]: createPlayer(ROLE.DEMANDA, rng, rules),
    },
    winner: null,
    endReason: null,
  };
}

/** Começa o turno de `role`: a proteção anterior expira, o Axé renova e a mão é reposta. */
function beginTurn(duel, role, rng) {
  const axe = axeForRound(duel.round, duel.rules);
  const refreshed = { ...duel.players[role], shield: 0, axe, maxAxe: axe };
  const missing = Math.max(0, RULES.handSize - refreshed.hand.length);
  const player = drawCards(refreshed, missing, rng);

  return {
    duel: withPlayer({ ...duel, active: role }, role, player),
    event: { type: "turnStart", role, round: duel.round },
  };
}

function startPlaying(duel, rng) {
  const { duel: started, event } = beginTurn({ ...duel, phase: DUEL_PHASE.PLAYING, round: 1 }, duel.rules.firstRole, rng);
  return { duel: started, events: [event] };
}

/**
 * Troca de cartas da primeira rodada: devolve até `mulliganMax` cartas ao
 * baralho e compra o mesmo número. Quando os dois confirmam, o duelo começa.
 */
export function submitMulligan(duel, role, cardIds, rng = Math.random) {
  if (duel.phase !== DUEL_PHASE.MULLIGAN) return fail("A troca de cartas já terminou.");

  const player = duel.players[role];
  if (player.mulliganDone) return fail("Você já confirmou a troca.");
  if (!Array.isArray(cardIds)) return fail("Escolha inválida de cartas.");
  if (new Set(cardIds).size !== cardIds.length) return fail("Cartas repetidas na troca.");
  if (cardIds.length > duel.rules.mulliganMax) {
    return fail(`Você pode trocar no máximo ${duel.rules.mulliganMax} cartas.`);
  }
  if (!cardIds.every((id) => player.hand.some((card) => card.id === id))) {
    return fail("Uma das cartas escolhidas não está na sua mão.");
  }

  const returned = player.hand.filter((card) => cardIds.includes(card.id));
  const kept = player.hand.filter((card) => !cardIds.includes(card.id));
  // Compra primeiro; só depois as cartas devolvidas voltam e o baralho é embaralhado.
  const drawn = player.drawPile.slice(0, returned.length);
  const drawPile = shuffle([...player.drawPile.slice(returned.length), ...returned], rng);

  const updated = withPlayer(duel, role, {
    ...player,
    hand: [...kept, ...drawn],
    drawPile,
    mulliganDone: true,
  });
  const events = [{ type: "mulliganDone", role, swapped: returned.length }];

  return finishMulliganIfReady(updated, events, rng);
}

/** Tempo da troca esgotado: quem não confirmou mantém a mão. */
export function resolveMulliganTimeout(duel, rng = Math.random) {
  if (duel.phase !== DUEL_PHASE.MULLIGAN) return fail("A troca de cartas já terminou.");

  let current = duel;
  const events = [];
  for (const role of Object.values(ROLE)) {
    if (current.players[role].mulliganDone) continue;
    current = withPlayer(current, role, { ...current.players[role], mulliganDone: true });
    events.push({ type: "mulliganDone", role, swapped: 0 });
  }
  return finishMulliganIfReady(current, events, rng);
}

function finishMulliganIfReady(duel, events, rng) {
  const bothDone = Object.values(duel.players).every((player) => player.mulliganDone);
  if (!bothDone) return succeed(duel, events);

  const started = startPlaying(duel, rng);
  return succeed(started.duel, [...events, ...started.events]);
}

function validateTurnAction(duel, role) {
  if (duel.phase !== DUEL_PHASE.PLAYING) return "A partida não está em andamento.";
  if (duel.active !== role) return "Não é a sua vez.";
  return null;
}

/**
 * Joga uma carta. Ordem dos efeitos:
 *  1. Descarrego remove proteção do adversário;
 *  2. o Ataque atinge o adversário (a proteção absorve primeiro);
 *  3. Defesa e Cura valem para quem jogou; Guia compra cartas.
 * O elemento da Demanda só afeta o dano das entidades do Terreiro.
 */
export function playCard(duel, role, cardId, rng = Math.random) {
  const turnError = validateTurnAction(duel, role);
  if (turnError) return fail(turnError);

  const me = duel.players[role];
  const card = me.hand.find((candidate) => candidate.id === cardId);
  if (!card) return fail("Essa carta não está na sua mão.");
  if (card.cost > me.axe) return fail(`Axé insuficiente: ${card.name} custa ${card.cost} e você tem ${me.axe}.`);

  const foeRole = opponentOf(role);
  const foe = duel.players[foeRole];

  const stripped = card.passe.type === PASSE.DESCARREGO ? Math.min(foe.shield, card.passe.amount) : 0;
  const shieldAfterStrip = foe.shield - stripped;

  const hasElementRule = role === ROLE.TERREIRO;
  const matchup = hasElementRule ? getMatchup(card.element, duel.demandElement) : MATCHUP.NEUTRAL;
  const damage = hasElementRule ? effectiveDamage(card.power, card.element, duel.demandElement) : card.power;
  const absorbed = Math.min(shieldAfterStrip, damage);
  const lifeDamage = damage - absorbed;

  const healed = card.passe.type === PASSE.CURA ? Math.min(me.maxLife - me.life, card.passe.amount) : 0;

  const afterPlay = {
    ...me,
    axe: me.axe - card.cost,
    hand: me.hand.filter((candidate) => candidate.id !== cardId),
    discardPile: [...me.discardPile, card],
    shield: me.shield + card.defense,
    life: me.life + healed,
  };
  const me2 = card.passe.type === PASSE.GUIA ? drawCards(afterPlay, card.passe.amount, rng) : afterPlay;
  const foe2 = { ...foe, shield: shieldAfterStrip - absorbed, life: Math.max(0, foe.life - lifeDamage) };

  let next = withPlayer(withPlayer(duel, role, me2), foeRole, foe2);
  const events = [
    {
      type: "cardPlayed",
      role,
      card: publicCard(card),
      damage,
      matchup,
      absorbed,
      lifeDamage,
      healed,
      stripped,
      drew: me2.hand.length - afterPlay.hand.length,
    },
  ];

  if (foe2.life === 0) {
    next = { ...next, phase: DUEL_PHASE.ENDED, winner: role, endReason: END_REASON.LIFE };
    events.push({ type: "duelEnd", winner: role, reason: END_REASON.LIFE });
  }
  return succeed(next, events);
}

/** Encerra o turno de `role` (por escolha ou por tempo) e começa o do adversário. */
export function endTurn(duel, role, rng = Math.random, reason = "manual") {
  const turnError = validateTurnAction(duel, role);
  if (turnError) return fail(turnError);

  const nextRole = opponentOf(role);
  // A rodada avança quando a vez volta a quem abre o duelo.
  const round = nextRole === duel.rules.firstRole ? duel.round + 1 : duel.round;
  const { duel: next, event } = beginTurn({ ...duel, round }, nextRole, rng);

  return succeed(next, [{ type: "turnEnd", role, reason }, event]);
}

/** Quem abandona (ou cai) perde; o adversário vence. */
export function forfeit(duel, loserRole) {
  if (duel.phase === DUEL_PHASE.ENDED) return fail("A partida já terminou.");
  const winner = opponentOf(loserRole);
  return succeed(
    { ...duel, phase: DUEL_PHASE.ENDED, winner, endReason: END_REASON.ABANDON },
    [{ type: "duelEnd", winner, reason: END_REASON.ABANDON }],
  );
}

/**
 * O que um jogador pode ver: a própria mão completa e, do adversário, só
 * números (nunca as cartas). `timer` vem do servidor: { kind, remainingMs, totalMs }.
 */
export function viewFor(duel, role, timer = null) {
  const me = duel.players[role];
  const foe = duel.players[opponentOf(role)];
  const youWon = duel.winner === role;

  return {
    phase: duel.phase,
    round: duel.round,
    active: duel.active,
    demandElement: duel.demandElement,
    timer,
    winner: duel.winner ? (youWon ? "you" : "opponent") : null,
    endReason: duel.endReason,
    you: {
      role,
      life: me.life,
      maxLife: me.maxLife,
      shield: me.shield,
      axe: me.axe,
      maxAxe: me.maxAxe,
      hand: me.hand,
      deckCount: me.drawPile.length,
      mulliganDone: me.mulliganDone,
    },
    opponent: {
      role: foe.role,
      life: foe.life,
      maxLife: foe.maxLife,
      shield: foe.shield,
      axe: foe.axe,
      maxAxe: foe.maxAxe,
      handCount: foe.hand.length,
      deckCount: foe.drawPile.length,
      mulliganDone: foe.mulliganDone,
    },
  };
}
