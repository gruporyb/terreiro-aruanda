import { Container, Graphics, Text } from "pixi.js";
import { CARD, COLORS } from "../config/constants";
import { CardAnimation } from "./CardAnimation";
import { createAttributesStyle, createTitleStyle } from "./cardStyles";
import { drawCardBackground } from "./drawCardBackground";

const formatAttributes = (attributes) =>
  attributes.map(({ label, value }) => `${label}: ${value}`).join("\n");

/** Carta interativa: desenha a si mesma, reage ao ponteiro e se anima por frame. */
export class Card extends Container {
  #data;
  #onPlay;
  #background = new Graphics();
  #animation = new CardAnimation();
  #baseY = 0;

  /**
   * @param {{ name: string, attributes: {label: string, value: string}[] }} data
   * @param {{ onPlay?: (data: object) => void }} [options]
   */
  constructor(data, { onPlay = () => {} } = {}) {
    super();
    this.#data = data;
    this.#onPlay = onPlay;

    // Pivô no centro: escala e animações partem do meio da carta.
    this.pivot.set(CARD.width / 2, CARD.height / 2);

    this.#buildVisuals();
    this.#enableInteraction();
  }

  /** Posiciona o centro da carta nas coordenadas informadas. */
  placeAt(x, y) {
    this.#baseY = y;
    this.position.set(x, y);
  }

  /** Deve ser chamado a cada frame pelo ticker. */
  tick(ticker) {
    const { scale, offsetY } = this.#animation.update(ticker);
    this.scale.set(scale);
    this.y = this.#baseY + offsetY;
  }

  #buildVisuals() {
    drawCardBackground(this.#background, { isHovered: false });

    this.addChild(
      this.#background,
      this.#createTitle(),
      this.#createDivider(),
      this.#createAttributes(),
    );
  }

  #createTitle() {
    const title = new Text({ text: this.#data.name, style: createTitleStyle() });
    title.anchor.set(0.5, 0);
    title.position.set(CARD.width / 2, CARD.titleTop);
    return title;
  }

  #createDivider() {
    return new Graphics()
      .moveTo(CARD.padding, CARD.dividerY)
      .lineTo(CARD.width - CARD.padding, CARD.dividerY)
      .stroke({ width: 1, color: COLORS.borderDefault });
  }

  #createAttributes() {
    const attributes = new Text({
      text: formatAttributes(this.#data.attributes),
      style: createAttributesStyle(),
    });
    attributes.position.set(CARD.padding, CARD.attributesTop);
    return attributes;
  }

  #enableInteraction() {
    // "static" habilita eventos de ponteiro (mouse e toque) no Pixi v8.
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerover", () => this.#setHovered(true));
    this.on("pointerout", () => this.#setHovered(false));
    this.on("pointertap", () => this.#play());
  }

  #setHovered(isHovered) {
    this.#animation.setHovered(isHovered);
    drawCardBackground(this.#background, { isHovered });
  }

  #play() {
    this.#animation.triggerPulse();
    this.#onPlay(this.#data);
  }
}
