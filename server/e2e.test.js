import { describe, expect, it } from "vitest";
import { createGameHttpServer } from "./createServer.js";
import { PVP_RULES } from "../src/game/pvp/pvpRules.js";

const hasWebSocket = typeof WebSocket !== "undefined"; // Node 22+

/** Cliente de teste sobre o WebSocket nativo. */
function connect(port) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const messages = [];
    const waiters = new Set();
    let closeEvent = null;

    socket.onmessage = (event) => {
      messages.push(JSON.parse(event.data));
      waiters.forEach((waiter) => waiter.check());
    };
    socket.onclose = (event) => {
      closeEvent = event;
      waiters.forEach((waiter) => waiter.check());
    };
    socket.onerror = reject;

    const client = {
      messages,
      send: (message) => socket.send(typeof message === "string" ? message : JSON.stringify(message)),
      close: () => socket.close(),
      get closeCode() {
        return closeEvent?.code ?? null;
      },
      /** Espera uma mensagem que satisfaça o predicado (ou o fechamento, se `untilClosed`). */
      waitFor(predicate, timeoutMs = 3000) {
        return new Promise((resolveWait, rejectWait) => {
          const check = () => {
            const found = messages.find(predicate);
            if (found) return done(found);
            return null;
          };
          const timer = setTimeout(() => {
            waiters.delete(waiter);
            rejectWait(new Error("tempo esgotado esperando mensagem"));
          }, timeoutMs);
          const done = (value) => {
            clearTimeout(timer);
            waiters.delete(waiter);
            resolveWait(value);
          };
          const waiter = { check };
          waiters.add(waiter);
          check();
        });
      },
      waitClosed: (timeoutMs = 3000) =>
        new Promise((resolveWait, rejectWait) => {
          if (closeEvent) return resolveWait(closeEvent.code);
          const timer = setTimeout(() => rejectWait(new Error("não fechou a tempo")), timeoutMs);
          const waiter = {
            check: () => {
              if (!closeEvent) return;
              clearTimeout(timer);
              waiters.delete(waiter);
              resolveWait(closeEvent.code);
            },
          };
          waiters.add(waiter);
        }),
    };
    socket.onopen = () => resolve(client);
  });
}

const isUpdate = (predicate) => (message) => message.type === "match.update" && predicate(message);

/** Sobe o servidor, conecta dois jogadores e os coloca em partida. */
async function withMatch(run, gameOptions = {}) {
  const server = createGameHttpServer(gameOptions);
  const port = await server.listen(0, "127.0.0.1");
  const clients = [];
  try {
    const [first, second] = [await connect(port), await connect(port)];
    clients.push(first, second);
    first.send({ type: "queue.join", name: "Ana" });
    await first.waitFor((m) => m.type === "queue");
    second.send({ type: "queue.join", name: "Beto" });

    const [foundA, foundB] = await Promise.all([
      first.waitFor((m) => m.type === "match.found"),
      second.waitFor((m) => m.type === "match.found"),
    ]);
    const byRole = { [foundA.role]: first, [foundB.role]: second };
    await run({ port, server, first, second, foundA, foundB, terreiro: byRole.terreiro, demanda: byRole.demanda });
  } finally {
    clients.forEach((client) => client.close());
    await server.close();
  }
}

