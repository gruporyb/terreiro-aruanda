import { Container, Graphics } from "pixi.js";
import { COLORS, FONT } from "../../config/constants.js";
import { ELEMENT_COLORS } from "../elementColors.js";
import { createLabel } from "../ui/createLabel.js";
import { advanceParticles, createBurst, particleAlpha, shakeOffset } from "./particles.js";
import { Timeline } from "./timeline.js";

const FLOAT_TEXT_MS = 1000;
const FLOAT_TEXT_RISE_PX_PER_S = 48;
const MAX_PARTICLES = 400;

/**
 * Camada de efeitos especiais: partículas, textos flutuantes, clarão de tela e
 * tremor. Fica acima de tudo (sem tremer junto) e não interfere nos toques.
 */
export class Effects extends Container {
  #layout;
  #shakeTarget;
  #rng;
  #timeline = new Timeline();
  #particleLayer = new Graphics();
  #flashLayer = new Graphics();
  #particles = [];
  #floatingTexts = [];
  #flash = null;
  #shake = null;

  /**
   * @param {{ layout: object, shakeTarget: Container, rng?: () => number }} options
   *   `shakeTarget`: o que balança no tremor (o "mundo" do jogo)
   */
  constructor({ layout, shakeTarget, rng = Math.random }) {
    super();
    this.#layout = layout;
    this.#shakeTarget = shakeTarget;
    this.#rng = rng;
    this.addChild(this.#flashLayer, this.#particleLayer);
  }

  /** Agenda uma ação (efeito ou som) para daqui a `delayMs`, no tempo do jogo. */
  after(delayMs, callback) {
    this.#timeline.after(delayMs, callback);
  }

  burst(options) {
    const created = createBurst(options, this.#rng);
    this.#particles = [...this.#particles, ...created].slice(-MAX_PARTICLES);
  }

  floatText(text, { x, y, color = COLORS.textTitle, size = 24 }) {
    const label = createLabel(text, { size, bold: true, font: FONT.display, color, x, y, anchorX: 0.5, anchorY: 0.5 });
    this.addChild(label);
    this.#floatingTexts.push({ label, elapsed: 0 });
  }

  flash(color, alpha = 0.25, durationMs = 450) {
    this.#flash = { color, alpha, elapsed: 0, duration: durationMs };
  }

  shake(strength = 7, durationMs = 380) {
    this.#shake = { strength, duration: durationMs, elapsed: 0 };
  }

  /** Chuva de confete colorido (vitória). */
  confetti() {
    const colors = [...Object.values(ELEMENT_COLORS), COLORS.axe, COLORS.good];
    const columns = 6;
    for (let i = 0; i < columns; i++) {
      this.burst({
        x: ((i + 0.5) * this.#layout.width) / columns,
        y: -10,
        color: colors[i % colors.length],
        count: 36,
        speed: 260,
        life: 1800,
        size: 5,
        gravity: 420,
        direction: Math.PI / 2,
        spread: Math.PI * 0.9,
      });
    }
  }

  /** Chamado a cada frame pelo ticker. */
  tick({ deltaMS }) {
    this.#timeline.tick(deltaMS);
    this.#updateParticles(deltaMS);
    this.#updateTexts(deltaMS);
    this.#updateFlash(deltaMS);
    this.#updateShake(deltaMS);
  }

  #updateParticles(deltaMS) {
    this.#particles = advanceParticles(this.#particles, deltaMS);
    const layer = this.#particleLayer.clear();
    for (const particle of this.#particles) {
      const alpha = particleAlpha(particle);
      layer.circle(particle.x, particle.y, particle.size * (0.4 + 0.6 * alpha)).fill({ color: particle.color, alpha });
    }
  }

  #updateTexts(deltaMS) {
    this.#floatingTexts = this.#floatingTexts.filter((item) => {
      item.elapsed += deltaMS;
      const progress = item.elapsed / FLOAT_TEXT_MS;
      if (progress >= 1) {
        this.removeChild(item.label);
        item.label.destroy();
        return false;
      }
      item.label.y -= (FLOAT_TEXT_RISE_PX_PER_S * deltaMS) / 1000;
      item.label.alpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
      return true;
    });
  }

  #updateFlash(deltaMS) {
    const layer = this.#flashLayer.clear();
    if (!this.#flash) return;

    this.#flash.elapsed += deltaMS;
    const remaining = 1 - this.#flash.elapsed / this.#flash.duration;
    if (remaining <= 0) {
      this.#flash = null;
      return;
    }
    layer
      .rect(0, 0, this.#layout.width, this.#layout.height)
      .fill({ color: this.#flash.color, alpha: this.#flash.alpha * remaining });
  }

  #updateShake(deltaMS) {
    if (!this.#shake) return;

    this.#shake.elapsed += deltaMS;
    const { x, y } = shakeOffset(this.#shake.elapsed, this.#shake.duration, this.#shake.strength, this.#rng);
    this.#shakeTarget.position.set(x, y);
    if (this.#shake.elapsed >= this.#shake.duration) this.#shake = null;
  }
}
