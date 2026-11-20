import {
  DUEL_PHASE,
  createDuel,
  endTurn,
  forfeit,
  playCard,
  resolveMulliganTimeout,
  submitMulligan,
  viewFor,
} from "../src/game/pvp/duel.js";
import { PVP_RULES, ROLE, opponentOf, publicRules } from "../src/game/pvp/pvpRules.js";
import { CLIENT, SERVER } from "./protocol.js";
import { realScheduler } from "./scheduler.js";

const TIMER = Object.freeze({ MULLIGAN: "mulligan", TURN: "turn" });
const ROLES = Object.values(ROLE);

/**
 * Uma partida entre dois jogadores. O servidor é a única fonte da verdade:
 * os clientes enviam intenções (trocar, jogar, encerrar) e recebem a visão
 * atualizada. O relógio do turno também é daqui: ao zerar, o turno passa.
 */
export class Match {
  #id;
  #players;
  #rng;
  #scheduler;
  #rules;
  #onEnd;
  #duel = null;
  #isOver = false;
  #timer = { handle: null, kind: null, deadline: 0, totalMs: 0 };

  /**
   * @param {object} options
   * @param {string} options.id
   * @param {{ terreiro: object, demanda: object }} options.players jogadores com `name` e `send(type, payload)`
   * @param {() => void} [options.onEnd] chamado uma vez, quando a partida acaba
   */
  constructor({ id, players, rng = Math.random, scheduler = realScheduler, rules = PVP_RULES, onEnd = () => {} }) {
    this.#id = id;
    this.#players = players;
    this.#rng = rng;
    this.#scheduler = scheduler;
    this.#rules = rules;
    this.#onEnd = onEnd;
  }

  get id() {
    return this.#id;
  }

  get isOver() {
    return this.#isOver;
  }

  roleOf(player) {
    return ROLES.find((role) => this.#players[role] === player) ?? null;
  }

  start() {
    this.#duel = createDuel(this.#rng, this.#rules);

    for (const role of ROLES) {
      const opponent = this.#players[opponentOf(role)];
      this.#players[role].send(SERVER.MATCH_FOUND, {
        matchId: this.#id,
        role,
        opponent: { role: opponentOf(role), name: opponent.name },
        rules: publicRules(this.#rules),
      });
    }
    this.#armTimer(TIMER.MULLIGAN, this.#rules.mulliganMs);
    this.#broadcast([]);
  }

  /** Recebe uma mensagem já validada de um dos jogadores. */
  receive(player, message) {
    const role = this.roleOf(player);
    if (this.#isOver || !role) return;

    const result = this.#applyAction(role, message);
    if (!result) return;
    if (!result.ok) {
      player.send(SERVER.ERROR, { code: "invalid_action", message: result.error });
      return;
    }
    this.#commit(result.duel, result.events);
  }

  /** Um jogador caiu ou desistiu: o adversário vence. */
  disconnect(player) {
    const role = this.roleOf(player);
    if (this.#isOver || !role) return;

    const result = forfeit(this.#duel, role);
    if (result.ok) this.#commit(result.duel, result.events);
  }

  #applyAction(role, message) {
    switch (message.type) {
      case CLIENT.MULLIGAN:
        return submitMulligan(this.#duel, role, message.cardIds, this.#rng);
      case CLIENT.PLAY:
        return playCard(this.#duel, role, message.cardId, this.#rng);
      case CLIENT.END_TURN:
        return endTurn(this.#duel, role, this.#rng, "manual");
      default:
        return null;
    }
  }

  #commit(duel, events) {
    this.#duel = duel;

    if (duel.phase === DUEL_PHASE.ENDED) {
      this.#isOver = true;
      this.#clearTimer();
      this.#broadcast(events);
      this.#onEnd(this);
      return;
    }
    // Todo início de turno (inclusive o 1º, após a troca) reinicia o relógio.
    if (events.some((event) => event.type === "turnStart")) {
      this.#armTimer(TIMER.TURN, this.#rules.turnMs);
    }
    this.#broadcast(events);
  }

  #onTimeout() {
    if (this.#isOver) return;

    const result =
      this.#timer.kind === TIMER.MULLIGAN
        ? resolveMulliganTimeout(this.#duel, this.#rng)
        : endTurn(this.#duel, this.#duel.active, this.#rng, "timeout");

    if (result.ok) this.#commit(result.duel, result.events);
  }

  #armTimer(kind, totalMs) {
    this.#clearTimer();
    this.#timer = {
      kind,
      totalMs,
      deadline: this.#scheduler.now() + totalMs,
      handle: this.#scheduler.setTimeout(() => this.#onTimeout(), totalMs),
    };
  }

  #clearTimer() {
    if (this.#timer.handle !== null) this.#scheduler.clearTimeout(this.#timer.handle);
    this.#timer = { handle: null, kind: null, deadline: 0, totalMs: 0 };
  }

  #timerView() {
    if (this.#timer.kind === null) return null;
    return {
      kind: this.#timer.kind,
      totalMs: this.#timer.totalMs,
      remainingMs: Math.max(0, this.#timer.deadline - this.#scheduler.now()),
    };
  }

  #broadcast(events) {
    const timer = this.#timerView();
    for (const role of ROLES) {
      this.#players[role].send(SERVER.MATCH_UPDATE, { view: viewFor(this.#duel, role, timer), events });
    }
  }
}