describe("online de ponta a ponta (sockets reais)", () => {
  it("fila: dois jogadores são pareados, com papéis distintos e informações escondidas", async () => {
    if (!hasWebSocket) return;
    await withMatch(async ({ first, second, foundA, foundB }) => {
      expect(foundA.matchId).toBe(foundB.matchId);
      expect([foundA.role, foundB.role].sort()).toEqual(["demanda", "terreiro"]);
      expect(foundA.opponent.name).toBe("Beto");
      expect(foundB.opponent.name).toBe("Ana");

      const updateA = await first.waitFor((m) => m.type === "match.update");
      const updateB = await second.waitFor((m) => m.type === "match.update");
      expect(updateA.view.phase).toBe("mulligan");
      expect(updateA.view.you.hand).toHaveLength(5);
      expect(updateA.view.you.life).toBe(updateB.view.you.life);
      expect(Object.hasOwn(updateA.view.opponent, "hand")).toBe(false);
      expect(JSON.stringify(updateA.view.opponent).includes('"cost"')).toBe(false); // nenhuma carta do outro vaza
    });
  });

  it("troca de até 3 cartas, início do duelo, jogada e passagem de turno", async () => {
    if (!hasWebSocket) return;
    await withMatch(async ({ terreiro, demanda }) => {
      const hand = (await terreiro.waitFor((m) => m.type === "match.update")).view.you.hand;
      terreiro.send({ type: "mulligan", cardIds: hand.slice(0, 3).map((c) => c.id) });
      const swapped = await terreiro.waitFor(isUpdate((m) => m.view.you.mulliganDone));
      expect(swapped.view.you.hand).toHaveLength(5);

      terreiro.send({ type: "mulligan", cardIds: [] });
      await terreiro.waitFor((m) => m.type === "error"); // já confirmou
      demanda.send({ type: "mulligan", cardIds: [] });

      const started = await demanda.waitFor(isUpdate((m) => m.view.phase === "playing"));
      expect(started.view.active).toBe("demanda");
      expect(started.view.timer.kind).toBe("turn");

      // a Terreiro não pode jogar fora da vez
      const terreiroHand = (await terreiro.waitFor(isUpdate((m) => m.view.phase === "playing"))).view.you.hand;
      terreiro.send({ type: "play", cardId: terreiroHand[0].id });
      const errors = terreiro.messages.filter((m) => m.type === "error");
      await terreiro.waitFor((m) => m.type === "error" && m.message === "Não é a sua vez.");
      expect(errors.length).toBeGreaterThan(0);

      // a Demanda joga e os dois recebem o evento
      const card = started.view.you.hand[0];
      demanda.send({ type: "play", cardId: card.id });
      const eventForTerreiro = await terreiro.waitFor(isUpdate((m) => m.events.some((e) => e.type === "cardPlayed")));
      expect(eventForTerreiro.events[0].card.id).toBe(card.id);

      // encerrar o turno passa a vez
      demanda.send({ type: "endTurn" });
      const turn = await terreiro.waitFor(isUpdate((m) => m.view.active === "terreiro"));
      expect(turn.view.you.axe).toBe(PVP_RULES.startingAxe);
    });
  });

  it("os tempos acabam sozinhos: troca de cartas e turno (relógio real, tempos curtos)", async () => {
    if (!hasWebSocket) return;
    const rules = { ...PVP_RULES, mulliganMs: 120, turnMs: 150 };
    await withMatch(async ({ terreiro }) => {
      const started = await terreiro.waitFor(isUpdate((m) => m.view.phase === "playing"), 2000);
      expect(started.view.active).toBe("demanda");

      const passed = await terreiro.waitFor(isUpdate((m) => m.view.active === "terreiro"), 2000);
      expect(passed.events[0]).toEqual({ type: "turnEnd", role: "demanda", reason: "timeout" });
    }, { rules });
  });

  it("quem desiste perde: o adversário recebe a vitória", async () => {
    if (!hasWebSocket) return;
    await withMatch(async ({ terreiro, demanda }) => {
      await demanda.waitFor((m) => m.type === "match.update");
      terreiro.close();
      const ended = await demanda.waitFor(isUpdate((m) => m.view.phase === "ended"));
      expect(ended.view.winner).toBe("you");
      expect(ended.view.endReason).toBe("abandon");
    });
  });

  it("mensagens inválidas dão erro; mensagens demais derrubam a conexão", async () => {
    if (!hasWebSocket) return;
    const server = createGameHttpServer({ maxMessagesPerSecond: 8 });
    const port = await server.listen(0, "127.0.0.1");
    try {
      const client = await connect(port);
      await client.waitFor((m) => m.type === "hello");
      client.send("isto não é json");
      const error = await client.waitFor((m) => m.type === "error");
      expect(error.code).toBe("invalid_message");

      for (let i = 0; i < 20; i++) client.send({ type: "queue.leave" });
      expect(await client.waitClosed()).toBe(1008);
    } finally {
      await server.close();
    }
  });

  it("responde ao /health", async () => {
    if (!hasWebSocket) return;
    const server = createGameHttpServer();
    const port = await server.listen(0, "127.0.0.1");
    try {
      const body = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
      expect(body).toEqual({ status: "ok", connections: 0, queued: 0, matches: 0 });
    } finally {
      await server.close();
    }
  });
});
