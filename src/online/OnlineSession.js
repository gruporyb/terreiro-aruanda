import { CLIENT } from "../../server/protocol.js";
import { ONLINE_STATUS, applyServerMessage, initialOnlineState, resetMatch, withStatus } from "./onlineState.js";

const SOCKET_OPEN = 1;
const now = () => globalThis.performance?.now() ?? Date.now();

/**
 * Conexão com o servidor online. Guarda o estado (puro, ver onlineState.js) e
 * avisa quem se inscrever. Não conhece React nem Pixi: a tela e a cena apenas
 * assinam e enviam intenções (trocar, jogar, encerrar o turno).
 */
export class OnlineSession {
  #url;
  #createSocket;
  #socket = null;
  #state = initialOnlineState();
  #listeners = new Set();

  /** Instante (ms) em que a última visão chegou: base do cronômetro local. */
  viewReceivedAt = 0;
  /** Recompensa da vitória (sacramento) e se já foi concedida, para não repetir ao remontar a cena. */
  reward = null;
  rewardClaimed = false;

  /** @param {{ url: string, createSocket?: (url: string) => WebSocket }} options */
  constructor({ url, createSocket = (target) => new WebSocket(target) }) {
    this.#url = url;
    this.#createSocket = createSocket;
  }

  get state() {
    return this.#state;
  }

  /** @param {(state: object, events: object[]) => void} listener @returns {() => void} cancelar a inscrição */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  connect() {
    if (this.#socket) return;
    this.#setState(withStatus(this.#state, ONLINE_STATUS.CONNECTING, null));

    let socket;
    try {
      socket = this.#createSocket(this.#url);
    } catch {
      this.#setState(withStatus(this.#state, ONLINE_STATUS.CLOSED, { code: "connect_failed", message: "Não foi possível conectar ao servidor." }));
      return;
    }
    this.#socket = socket;

    socket.onmessage = (event) => this.#receive(event.data);
    socket.onclose = () => this.#handleClose();
    // Navegadores disparam `error` e depois `close`; alguns ambientes (ex.: Node) só `error`.
    // Tratar os dois como queda é seguro: #handleClose ignora repetições.
    socket.onerror = () => this.#handleClose();
  }

  joinQueue(name) {
    this.reward = null;
    this.rewardClaimed = false;
    this.#setState(resetMatch(this.#state));
    this.#send({ type: CLIENT.QUEUE_JOIN, name });
  }

  leaveQueue() {
    this.#send({ type: CLIENT.QUEUE_LEAVE });
  }

  mulligan(cardIds) {
    this.#send({ type: CLIENT.MULLIGAN, cardIds });
  }

  play(cardId) {
    this.#send({ type: CLIENT.PLAY, cardId });
  }

  endTurn() {
    this.#send({ type: CLIENT.END_TURN });
  }

  /** Encerra a conexão. No meio de uma partida, equivale a desistir. */
  close() {
    const socket = this.#socket;
    this.#socket = null;
    this.#listeners.clear();
    if (socket) {
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
  }

  #send(message) {
    if (this.#socket?.readyState !== SOCKET_OPEN) return false;
    this.#socket.send(JSON.stringify(message));
    return true;
  }

  #receive(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return; // ignora o que não for JSON
    }
    const { state, events } = applyServerMessage(this.#state, message);
    if (message.type === "match.update") this.viewReceivedAt = now();
    this.#setState(state, events);
  }

  #handleClose() {
    this.#socket = null;
    const { status } = this.#state;
    // Depois do fim da partida, a visão final continua válida; a conexão fechada não muda isso.
    if (status === ONLINE_STATUS.ENDED || status === ONLINE_STATUS.CLOSED) return;

    const wasInGame = status === ONLINE_STATUS.MATCHED;
    this.#setState(
      withStatus(this.#state, ONLINE_STATUS.CLOSED, {
        code: "disconnected",
        message: wasInGame ? "A conexão com o servidor foi perdida." : "Não foi possível conectar ao servidor.",
      }),
    );
  }

  #setState(state, events = []) {
    this.#state = state;
    for (const listener of [...this.#listeners]) listener(state, events);
  }
}
