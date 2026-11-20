import { Container, Graphics, Rectangle, Sprite } from "pixi.js";
import { CARD, COLORS, FONT, MOTION, Z_INDEX } from "../config/constants.js";
import { ICON_COLORS } from "../config/icons.js";
import { coverScale } from "../utils/math.js";
import { CardMotion } from "./CardMotion.js";
import { getCardStats } from "./cardStats.js";
import { drawCardBackground } from "./drawCardBackground.js";
import { ELEMENT_COLORS } from "./elementColors.js";
import { MATCHUP, MATCHUP_LABEL } from "./rules/elements.js";
import { createIcon } from "./ui/createIcon.js";
import { createLabel } from "./ui/createLabel.js";

const BADGE_CENTER = CARD.padding + CARD.badgeRadius;
const CONTENT_WIDTH = CARD.width - CARD.padding * 2;
const CHIP = Object.freeze({ width: 46, height: 20, margin: 4 });

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
  #isSelected = false;
  #order = 0;
  #matchup = MATCHUP.NEUTRAL;
  #chip = new Container();
  #chipBackground = new Graphics();
  #chipLabel = createLabel("", { size: 12, bold: true, color: COLORS.buttonText, x: CHIP.width / 2, y: CHIP.height / 2, anchorX: 0.5, anchorY: 0.5 });

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

  /**
   * Selo no canto da ilustração: "+30%" (elemento forte contra a demanda) ou
   * "½" (fraco). Sem selo quando o confronto é neutro.
   */
  setMatchup(matchup) {
    if (matchup === this.#matchup) return;
    this.#matchup = matchup;

    this.#chip.visible = matchup !== MATCHUP.NEUTRAL;
    if (!this.#chip.visible) return;

    const color = matchup === MATCHUP.STRONG ? COLORS.good : COLORS.borderBlocked;
    this.#chipBackground.clear().roundRect(0, 0, CHIP.width, CHIP.height, CHIP.height / 2).fill({ color });
    this.#chipLabel.text = MATCHUP_LABEL[matchup];
  }

  /** Marca a carta (borda âmbar e levantada), p.ex. para a troca da primeira rodada. */
  setSelected(isSelected) {
    if (this.#isSelected === isSelected) return;
    this.#isSelected = isSelected;
    this.#motion.setSelected(isSelected);
    this.#updateZIndex();
    this.#refresh();
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
    this.#isSelected = false;
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

    const costText = createLabel(String(cost), {
      size: 16,
      bold: true,
      color: COLORS.buttonText,
      x: BADGE_CENTER,
      y: BADGE_CENTER,
      anchorX: 0.5,
      anchorY: 0.5,
    });
    const elementLabel = createLabel(element, {
      size: 13,
      bold: true,
      color: ELEMENT_COLORS[element],
      x: CARD.padding + CARD.badgeRadius * 2 + 6,
      y: BADGE_CENTER,
      anchorY: 0.5,
    });
    const title = createLabel(name, {
      size: 13,
      bold: true,
      font: FONT.display,
      x: CARD.width / 2,
      y: CARD.titleTop,
      anchorX: 0.5,
      align: "center",
      wrapWidth: CONTENT_WIDTH,
    });
    const divider = new Graphics()
      .moveTo(CARD.padding, CARD.dividerY)
      .lineTo(CARD.width - CARD.padding, CARD.dividerY)
      .stroke({ width: 1, color: COLORS.borderIdle });

    this.addChild(
      this.#background,
      this.#createArt(),
      this.#createChip(),
      this.#costBadge,
      costText,
      elementLabel,
      title,
      divider,
      this.#createStats(),
    );
  }

  #createChip() {
    this.#chip.visible = false;
    this.#chip.position.set(
      CARD.padding + CONTENT_WIDTH - CHIP.width - CHIP.margin,
      CARD.art.top + CHIP.margin,
    );
    this.#chip.addChild(this.#chipBackground, this.#chipLabel);
    return this.#chip;
  }

  /** Atributos como colunas: ícone em cima, valor embaixo (ataque, defesa, passe). */
  #createStats() {
    const { padding, statsTop, stat } = CARD;
    const columnWidth = CONTENT_WIDTH / 3;
    const container = new Container();

    getCardStats(this.#card).forEach(({ icon, value, isActive }, index) => {
      const centerX = padding + columnWidth * (index + 0.5);
      const alpha = isActive ? 1 : stat.inactiveAlpha;

      if (icon) {
        const iconView = createIcon(icon, {
          size: stat.iconSize,
          color: ICON_COLORS[icon],
          alpha,
        });
        iconView.position.set(centerX, statsTop + stat.iconSize / 2);
        container.addChild(iconView);
      }

      container.addChild(
        createLabel(value, {
          size: stat.valueSize,
          bold: true,
          color: isActive ? COLORS.textTitle : COLORS.textMuted,
          x: centerX,
          y: statsTop + stat.iconSize + stat.valueGap,
          anchorX: 0.5,
        }),
      );
    });
    return container;
  }

  /** Janela da ilustração: imagem recortada, ou um emblema do elemento como reserva. */
  #createArt() {
    const { padding, art } = CARD;
    const center = { x: padding + CONTENT_WIDTH / 2, y: art.top + art.height / 2 };
    const color = ELEMENT_COLORS[this.#card.element];
    const drawWindow = (graphics) =>
      graphics.roundRect(padding, art.top, CONTENT_WIDTH, art.height, art.radius);

    const container = new Container();
    container.addChild(drawWindow(new Graphics()).fill({ color, alpha: 0.12 }));

    if (!this.#texture) {
      container.addChild(this.#createEmblem(center, color));
      return container;
    }

    const sprite = new Sprite(this.#texture);
    sprite.anchor.set(0.5);
    sprite.position.set(center.x, center.y);
    sprite.scale.set(coverScale(this.#texture, { width: CONTENT_WIDTH, height: art.height }));

    const mask = drawWindow(new Graphics()).fill({ color: 0xffffff });
    sprite.mask = mask;
    container.addChild(sprite, mask);
    return container;
  }

  #createEmblem(center, color) {
    const emblem = new Container();
    emblem.addChild(
      new Graphics().circle(center.x, center.y, 22).stroke({ width: 2, color }),
      createLabel(this.#card.element[0], {
        size: 24,
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
    else if (this.#isHovered || this.#isSelected) this.zIndex = Z_INDEX.hovered;
    else this.zIndex = this.#order;
  }

  #refresh() {
    const isFocused = this.#isHovered || this.#isDragging;
    let highlight = !isFocused ? "idle" : this.#isPlayable ? "active" : "blocked";
    if (this.#isSelected) highlight = "selected";
    drawCardBackground(this.#background, { highlight, isPlayable: this.#isPlayable });

    this.#costBadge
      .clear()
      .circle(BADGE_CENTER, BADGE_CENTER, CARD.badgeRadius)
      .fill({ color: this.#isPlayable ? COLORS.badge : COLORS.badgeDisabled });
  }
}
