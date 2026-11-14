import { ANIMATION } from "../config/constants";
import { clamp, lerp } from "../utils/math";

/**
 * Estado e regras de animação da carta (escala de hover + pulso vertical).
 * Não depende do Pixi: recebe tempo e devolve valores, o que facilita testes.
 */
export class CardAnimation {
  #config;
  #scale;
  #targetScale;
  /** Tempo decorrido do pulso em ms; `null` quando não há pulso ativo. */
  #pulseElapsedMs = null;

  constructor(config = ANIMATION) {
    this.#config = config;
    this.#scale = config.restScale;
    this.#targetScale = config.restScale;
  }

  setHovered(isHovered) {
    this.#targetScale = isHovered
      ? this.#config.hoverScale
      : this.#config.restScale;
  }

  triggerPulse() {
    this.#pulseElapsedMs = 0;
  }

  /** Avança a animação e retorna o quadro atual: `{ scale, offsetY }`. */
  update({ deltaTime, deltaMS }) {
    this.#advanceScale(deltaTime);
    const offsetY = this.#advancePulse(deltaMS);
    return { scale: this.#scale, offsetY };
  }

  #advanceScale(deltaTime) {
    const smoothing = clamp(this.#config.scaleSmoothing * deltaTime, 0, 1);
    this.#scale = lerp(this.#scale, this.#targetScale, smoothing);
  }

  #advancePulse(deltaMS) {
    if (this.#pulseElapsedMs === null) return 0;

    this.#pulseElapsedMs += deltaMS;
    const progress = clamp(
      this.#pulseElapsedMs / this.#config.pulseDurationMs,
      0,
      1,
    );

    if (progress === 1) {
      this.#pulseElapsedMs = null;
      return 0;
    }

    // Seno de 0 a π: sobe até o pico e retorna suavemente a 0.
    return -Math.sin(progress * Math.PI) * this.#config.pulseHeightPx;
  }
}
