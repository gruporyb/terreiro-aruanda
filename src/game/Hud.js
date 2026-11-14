import { Container, Graphics } from "pixi.js";
import { CANVAS, COLORS, END_TURN_BUTTON, HUD, RULES } from "../config/constants.js";
import { getDemandAttack } from "./rules/gameLogic.js";
import { createLabel } from "./ui/createLabel.js";

const CENTER_X = CANVAS.width / 2;
const RIGHT_EDGE = CANVAS.width - HUD.margin;
const BUTTON_CENTER_X = END_TURN_BUTTON.x + END_TURN_BUTTON.width / 2;

/** Painel de informações: Harmonia, demanda, Axé, proteção, giro e mensagens. */
export class Hud extends Container {
  #bars = new Graphics();
  #harmony = createLabel("", { size: 14, bold: true, x: HUD.margin, y: 14 });
  #demand = createLabel("", { size: 14, bold: true, x: RIGHT_EDGE, y: 14, anchorX: 1 });
  #axe = createLabel("", { size: 14, bold: true, x: CENTER_X, y: 12, anchorX: 0.5 });
  #turn = createLabel("", { size: 16, bold: true, x: HUD.margin, y: 140 });
  #shield = createLabel("", { size: 14, color: COLORS.textBody, x: HUD.margin, y: 168 });
  #attack = createLabel("", {
    size: 14,
    color: COLORS.textBody,
    x: BUTTON_CENTER_X,
    y: END_TURN_BUTTON.y - 28,
    anchorX: 0.5,
  });
  #message = createLabel("", {
    size: 15,
    color: COLORS.textBody,
    x: CENTER_X,
    y: HUD.messageY,
    anchorX: 0.5,
    align: "center",
    wrapWidth: 640,
  });

  constructor() {
    super();
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
    this.#harmony.text = `Harmonia do terreiro  ${state.harmony}/${RULES.maxHarmony}`;
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
    const { margin, barWidth, barHeight, barTop } = HUD;
    const demandX = RIGHT_EDGE - barWidth;
    const bars = this.#bars.clear();

    const drawBar = (x, ratio, color) => {
      bars.roundRect(x, barTop, barWidth, barHeight, 6).fill({ color: COLORS.track });
      if (ratio > 0) {
        bars.roundRect(x, barTop, barWidth * ratio, barHeight, 6).fill({ color });
      }
    };
    drawBar(margin, state.harmony / RULES.maxHarmony, COLORS.harmony);
    drawBar(demandX, state.demand.health / state.demand.maxHealth, COLORS.demand);

    this.#drawAxeOrbs(state);
  }

  #drawAxeOrbs({ axe, maxAxe }) {
    const { orbRadius, orbSpacing, orbTop } = HUD;
    for (let i = 0; i < maxAxe; i++) {
      const x = CENTER_X + (i - (maxAxe - 1) / 2) * orbSpacing;
      const isAvailable = i < axe;
      this.#bars
        .circle(x, orbTop, orbRadius)
        .fill({ color: isAvailable ? COLORS.axe : COLORS.track })
        .stroke({ width: 2, color: COLORS.axe });
    }
  }
}
