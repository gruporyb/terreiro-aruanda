import { SERVER } from "../../server/protocol.js";

/** Estados da conexão/partida do ponto de vista do cliente. */
export const ONLINE_STATUS = Object.freeze({
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected", // conectado, ainda fora da fila
  QUEUED: "queued",
  MATCHED: "matched",
  ENDED: "ended", // partida terminou (a visão final continua disponível)
  CLOSED: "closed", // conexão encerrada
});

export const initialOnlineState = () => ({
  status: ONLINE_STATUS.IDLE,
  role: null,
  opponentName: null,
  rules: null,
  view: null,
  waiting: 0,
  error: null,
});

const MATCH_FIELDS = { role: null, opponentName: null, view: null };

/** Volta ao ponto "conectado, sem partida" (usado para jogar de novo). */
export const resetMatch = (state) => ({
  ...state,
  ...MATCH_FIELDS,
  status: ONLINE_STATUS.CONNECTED,
  waiting: 0,
  error: null,
});

export const withStatus = (state, status, error = state.error) => ({ ...state, status, error });

/**
 * Aplica uma mensagem do servidor ao estado. Devolve o novo estado e os
 * eventos da partida (para animar), sem mutar nada.
 * @returns {{ state: object, events: object[] }}
 */
export function applyServerMessage(state, message) {
  switch (message.type) {
    case SERVER.HELLO:
      return { state: { ...state, status: ONLINE_STATUS.CONNECTED, rules: message.rules }, events: [] };

    case SERVER.QUEUE:
      return {
        state:
          message.status === "waiting"
            ? { ...state, status: ONLINE_STATUS.QUEUED, waiting: message.waiting, error: null }
            : { ...state, status: ONLINE_STATUS.CONNECTED, waiting: 0 },
        events: [],
      };

    case SERVER.MATCH_FOUND:
      return {
        state: {
          ...state,
          status: ONLINE_STATUS.MATCHED,
          role: message.role,
          opponentName: message.opponent.name,
          rules: message.rules,
          view: null,
          waiting: 0,
          error: null,
        },
        events: [],
      };

    case SERVER.MATCH_UPDATE: {
      const isOver = message.view.phase === "ended";
      return {
        state: { ...state, status: isOver ? ONLINE_STATUS.ENDED : ONLINE_STATUS.MATCHED, view: message.view },
        events: message.events ?? [],
      };
    }

    case SERVER.ERROR:
      return { state: { ...state, error: { code: message.code, message: message.message } }, events: [] };

    default:
      return { state, events: [] };
  }
}
