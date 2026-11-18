import { describe, expect, it } from "vitest";
import { DIFFICULTY } from "../data/difficulties.js";
import {
  SACRAMENTOS_TO_UNLOCK,
  createProgress,
  describeReward,
  isDifficultyUnlocked,
  isValidProgress,
  registerVictory,
  sacramentosToGo,
} from "./progress.js";

const winTimes = (times, start = createProgress()) => {
  let progress = start;
  let reward = null;
  for (let i = 0; i < times; i++) ({ progress, reward } = registerVictory(progress));
  return { progress, reward };
};

describe("progress", () => {
  it("cada vitória rende 1 sacramento", () => {
    expect(winTimes(1).progress.sacramentos).toBe(1);
    expect(winTimes(3).progress.sacramentos).toBe(3);
  });

  it("a Demanda suprema só é liberada com 5 sacramentos", () => {
    const four = winTimes(SACRAMENTOS_TO_UNLOCK - 1).progress;
    expect(isDifficultyUnlocked(DIFFICULTY.SUPREME, four)).toBe(false);
    expect(sacramentosToGo(four)).toBe(1);

    const { progress, reward } = winTimes(1, four);
    expect(isDifficultyUnlocked(DIFFICULTY.SUPREME, progress)).toBe(true);
    expect(reward.justUnlocked).toBe(true);
  });

  it("continua liberada nas vitórias seguintes, sem avisar de novo", () => {
    const unlocked = winTimes(5).progress;
    const { progress, reward } = registerVictory(unlocked);
    expect(progress.supremeUnlocked).toBe(true);
    expect(progress.sacramentos).toBe(6);
    expect(reward.justUnlocked).toBe(false);
  });

  it("as outras dificuldades nunca são bloqueadas", () => {
    for (const id of [DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD]) {
      expect(isDifficultyUnlocked(id, createProgress())).toBe(true);
    }
  });

  it("valida o que vem do armazenamento", () => {
    expect(isValidProgress(createProgress())).toBe(true);
    expect(isValidProgress(null)).toBe(false);
    expect(isValidProgress({ sacramentos: -1, supremeUnlocked: false })).toBe(false);
    expect(isValidProgress({ sacramentos: 2 })).toBe(false);
  });

  it("descreve a recompensa nos três casos", () => {
    expect(describeReward(winTimes(2).reward)).toBe("+1 sacramento (2/5)");
    expect(describeReward(winTimes(5).reward).includes("liberada")).toBe(true);
    expect(describeReward(registerVictory(winTimes(5).progress).reward).includes("Você tem 6")).toBe(true);
  });
});
