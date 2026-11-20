import { RULES } from "../../config/constants.js";

/** Os dois papéis de um duelo online. */
export const ROLE = Object.freeze({ TERREIRO: "terreiro", DEMANDA: "demanda" });

export const opponentOf = (role) => (role === ROLE.TERREIRO ? ROLE.DEMANDA : ROLE.TERREIRO);

/**
 * Regras do duelo online. Os dois lados começam IGUAIS em vida e Axé.
 *  - `firstRole`: quem joga primeiro. A Demanda abre o duelo para compensar a
 *    vantagem de escolha do Terreiro (que enxerga o elemento e pode buscar +30%).
 *  - O Axé de cada turno depende só da rodada, então os dois sempre têm o mesmo.
 */
export const PVP_RULES = Object.freeze({
  maxLife: 30,
  startingAxe: 3,
  mulliganMax: 3,
  turnMs: 30_000,
  mulliganMs: 30_000,
  firstRole: ROLE.DEMANDA,
});

/** Axé disponível em cada turno da rodada `round` (igual para os dois jogadores). */
export const axeForRound = (round, rules = PVP_RULES) =>
  Math.min(RULES.maxAxe, rules.startingAxe + round - 1);

/** Parte das regras que o cliente precisa conhecer. */
export const publicRules = (rules = PVP_RULES) => ({
  maxLife: rules.maxLife,
  startingAxe: rules.startingAxe,
  mulliganMax: rules.mulliganMax,
  turnMs: rules.turnMs,
  mulliganMs: rules.mulliganMs,
});
