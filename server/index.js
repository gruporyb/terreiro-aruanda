import { createGameHttpServer } from "./createServer.js";

const port = Number(process.env.PORT) || 8085;
const host = process.env.HOST || undefined;
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = createGameHttpServer({ allowedOrigins });
const actualPort = await server.listen(port, host);

console.log(`Terreiro de Aruanda (online) em ws://localhost:${actualPort}/ws`);
if (allowedOrigins.length === 0) {
  console.log("Aviso: ALLOWED_ORIGINS vazio, aceitando conexões de qualquer origem.");
}

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
