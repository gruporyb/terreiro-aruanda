import { describe, expect, it } from "vitest";
import { ICON_COLORS, ICON_PATHS, ICON_VIEWBOX } from "./icons.js";
import { parsePath } from "../utils/svgPath.js";

describe("parsePath", () => {
  it("interpreta M, L, C e Z", () => {
    const commands = parsePath("M1 2 L3 4 C5 6 7 8 9 10 Z");
    expect(commands.map((c) => c.type)).toEqual(["M", "L", "C", "Z"]);
    expect(commands[2].args).toEqual([5, 6, 7, 8, 9, 10]);
  });

  it("aceita negativos e decimais", () => {
    expect(parsePath("M-1.5 .5")[0].args).toEqual([-1.5, 0.5]);
  });

  it("coordenadas repetidas após M viram L", () => {
    expect(parsePath("M0 0 1 1 2 2").map((c) => c.type)).toEqual(["M", "L", "L"]);
  });

  it("rejeita comandos não suportados e parâmetros faltando", () => {
    expect(() => parsePath("M0 0 A1 1 0 0 1 2 2")).toThrow();
    expect(() => parsePath("M0")).toThrow();
  });
});

describe("ícones", () => {
  for (const [name, d] of Object.entries(ICON_PATHS)) {
    it(`${name}: caminho válido, dentro da caixa ${ICON_VIEWBOX}x${ICON_VIEWBOX} e subcaminhos fechados`, () => {
      const commands = parsePath(d);
      const moves = commands.filter((c) => c.type === "M").length;
      const closes = commands.filter((c) => c.type === "Z").length;
      expect(moves).toBe(closes);

      const coords = commands.flatMap((c) => c.args);
      expect(Math.min(...coords)).toBeGreaterThan(-0.001);
      expect(Math.max(...coords)).toBeLessThan(ICON_VIEWBOX + 0.001);
    });

    it(`${name}: tem cor definida`, () => {
      expect(typeof ICON_COLORS[name]).toBe("number");
    });
  }
});
