/**
 * Níveis de dificuldade. Cada um é um "ruleset": só muda a pressão da demanda
 * e a Harmonia inicial; as cartas e as demais regras são as mesmas.
 */

export const DIFFICULTY = Object.freeze({
  EASY: "easy",
  NORMAL: "normal",
  HARD: "hard",
  SUPREME: "supreme",
});

const ruleset = ({ maxHarmony, startingAxe = 3, demandName, health, baseAttack, attackGrowth }) =>
  Object.freeze({
    maxHarmony,
    startingAxe,
    demand: Object.freeze({ name: demandName, health, baseAttack, attackGrowth }),
  });

export const DIFFICULTIES = Object.freeze({
  [DIFFICULTY.EASY]: Object.freeze({
    id: DIFFICULTY.EASY,
    label: "Fácil",
    description: "Demanda mais branda e mais Harmonia. Ideal para conhecer o jogo.",
    ruleset: ruleset({ maxHarmony: 32, demandName: "Demanda leve", health: 50, baseAttack: 6, attackGrowth: 2 }),
  }),
  [DIFFICULTY.NORMAL]: Object.freeze({
    id: DIFFICULTY.NORMAL,
    label: "Normal",
    description: "O equilíbrio original do terreiro.",
    ruleset: ruleset({ maxHarmony: 30, demandName: "Demanda pesada", health: 52, baseAttack: 7, attackGrowth: 2 }),
  }),
  [DIFFICULTY.HARD]: Object.freeze({
    id: DIFFICULTY.HARD,
    label: "Difícil",
    description: "Demanda com mais vida e menos Harmonia. Exige defesa e bons passes.",
    ruleset: ruleset({ maxHarmony: 28, demandName: "Demanda profunda", health: 56, baseAttack: 7, attackGrowth: 2 }),
  }),
  [DIFFICULTY.SUPREME]: Object.freeze({
    id: DIFFICULTY.SUPREME,
    label: "Demanda suprema",
    description: "O desafio máximo do terreiro. Chances bem baixas de vitória.",
    ruleset: ruleset({ maxHarmony: 26, demandName: "Demanda suprema", health: 58, baseAttack: 8, attackGrowth: 2 }),
  }),
});

/** Ordem de exibição no menu. */
export const DIFFICULTY_ORDER = Object.freeze([
  DIFFICULTY.EASY,
  DIFFICULTY.NORMAL,
  DIFFICULTY.HARD,
  DIFFICULTY.SUPREME,
]);

export const DEFAULT_DIFFICULTY = DIFFICULTY.NORMAL;

export const isDifficulty = (value) => Object.hasOwn(DIFFICULTIES, value);

/** Regras do tutorial: demanda fraca e previsível (não aparece no menu). */
export const TUTORIAL_RULESET = ruleset({
  maxHarmony: 30,
  demandName: "Demanda de treino",
  health: 12,
  baseAttack: 6,
  attackGrowth: 0,
});
