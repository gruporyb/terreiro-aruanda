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
  #reward;

  constructor({ layout, onRestart, onMenu, restartLabel = "Jogar novamente" }) {
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

    this.#reward = createLabel("", {
      size: 17,
      bold: true,
      color: COLORS.good,
      x: centerX,
      y: top + 142,
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
      label: restartLabel,
      x: centerX - 100,
      y: top + 196,
      width: 200,
      height: 52,
      onTap: onRestart,
    });

    const menu = new Button({
      label: "Menu",
      x: centerX - 100,
      y: top + 260,
      width: 200,
      height: 52,
      onTap: onMenu,
    });

    this.addChild(dim, this.#title, this.#subtitle, this.#reward, restart, menu);
  }

  /**
   * @param {string | null} rewardText texto da recompensa (só na vitória)
   * @param {{ title: string, subtitle: string } | null} customEnding textos próprios (ex.: duelo online)
   */
  update(status, rewardText = null, customEnding = null) {
    const ending = ENDINGS[status] && (customEnding ?? ENDINGS[status]);
    this.visible = Boolean(ending);
    if (!ending) return;
    this.#title.text = ending.title;
    this.#subtitle.text = ending.subtitle;
    this.#reward.text = status === GAME_STATUS.WON && rewardText ? rewardText : "";
  }
}
