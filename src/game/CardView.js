import { Container, Graphics, Rectangle, Sprite } from "pixi.js";
import { CARD, COLORS, FONT, MOTION, Z_INDEX } from "../config/constants.js";
import { CardMotion } from "./CardMotion.js";
import { formatStats } from "./cardText.js";
import { drawCardBackground } from "./drawCardBackground.js";
import { coverScale } from "../utils/math.js";
import { ELEMENT_COLORS } from "./elementColors.js";
import { createLabel } from "./ui/createLabel.js";

const BADGE_CENTER = CARD.padding + CARD.badgeRadius;

/** Representação visual e interativa de uma carta. Não conhece as regras do jogo. */
export class CardView extends Container {
  /** Sobe na hierarquia a partir de um alvo de evento até achar a carta. */
  static findAncestor(node) {
    let current = node;
    while (current && !(current instanceof CardView)) current = current.parent;
    return current ?? null;
  }

  #card;
  #texture;
  #motion = new CardMotion();
  #background = new Graphics();
  #costBadge = new Graphics();
  #isPlayable = true;
  #isHovered = false;
  #isDragging = false;
  #isDismissing = false;
  #order = 0;

  /**
   * @param {object} card dados da carta
   * @param {import("pixi.js").Texture | null} [texture] ilustração (opcional)
   */
  constructor(card, texture = null) {
    super();
    this.#card = card;
    this.#texture = texture;

    // Pivô no centro: posição, escala e rotação partem do meio da carta.
    this.pivot.set(CARD.width / 2, CARD.height / 2);
    // Área de clique estendida para baixo: evita "tremedeira" quando a carta
    // sobe no hover e o ponteiro sairia dela.
    this.hitArea = new Rectangle(0, 0, CARD.width, CARD.height + MOTION.hoverLift);
    this.eventMode = "static";
    this.cursor = "grab";

    this.#buildVisuals();
    this.#bindHover();
    this.#refresh();
  }

  get card() {
    return this.#card;
  }

  get isPlayable() {
    return this.#isPlayable;
  }

  get isDismissing() {
    return this.#isDismissing;
  }

  get isDismissed() {
    return this.#motion.isDismissed;
  }

  /** Posiciona imediatamente (usado quando a carta é criada). */
  placeAt(x, y, rotation = 0) {
    this.#motion.placeAt(x, y, rotation);
    this.#applyPose(this.#motion.pose);
  }

  /** Define o lugar da carta na mão e sua ordem de empilhamento. */
  setSlot(slot, order) {
    this.#motion.setSlot(slot);
    this.#order = order;
    this.#updateZIndex();
  }

  setPlayable(isPlayable) {
    this.#isPlayable = isPlayable;
    this.#refresh();
  }

  startDrag(x, y) {
    this.#isDragging = true;
    this.cursor = "grabbing";
    this.#motion.startDrag({ x, y });
    this.#updateZIndex();
    this.#refresh();
  }

  dragTo(x, y) {
    this.#motion.moveDrag({ x, y });
  }

  endDrag() {
    this.#isDragging = false;
    this.#isHovered = false;
    this.cursor = "grab";
    this.#motion.setHovered(false);
    this.#motion.endDrag();
    this.#updateZIndex();
    this.#refresh();
  }

  /** Carta jogada: voa até (x, y), pulsa e desaparece. */
  dismiss(x, y) {
    this.#isDismissing = true;
    this.#isHovered = false;
    this.eventMode = "none";
    this.#motion.setSlot({ x, y, rotation: 0 });
    this.#motion.dismiss();
    this.zIndex = Z_INDEX.leaving;
    this.#refresh();
  }

  /** Chamado a cada frame pelo ticker. */
  tick(ticker) {
    this.#applyPose(this.#motion.update(ticker));
  }

