import { clamp } from "../../utils/math.js";

const TAU = Math.PI * 2;

/**
 * Cria uma explosão de partículas.
 * `direction` em radianos (-π/2 = para cima) e `spread` = abertura do leque.
 */
export function createBurst(
  { x, y, color, count = 24, speed = 200, life = 700, size = 4, gravity = 300, spread = TAU, direction = -Math.PI / 2 },
  rng = Math.random,
) {
  return Array.from({ length: count }, () => {
    const angle = direction + (rng() - 0.5) * spread;
    const velocity = speed * (0.4 + 0.6 * rng());
    const particleLife = life * (0.6 + 0.4 * rng());
    return {
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: particleLife,
      maxLife: particleLife,
      size: size * (0.6 + 0.8 * rng()),
      color,
      gravity,
    };
  });
}

/** Move as partículas e devolve só as que ainda estão vivas. */
export function advanceParticles(particles, deltaMS) {
  const seconds = deltaMS / 1000;
  return particles.filter((particle) => {
    particle.life -= deltaMS;
    if (particle.life <= 0) return false;
    particle.vy += particle.gravity * seconds;
    particle.x += particle.vx * seconds;
    particle.y += particle.vy * seconds;
    return true;
  });
}

/** 1 no nascimento, 0 no fim da vida. */
export const particleAlpha = (particle) => clamp(particle.life / particle.maxLife, 0, 1);

/** Deslocamento do tremor da tela: forte no início e some suavemente. */
export function shakeOffset(elapsedMs, durationMs, strength, rng = Math.random) {
  if (elapsedMs >= durationMs) return { x: 0, y: 0 };
  const decay = (1 - elapsedMs / durationMs) ** 2;
  return {
    x: (rng() * 2 - 1) * strength * decay,
    y: (rng() * 2 - 1) * strength * decay,
  };
}
