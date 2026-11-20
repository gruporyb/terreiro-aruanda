import { WebSocketServer } from "ws";

const OPEN = 1;
const MAX_PAYLOAD_BYTES = 4096;
const HEARTBEAT_MS = 20_000;

/**
 * Liga um GameServer a um servidor HTTP via WebSocket.
 * @param {import("node:http").Server} httpServer
 * @param {import("./gameServer.js").GameServer} gameServer
 * @param {{ path?: string, allowedOrigins?: string[], heartbeatMs?: number }} [options]
 *   `allowedOrigins` vazio aceita qualquer origem; informe a lista em produção.
 */
export function attachWebSocketServer(
  httpServer,
  gameServer,
  { path = "/ws", allowedOrigins = [], heartbeatMs = HEARTBEAT_MS } = {},
) {
  const wss = new WebSocketServer({
    server: httpServer,
    path,
    maxPayload: MAX_PAYLOAD_BYTES,
    verifyClient: ({ origin }) => allowedOrigins.length === 0 || allowedOrigins.includes(origin),
  });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    const connection = gameServer.connect({
      send: (text) => {
        if (socket.readyState === OPEN) socket.send(text);
      },
      close: (code, reason) => socket.close(code, reason),
    });

    socket.on("message", (data) => connection.receive(data.toString()));
    socket.on("close", () => connection.close());
    socket.on("error", () => connection.close());
  });

  // Derruba conexões "fantasma" (sem resposta ao ping), que de outro modo
  // manteriam jogadores presos na fila ou em partidas.
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, heartbeatMs);
  heartbeat.unref();
  wss.on("close", () => clearInterval(heartbeat));

  return wss;
}
