import { Container, Graphics } from "pixi.js";
import { COLORS, FONT } from "../config/constants.js";
import { GAME_STATUS } from "./rules/gameLogic.js";
import { Button } from "./ui/Button.js";
import { createLabel } from "./ui/createLabel.js";

const ENDINGS = {
  [GAME_STATUS.WON]: {
    title: "Axé! A demanda foi desfeita.",
    subtitle: "O terreiro voltou à harmonia.",
  },
  [GAME_STATUS.LOST]: {
    title: "A demanda venceu desta vez.",
    subtitle: "A Harmonia se esgotou. Respire fundo e jogue de novo.",
  },
};

/** Tela de fim de partida, com botão de reinício. */
export class GameOverlay extends Container {
  #title;
  #subtitle;

  constructor({ layout, onRestart, onMenu }) {
    super();
    this.visible = false;

    const centerX = layout.width / 2;
    const top = layout.height * 0.34;
    const wrapWidth = layout.width - 48;

    this.#title = createLabel("", {
      size: 28,
      bold: true,
      font: FONT.display,
      x: centerX,
      y: top,
      anchorX: 0.5,
      align: "center",
      wrapWidth,
    });
    this.#subtitle = createLabel("", {
      size: 17,
      color: COLORS.textBody,
      x: centerX,
      y: top + 90,
      anchorX: 0.5,
      align: "center",
      wrapWidth,
    });

    const dim = new Graphics()
      .rect(0, 0, layout.width, layout.height)
      .fill({ color: COLORS.overlay, alpha: 0.92 });
    // Interativo para impedir cliques nos elementos que ficam por baixo.
    dim.eventMode = "static";

    const restart = new Button({
      label: "Jogar novamente",
      x: centerX - 100,
      y: top + 160,
      width: 200,
      height: 52,
      onTap: onRestart,
    });

    const menu = new Button({
      label: "Menu",
      x: centerX - 100,
      y: top + 224,
      width: 200,
      height: 52,
      onTap: onMenu,
    });

    this.addChild(dim, this.#title, this.#subtitle, restart, menu);
  }

  update(status) {
    const ending = ENDINGS[status];
    this.visible = Boolean(ending);
    if (!ending) return;
    this.#title.text = ending.title;
    this.#subtitle.text = ending.subtitle;
  }
}
