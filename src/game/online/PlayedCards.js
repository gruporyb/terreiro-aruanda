import { Container } from "pixi.js";
import { CardView } from "../CardView.js";

/**
 * Cartas jogadas pelo adversário: aparecem vindas de cima, voam até a gira,
 * pulsam e somem (a mesma animação das suas próprias cartas jogadas).
 */
export class PlayedCards extends Container {
  #art;
  #views = new Set();

  /** @param {Map<string, import("pixi.js").Texture>} [art] */
  constructor(art = new Map()) {
    super();
    this.#art = art;
  }

  show(card, from, to) {
    const view = new CardView(card, this.#art.get(card.templateId) ?? null);
    view.placeAt(from.x, from.y);
    view.dismiss(to.x, to.y);
    this.#views.add(view);
    this.addChild(view);
  }

  /** Chamado a cada frame pelo ticker. */
  tick(ticker) {
    for (const view of this.#views) {
      view.tick(ticker);
      if (!view.isDismissed) continue;
      this.#views.delete(view);
      this.removeChild(view);
      view.destroy({ children: true });
    }
  }
}
