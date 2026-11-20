import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/utils/random.js";
import { Matchmaker } from "./matchmaker.js";

const setup = (rng = createSeededRandom(1)) => {
  const matches = [];
  const matchmaker = new Matchmaker({ rng, onMatch: (pair) => matches.push(pair) });
  return { matchmaker, matches };
};

describe("Matchmaker", () => {
  it("um jogador sozinho espera na fila", () => {
    const { matchmaker, matches } = setup();
    matchmaker.join({ name: "A" });
    expect(matchmaker.size).toBe(1);
    expect(matches).toHaveLength(0);
  });

  it("o segundo jogador forma o par; um é o Terreiro e o outro a Demanda", () => {
    const { matchmaker, matches } = setup();
    const a = { name: "A" };
    const b = { name: "B" };
    matchmaker.join(a);
    matchmaker.join(b);

    expect(matches).toHaveLength(1);
    const { terreiro, demanda } = matches[0];
    expect([terreiro, demanda].includes(a)).toBe(true);
    expect([terreiro, demanda].includes(b)).toBe(true);
    expect(terreiro === demanda).toBe(false);
    expect(matchmaker.size).toBe(0);
  });

  it("forma pares por ordem de chegada", () => {
    const { matchmaker, matches } = setup();
    const [a, b, c, d] = ["A", "B", "C", "D"].map((name) => ({ name }));
    [a, b, c].forEach((p) => matchmaker.join(p));
    expect(matches).toHaveLength(1);
    expect(matchmaker.size).toBe(1); // C aguarda
    matchmaker.join(d);
    const second = matches[1];
    expect([second.terreiro, second.demanda].sort((x, y) => x.name.localeCompare(y.name))).toEqual([c, d]);
  });

  it("os papéis variam conforme o sorteio", () => {
    const rolesOfA = new Set();
    for (let seed = 1; seed <= 30; seed++) {
      const { matchmaker, matches } = setup(createSeededRandom(seed));
      const a = { name: "A" };
      matchmaker.join(a);
      matchmaker.join({ name: "B" });
      rolesOfA.add(matches[0].terreiro === a ? "terreiro" : "demanda");
    }
    expect(rolesOfA.size).toBe(2);
  });

  it("não aceita o mesmo jogador duas vezes e permite sair da fila", () => {
    const { matchmaker, matches } = setup();
    const a = { name: "A" };
    expect(matchmaker.join(a)).toBe(true);
    expect(matchmaker.join(a)).toBe(false);
    expect(matchmaker.size).toBe(1);

    expect(matchmaker.leave(a)).toBe(true);
    expect(matchmaker.leave(a)).toBe(false);
    matchmaker.join({ name: "B" });
    expect(matches).toHaveLength(0); // A saiu: B não é pareado com ele
  });
});
