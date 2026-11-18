import { describe, expect, it } from "vitest";
import { CARD_CATALOG } from "../../data/cardCatalog.js";
import { createSeededRandom } from "../../utils/random.js";
import { GAME_STATUS, canPlayCard, endTurn, playCard } from "../rules/gameLogic.js";
import { createTutorialGame } from "./tutorialGame.js";
import {
  TUTORIAL_STEPS,
  checkTutorialAction,
  getTutorialStep,
  isLastTutorialStep,
} from "./tutorialSteps.js";

const catalogIds = CARD_CATALOG.map((card) => card.id);
const firstIndexOf = (id) => TUTORIAL_STEPS.findIndex((step) => step.id === id);

describe("roteiro", () => {
  it("passos de ação têm ação esperada e dica; o último passo é informativo", () => {
    for (const step of TUTORIAL_STEPS.filter((s) => s.kind === "action")) {
      expect(Boolean(step.expect)).toBe(true);
      expect(step.hint.length).toBeGreaterThan(0);
    }
    expect(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].kind).toBe("info");
    expect(isLastTutorialStep(TUTORIAL_STEPS.length - 1)).toBe(true);
  });

  it("os destaques de carta apontam para cartas do catálogo", () => {
    for (const step of TUTORIAL_STEPS) {
      for (const target of step.highlight.filter((t) => t.startsWith("card:"))) {
        expect(catalogIds.includes(target.slice(5))).toBe(true);
      }
    }
  });

  it("textos cabem no painel (até 150 caracteres)", () => {
    for (const step of TUTORIAL_STEPS) expect(step.text.length).toBeLessThan(151);
  });

  it("índices fora do intervalo ficam nos limites", () => {
    expect(getTutorialStep(-5).id).toBe(TUTORIAL_STEPS[0].id);
    expect(getTutorialStep(999).id).toBe(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id);
  });
});

describe("checkTutorialAction", () => {
  const attack = firstIndexOf("attack");

  it("em passos informativos nenhuma ação é permitida", () => {
    expect(checkTutorialAction(0, { type: "endTurn" }).allowed).toBe(false);
  });

  it("aceita só a carta esperada", () => {
    expect(checkTutorialAction(attack, { type: "play", templateId: "ze-do-coco" }).allowed).toBe(true);
    const wrong = checkTutorialAction(attack, { type: "play", templateId: "pai-joaquim" });
    expect(wrong.allowed).toBe(false);
    expect(wrong.hint.length).toBeGreaterThan(0);
  });

  it("recusa encerrar o giro quando se espera jogar carta", () => {
    expect(checkTutorialAction(attack, { type: "endTurn" }).allowed).toBe(false);
  });

  it("aceita encerrar o giro no passo certo", () => {
    expect(checkTutorialAction(firstIndexOf("end-turn"), { type: "endTurn" }).allowed).toBe(true);
  });
});

describe("tutorial de ponta a ponta (só regras)", () => {
  it("o roteiro pode ser cumprido com a mão fixa e os números do texto batem", () => {
    const rng = createSeededRandom(5);
    let state = createTutorialGame(rng);

    TUTORIAL_STEPS.forEach((step, index) => {
      if (step.kind !== "action") return;
      const { expect: expected } = step;
      expect(checkTutorialAction(index, expected).allowed).toBe(true);

      if (expected.type === "play") {
        const card = state.hand.find((c) => c.templateId === expected.templateId);
        expect(Boolean(card)).toBe(true);
        expect(canPlayCard(state, card.id).ok).toBe(true);
        state = playCard(state, card.id, rng);
      } else {
        state = endTurn(state, rng);
      }
    });

    expect(state.status).toBe(GAME_STATUS.PLAYING);
    expect(state.harmony).toBe(state.ruleset.maxHarmony); // a cura devolveu o dano
    // Zé do Coco (Fogo) causa 3; Pai Joaquim (Terra) causa metade de 1, arredondado para baixo: 0
    expect(state.demand.health).toBe(state.demand.maxHealth - 3);
  });
});
