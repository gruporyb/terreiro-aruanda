import { describe, expect, it } from "vitest";
import { ONLINE_STATUS, applyServerMessage, initialOnlineState, resetMatch, withStatus } from "./onlineState.js";

const apply = (state, message) => applyServerMessage(state, message);

describe("applyServerMessage", () => {
  it("hello: conectado, com as regras", () => {
    const { state } = apply(initialOnlineState(), { type: "hello", rules: { turnMs: 30000 } });
    expect(state.status).toBe(ONLINE_STATUS.CONNECTED);
    expect(state.rules.turnMs).toBe(30000);
  });

  it("fila: entra e sai", () => {
    let { state } = apply(initialOnlineState(), { type: "queue", status: "waiting", waiting: 1 });
    expect(state.status).toBe(ONLINE_STATUS.QUEUED);
    expect(state.waiting).toBe(1);
    ({ state } = apply(state, { type: "queue", status: "left" }));
    expect(state.status).toBe(ONLINE_STATUS.CONNECTED);
  });

  it("partida encontrada: guarda o papel e o oponente", () => {
    const { state } = apply(initialOnlineState(), {
      type: "match.found",
      role: "terreiro",
      opponent: { name: "Beto", role: "demanda" },
      rules: { mulliganMax: 3 },
    });
    expect(state).toMatchObject({ status: "matched", role: "terreiro", opponentName: "Beto" });
  });

  it("atualização: guarda a visão e repassa os eventos; o fim da partida muda o status", () => {
    const events = [{ type: "turnStart", role: "demanda", round: 1 }];
    let result = apply(initialOnlineState(), { type: "match.update", view: { phase: "playing" }, events });
    expect(result.state.status).toBe(ONLINE_STATUS.MATCHED);
    expect(result.events).toEqual(events);

    result = apply(result.state, { type: "match.update", view: { phase: "ended", winner: "you" }, events: [] });
    expect(result.state.status).toBe(ONLINE_STATUS.ENDED);
    expect(result.state.view.winner).toBe("you");
  });

  it("erro: guarda o último erro sem mudar o status", () => {
    const base = { ...initialOnlineState(), status: ONLINE_STATUS.MATCHED };
    const { state } = apply(base, { type: "error", code: "invalid_action", message: "Não é a sua vez." });
    expect(state.status).toBe(ONLINE_STATUS.MATCHED);
    expect(state.error).toEqual({ code: "invalid_action", message: "Não é a sua vez." });
  });

  it("mensagem desconhecida não altera nada", () => {
    const base = initialOnlineState();
    expect(apply(base, { type: "???" }).state).toBe(base);
  });

  it("resetMatch limpa a partida anterior, mantendo as regras", () => {
    const dirty = { ...initialOnlineState(), rules: { a: 1 }, status: ONLINE_STATUS.ENDED, role: "demanda", view: { x: 1 }, opponentName: "B" };
    expect(resetMatch(dirty)).toMatchObject({ status: "connected", role: null, view: null, opponentName: null, rules: { a: 1 } });
  });

  it("withStatus troca o status e (opcionalmente) o erro", () => {
    expect(withStatus(initialOnlineState(), "closed", { code: "x", message: "y" })).toMatchObject({ status: "closed", error: { code: "x" } });
  });
});
