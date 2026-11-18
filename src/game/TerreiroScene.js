import { Container } from "pixi.js";
import { CARD, COLORS } from "../config/constants.js";
import { createLayout } from "../config/layout.js";
import { sound } from "./audio/sound.js";
import { loadCardArt } from "./cardArt.js";
import { DragController } from "./DragController.js";
import { DropZone } from "./DropZone.js";
import { Effects } from "./effects/Effects.js";
import { ELEMENT_COLORS } from "./elementColors.js";
import { GameOverlay } from "./GameOverlay.js";
import { Hand } from "./Hand.js";
import { Hud } from "./Hud.js";
import { describeReward } from "./progress.js";
import { MATCHUP, MATCHUP_LABEL, effectiveDamage, getMatchup } from "./rules/elements.js";
import {
  GAME_STATUS,
  canPlayCard,
  endTurn,
  playCard,
  previewTurnEnd,
} from "./rules/gameLogic.js";
import { PASSE } from "../data/cardCatalog.js";
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

/** Tempo em que a entrada fica travada enquanto o fim do giro é animado. */
const TURN_END_BUSY_MS = 1250;

/**
 * Orquestra a partida: guarda o estado (puro), conecta a entrada do jogador
 * às regras e atualiza as views, os efeitos e os sons. É o único lugar que
 * conhece todas as partes.
 *
 * O estado, o passo do tutorial e a recompensa ficam na `session`, fora do
 * Pixi. Assim, ao girar o aparelho (o canvas é recriado), tudo continua.
 */
export class TerreiroScene {
  #layout;
  #rng;
  #session;
  #callbacks;
  #state;
  #lastStatus;
  #isBusy = false;
  #world = new Container();
  #table;
  #hand;
  #hud;
  #endTurnButton;
  #highlight = new TutorialHighlight();
  #panel;
  #overlay;
  #effects;

