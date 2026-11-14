import { Container, Graphics } from "pixi.js";
import { BORDER_WIDTH, COLORS, FONT } from "../config/constants.js";
import { createLabel } from "./ui/createLabel.js";

const STYLE_BY_HIGHLIGHT = {
  idle: { border: COLORS.borderIdle, fill: 0xffffff, fillAlpha: 0.6, borderWidth: BORDER_WIDTH.idle },
  valid: { border: COLORS.borderActive, fill: COLORS.borderActive, fillAlpha: 0.12, borderWidth: BORDER_WIDTH.active },
  blocked: { border: COLORS.borderBlocked, fill: COLORS.borderBlocked, fillAlpha: 0.1, borderWidth: BORDER_WIDTH.active },
};

/** A "gira": área da mesa onde as cartas são soltas para serem jogadas. */
export class DropZone extends Container {
  #table;
  #frame = new Graphics();
  #hint;

  /** @param {{x: number, y: number, width: number, height: number, radius: number, center: {x: number, y: number}}} table */
  constructor(table) {
    super();
    this.#table = table;

    this.#hint = createLabel("Gira\nsolte uma carta aqui", {
      size: 18,
      font: FONT.display,
      color: COLORS.textMuted,
      x: table.center.x,
      y: table.center.y - 14,
      anchorX: 0.5,
      anchorY: 0.5,
      align: "center",
    });
    this.addChild(this.#frame, this.#hint);
    this.setHighlight("idle");
  }

  /** O texto "solte uma carta aqui" some quando outro conteúdo ocupa a mesa (tutorial). */
  setHintVisible(isVisible) {
    this.#hint.visible = isVisible;
  }

  get center() {
    return this.#table.center;
  }

  containsPoint({ x, y }) {
    const { x: left, y: top, width, height } = this.#table;
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }

  /** @param {"idle"|"valid"|"blocked"} kind */
  setHighlight(kind) {
    const style = STYLE_BY_HIGHLIGHT[kind];
    const { x, y, width, height, radius } = this.#table;
    this.#frame
      .clear()
      .roundRect(x, y, width, height, radius)
      .fill({ color: style.fill, alpha: style.fillAlpha })
      .stroke({ width: style.borderWidth, color: style.border });
  }
}
