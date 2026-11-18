/**
 * Definição dos sons como dados. Todos são sintetizados na hora (Web Audio),
 * então o jogo não precisa de arquivos de áudio.
 *
 * tone:  { kind: "tone", wave, from, to, at, duration, gain }   (frequências em Hz, tempos em s)
 * noise: { kind: "noise", filter, at, duration, gain }           (ruído com filtro passa-baixa em Hz)
 */
const tone = (wave, from, to, at, duration, gain) => ({ kind: "tone", wave, from, to, at, duration, gain });
const noise = (filter, at, duration, gain) => ({ kind: "noise", filter, at, duration, gain });

export const SOUND_DEFS = Object.freeze({
  click: [tone("triangle", 600, 500, 0, 0.05, 0.3)],
  pick: [tone("triangle", 440, 560, 0, 0.07, 0.4)],
  invalid: [tone("sawtooth", 220, 150, 0, 0.16, 0.3)],
  play: [
    noise(400, 0, 0.12, 0.5),
    tone("sine", 180, 90, 0, 0.2, 0.7),
    tone("triangle", 660, 880, 0.05, 0.15, 0.3),
  ],
  strong: [tone("sine", 660, 660, 0, 0.12, 0.45), tone("sine", 990, 990, 0.1, 0.2, 0.45)],
  weak: [tone("square", 330, 220, 0, 0.22, 0.2)],
  hit: [noise(900, 0, 0.18, 0.6), tone("sawtooth", 200, 80, 0, 0.25, 0.5)],
  turnEnd: [tone("sawtooth", 110, 55, 0, 0.45, 0.45), noise(300, 0, 0.4, 0.35)],
  block: [tone("square", 1100, 900, 0, 0.08, 0.3), tone("triangle", 800, 800, 0.06, 0.12, 0.3)],
  heal: [
    tone("sine", 523, 523, 0, 0.18, 0.4),
    tone("sine", 659, 659, 0.09, 0.18, 0.4),
    tone("sine", 784, 784, 0.18, 0.25, 0.4),
  ],
  draw: [tone("triangle", 500, 700, 0, 0.09, 0.35), tone("triangle", 700, 900, 0.07, 0.09, 0.35)],
  newTurn: [tone("sine", 784, 784, 0, 0.18, 0.4), tone("sine", 1047, 1047, 0.12, 0.28, 0.4)],
  victory: [
    tone("triangle", 523, 523, 0, 0.3, 0.45),
    tone("triangle", 659, 659, 0.13, 0.3, 0.45),
    tone("triangle", 784, 784, 0.26, 0.3, 0.45),
    tone("triangle", 1047, 1047, 0.39, 0.5, 0.5),
  ],
  defeat: [
    tone("sawtooth", 392, 392, 0, 0.3, 0.3),
    tone("sawtooth", 330, 330, 0.28, 0.3, 0.3),
    tone("sawtooth", 262, 262, 0.56, 0.5, 0.3),
  ],
  unlock: [
    tone("sine", 784, 784, 0, 0.25, 0.35),
    tone("sine", 988, 988, 0.08, 0.25, 0.35),
    tone("sine", 1175, 1175, 0.16, 0.25, 0.35),
    tone("sine", 1568, 1568, 0.24, 0.4, 0.35),
  ],
});