  /**
   * @param {import("pixi.js").Application} app
   * @param {object} options
   * @param {object} options.layout resultado de createLayout()
   * @param {object} options.session ver game/session.js
   * @param {{ onMenu?: () => void, onTutorialFinish?: () => void, onVictory?: () => object | null }} [options.callbacks]
   *   `onVictory` registra o sacramento e devolve a recompensa
   * @param {Map<string, import("pixi.js").Texture>} [options.art] ilustrações já carregadas
   * @param {() => number} [options.rng]
   */
  constructor(app, { layout, session, callbacks = {}, art = new Map(), rng = Math.random }) {
    this.#layout = layout;
    this.#rng = rng;
    this.#session = session;
    this.#callbacks = callbacks;
    this.#state = session.state ?? createGameForSession(session, rng);
    this.#lastStatus = this.#state.status; // evita refazer efeitos/recompensa ao remontar

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
    this.#effects = new Effects({ layout, shakeTarget: this.#world, rng });

    new DragController(app.stage, {
      bounds: layout,
      zone: this.#table,
      canStart: (view) => this.#canStartDrag(view),
      onStart: () => sound.play("pick"),
      onDrop: (view, isOverZone) => this.#handleDrop(view, isOverZone),
    });

    // Ordem de empilhamento (o "mundo" balança no tremor; os efeitos ficam por cima de tudo):
    // mesa, HUD, botão, mão, contornos, painel de dicas e overlay de fim de partida.
    this.#world.addChild(
      this.#table,
      this.#hud,
      this.#endTurnButton,
      this.#hand,
      this.#highlight,
      this.#panel,
      this.#overlay,
    );
    app.stage.addChild(this.#world, this.#effects);
    app.ticker.add((ticker) => {
      this.#hand.tick(ticker);
      this.#highlight.tick(ticker);
      this.#effects.tick(ticker);
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
    if (this.#isBusy || !this.#isPlaying() || view.isDismissing) return false;
    // No tutorial, só se arrasta carta nos passos de ação.
    return !this.#isTutorial() || this.#currentStep().kind === "action";
  }

  /** Se for tutorial e a ação não for a esperada, mostra a dica e devolve false. */
  #isActionAllowed(action) {
    if (!this.#isTutorial()) return true;
    const verdict = checkTutorialAction(this.#session.tutorialStep, action);
    if (!verdict.allowed) {
      this.#hud.showMessage(verdict.hint);
      sound.play("invalid");
    }
    return verdict.allowed;
  }

  #handleDrop(view, isOverZone) {
    if (!isOverZone) return; // soltou fora da gira: a carta volta para a mão
    if (!this.#isActionAllowed({ type: "play", templateId: view.card.templateId })) return;

    const check = canPlayCard(this.#state, view.card.id);
    if (!check.ok) {
      this.#hud.showMessage(check.reason);
      sound.play("invalid");
      return;
    }

    const { card } = view;
    const { element } = this.#state.demand;
    const matchup = getMatchup(card.element, element);
    const damage = effectiveDamage(card.power, card.element, element);

    this.#commit(playCard(this.#state, card.id, this.#rng));
    this.#playCardEffects(card, damage, matchup);
    this.#advanceTutorial();
  }

  #handleEndTurn() {
    if (this.#isBusy || !this.#isPlaying()) return;
    if (!this.#isActionAllowed({ type: "endTurn" })) return;

    const summary = previewTurnEnd(this.#state);
    this.#commit(endTurn(this.#state, this.#rng));
    this.#playTurnEndEffects(summary);
    this.#advanceTutorial();
  }

  #handleRestart() {
    sound.play("click");
    this.#session.tutorialStep = 0;
    this.#hand.reset();
    this.#commit(createGameForSession(this.#session, this.#rng));
  }

  #handleTutorialContinue() {
    sound.play("click");
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

    this.#handleStatusChange(state.status);

    const demandElement = state.demand.element;
    this.#hud.update(state);
    this.#hand.sync(state.hand, this.#table.center);
    this.#hand.setPlayable((card) => canPlayCard(state, card.id).ok);
    this.#hand.setMatchup((card) =>
      card.power > 0 ? getMatchup(card.element, demandElement) : MATCHUP.NEUTRAL,
    );
    this.#endTurnButton.setEnabled(this.#isPlaying());
    this.#overlay.update(state.status, this.#session.reward ? describeReward(this.#session.reward) : null);
    this.#renderTutorial();
  }

  /** Reage a vitória/derrota uma única vez (efeitos, sons e sacramento). */
  #handleStatusChange(status) {
    if (status === this.#lastStatus) return;
    this.#lastStatus = status;

    if (status === GAME_STATUS.PLAYING) {
      this.#session.reward = null; // nova partida
      return;
    }
    if (status === GAME_STATUS.WON) {
      this.#effects.confetti();
      this.#effects.flash(COLORS.axe, 0.3, 700);
      this.#effects.after(250, () => sound.play("victory"));

      if (!this.#isTutorial()) {
        this.#session.reward = this.#callbacks.onVictory?.() ?? null;
        if (this.#session.reward?.justUnlocked) this.#effects.after(1100, () => sound.play("unlock"));
      }
      return;
    }
    this.#effects.after(900, () => sound.play("defeat"));
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

  // ------------------------------------------------------------ efeitos

  /** Pontos de referência para posicionar efeitos. */
  #anchor(name) {
    const { hud, table } = this.#layout;
    switch (name) {
      case "harmony":
        return { x: hud.harmony.barX + hud.harmony.barWidth / 2, y: hud.harmony.barY + 40 };
      case "demand":
        return { x: hud.demand.barX + hud.demand.barWidth / 2, y: hud.demand.barY + 40 };
      case "axe":
        return { x: hud.axe.orbsX, y: hud.axe.orbsY };
      default:
        return table.center;
    }
  }

  #playCardEffects(card, damage, matchup) {
    const effects = this.#effects;
    const table = this.#anchor("table");
    const demand = this.#anchor("demand");

    effects.burst({ ...table, color: ELEMENT_COLORS[card.element], count: 30, speed: 250 });
    sound.play("play");

    if (card.power > 0) {
      effects.floatText(`-${damage}`, { ...demand, color: COLORS.demand, size: 28 });
      effects.burst({ ...demand, color: COLORS.demand, count: 14, speed: 150, life: 500 });
    }
    if (matchup !== MATCHUP.NEUTRAL) {
      const isStrong = matchup === MATCHUP.STRONG;
      effects.floatText(MATCHUP_LABEL[matchup], {
        x: table.x,
        y: table.y - 30,
        color: isStrong ? COLORS.good : COLORS.borderBlocked,
        size: 32,
      });
      effects.after(120, () => sound.play(isStrong ? "strong" : "weak"));
    }
    if (card.passe.type === PASSE.CURA) {
      const harmony = this.#anchor("harmony");
      effects.floatText(`+${card.passe.amount}`, { ...harmony, color: COLORS.good, size: 26 });
      effects.burst({ ...harmony, color: COLORS.good, count: 16, speed: 120, life: 600, gravity: -60 });
      effects.after(220, () => sound.play("heal"));
    } else if (card.passe.type === PASSE.GUIA) {
      effects.after(220, () => sound.play("draw"));
    }
  }

  /**
   * Sequência do fim do giro: a demanda ataca, a proteção reage, o dano chega
   * à Harmonia e um novo giro começa. A entrada fica travada até o fim.
   */
  #playTurnEndEffects({ attack, blocked, damage, isDefeat }) {
    const effects = this.#effects;
    const demand = this.#anchor("demand");
    const harmony = this.#anchor("harmony");
    const table = this.#anchor("table");

    this.#isBusy = true;
    effects.after(TURN_END_BUSY_MS, () => {
      this.#isBusy = false;
    });

    // 1) a demanda ataca
    sound.play("turnEnd");
    effects.flash(COLORS.demand, 0.16, 500);
    effects.burst({ ...demand, color: COLORS.demand, count: 36, speed: 260, gravity: 200, direction: Math.PI / 2, spread: Math.PI });
    effects.floatText(`Ataque ${attack}`, { ...demand, color: COLORS.demand, size: 24 });

    // 2) a proteção absorve
    if (blocked > 0) {
      effects.after(350, () => {
        sound.play("block");
        effects.floatText(`Bloqueou ${blocked}`, { ...table, color: COLORS.shield, size: 28 });
        effects.burst({ ...table, color: COLORS.shield, count: 26, speed: 200 });
      });
    }

    // 3) o dano que passou atinge a Harmonia
    effects.after(600, () => {
      if (damage > 0) {
        sound.play("hit");
        effects.shake(9, 420);
        effects.flash(COLORS.demand, 0.3, 450);
        effects.floatText(`-${damage}`, { ...harmony, color: COLORS.demand, size: 30 });
        effects.burst({ ...harmony, color: COLORS.demand, count: 28, speed: 220 });
      } else {
        effects.floatText("Sem dano!", { ...harmony, color: COLORS.good, size: 26 });
      }
    });

    // 4) novo giro
    if (!isDefeat) {
      effects.after(1000, () => {
        sound.play("newTurn");
        effects.floatText(`Giro ${this.#state.turn}`, { ...table, color: COLORS.textTitle, size: 34 });
        effects.burst({ ...this.#anchor("axe"), color: COLORS.axe, count: 34, speed: 180, life: 800, gravity: 80 });
      });
    }
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
