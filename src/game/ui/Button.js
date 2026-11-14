import { Container, Graphics } from "pixi.js";
import { COLORS } from "../../config/constants.js";
import { createLabel } from "./createLabel.js";

/** Botão retangular simples com estados normal, hover e desabilitado. */
export class Button extends Container {
  #background = new Graphics();
  #label;
  #size;
  #isEnabled = true;
  #isHovered = false;

  constructor({ label, x, y, width, height, onTap }) {
    super();
    this.position.set(x, y);
    this.#size = { width, height };
    this.#label = createLabel(label, {
      size: 15,
      bold: true,
      color: COLORS.buttonText,
      x: width / 2,
      y: height / 2,
      anchorX: 0.5,
      anchorY: 0.5,
    });
    this.addChild(this.#background, this.#label);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerover", () => this.#setHovered(true));
    this.on("pointerout", () => this.#setHovered(false));
    this.on("pointertap", () => this.#isEnabled && onTap());

    this.#redraw();
  }

  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled;
    this.#isHovered = false;
    this.eventMode = isEnabled ? "static" : "none";
    this.#redraw();
  }

  #setHovered(isHovered) {
    this.#isHovered = isHovered;
    this.#redraw();
  }

  #redraw() {
    const color = !this.#isEnabled
      ? COLORS.buttonDisabled
      : this.#isHovered
        ? COLORS.buttonHover
        : COLORS.button;

    this.#background
      .clear()
      .roundRect(0, 0, this.#size.width, this.#size.height, 10)
      .fill({ color });
  }
}
