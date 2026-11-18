import { SOUND_DEFS } from "./soundDefs.js";

const SILENT = 0.0001; // as rampas exponenciais não aceitam zero
const ATTACK_S = 0.01;
const DEFAULT_VOLUME = 0.3;

function createNoiseBuffer(context) {
  const length = Math.floor(context.sampleRate * 0.5);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function envelope(context, destination, gainValue, start, duration) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(SILENT, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(gainValue, SILENT), start + ATTACK_S);
  gain.gain.exponentialRampToValueAtTime(SILENT, start + duration);
  gain.connect(destination);
  return gain;
}

/** Agenda os eventos de um som no contexto de áudio. Exportada para teste. */
export function scheduleSound(context, destination, noiseBuffer, events, startTime) {
  for (const event of events) {
    const start = startTime + event.at;
    const gain = envelope(context, destination, event.gain, start, event.duration);

    if (event.kind === "tone") {
      const oscillator = context.createOscillator();
      oscillator.type = event.wave;
      oscillator.frequency.setValueAtTime(event.from, start);
      if (event.to !== event.from) {
        oscillator.frequency.exponentialRampToValueAtTime(event.to, start + event.duration);
      }
      oscillator.connect(gain);
      oscillator.start(start);
      oscillator.stop(start + event.duration + 0.02);
    } else {
      const source = context.createBufferSource();
      source.buffer = noiseBuffer;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = event.filter;
      source.connect(filter);
      filter.connect(gain);
      source.start(start);
      source.stop(start + event.duration + 0.02);
    }
  }
}

function defaultCreateContext() {
  try {
    const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    return AudioContextClass ? new AudioContextClass() : null;
  } catch {
    return null; // sem suporte a áudio: o jogo segue mudo
  }
}

/**
 * Motor de efeitos sonoros. O contexto de áudio só é criado no primeiro som
 * (ou em unlock()), pois os navegadores exigem um gesto do usuário antes.
 */
export function createSoundEngine({ createContext = defaultCreateContext, volume = DEFAULT_VOLUME } = {}) {
  let context = null;
  let master = null;
  let noiseBuffer = null;
  let isMuted = false;

  function ensureContext() {
    if (context) return context;
    context = createContext();
    if (!context) return null;
    master = context.createGain();
    master.gain.value = isMuted ? 0 : volume;
    master.connect(context.destination);
    noiseBuffer = createNoiseBuffer(context);
    return context;
  }

  const resumeIfNeeded = (ctx) => {
    if (ctx.state === "suspended") ctx.resume?.();
  };

  return {
    /** Chame dentro de um gesto do usuário (toque/clique) para liberar o áudio. */
    unlock() {
      const ctx = ensureContext();
      if (ctx) resumeIfNeeded(ctx);
    },

    play(name) {
      const events = SOUND_DEFS[name];
      if (!events || isMuted) return;
      const ctx = ensureContext();
      if (!ctx) return;
      resumeIfNeeded(ctx);
      scheduleSound(ctx, master, noiseBuffer, events, ctx.currentTime);
    },

    setMuted(value) {
      isMuted = value;
      if (master) master.gain.value = value ? 0 : volume;
    },

    get isMuted() {
      return isMuted;
    },
  };
}
