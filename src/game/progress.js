import { DIFFICULTY } from "../data/difficulties.js";

/** Sacramentos necessários para liberar a Demanda suprema. */
export const SACRAMENTOS_TO_UNLOCK = 5;

export const createProgress = () => ({ sacramentos: 0, supremeUnlocked: false });

export const isValidProgress = (value) =>
  Boolean(value) &&
  Number.isInteger(value.sacramentos) &&
  value.sacramentos >= 0 &&
  typeof value.supremeUnlocked === "boolean";

export const sacramentosToGo = (progress) =>
  Math.max(0, SACRAMENTOS_TO_UNLOCK - progress.sacramentos);

/** Só a Demanda suprema precisa ser liberada; as demais estão sempre disponíveis. */
export const isDifficultyUnlocked = (difficultyId, progress) =>
  difficultyId !== DIFFICULTY.SUPREME || progress.supremeUnlocked;

/**
 * Cada vitória rende 1 sacramento; ao chegar a 5 a Demanda suprema é liberada
 * (e continua liberada). Devolve o novo progresso e o resumo da recompensa.
 */
export function registerVictory(progress) {
  const sacramentos = progress.sacramentos + 1;
  const supremeUnlocked = progress.supremeUnlocked || sacramentos >= SACRAMENTOS_TO_UNLOCK;

  return {
    progress: { sacramentos, supremeUnlocked },
    reward: {
      sacramentos,
      target: SACRAMENTOS_TO_UNLOCK,
      justUnlocked: supremeUnlocked && !progress.supremeUnlocked,
      unlocked: supremeUnlocked,
    },
  };
}

/** Texto da recompensa exibido na tela de vitória. */
export function describeReward({ sacramentos, target, justUnlocked, unlocked }) {
  if (justUnlocked) return `+1 sacramento (${sacramentos}/${target}). A Demanda suprema foi liberada!`;
  if (unlocked) return `+1 sacramento. Você tem ${sacramentos}.`;
  return `+1 sacramento (${sacramentos}/${target})`;
}
