import { Container, Graphics } from "pixi.js";
import { BORDER_WIDTH, COLORS, FONT, TABLE } from "../config/constants.js";
import { createLabel } from "./ui/createLabel.js";

const STYLE_BY_HIGHLIGHT = {
  idle: { border: COLORS.borderIdle, fill: 0xffffff, fillAlpha: 0.6, borderWidth: BORDER_WIDTH.idle },
  valid: { border: COLORS.borderActive, fill: COLORS.borderActive, fillAlpha: 0.12, borderWidth: BORDER_WIDTH.active },
  blocked: { border: COLORS.borderBlocked, fill: COLORS.borderBlocked, fillAlpha: 0.1, borderWidth: BORDER_WIDTH.active },
};

/** A "gira": área da mesa onde as cartas são soltas para serem jogadas. */
export class DropZone extends Container {
  #frame = new Graphics();

  constructor() {
    super();
    const hint = createLabel("Gira\nsolte uma carta aqui", {
      size: 16,
      font: FONT.display,
      color: COLORS.textMuted,
      x: this.center.x,
      y: this.center.y,
      anchorX: 0.5,
      anchorY: 0.5,
      align: "center",
    });
    this.addChild(this.#frame, hint);
    this.setHighlight("idle");
  }

  get center() {
    return { x: TABLE.x + TABLE.width / 2, y: TABLE.y + TABLE.height / 2 };
  }

  containsPoint({ x, y }) {
    return (
      x >= TABLE.x &&
      x <= TABLE.x + TABLE.width &&
      y >= TABLE.y &&
      y <= TABLE.y + TABLE.height
    );
  }

  /** @param {"idle"|"valid"|"blocked"} kind */
  setHighlight(kind) {
    const style = STYLE_BY_HIGHLIGHT[kind];
    this.#frame
      .clear()
      .roundRect(TABLE.x, TABLE.y, TABLE.width, TABLE.height, TABLE.radius)
      .fill({ color: style.fill, alpha: style.fillAlpha })
      .stroke({ width: style.borderWidth, color: style.border });
  }
}
