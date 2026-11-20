/**
 * Protocolo entre cliente e servidor: mensagens JSON `{ type, ...dados }`.
 * Compartilhado pelos dois lados para que os nomes nunca divirjam.
 */

export const CLIENT = Object.freeze({
  QUEUE_JOIN: "queue.join",
  QUEUE_LEAVE: "queue.leave",
  MULLIGAN: "mulligan",
  PLAY: "play",
  END_TURN: "endTurn",
});

export const SERVER = Object.freeze({
  HELLO: "hello",
  QUEUE: "queue",
  MATCH_FOUND: "match.found",
  MATCH_UPDATE: "match.update",
  ERROR: "error",
});

export const DEFAULT_NAME = "Jogador";
export const MAX_NAME_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2048;
const MAX_ID_LENGTH = 64;
const MAX_MULLIGAN_IDS = 10;

/** Apelido seguro para exibir: sem caracteres de controle, com tamanho limitado. */
export function sanitizeName(raw) {
  if (typeof raw !== "string") return DEFAULT_NAME;
  const name = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return name || DEFAULT_NAME;
}

const isId = (value) => typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
const invalid = (error) => ({ ok: false, error });

/**
 * Valida o texto recebido do cliente (nunca confiar no que vem da rede).
 * @returns {{ ok: true, message: object } | { ok: false, error: string }}
 */
export function parseClientMessage(raw) {
  if (typeof raw !== "string" || raw.length > MAX_MESSAGE_LENGTH) return invalid("Mensagem grande demais.");

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return invalid("Mensagem não é um JSON válido.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return invalid("Formato de mensagem inválido.");

  switch (data.type) {
    case CLIENT.QUEUE_JOIN:
      return { ok: true, message: { type: data.type, name: sanitizeName(data.name) } };
    case CLIENT.QUEUE_LEAVE:
    case CLIENT.END_TURN:
      return { ok: true, message: { type: data.type } };
    case CLIENT.MULLIGAN:
      if (!Array.isArray(data.cardIds) || data.cardIds.length > MAX_MULLIGAN_IDS || !data.cardIds.every(isId)) {
        return invalid("Lista de cartas inválida.");
      }
      return { ok: true, message: { type: data.type, cardIds: data.cardIds } };
    case CLIENT.PLAY:
      if (!isId(data.cardId)) return invalid("Carta inválida.");
      return { ok: true, message: { type: data.type, cardId: data.cardId } };
    default:
      return invalid("Tipo de mensagem desconhecido.");
  }
}
