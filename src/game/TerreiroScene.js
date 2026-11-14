import { CARD } from "../config/constants.js";
import { createLayout } from "../config/layout.js";
import { loadCardArt } from "./cardArt.js";
import { DragController } from "./DragController.js";
import { DropZone } from "./DropZone.js";
import { GameOverlay } from "./GameOverlay.js";
import { Hand } from "./Hand.js";
import { Hud } from "./Hud.js";
import {
  GAME_STATUS,
  canPlayCard,
  endTurn,
  playCard,
} from "./rules/gameLogic.js";
import { createGameForSession, isTutorialSession } from "./session.js";
import { TutorialHighlight } from "./tutorial/TutorialHighlight.js";
import { TutorialPanel } from "./tutorial/TutorialPanel.js";
import {
  TUTORIAL_STEPS,
  checkTutorialAction,
  getTutorialStep,
  isLastTutorialStep,
} from "./tutorial/tutorialSteps.js";
import { Button } from "./ui/Button.js";

/**
 * Orquestra a partida: guarda o estado (puro), conecta a entrada do jogador
 * às regras e atualiza as views. É o único lugar que conhece todas as partes.
 *
 * O estado e o passo do tutorial ficam na `session`, fora do Pixi. Assim, ao
 * girar o aparelho (o canvas é recriado com outro layout), tudo continua.
 */
export class TerreiroScene {
  #layout;
  #rng;
  #session;
  #callbacks;
  #state;
  #table;
  #hand;
  #hud;
  #endTurnButton;
  #highlight = new TutorialHighlight();
  #panel;
  #overlay;

