import { describe, expect, it } from "vitest";
import { DIFFICULTIES, DIFFICULTY } from "../data/difficulties.js";
import { SESSION_MODE, createGameForSession, createSession } from "./session.js";

describe("session", () => {
  it("começa sem estado, no passo 0", () => {
    const session = createSession();
    expect(session.state).toBe(null);
    expect(session.tutorialStep).toBe(0);
    expect(session.mode).toBe(SESSION_MODE.GAME);
  });

  it("cria a partida com o ruleset da dificuldade da sessão", () => {
    const session = createSession({ difficulty: DIFFICULTY.HARD });
    const state = createGameForSession(session);
    expect(state.ruleset).toBe(DIFFICULTIES[DIFFICULTY.HARD].ruleset);
  });

  it("no modo tutorial cria a partida guiada, com mão fixa", () => {
    const state = createGameForSession(createSession({ mode: SESSION_MODE.TUTORIAL }));
    expect(state.hand.map((c) => c.templateId)).toEqual([
      "ze-do-coco",
      "pai-joaquim",
      "vovo-maria-conga",
      "ere-cosminho",
      "caboclo-sete-matas",
    ]);
  });
});
