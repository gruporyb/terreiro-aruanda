import { Container, Graphics } from "pixi.js";
import { COLORS } from "../../config/constants.js";
import { Button } from "../ui/Button.js";
import { createLabel } from "../ui/createLabel.js";

const PADDING = 14;
const BUTTON = Object.freeze({ width: 190, height: 36 });

/** Caixa da troca de cartas da primeira rodada (ocupa o topo da gira). */
export class MulliganPanel extends Container {
  #text;
  #button;

  /** @param {{ layout: object, onConfirm: () => void }} options */
  constructor({ layout, onConfirm }) {
    super();
    const { x, y, width, height } = layout.tutorial;
    this.visible = false;

    const background = new Graphics()
      .roundRect(x, y, width, height, 12)
      .fill({ color: 0xffffff, alpha: 0.97 })
      .stroke({ width: 2, color: COLORS.axe });

    const title = createLabel("Troca de cartas", {
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
      label: "Manter minha mão",
      x: x + width - PADDING - BUTTON.width,
      y: y + height - 8 - BUTTON.height,
      width: BUTTON.width,
      height: BUTTON.height,
      onTap: onConfirm,
    });

    this.addChild(background, title, this.#text, this.#button);
  }

  /** @param {{ isDone: boolean, selectedCount: number, max: number }} state */
  show({ isDone, selectedCount, max }) {
    this.visible = true;
    this.#button.visible = !isDone;

    if (isDone) {
      this.#text.text = "Troca confirmada. Aguardando o oponente...";
      return;
    }
    this.#text.text = `Troque até ${max} cartas: toque nas que quer trocar. Selecionadas: ${selectedCount}/${max}.`;
    this.#button.setLabel(selectedCount > 0 ? `Trocar ${selectedCount} carta(s)` : "Manter minha mão");
  }

  hide() {
    this.visible = false;
  }
}