  /**
   * @param {import("pixi.js").Application} app
   * @param {object} options
   * @param {object} options.layout resultado de createLayout()
   * @param {object} options.session ver game/session.js
   * @param {{ onMenu?: () => void, onTutorialFinish?: () => void }} [options.callbacks]
   * @param {Map<string, import("pixi.js").Texture>} [options.art] ilustrações já carregadas
   * @param {() => number} [options.rng]
   */
  constructor(app, { layout, session, callbacks = {}, art = new Map(), rng = Math.random }) {
    this.#layout = layout;
    this.#rng = rng;
    this.#session = session;
    this.#callbacks = callbacks;
    this.#state = session.state ?? createGameForSession(session, rng);

    this.#table = new DropZone(layout.table);
    this.#hand = new Hand(layout.hand, art);
    this.#hud = new Hud(layout);
    this.#endTurnButton = new Button({
      ...layout.endTurnButton,
      label: "Encerrar giro",
      onTap: () => this.#handleEndTurn(),
    });
    this.#panel = new TutorialPanel({ layout, onContinue: () => this.#handleTutorialContinue() });
    this.#overlay = new GameOverlay({
      layout,
      onRestart: () => this.#handleRestart(),
      onMenu: () => this.#callbacks.onMenu?.(),
    });

    new DragController(app.stage, {
      bounds: layout,
      zone: this.#table,
      canStart: (view) => this.#canStartDrag(view),
      onDrop: (view, isOverZone) => this.#handleDrop(view, isOverZone),
    });

    // Ordem de empilhamento: mesa, HUD, botão, mão (cartas por cima),
    // contornos, painel de dicas e overlay de fim de partida.
    app.stage.addChild(
      this.#table,
      this.#hud,
      this.#endTurnButton,
      this.#hand,
      this.#highlight,
      this.#panel,
      this.#overlay,
    );
    app.ticker.add((ticker) => {
      this.#hand.tick(ticker);
      this.#highlight.tick(ticker);
    });

    this.#commit(this.#state);
  }

  #isPlaying() {
    return this.#state.status === GAME_STATUS.PLAYING;
  }

  #isTutorial() {
    return isTutorialSession(this.#session);
  }

  #currentStep() {
    return getTutorialStep(this.#session.tutorialStep);
  }

  #canStartDrag(view) {
    if (!this.#isPlaying() || view.isDismissing) return false;
    // No tutorial, só se arrasta carta nos passos de ação.
    return !this.#isTutorial() || this.#currentStep().kind === "action";
  }

  /** Se for tutorial e a ação não for a esperada, mostra a dica e devolve false. */
  #isActionAllowed(action) {
    if (!this.#isTutorial()) return true;
    const verdict = checkTutorialAction(this.#session.tutorialStep, action);
    if (!verdict.allowed) this.#hud.showMessage(verdict.hint);
    return verdict.allowed;
  }

  #handleDrop(view, isOverZone) {
    if (!isOverZone) return; // soltou fora da gira: a carta volta para a mão
    if (!this.#isActionAllowed({ type: "play", templateId: view.card.templateId })) return;

    const check = canPlayCard(this.#state, view.card.id);
    if (!check.ok) {
      this.#hud.showMessage(check.reason);
      return;
    }
    this.#commit(playCard(this.#state, view.card.id, this.#rng));
    this.#advanceTutorial();
  }

  #handleEndTurn() {
    if (!this.#isActionAllowed({ type: "endTurn" })) return;
    this.#commit(endTurn(this.#state, this.#rng));
    this.#advanceTutorial();
  }

  #handleRestart() {
    this.#session.tutorialStep = 0;
    this.#hand.reset();
    this.#commit(createGameForSession(this.#session, this.#rng));
  }

  #handleTutorialContinue() {
    if (isLastTutorialStep(this.#session.tutorialStep)) {
      this.#callbacks.onTutorialFinish?.();
      return;
    }
    this.#advanceTutorial();
  }

  #advanceTutorial() {
    if (!this.#isTutorial()) return;
    this.#session.tutorialStep = Math.min(this.#session.tutorialStep + 1, TUTORIAL_STEPS.length - 1);
    this.#renderTutorial();
  }

  /** Adota um novo estado, grava na sessão e atualiza as views. */
  #commit(state) {
    this.#state = state;
    this.#session.state = state;

    this.#hud.update(state);
    this.#hand.sync(state.hand, this.#table.center);
    this.#hand.setPlayable((card) => canPlayCard(state, card.id).ok);
    this.#endTurnButton.setEnabled(this.#isPlaying());
    this.#overlay.update(state.status);
    this.#renderTutorial();
  }

  #renderTutorial() {
    if (!this.#isTutorial()) {
      this.#panel.hide();
      this.#highlight.setTargets([]);
      this.#table.setHintVisible(true);
      return;
    }

    const step = this.#currentStep();
    this.#panel.show(step, this.#session.tutorialStep, TUTORIAL_STEPS.length);
    this.#highlight.setTargets(step.highlight.map((target) => () => this.#resolveHighlight(target)));
    this.#table.setHintVisible(false);
  }

  /** Retângulo atual do alvo de um destaque, ou null se ele não existe agora. */
  #resolveHighlight(target) {
    const { hud, table, endTurnButton } = this.#layout;

    if (target === "table") return table;
    if (target === "endTurn") return endTurnButton;

    if (target === "harmony" || target === "demand") {
      const spec = hud[target];
      return {
        x: spec.barX,
        y: spec.y - 2,
        width: spec.barWidth,
        height: spec.barY + hud.barHeight - spec.y + 4,
      };
    }
    if (target === "axe") {
      const width = this.#state.maxAxe * hud.orbSpacing + 40;
      return {
        x: hud.axe.orbsX - width / 2,
        y: hud.axe.y - 2,
        width,
        height: hud.axe.orbsY + hud.orbRadius - hud.axe.y + 6,
      };
    }
    if (target.startsWith("card:")) {
      const view = this.#hand.findViewByTemplate(target.slice("card:".length));
      if (!view) return null;
      const width = CARD.width * view.scale.x;
      const height = CARD.height * view.scale.x;
      return { x: view.x - width / 2, y: view.y - height / 2, width, height };
    }
    return null;
  }
}

/**
 * Cria o "loader" usado pelo hook usePixiApp para um tamanho de canvas.
 * `preload` carrega as ilustrações; `setup` monta a cena.
 */
export function createSceneLoader(size, session, callbacks) {
  const layout = createLayout(size);
  return {
    size,
    preload: loadCardArt,
    setup: (app, art) => new TerreiroScene(app, { layout, session, callbacks, art }),
  };
}
