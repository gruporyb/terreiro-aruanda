import http from "node:http";
import { GameServer } from "./gameServer.js";
import { attachWebSocketServer } from "./wsTransport.js";

/**
 * Monta o servidor HTTP + WebSocket do jogo online.
 * `GET /health` devolve contadores simples (útil para monitoramento).
 */
export function createGameHttpServer({ allowedOrigins = [], path = "/ws", ...gameOptions } = {}) {
  const gameServer = new GameServer(gameOptions);

  const httpServer = http.createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok", ...gameServer.stats }));
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Servidor do Terreiro de Aruanda: conecte-se via WebSocket em " + path);
  });
  const wss = attachWebSocketServer(httpServer, gameServer, { path, allowedOrigins });

  return {
    gameServer,
    httpServer,
    /** @returns {Promise<number>} porta efetiva (útil com porta 0 nos testes) */
    listen: (port = 8085, host) =>
      new Promise((resolve) => httpServer.listen(port, host, () => resolve(httpServer.address().port))),
    close: () =>
      new Promise((resolve) => {
        for (const client of wss.clients) client.terminate();
        wss.close(() => httpServer.close(() => resolve()));
      }),
  };
}