  #applyPose({ x, y, rotation, scale, alpha }) {
    this.position.set(x, y);
    this.rotation = rotation;
    this.scale.set(scale);
    this.alpha = alpha;
  }

  #buildVisuals() {
    const { name, element, cost } = this.#card;
    const elementColor = ELEMENT_COLORS[element];
    const contentWidth = CARD.width - CARD.padding * 2;

    const costText = createLabel(String(cost), {
      size: 14,
      bold: true,
      color: COLORS.buttonText,
      x: BADGE_CENTER,
      y: BADGE_CENTER,
      anchorX: 0.5,
      anchorY: 0.5,
    });
    const elementLabel = createLabel(element, {
      size: 12,
      bold: true,
      color: elementColor,
      x: CARD.padding + CARD.badgeRadius * 2 + 6,
      y: BADGE_CENTER,
      anchorY: 0.5,
    });
    const title = createLabel(name, {
      size: 12,
      bold: true,
      font: FONT.display,
      x: CARD.width / 2,
      y: CARD.titleTop,
      anchorX: 0.5,
      align: "center",
      wrapWidth: contentWidth,
    });
    const divider = new Graphics()
      .moveTo(CARD.padding, CARD.dividerY)
      .lineTo(CARD.width - CARD.padding, CARD.dividerY)
      .stroke({ width: 1, color: COLORS.borderIdle });
    const stats = createLabel(formatStats(this.#card), {
      size: 11,
      color: COLORS.textBody,
      x: CARD.padding,
      y: CARD.statsTop,
      wrapWidth: contentWidth,
    });

    this.addChild(
      this.#background,
      this.#createArt(),
      this.#costBadge,
      costText,
      elementLabel,
      title,
      divider,
      stats,
    );
  }

  /** Janela da ilustração: imagem recortada, ou um emblema do elemento como reserva. */
  #createArt() {
    const { padding, art } = CARD;
    const width = CARD.width - padding * 2;
    const center = { x: padding + width / 2, y: art.top + art.height / 2 };
    const color = ELEMENT_COLORS[this.#card.element];
    const drawWindow = (graphics) =>
      graphics.roundRect(padding, art.top, width, art.height, art.radius);

    const container = new Container();
    container.addChild(drawWindow(new Graphics()).fill({ color, alpha: 0.12 }));

    if (!this.#texture) {
      container.addChild(this.#createEmblem(center, color));
      return container;
    }

    const sprite = new Sprite(this.#texture);
    sprite.anchor.set(0.5);
    sprite.position.set(center.x, center.y);
    sprite.scale.set(coverScale(this.#texture, { width, height: art.height }));

    const mask = drawWindow(new Graphics()).fill({ color: 0xffffff });
    sprite.mask = mask;
    container.addChild(sprite, mask);
    return container;
  }

  #createEmblem(center, color) {
    const emblem = new Container();
    emblem.addChild(
      new Graphics().circle(center.x, center.y, 24).stroke({ width: 2, color }),
      createLabel(this.#card.element[0], {
        size: 26,
        bold: true,
        font: FONT.display,
        color,
        x: center.x,
        y: center.y,
        anchorX: 0.5,
        anchorY: 0.5,
      }),
    );
    return emblem;
  }

  #bindHover() {
    this.on("pointerover", () => this.#setHovered(true));
    this.on("pointerout", () => this.#setHovered(false));
  }

  #setHovered(isHovered) {
    if (this.#isDragging || this.#isDismissing) return;
    this.#isHovered = isHovered;
    this.#motion.setHovered(isHovered);
    this.#updateZIndex();
    this.#refresh();
  }

  #updateZIndex() {
    if (this.#isDragging) this.zIndex = Z_INDEX.dragging;
    else if (this.#isHovered) this.zIndex = Z_INDEX.hovered;
    else this.zIndex = this.#order;
  }

  #refresh() {
    const isFocused = this.#isHovered || this.#isDragging;
    const highlight = !isFocused ? "idle" : this.#isPlayable ? "active" : "blocked";
    drawCardBackground(this.#background, { highlight, isPlayable: this.#isPlayable });

    this.#costBadge
      .clear()
      .circle(BADGE_CENTER, BADGE_CENTER, CARD.badgeRadius)
      .fill({ color: this.#isPlayable ? COLORS.badge : COLORS.badgeDisabled });
  }
}
