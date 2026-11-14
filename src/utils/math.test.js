import { describe, expect, it } from "vitest";
import { clamp, coverScale, lerp } from "./math.js";

describe("math", () => {
  it("lerp e clamp", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("coverScale cobre a caixa nos dois eixos", () => {
    const box = { width: 116, height: 70 };
    // imagem quadrada: a largura decide
    expect(coverScale({ width: 1024, height: 1024 }, box)).toBeCloseTo(116 / 1024, 6);
    // imagem muito larga: a altura decide
    expect(coverScale({ width: 2000, height: 500 }, box)).toBeCloseTo(70 / 500, 6);
  });
});
