import { MOTION } from "../config/constants.js";
import { clamp, lerp } from "../utils/math.js";

const POSE_KEYS = ["x", "y", "rotation", "scale"];

/**
 * Movimento de uma carta: segue o "slot" da mão, sobe no hover, acompanha o
 * ponteiro no arraste e, ao ser jogada, pulsa e some. Independente do Pixi:
 * recebe tempo e devolve a pose, o que facilita os testes.
 */
export class CardMotion {
  #config;
  #pose;
  #slot = { x: 0, y: 0, rotation: 0 };
  #dragPoint = null;
  #isHovered = false;
  #isSelected = false;
  #isDismissing = false;
  /** Tempo do pulso em ms; `null` quando não há pulso ativo. */
  #pulseElapsedMs = null;

  constructor(config = MOTION) {
    this.#config = config;
    this.#pose = { x: 0, y: 0, rotation: 0, scale: config.restScale, alpha: 1 };
  }

  get pose() {
    return { ...this.#pose };
  }

  get isDragging() {
    return this.#dragPoint !== null;
  }

  get isDismissed() {
    return this.#isDismissing && this.#pose.alpha < this.#config.fadedAlpha;
  }

  /** Posiciona imediatamente, sem animar. */
  placeAt(x, y, rotation = 0) {
    this.#slot = { x, y, rotation };
    this.#pose = { ...this.#pose, x, y, rotation };
  }

  /** Define para onde a carta deve ir quando em repouso. */
  setSlot(slot) {
    this.#slot = { ...slot };
  }

  setHovered(isHovered) {
    this.#isHovered = isHovered;
  }

  /** Carta marcada pelo jogador (ex.: para trocar): fica levantada como no hover. */
  setSelected(isSelected) {
    this.#isSelected = isSelected;
  }

  startDrag(point) {
    this.#dragPoint = { ...point };
  }

  moveDrag(point) {
    if (this.#dragPoint) this.#dragPoint = { ...point };
  }

  endDrag() {
    this.#dragPoint = null;
  }

  triggerPulse() {
    this.#pulseElapsedMs = 0;
  }

  /** Carta jogada: vai ao slot atual, pulsa e então desaparece. */
  dismiss() {
    this.#isDismissing = true;
    this.#dragPoint = null;
    this.#isHovered = false;
    this.#isSelected = false;
    this.triggerPulse();
  }

  /** Avança a animação e devolve a pose do frame: `{ x, y, rotation, scale, alpha }`. */
  update({ deltaTime, deltaMS }) {
    const target = this.#computeTarget();
    const smoothing = this.#dragPoint
      ? this.#config.dragSmoothing
      : this.#config.smoothing;
    const follow = clamp(smoothing * deltaTime, 0, 1);

    for (const key of POSE_KEYS) {
      this.#pose[key] = lerp(this.#pose[key], target[key], follow);
    }
    this.#pose.alpha = lerp(
      this.#pose.alpha,
      target.alpha,
      clamp(this.#config.alphaSmoothing * deltaTime, 0, 1),
    );

    const pulseOffsetY = this.#advancePulse(deltaMS);
    return { ...this.#pose, y: this.#pose.y + pulseOffsetY };
  }

  #computeTarget() {
    const { restScale, hoverScale, dragScale, hoverLift } = this.#config;
    // A carta jogada só começa a sumir depois que o pulso termina.
    const alpha = this.#isDismissing && this.#pulseElapsedMs === null ? 0 : 1;

    if (this.#dragPoint) {
      return { ...this.#dragPoint, rotation: 0, scale: dragScale, alpha };
    }
    if (this.#isHovered || this.#isSelected) {
      return {
        x: this.#slot.x,
        y: this.#slot.y - hoverLift,
        rotation: 0,
        scale: hoverScale,
        alpha,
      };
    }
    return { ...this.#slot, scale: restScale, alpha };
  }

  #advancePulse(deltaMS) {
    if (this.#pulseElapsedMs === null) return 0;

    this.#pulseElapsedMs += deltaMS;
    const progress = clamp(this.#pulseElapsedMs / this.#config.pulseDurationMs, 0, 1);

    if (progress === 1) {
      this.#pulseElapsedMs = null;
      return 0;
    }
    // Seno de 0 a π: sobe até o pico e volta suavemente a 0.
    return -Math.sin(progress * Math.PI) * this.#config.pulseHeightPx;
  }
}
