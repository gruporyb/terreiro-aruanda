import { clamp } from "../../utils/math.js";

/**
 * Roteiro do tutorial. Cada passo é:
 *  - "info": texto + botão Continuar (o jogador não pode jogar ainda);
 *  - "action": o jogador precisa fazer exatamente a ação esperada.
 * `highlight` lista o que ganha o contorno pulsante: "harmony", "demand", "axe",
 * "table", "endTurn" ou "card:<id da carta>".
 */
const KIND = Object.freeze({ INFO: "info", ACTION: "action" });

const info = (id, text, highlight = [], buttonLabel = "Continuar") => ({
  id,
  kind: KIND.INFO,
  text,
  highlight,
  buttonLabel,
});

const playCard = (id, text, templateId, hint) => ({
  id,
  kind: KIND.ACTION,
  text,
  hint,
  highlight: [`card:${templateId}`, "table"],
  expect: { type: "play", templateId },
});

const endTurn = (id, text, hint) => ({
  id,
  kind: KIND.ACTION,
  text,
  hint,
  highlight: ["endTurn"],
  expect: { type: "endTurn" },
});

export const TUTORIAL_STEPS = Object.freeze([
  info(
    "goal",
    "Bem-vindo ao terreiro! Desfaça a demanda (barra vermelha) antes que a Harmonia do terreiro (barra verde) se esgote.",
    ["harmony", "demand"],
  ),
  info(
    "axe",
    "O Axé é a energia do seu giro. Cada carta custa Axé (número no círculo escuro). Você começa com 3 e ganha 1 a mais a cada giro.",
    ["axe", "card:caboclo-sete-matas"],
  ),
  info(
    "icons",
    "Cada carta tem Ataque (espada), Defesa (escudo) e Passe (coração, cartas ou faísca). Os valores ficam na parte de baixo da carta.",
    ["card:caboclo-sete-matas"],
  ),
  playCard(
    "attack",
    "Vamos jogar! Arraste o Zé do Coco até a gira. Ele custa 1 de Axé e causa 3 de Ataque na demanda.",
    "ze-do-coco",
    "Neste passo, arraste o Zé do Coco (destacado) até a gira.",
  ),
  info(
    "attack-result",
    "Muito bem! A barra vermelha diminuiu. Quando a vida da demanda chegar a zero, você vence.",
    ["demand"],
  ),
  playCard(
    "defense",
    "Agora chame o Pai Joaquim. A Defesa dele cria proteção, que absorve o ataque da demanda até o fim do giro.",
    "pai-joaquim",
    "Neste passo, arraste o Pai Joaquim (destacado) até a gira.",
  ),
  endTurn(
    "end-turn",
    "Hora de encerrar o giro. A demanda vai atacar, mas sua proteção absorve parte do dano. Toque em Encerrar giro.",
    "Neste passo, toque em Encerrar giro (destacado).",
  ),
  playCard(
    "passe",
    "Nem toda carta ataca. A Vovó Maria Conga tem passe de Cura: ela devolve Harmonia. Arraste-a até a gira.",
    "vovo-maria-conga",
    "Neste passo, arraste a Vovó Maria Conga (destacada) até a gira.",
  ),
  info(
    "done",
    "Pronto! Ainda existem os passes Guia (compra cartas) e Descarrego (enfraquece a demanda). Escolha a dificuldade e boa jogada!",
    [],
    "Concluir",
  ),
]);

const LAST_INDEX = TUTORIAL_STEPS.length - 1;

export const getTutorialStep = (index) => TUTORIAL_STEPS[clamp(index, 0, LAST_INDEX)];

export const isLastTutorialStep = (index) => index >= LAST_INDEX;

/**
 * Decide se uma ação do jogador é permitida no passo atual.
 * @param {number} stepIndex
 * @param {{ type: "play", templateId: string } | { type: "endTurn" }} action
 * @returns {{ allowed: boolean, hint: string | null }}
 */
export function checkTutorialAction(stepIndex, action) {
  const step = getTutorialStep(stepIndex);

  if (step.kind !== KIND.ACTION) {
    return { allowed: false, hint: "Leia a dica e toque em Continuar." };
  }

  const { expect } = step;
  const isExpected =
    action.type === expect.type &&
    (action.type !== "play" || action.templateId === expect.templateId);

  return isExpected ? { allowed: true, hint: null } : { allowed: false, hint: step.hint };
}
