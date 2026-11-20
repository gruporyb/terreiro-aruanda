import { describe, expect, it } from "vitest";
import { createGameHttpServer } from "../../server/createServer.js";
import { OnlineSession } from "./OnlineSession.js";
import { ONLINE_STATUS } from "./onlineState.js";

const hasWebSocket = typeof WebSocket !== "undefined"; // Node 22+

/** Espera o estado da sessão satisfazer o predicado. */
function until(session, predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    if (predicate(session.state)) return resolve(session.state);
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`tempo esgotado (estado: ${session.state.status})`));
    }, timeoutMs);
    const unsubscribe = session.subscribe((state) => {
      if (!predicate(state)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(state);
    });
  });
}

async function withServer(run, options = {}) {
  const server = createGameHttpServer(options);
  const port = await server.listen(0, "127.0.0.1");
  const sessions = [];
  const open = () => {
    const session = new OnlineSession({ url: `ws://127.0.0.1:${port}/ws` });
    sessions.push(session);
    session.connect();
    return session;
  };
  try {
    await run({ open, port });
  } finally {
    sessions.forEach((session) => session.close());
    await server.close();
  }
}

describe("OnlineSession contra o servidor real", () => {
  it("conecta, entra na fila, é pareada e recebe a visão da partida", async () => {
    if (!hasWebSocket) return;
    await withServer(async ({ open }) => {
      const a = open();
      expect(a.state.status).toBe(ONLINE_STATUS.CONNECTING);
      await until(a, (s) => s.status === ONLINE_STATUS.CONNECTED);
      a.joinQueue("Ana");
      await until(a, (s) => s.status === ONLINE_STATUS.QUEUED);

      const b = open();
      await until(b, (s) => s.status === ONLINE_STATUS.CONNECTED);
      b.joinQueue("Beto");

      const [stateA, stateB] = await Promise.all([
        until(a, (s) => s.status === ONLINE_STATUS.MATCHED && s.view),
        until(b, (s) => s.status === ONLINE_STATUS.MATCHED && s.view),
      ]);
      expect([stateA.role, stateB.role].sort()).toEqual(["demanda", "terreiro"]);
      expect(stateA.opponentName).toBe("Beto");
      expect(stateA.view.phase).toBe("mulligan");
      expect(a.viewReceivedAt).toBeGreaterThan(0);
    });
  });

  it("joga uma partida curta: troca, jogada, turno e desistência", async () => {
    if (!hasWebSocket) return;
    await withServer(async ({ open }) => {
      const [a, b] = [open(), open()];
      await Promise.all([a, b].map((s) => until(s, (st) => st.status === ONLINE_STATUS.CONNECTED)));
      a.joinQueue("Ana");
      await until(a, (s) => s.status === ONLINE_STATUS.QUEUED);
      b.joinQueue("Beto");
      await Promise.all([a, b].map((s) => until(s, (st) => st.status === ONLINE_STATUS.MATCHED && st.view)));

      const demanda = a.state.role === "demanda" ? a : b;
      const terreiro = demanda === a ? b : a;

      // troca (até 3) e confirmação
      const swap = terreiro.state.view.you.hand.slice(0, 2).map((c) => c.id);
      terreiro.mulligan(swap);
      demanda.mulligan([]);
      await Promise.all([a, b].map((s) => until(s, (st) => st.view.phase === "playing")));

      // a Demanda joga; o Terreiro acompanha pelos eventos
      const events = [];
      terreiro.subscribe((_state, list) => events.push(...list));
      const card = demanda.state.view.you.hand[0];
      demanda.play(card.id);
      // espera o evento da jogada (a contagem de cartas não serve: o passe Guia compra de volta)
      await until(terreiro, () => events.some((e) => e.type === "cardPlayed"));
      expect(events.find((e) => e.type === "cardPlayed").card.id).toBe(card.id);

      demanda.endTurn();
      await until(terreiro, (s) => s.view.active === "terreiro");

      // desistência
      terreiro.close();
      const ended = await until(demanda, (s) => s.status === ONLINE_STATUS.ENDED);
      expect(ended.view.winner).toBe("you");
      expect(ended.view.endReason).toBe("abandon");

      // jogar de novo: volta a "fila" sem restos da partida anterior
      demanda.joinQueue("Beto");
      expect(demanda.state.view).toBe(null);
      await until(demanda, (s) => s.status === ONLINE_STATUS.QUEUED);
    });
  });

  it("falha de conexão vira estado 'closed' com mensagem", async () => {
    if (!hasWebSocket) return;
    const session = new OnlineSession({ url: "ws://127.0.0.1:1/ws" }); // porta sem servidor
    session.connect();
    const state = await until(session, (s) => s.status === ONLINE_STATUS.CLOSED);
    expect(state.error.code).toBe("disconnected");
    session.close();
  });

  it("enviar sem conexão aberta não faz nada (nem dá erro)", () => {
    const session = new OnlineSession({ url: "ws://x/ws", createSocket: () => ({ readyState: 0, close() {} }) });
    session.connect();
    session.play("x");
    session.endTurn();
    expect(session.state.status).toBe(ONLINE_STATUS.CONNECTING);
  });
});
