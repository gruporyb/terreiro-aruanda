import { describe, expect, it } from "vitest";
import { describeEnding, describeEvent, describeStatus } from "./describeEvent.js";

const card = { name: "Zé do Coco", defense: 0 };
const played = (overrides) => ({
  type: "cardPlayed",
  role: "terreiro",
  card,
  damage: 3,
  matchup: "neutral",
  absorbed: 0,
  lifeDamage: 3,
  healed: 0,
  stripped: 0,
  drew: 0,
  ...overrides,
});

describe("describeEvent", () => {
  it("narra de acordo com quem jogou", () => {
    expect(describeEvent(played({}), "terreiro")).toBe("Você jogou Zé do Coco: -3 de vida.");
    expect(describeEvent(played({}), "demanda")).toBe("O oponente jogou Zé do Coco: -3 de vida.");
  });

  it("inclui elemento, bloqueio, proteção, descarrego, cura e compra", () => {
    expect(describeEvent(played({ matchup: "strong" }), "terreiro")).toBe("Você jogou Zé do Coco: -3 de vida (+30%).");
    expect(describeEvent(played({ absorbed: 2, lifeDamage: 1 }), "terreiro")).toBe("Você jogou Zé do Coco: -1 de vida, 2 bloqueado(s).");
    const full = describeEvent(played({ card: { name: "X", defense: 2 }, damage: 0, stripped: 1, healed: 2, drew: 1 }), "terreiro");
    expect(full).toBe("Você jogou X: +2 de proteção, descarrego: -1 de proteção do alvo, cura +2, +1 carta(s).");
  });

  it("carta sem efeito visível só diz que foi jogada", () => {
    expect(describeEvent(played({ card: { name: "Y", defense: 0 }, damage: 0 }), "terreiro")).toBe("Você jogou Y.");
  });

  it("turnos, trocas e tempo esgotado", () => {
    expect(describeEvent({ type: "turnStart", role: "terreiro" }, "terreiro")).toBe("Sua vez! Arraste uma carta até a gira.");
    expect(describeEvent({ type: "turnStart", role: "demanda" }, "terreiro")).toBe("Vez do oponente.");
    expect(describeEvent({ type: "turnEnd", role: "terreiro", reason: "timeout" }, "terreiro")).toBe("Seu tempo acabou.");
    expect(describeEvent({ type: "turnEnd", role: "demanda", reason: "timeout" }, "terreiro")).toBe("O tempo do oponente acabou.");
    expect(describeEvent({ type: "turnEnd", role: "demanda", reason: "manual" }, "terreiro")).toBe(null);
    expect(describeEvent({ type: "mulliganDone", role: "terreiro", swapped: 2 }, "terreiro")).toBe("Você trocou 2 carta(s).");
    expect(describeEvent({ type: "mulliganDone", role: "demanda", swapped: 0 }, "terreiro")).toBe("O oponente manteve a mão.");
  });

  it("fim do duelo", () => {
    expect(describeEvent({ type: "duelEnd", winner: "terreiro", reason: "life" }, "terreiro")).toBe("Vitória!");
    expect(describeEvent({ type: "duelEnd", winner: "terreiro", reason: "abandon" }, "terreiro")).toBe("O oponente desistiu. Vitória!");
    expect(describeEvent({ type: "duelEnd", winner: "demanda", reason: "life" }, "terreiro")).toBe("Derrota.");
  });

  it("eventos desconhecidos não têm texto", () => {
    expect(describeEvent({ type: "outro" }, "terreiro")).toBe(null);
  });
});

describe("describeStatus", () => {
  const view = (overrides) => ({ phase: "playing", active: "terreiro", winner: null, you: { role: "terreiro", mulliganDone: false }, ...overrides });

  it("descreve cada situação", () => {
    expect(describeStatus(view({ phase: "mulligan" }), 3)).toBe("Troque até 3 cartas: toque nas que quer trocar.");
    expect(describeStatus(view({ phase: "mulligan", you: { role: "terreiro", mulliganDone: true } }), 3)).toBe("Aguardando o oponente confirmar a troca...");
    expect(describeStatus(view({}), 3)).toBe("Sua vez! Arraste uma carta até a gira.");
    expect(describeStatus(view({ active: "demanda" }), 3)).toBe("Vez do oponente.");
    expect(describeStatus(view({ phase: "ended", winner: "you" }), 3)).toBe("Vitória!");
    expect(describeStatus(view({ phase: "ended", winner: "opponent" }), 3)).toBe("Derrota.");
  });
});

describe("describeEnding", () => {
  it("vitória por vida, vitória por abandono e derrota", () => {
    expect(describeEnding({ winner: "you", endReason: "life" })).toEqual({ title: "Vitória!", subtitle: "Você derrotou o oponente." });
    expect(describeEnding({ winner: "you", endReason: "abandon" }).subtitle).toBe("O oponente desistiu da batalha.");
    expect(describeEnding({ winner: "opponent", endReason: "life" }).title).toBe("Derrota.");
  });
});
