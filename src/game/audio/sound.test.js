import { describe, expect, it } from "vitest";
import { createSoundEngine } from "./soundEngine.js";
import { SOUND_DEFS } from "./soundDefs.js";

/** Contexto de áudio falso: só registra o que foi criado e agendado. */
function createFakeContext() {
  const log = { oscillators: [], sources: [], gains: 0, resumed: 0 };
  const param = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 0 });
  const context = {
    currentTime: 10,
    sampleRate: 8000,
    state: "suspended",
    destination: {},
    resume() { log.resumed++; },
    createGain() { log.gains++; return { gain: param(), connect() {} }; },
    createOscillator() {
      const osc = { type: "", frequency: param(), connect() {}, start(t) { osc.startedAt = t; }, stop() {} };
      log.oscillators.push(osc);
      return osc;
    },
    createBufferSource() {
      const src = { buffer: null, connect() {}, start(t) { src.startedAt = t; }, stop() {} };
      log.sources.push(src);
      return src;
    },
    createBiquadFilter() { return { type: "", frequency: { value: 0 }, connect() {} }; },
    createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; },
  };
  return { context, log };
}

describe("soundDefs", () => {
  it("todo som tem eventos válidos", () => {
    for (const [name, events] of Object.entries(SOUND_DEFS)) {
      expect(events.length).toBeGreaterThan(0);
      for (const e of events) {
        expect(e.duration).toBeGreaterThan(0);
        expect(e.gain).toBeGreaterThan(0);
        expect(e.gain).toBeLessThan(1.01);
        expect(e.at).toBeGreaterThan(-0.001);
        if (e.kind === "tone") {
          expect(e.from).toBeGreaterThan(0);
          expect(e.to).toBeGreaterThan(0);
          expect(["sine", "triangle", "square", "sawtooth"].includes(e.wave)).toBe(true);
        } else {
          expect(e.kind).toBe("noise");
          expect(e.filter).toBeGreaterThan(0);
        }
      }
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("existem os sons usados pelo jogo", () => {
    for (const name of ["pick", "play", "strong", "weak", "hit", "turnEnd", "block", "heal", "draw", "newTurn", "victory", "defeat", "unlock", "invalid", "click"]) {
      expect(Boolean(SOUND_DEFS[name])).toBe(true);
    }
  });
});

describe("soundEngine", () => {
  it("agenda um oscilador por nota e uma fonte por ruído, no tempo certo", () => {
    const { context, log } = createFakeContext();
    const engine = createSoundEngine({ createContext: () => context });
    engine.play("play"); // 2 notas + 1 ruído
    expect(log.oscillators).toHaveLength(2);
    expect(log.sources).toHaveLength(1);
    expect(log.oscillators[1].startedAt).toBeCloseTo(10.05, 5);
    expect(log.resumed).toBe(1); // contexto suspenso é retomado
  });

  it("mudo não cria contexto nem toca", () => {
    let created = 0;
    const engine = createSoundEngine({ createContext: () => { created++; return null; } });
    engine.setMuted(true);
    engine.play("hit");
    expect(created).toBe(0);
    expect(engine.isMuted).toBe(true);
  });

  it("sem suporte a áudio não dá erro", () => {
    const engine = createSoundEngine({ createContext: () => null });
    engine.play("victory");
    engine.unlock();
    expect(engine.isMuted).toBe(false);
  });

  it("som desconhecido é ignorado", () => {
    const { context, log } = createFakeContext();
    const engine = createSoundEngine({ createContext: () => context });
    engine.play("nao-existe");
    expect(log.oscillators).toHaveLength(0);
  });
});
