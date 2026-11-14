import { Container, Graphics } from "pixi.js";
import { COLORS } from "../../config/constants.js";
import { Button } from "../ui/Button.js";
import { createLabel } from "../ui/createLabel.js";

const PADDING = 14;
const BUTTON = Object.freeze({ width: 150, height: 36 });

/** Caixa de dicas do tutorial, sobre a parte de cima da gira. */
export class TutorialPanel extends Container {
  #counter;
  #text;
  #button;

  /**
   * @param {{ layout: object, onContinue: () => void }} options
   *   `layout.tutorial` define o retângulo ocupado pelo painel
   */
  constructor({ layout, onContinue }) {
    super();
    const { x, y, width, height } = layout.tutorial;
    this.visible = false;

    const background = new Graphics()
      .roundRect(x, y, width, height, 12)
      .fill({ color: 0xffffff, alpha: 0.97 })
      .stroke({ width: 2, color: COLORS.axe });

    this.#counter = createLabel("", {
      size: 12,
      bold: true,
      color: COLORS.textMuted,
      x: x + PADDING,
      y: y + 8,
    });
    this.#text = createLabel("", {
      size: 15,
      color: COLORS.textTitle,
      x: x + PADDING,
      y: y + 26,
      wrapWidth: width - PADDING * 2,
    });
    this.#button = new Button({
      label: "Continuar",
      x: x + width - PADDING - BUTTON.width,
      y: y + height - 8 - BUTTON.height,
      width: BUTTON.width,
      height: BUTTON.height,
      onTap: onContinue,
    });

    this.addChild(background, this.#counter, this.#text, this.#button);
  }

  /** Mostra o passo atual; o botão só aparece nos passos informativos. */
  show(step, index, total) {
    this.visible = true;
    this.#counter.text = `Passo ${index + 1} de ${total}`;
    this.#text.text = step.text;
    this.#button.visible = step.kind === "info";
    if (step.buttonLabel) this.#button.setLabel(step.buttonLabel);
  }

  hide() {
    this.visible = false;
  }
}
