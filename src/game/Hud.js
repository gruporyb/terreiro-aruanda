import { Container, Graphics } from "pixi.js";
import { COLORS } from "../config/constants.js";
import { getDemandAttack } from "./rules/gameLogic.js";
import { createLabel } from "./ui/createLabel.js";

const LABEL_SIZE = 16;

/** Painel de informações: Harmonia, demanda, Axé, proteção, giro e mensagens. */
export class Hud extends Container {
  #hud;
  #bars = new Graphics();
  #harmony;
  #demand;
  #axe;
  #turn;
  #shield;
  #attack;
  #message;

  /** @param {object} layout resultado de createLayout() */
  constructor(layout) {
    super();
    const { hud, message } = layout;
    this.#hud = hud;

    const labelAt = (spec, options = {}) =>
      createLabel("", { size: LABEL_SIZE, x: spec.x, y: spec.y, anchorX: spec.anchorX ?? 0, ...options });

    this.#harmony = labelAt(hud.harmony, { bold: true });
    this.#demand = labelAt(hud.demand, { bold: true });
    this.#axe = labelAt(hud.axe, { bold: true, anchorX: 0.5 });
    this.#turn = labelAt(hud.turn, { bold: true });
    this.#shield = labelAt(hud.shield, { color: COLORS.textBody });
    this.#attack = labelAt(hud.attack, { color: COLORS.textBody });
    this.#message = createLabel("", {
      size: LABEL_SIZE,
      color: COLORS.textBody,
      x: message.x,
      y: message.y,
      anchorX: 0.5,
      anchorY: 0.5,
      align: "center",
      wrapWidth: message.wrapWidth,
    });

    this.addChild(
      this.#bars,
      this.#harmony,
      this.#demand,
      this.#axe,
      this.#turn,
      this.#shield,
      this.#attack,
      this.#message,
    );
  }

  update(state) {
    this.#harmony.text = `Harmonia do terreiro  ${state.harmony}/${state.ruleset.maxHarmony}`;
    this.#demand.text = `${state.demand.name}  ${state.demand.health}/${state.demand.maxHealth}`;
    this.#axe.text = `Axé  ${state.axe}/${state.maxAxe}`;
    this.#turn.text = `Giro ${state.turn}`;
    this.#shield.text = `Proteção: ${state.shield}`;
    this.#attack.text = `Próximo ataque: ${getDemandAttack(state)}`;
    this.showMessage(state.message);
    this.#drawBars(state);
  }

  /** Mostra um aviso temporário (ex.: "Axé insuficiente") no lugar da mensagem atual. */
  showMessage(text) {
    this.#message.text = text;
  }

  #drawBars(state) {
    const { barHeight, harmony, demand } = this.#hud;
    const bars = this.#bars.clear();

    const drawBar = ({ barX, barY, barWidth }, ratio, color) => {
      bars.roundRect(barX, barY, barWidth, barHeight, barHeight / 2).fill({ color: COLORS.track });
      if (ratio > 0) {
        bars.roundRect(barX, barY, barWidth * ratio, barHeight, barHeight / 2).fill({ color });
      }
    };
    drawBar(harmony, state.harmony / state.ruleset.maxHarmony, COLORS.harmony);
    drawBar(demand, state.demand.health / state.demand.maxHealth, COLORS.demand);

    this.#drawAxeOrbs(state);
  }

  #drawAxeOrbs({ axe, maxAxe }) {
    const { orbRadius, orbSpacing, axe: spec } = this.#hud;
    for (let i = 0; i < maxAxe; i++) {
      const x = spec.orbsX + (i - (maxAxe - 1) / 2) * orbSpacing;
      this.#bars
        .circle(x, spec.orbsY, orbRadius)
        .fill({ color: i < axe ? COLORS.axe : COLORS.track })
        .stroke({ width: 2, color: COLORS.axe });
    }
  }
}
