import { PVP_RULES, publicRules } from "../src/game/pvp/pvpRules.js";
import { Match } from "./match.js";
import { Matchmaker } from "./matchmaker.js";
import { CLIENT, DEFAULT_NAME, SERVER, parseClientMessage } from "./protocol.js";
import { realScheduler } from "./scheduler.js";

const RATE_WINDOW_MS = 1000;
const POLICY_VIOLATION = 1008;

/**
 * Orquestra conexões, fila e partidas. Não conhece WebSocket: cada conexão é
 * um "transporte" com `send(texto)` e `close(código, motivo)`, o que permite
 * testar tudo em memória.
 */
export class GameServer {
  #rng;
  #scheduler;
  #rules;
  #maxMessagesPerSecond;
  #matchmaker;
  #matches = new Set();
  #connections = 0;
  #nextId = 1;

  /**
   * @param {{ rng?: () => number, scheduler?: object, rules?: object, maxMessagesPerSecond?: number }} [options]
   */
  constructor({ rng = Math.random, scheduler = realScheduler, rules = PVP_RULES, maxMessagesPerSecond = 30 } = {}) {
    this.#rng = rng;
    this.#scheduler = scheduler;
    this.#rules = rules;
    this.#maxMessagesPerSecond = maxMessagesPerSecond;
    this.#matchmaker = new Matchmaker({ rng, onMatch: (pair) => this.#startMatch(pair) });
  }

  get stats() {
    return { connections: this.#connections, queued: this.#matchmaker.size, matches: this.#matches.size };
  }

  /**
   * Registra uma nova conexão.
   * @param {{ send: (text: string) => void, close: (code?: number, reason?: string) => void }} transport
   * @returns {{ receive: (raw: string) => void, close: () => void }} funções para o transporte chamar
   */
  connect(transport) {
    const player = {
      id: `p${this.#nextId++}`,
      name: DEFAULT_NAME,
      match: null,
      recentMessages: [],
      send: (type, payload = {}) => transport.send(JSON.stringify({ type, ...payload })),
    };
    this.#connections++;
    player.send(SERVER.HELLO, { rules: publicRules(this.#rules) });

    let isClosed = false;
    return {
      receive: (raw) => {
        if (isClosed) return;
        if (this.#isRateLimited(player)) {
          transport.close(POLICY_VIOLATION, "Mensagens demais.");
          return;
        }
        this.#handle(player, raw);
      },
      close: () => {
        if (isClosed) return;
        isClosed = true;
        this.#connections--;
        this.#matchmaker.leave(player);
        player.match?.disconnect(player);
        player.match = null;
      },
    };
  }

  #isRateLimited(player) {
    const now = this.#scheduler.now();
    player.recentMessages = player.recentMessages.filter((at) => now - at < RATE_WINDOW_MS);
    player.recentMessages.push(now);
    return player.recentMessages.length > this.#maxMessagesPerSecond;
  }

  #handle(player, raw) {
    const parsed = parseClientMessage(raw);
    if (!parsed.ok) {
      player.send(SERVER.ERROR, { code: "invalid_message", message: parsed.error });
      return;
    }
    const { message } = parsed;

    switch (message.type) {
      case CLIENT.QUEUE_JOIN:
        return this.#joinQueue(player, message.name);
      case CLIENT.QUEUE_LEAVE:
        this.#matchmaker.leave(player);
        return player.send(SERVER.QUEUE, { status: "left" });
      default:
        if (!player.match) {
          return player.send(SERVER.ERROR, { code: "not_in_match", message: "Você não está em uma partida." });
        }
        return player.match.receive(player, message);
    }
  }

  #joinQueue(player, name) {
    if (player.match) {
      return player.send(SERVER.ERROR, { code: "already_in_match", message: "Você já está em uma partida." });
    }
    player.name = name;
    if (!this.#matchmaker.join(player)) {
      return player.send(SERVER.ERROR, { code: "already_queued", message: "Você já está na fila." });
    }
    // Se o par se formou, `match` já foi definido e o jogador recebe `match.found` no lugar.
    if (!player.match) player.send(SERVER.QUEUE, { status: "waiting", waiting: this.#matchmaker.size });
  }

  #startMatch(pair) {
    const match = new Match({
      id: `m${this.#nextId++}`,
      players: pair,
      rng: this.#rng,
      scheduler: this.#scheduler,
      rules: this.#rules,
      onEnd: (ended) => this.#endMatch(ended, pair),
    });
    this.#matches.add(match);
    pair.terreiro.match = match;
    pair.demanda.match = match;
    match.start();
  }

  #endMatch(match, pair) {
    this.#matches.delete(match);
    // Libera os jogadores para entrar na fila de novo.
    for (const player of Object.values(pair)) {
      if (player.match === match) player.match = null;
    }
  }
}
