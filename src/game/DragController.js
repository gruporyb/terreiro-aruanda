import { Rectangle } from "pixi.js";
import { CardView } from "./CardView.js";

/**
 * Arrastar e soltar de cartas, via eventos no palco (mouse e toque).
 * Só se comunica com o resto do jogo por callbacks:
 *  - canStart(view): a carta pode ser arrastada agora?
 *  - onDrop(view, isOverZone): a carta foi solta (dentro ou fora da gira).
 */
export class DragController {
  #zone;
  #canStart;
  #onDrop;
  #view = null;
  #grabOffset = { x: 0, y: 0 };

  /** @param {{ width: number, height: number }} bounds tamanho lógico do canvas */
  constructor(stage, { bounds, zone, canStart, onDrop }) {
    this.#zone = zone;
    this.#canStart = canStart;
    this.#onDrop = onDrop;

    // O palco precisa ser interativo e cobrir a tela para receber move/up em qualquer ponto.
    stage.eventMode = "static";
    stage.hitArea = new Rectangle(0, 0, bounds.width, bounds.height);

    stage.on("pointerdown", (event) => this.#start(event));
    stage.on("pointermove", (event) => this.#move(event));
    stage.on("pointerup", (event) => this.#end(event));
    stage.on("pointerupoutside", (event) => this.#end(event));
  }

  #start(event) {
    const view = CardView.findAncestor(event.target);
    if (!view || this.#view || !this.#canStart(view)) return;

    this.#view = view;
    // Mantém o ponto onde a carta foi "agarrada" sob o ponteiro.
    this.#grabOffset = { x: event.global.x - view.x, y: event.global.y - view.y };
    view.startDrag(view.x, view.y);
  }

  #move(event) {
    if (!this.#view) return;

    this.#view.dragTo(
      event.global.x - this.#grabOffset.x,
      event.global.y - this.#grabOffset.y,
    );

    const isOverZone = this.#zone.containsPoint(event.global);
    const highlight = !isOverZone ? "idle" : this.#view.isPlayable ? "valid" : "blocked";
    this.#zone.setHighlight(highlight);
  }

  #end(event) {
    if (!this.#view) return;

    const view = this.#view;
    this.#view = null;

    const isOverZone = this.#zone.containsPoint(event.global);
    view.endDrag();
    this.#zone.setHighlight("idle");
    this.#onDrop(view, isOverZone);
  }
}
