import { Container, Graphics } from "pixi.js";
import { COLORS } from "../../config/constants.js";
import { ROLE } from "../pvp/pvpRules.js";
import { ELEMENT_COLORS } from "../elementColors.js";
import { createLabel } from "../ui/createLabel.js";
import { drawAxeOrbs, drawResourceBar } from "../ui/resourceBars.js";

const LABEL_SIZE = 16;
const TIMER_COLOR = Object.freeze({
  mine: COLORS.textTitle,
  theirs: COLORS.textMuted,
  urgent: COLORS.demand,
});

const describeRole = (role, demandElement) =>
  role === ROLE.DEMANDA ? `Demanda de ${demandElement}` : "Terreiro";

/**
 * Painel do duelo online. À esquerda, você; à direita, o oponente. No centro,
 * o seu Axé; o cronômetro fica junto ao botão de encerrar o giro.
 */
export class OnlineHud extends Container {
  #hud;
  #bars = new Graphics();
  #me;
  #opponent;
  #opponentInfo;
  #axe;
  #round;
  #shield;
  #timer;
  #message;

  /** @param {object} layout resultado de createLayout() */
  constructor(layout) {
    super();
    const { hud, message } = layout;
    this.#hud = hud;

    const labelAt = (spec, options = {}) =>
      createLabel("", { size: LABEL_SIZE, x: spec.x, y: spec.y, anchorX: spec.anchorX ?? 0, ...options });

    this.#me = labelAt(hud.harmony, { bold: true });
    this.#opponent = labelAt(hud.demand, { bold: true });
    this.#opponentInfo = labelAt(hud.demand.matchup, { size: 13, color: COLORS.textBody });
    this.#axe = labelAt(hud.axe, { bold: true, anchorX: 0.5 });
    this.#round = labelAt(hud.turn, { bold: true });
    this.#shield = labelAt(hud.shield, { color: COLORS.textBody });
    this.#timer = labelAt(hud.attack, { bold: true });
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
      this.#me,
      this.#opponent,
      this.#opponentInfo,
      this.#axe,
      this.#round,
      this.#shield,
      this.#timer,
      this.#message,
    );
  }

  /**
   * @param {{ view: object, opponentName: string, startingAxe: number }} data
   *   `startingAxe` aparece como prévia enquanto o Axé ainda não foi definido (troca de cartas)
   */
  update({ view, opponentName, startingAxe }) {
    const { you, opponent, demandElement } = view;
    const axe = you.maxAxe > 0 ? you.axe : startingAxe;
    const maxAxe = you.maxAxe > 0 ? you.maxAxe : startingAxe;

    this.#me.text = `Você (${describeRole(you.role, demandElement)})  ${you.life}/${you.maxLife}`;
    this.#me.style.fill = this.#colorFor(you.role, demandElement);
    this.#opponent.text = `${opponentName}  ${opponent.life}/${opponent.maxLife}`;
    this.#opponent.style.fill = this.#colorFor(opponent.role, demandElement);
    this.#opponentInfo.text = `${describeRole(opponent.role, demandElement)}  Proteção ${opponent.shield}  Mão ${opponent.handCount}`;
    this.#axe.text = `Axé  ${axe}/${maxAxe}`;
    this.#round.text = `Rodada ${view.round}`;
    this.#shield.text = `Proteção: ${you.shield}`;

    const bars = this.#bars.clear();
    drawResourceBar(bars, this.#hud, this.#hud.harmony, you.life / you.maxLife, COLORS.harmony);
    drawResourceBar(bars, this.#hud, this.#hud.demand, opponent.life / opponent.maxLife, COLORS.demand);
    drawAxeOrbs(bars, this.#hud, axe, maxAxe);
  }

  /** @param {{ text: string, tone: "mine" | "theirs" | "urgent" }} timer */
  setTimer({ text, tone }) {
    this.#timer.text = text;
    this.#timer.style.fill = TIMER_COLOR[tone];
  }

  showMessage(text) {
    this.#message.text = text;
  }

  #colorFor(role, demandElement) {
    return role === ROLE.DEMANDA ? ELEMENT_COLORS[demandElement] : COLORS.textTitle;
  }
}
