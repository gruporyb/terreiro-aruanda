import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  isDifficulty,
} from "./difficulties.js";

const rulesetOf = (id) => DIFFICULTIES[id].ruleset;

describe("difficulties", () => {
  it("cada nível tem id igual à sua chave e a ordem cobre todos", () => {
    for (const [key, difficulty] of Object.entries(DIFFICULTIES)) {
      expect(difficulty.id).toBe(key);
    }
    expect(DIFFICULTY_ORDER).toHaveLength(Object.keys(DIFFICULTIES).length);
  });

  it("a pressão cresce do mais fácil ao mais difícil", () => {
    for (let i = 1; i < DIFFICULTY_ORDER.length; i++) {
      const easier = rulesetOf(DIFFICULTY_ORDER[i - 1]);
      const harder = rulesetOf(DIFFICULTY_ORDER[i]);
      expect(harder.demand.health).toBeGreaterThan(easier.demand.health);
      expect(harder.demand.baseAttack).toBeGreaterThan(easier.demand.baseAttack - 1);
      expect(harder.demand.attackGrowth).toBeGreaterThan(easier.demand.attackGrowth - 1);
      expect(harder.maxHarmony).toBeLessThan(easier.maxHarmony);
    }
  });

  it("valida e tem padrão", () => {
    expect(isDifficulty(DEFAULT_DIFFICULTY)).toBe(true);
    expect(isDifficulty("impossivel")).toBe(false);
  });
});
