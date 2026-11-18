import { Container } from "pixi.js";
import { CardView } from "./CardView.js";
import { computeHandLayout } from "./handLayout.js";

/** Gerencia as cartas da mão: criação, leque, saída ao serem jogadas e limpeza. */
export class Hand extends Container {
  /** id da carta -> view, apenas das cartas que ainda estão na mão. */
  #views = new Map();
  /** Cartas já jogadas, ainda animando até desaparecer. */
  #leaving = new Set();

  #layout;
  #art;

  /**
   * @param {object} handLayout configuração da mão (layout.hand)
   * @param {Map<string, import("pixi.js").Texture>} [art] id do modelo -> ilustração
   */
  constructor(handLayout, art = new Map()) {
    super();
    this.#layout = handLayout;
    this.#art = art;
    // Permite que cartas em hover/arraste fiquem acima das demais (zIndex).
    this.sortableChildren = true;
  }

  /**
   * Sincroniza as views com o estado do jogo.
   * @param {object[]} cards cartas atualmente na mão
   * @param {{x: number, y: number}} dismissTarget para onde vão as cartas jogadas
   */
  sync(cards, dismissTarget) {
    const idsInHand = new Set(cards.map((card) => card.id));

    for (const [id, view] of this.#views) {
      if (idsInHand.has(id)) continue;
      this.#views.delete(id);
      this.#leaving.add(view);
      view.dismiss(dismissTarget.x, dismissTarget.y);
    }

    const slots = computeHandLayout(cards.length, this.#layout);
    cards.forEach((card, index) => {
      const view = this.#views.get(card.id) ?? this.#spawn(card);
      view.setSlot(slots[index], index);
    });
  }

  /** Procura, entre as cartas da mão, a que veio do modelo `templateId`. */
  findViewByTemplate(templateId) {
    return [...this.#views.values()].find((view) => view.card.templateId === templateId) ?? null;
  }

  /** Atualiza os selos de elemento (+30% / ½) conforme a demanda atual. */
  setMatchup(getMatchupOf) {
    for (const view of this.#views.values()) view.setMatchup(getMatchupOf(view.card));
  }

  /** Atualiza quais cartas podem ser jogadas (ex.: Axé suficiente). */
  setPlayable(isPlayable) {
    for (const view of this.#views.values()) {
      view.setPlayable(isPlayable(view.card));
    }
  }

  /** Chamado a cada frame pelo ticker. */
  tick(ticker) {
    for (const view of this.#views.values()) view.tick(ticker);

    for (const view of this.#leaving) {
      view.tick(ticker);
      if (!view.isDismissed) continue;
      this.#leaving.delete(view); // remover de um Set durante a iteração é seguro
      this.#destroyView(view);
    }
  }

  /** Remove todas as cartas imediatamente (reinício da partida). */
  reset() {
    [...this.#views.values(), ...this.#leaving].forEach((view) =>
      this.#destroyView(view),
    );
    this.#views.clear();
    this.#leaving.clear();
  }

  #spawn(card) {
    const view = new CardView(card, this.#art.get(card.templateId) ?? null);
    view.placeAt(this.#layout.spawn.x, this.#layout.spawn.y);
    this.#views.set(card.id, view);
    this.addChild(view);
    return view;
  }

  #destroyView(view) {
    this.removeChild(view);
    view.destroy({ children: true });
  }
}
