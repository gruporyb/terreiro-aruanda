import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../../utils/random.js";
import { advanceParticles, createBurst, particleAlpha, shakeOffset } from "./particles.js";
import { Timeline } from "./timeline.js";

describe("Timeline", () => {
  it("executa as ações na ordem do tempo, só quando vencem", () => {
    const timeline = new Timeline();
    const log = [];
    timeline.after(300, () => log.push("b"));
    timeline.after(100, () => log.push("a"));
    timeline.tick(50);
    expect(log).toEqual([]);
    timeline.tick(100);
    expect(log).toEqual(["a"]);
    timeline.tick(500);
    expect(log).toEqual(["a", "b"]);
    expect(timeline.pendingCount).toBe(0);
  });

  it("uma ação pode agendar outra", () => {
    const timeline = new Timeline();
    const log = [];
    timeline.after(10, () => {
      log.push("1");
      timeline.after(10, () => log.push("2"));
    });
    timeline.tick(10);
    timeline.tick(10);
    expect(log).toEqual(["1", "2"]);
  });
});

describe("partículas", () => {
  const rng = () => createSeededRandom(9);

  it("cria a quantidade pedida, todas vivas", () => {
    const burst = createBurst({ x: 10, y: 20, color: 0xff0000, count: 12 }, rng());
    expect(burst).toHaveLength(12);
    expect(burst.every((p) => p.life > 0 && p.x === 10 && p.y === 20)).toBe(true);
  });

  it("avança posição, aplica gravidade e remove as que acabaram", () => {
    const burst = createBurst({ x: 0, y: 0, color: 1, count: 20, life: 400, gravity: 500 }, rng());
    const before = burst.map((p) => ({ vy: p.vy }));
    const alive = advanceParticles(burst, 100);
    expect(alive).toHaveLength(20);
    alive.forEach((p, i) => expect(p.vy).toBeGreaterThan(before[i].vy));
    expect(advanceParticles(alive, 1000)).toHaveLength(0);
  });

  it("a transparência vai de 1 a 0 ao longo da vida", () => {
    const [particle] = createBurst({ x: 0, y: 0, color: 1, count: 1, life: 1000 }, rng());
    expect(particleAlpha(particle)).toBe(1);
    particle.life = particle.maxLife / 2;
    expect(particleAlpha(particle)).toBeCloseTo(0.5, 5);
    particle.life = 0;
    expect(particleAlpha(particle)).toBe(0);
  });

  it("o tremor perde força e termina em zero", () => {
    const random = () => 1; // sempre o máximo
    expect(shakeOffset(0, 400, 10, random).x).toBeCloseTo(10, 5);
    expect(shakeOffset(200, 400, 10, random).x).toBeCloseTo(2.5, 5);
    expect(shakeOffset(400, 400, 10, random)).toEqual({ x: 0, y: 0 });
  });
});
