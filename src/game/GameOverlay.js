import { Container, Graphics } from "pixi.js";
import { CANVAS, COLORS, FONT } from "../config/constants.js";
import { GAME_STATUS } from "./rules/gameLogic.js";
import { Button } from "./ui/Button.js";
import { createLabel } from "./ui/createLabel.js";

const CENTER_X = CANVAS.width / 2;

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
  #title = createLabel("", {
    size: 28,
    bold: true,
    font: FONT.display,
    x: CENTER_X,
    y: 230,
    anchorX: 0.5,
    align: "center",
  });
  #subtitle = createLabel("", {
    size: 16,
    color: COLORS.textBody,
    x: CENTER_X,
    y: 282,
    anchorX: 0.5,
    align: "center",
  });

  constructor({ onRestart }) {
    super();
    this.visible = false;

    const dim = new Graphics()
      .rect(0, 0, CANVAS.width, CANVAS.height)
      .fill({ color: COLORS.overlay, alpha: 0.9 });
    // Interativo para impedir cliques nos elementos que ficam por baixo.
    dim.eventMode = "static";

    const restart = new Button({
      label: "Jogar novamente",
      x: CENTER_X - 85,
      y: 330,
      width: 170,
      height: 46,
      onTap: onRestart,
    });

    this.addChild(dim, this.#title, this.#subtitle, restart);
  }

  update(status) {
    const ending = ENDINGS[status];
    this.visible = Boolean(ending);
    if (!ending) return;
    this.#title.text = ending.title;
    this.#subtitle.text = ending.subtitle;
  }
}
