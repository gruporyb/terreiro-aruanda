import { Container } from "pixi.js";
import { CARD, COLORS } from "../../config/constants.js";
import { createLayout } from "../../config/layout.js";
import { describeEnding, describeEvent, describeStatus } from "../../online/describeEvent.js";
import { sound } from "../audio/sound.js";
import { loadCardArt } from "../cardArt.js";
import { DragController } from "../DragController.js";
import { DropZone } from "../DropZone.js";
import { Effects } from "../effects/Effects.js";
import { ELEMENT_COLORS } from "../elementColors.js";
import { GameOverlay } from "../GameOverlay.js";
import { Hand } from "../Hand.js";
import { describeReward } from "../progress.js";
import { ROLE } from "../pvp/pvpRules.js";
import { MATCHUP, MATCHUP_LABEL, getMatchup } from "../rules/elements.js";
import { GAME_STATUS } from "../rules/gameLogic.js";
import { Button } from "../ui/Button.js";
import { MulliganPanel } from "./MulliganPanel.js";
import { OnlineHud } from "./OnlineHud.js";
import { PlayedCards } from "./PlayedCards.js";

const NO_SELECTION = new Set();
const URGENT_SECONDS = 10;
const TICK_SOUND_SECONDS = 5;
const now = () => globalThis.performance?.now() ?? Date.now();

/**
 * Cena do duelo online. Mostra a visão que o servidor envia e traduz o que o
 * jogador faz (arrastar, tocar, encerrar) em pedidos ao servidor: quem decide
 * é sempre o servidor, então a carta só sai da mão quando ele confirma.
 */
export class OnlineScene {
  #layout;
  #session;
  #callbacks;
  #state = null;
  #appliedView = null;
  #selected = new Set();
  #lastError = null;
  #shownTimerKey = "";
  #unsubscribe;
  #world = new Container();
  #table;
  #hand;
  #hud;
  #endTurnButton;
  #mulliganPanel;
  #played;
  #overlay;
  #effects;

  /**
   * @param {import("pixi.js").Application} app
   * @param {object} options
   * @param {object} options.layout resultado de createLayout()
   * @param {import("../../online/OnlineSession.js").OnlineSession} options.session
   * @param {{ onMenu?: () => void, onRematch?: () => void, onVictory?: () => object | null }} [options.callbacks]
   * @param {Map<string, import("pixi.js").Texture>} [options.art]
   */
  constructor(app, { layout, session, callbacks = {}, art = new Map(), rng = Math.random }) {
    this.#layout = layout;
    this.#session = session;
    this.#callbacks = callbacks;

    this.#table = new DropZone(layout.table);
    this.#hand = new Hand(layout.hand, art, { onCardTap: (view) => this.#toggleSelection(view) });
    this.#hud = new OnlineHud(layout);
    this.#endTurnButton = new Button({
      ...layout.endTurnButton,
      label: "Encerrar giro",
      onTap: () => this.#handleEndTurn(),
    });
    this.#mulliganPanel = new MulliganPanel({ layout, onConfirm: () => this.#confirmMulligan() });
    this.#played = new PlayedCards(art);
    this.#overlay = new GameOverlay({
      layout,
      restartLabel: "Jogar online de novo",
      onRestart: () => this.#callbacks.onRematch?.(),
      onMenu: () => this.#callbacks.onMenu?.(),
    });
    this.#effects = new Effects({ layout, shakeTarget: this.#world, rng });

    new DragController(app.stage, {
      bounds: layout,
      zone: this.#table,
      canStart: () => this.#isMyTurn(),
      onStart: () => sound.play("pick"),
      onDrop: (view, isOverZone) => this.#handleDrop(view, isOverZone),
    });

    this.#world.addChild(
      this.#table,
      this.#hud,
      this.#endTurnButton,
      this.#played,
      this.#hand,
      this.#mulliganPanel,
      this.#overlay,
    );
    app.stage.addChild(this.#world, this.#effects);
    app.ticker.add((ticker) => {
      this.#hand.tick(ticker);
      this.#played.tick(ticker);
      this.#effects.tick(ticker);
      this.#tickTimer();
    });

    this.#unsubscribe = session.subscribe((state, events) => this.#onState(state, events));
    this.#onState(session.state, []);
  }

  /** Chamado ao desmontar o canvas: para de ouvir a sessão. */
  dispose() {
    this.#unsubscribe();
  }

  // ------------------------------------------------------------ estado

  get #view() {
    return this.#state?.view ?? null;
  }

  #isMyTurn() {
    const view = this.#view;
    return Boolean(view) && view.phase === "playing" && view.active === view.you.role;
  }

  #onState(state, events) {
    this.#state = state;

    if (state.error && state.error !== this.#lastError) {
      this.#lastError = state.error;
      this.#hud.showMessage(state.error.message);
      sound.play("invalid");
    }
    // Só reprocessa quando chega uma visão nova: um aviso de erro chega com a mesma
    // visão e não pode ser apagado pela mensagem de status.
    if (state.view && state.view !== this.#appliedView) {
      this.#appliedView = state.view;
      this.#apply(events);
    }
  }

  #apply(events) {
    const view = this.#view;
    const me = view.you.role;

    // Após a troca, as cartas novas vêm do baralho (não voam até a gira como se fossem jogadas).
    if (events.some((event) => event.type === "mulliganDone" && event.role === me)) this.#hand.reset();
    if (view.phase !== "mulligan" || view.you.mulliganDone) this.#selected.clear();

    for (const event of events) this.#playEventEffects(event, view);

    const texts = events.map((event) => describeEvent(event, me)).filter(Boolean);
    this.#hud.showMessage(texts.length > 0 ? texts[texts.length - 1] : describeStatus(view, this.#state.rules.mulliganMax));

    this.#render();
  }

  #render() {
    const view = this.#view;
    const { you } = view;
    const { rules, opponentName } = this.#state;
    const inMulligan = view.phase === "mulligan";
    const myTurn = this.#isMyTurn();
    const canSwap = inMulligan && !you.mulliganDone;

    this.#hud.update({ view, opponentName, startingAxe: rules.startingAxe });
    this.#hand.sync(you.hand, this.#table.center);
    this.#hand.setPlayable((card) => (inMulligan ? !you.mulliganDone : myTurn && card.cost <= you.axe));
    this.#hand.setMatchup((card) =>
      you.role === ROLE.TERREIRO && card.power > 0 ? getMatchup(card.element, view.demandElement) : MATCHUP.NEUTRAL,
    );
    this.#hand.setSelected(canSwap ? this.#selected : NO_SELECTION);
    this.#endTurnButton.setEnabled(myTurn);

    if (inMulligan) {
      this.#mulliganPanel.show({ isDone: you.mulliganDone, selectedCount: this.#selected.size, max: rules.mulliganMax });
    } else {
      this.#mulliganPanel.hide();
    }
    this.#table.setHintVisible(!inMulligan);

    const ended = view.phase === "ended";
    const status = !ended ? GAME_STATUS.PLAYING : view.winner === "you" ? GAME_STATUS.WON : GAME_STATUS.LOST;
    const reward = this.#session.reward ? describeReward(this.#session.reward) : null;
    this.#overlay.update(status, reward, ended ? describeEnding(view) : null);
  }

  // ------------------------------------------------------------ cronômetro

  /** O servidor envia o tempo restante; a contagem entre mensagens é local. */
  #timerDisplay(view) {
    if (!view.timer || view.phase === "ended") return { text: "", tone: "theirs", playTick: false };

    const elapsed = now() - this.#session.viewReceivedAt;
    const seconds = Math.ceil(Math.max(0, view.timer.remainingMs - elapsed) / 1000);

    if (view.timer.kind === "mulligan") {
      const isUrgent = seconds <= TICK_SOUND_SECONDS && !view.you.mulliganDone;
      return { text: `Troca: ${seconds}s`, tone: isUrgent ? "urgent" : "mine", playTick: false };
    }
    const myTurn = view.active === view.you.role;
    const tone = !myTurn ? "theirs" : seconds <= URGENT_SECONDS ? "urgent" : "mine";
    return {
      text: `${myTurn ? "Sua vez" : "Oponente"}: ${seconds}s`,
      tone,
      playTick: myTurn && seconds <= TICK_SOUND_SECONDS && seconds > 0,
    };
  }

  #tickTimer() {
    const view = this.#view;
    if (!view) return;

    const display = this.#timerDisplay(view);
    const key = `${display.text}|${display.tone}`;
    if (key === this.#shownTimerKey) return;

    this.#shownTimerKey = key;
    this.#hud.setTimer(display);
    if (display.playTick) sound.play("tick");
  }

  // ------------------------------------------------------------ entrada do jogador

  #handleDrop(view, isOverZone) {
    if (!isOverZone) return; // soltou fora da gira: a carta volta para a mão

    const { card } = view;
    const { you } = this.#view;
    if (!this.#isMyTurn()) {
      this.#reject("Aguarde a sua vez.");
      return;
    }
    if (card.cost > you.axe) {
      this.#reject(`Axé insuficiente: ${card.name} custa ${card.cost} e você tem ${you.axe}.`);
      return;
    }
    this.#session.play(card.id);
  }

  #handleEndTurn() {
    if (!this.#isMyTurn()) return;
    sound.play("click");
    this.#session.endTurn();
  }

  #toggleSelection(view) {
    const current = this.#view;
    if (!current || current.phase !== "mulligan" || current.you.mulliganDone) return;

    const max = this.#state.rules.mulliganMax;
    const id = view.card.id;
    if (this.#selected.has(id)) {
      this.#selected.delete(id);
    } else if (this.#selected.size >= max) {
      this.#reject(`Você pode trocar no máximo ${max} cartas.`);
      return;
    } else {
      this.#selected.add(id);
    }
    sound.play("pick");
    this.#render();
  }

  #confirmMulligan() {
    const view = this.#view;
    if (!view || view.phase !== "mulligan" || view.you.mulliganDone) return;
    sound.play("click");
    this.#session.mulligan([...this.#selected]);
  }

  #reject(message) {
    this.#hud.showMessage(message);
    sound.play("invalid");
  }

  // ------------------------------------------------------------ efeitos

  #anchor(name) {
    const { hud, table } = this.#layout;
    switch (name) {
      case "me":
        return { x: hud.harmony.barX + hud.harmony.barWidth / 2, y: hud.harmony.barY + 40 };
      case "opponent":
        return { x: hud.demand.barX + hud.demand.barWidth / 2, y: hud.demand.barY + 40 };
      case "axe":
        return { x: hud.axe.orbsX, y: hud.axe.orbsY };
      default:
        return table.center;
    }
  }

  #playEventEffects(event, view) {
    const me = view.you.role;
    const effects = this.#effects;
    const table = this.#anchor("table");

    switch (event.type) {
      case "turnStart": {
        const isMine = event.role === me;
        effects.floatText(isMine ? "Sua vez!" : "Vez do oponente", {
          ...table,
          color: isMine ? COLORS.good : COLORS.textMuted,
          size: 34,
        });
        if (isMine) {
          sound.play("newTurn");
          effects.burst({ ...this.#anchor("axe"), color: COLORS.axe, count: 30, speed: 180, life: 800, gravity: 80 });
        }
        break;
      }
      case "turnEnd":
        if (event.reason === "timeout" && event.role === me) sound.play("invalid");
        break;
      case "cardPlayed":
        this.#cardPlayedEffects(event, view);
        break;
      case "duelEnd":
        this.#duelEndEffects(event, me);
        break;
      default:
        break;
    }
  }

  #cardPlayedEffects(event, view) {
    const effects = this.#effects;
    const { card } = event;
    const isMine = event.role === view.you.role;
    const table = this.#anchor("table");
    const target = this.#anchor(isMine ? "opponent" : "me");
    const owner = this.#anchor(isMine ? "me" : "opponent");

    if (!isMine) this.#played.show(card, { x: this.#layout.width / 2, y: -CARD.height }, table);
    effects.burst({ ...table, color: ELEMENT_COLORS[card.element], count: 30, speed: 250 });
    sound.play("play");

    if (event.absorbed > 0) {
      effects.floatText(`Bloqueou ${event.absorbed}`, { x: table.x, y: table.y + 30, color: COLORS.shield, size: 26 });
      effects.after(120, () => sound.play("block"));
    }
    if (event.lifeDamage > 0) {
      effects.floatText(`-${event.lifeDamage}`, { ...target, color: COLORS.demand, size: 30 });
      effects.burst({ ...target, color: COLORS.demand, count: 16, speed: 150, life: 500 });
      effects.after(150, () => sound.play("hit"));
      if (!isMine) {
        effects.shake(7, 350);
        effects.flash(COLORS.demand, 0.2, 400);
      }
    }
    if (event.matchup !== MATCHUP.NEUTRAL) {
      const isStrong = event.matchup === MATCHUP.STRONG;
      effects.floatText(MATCHUP_LABEL[event.matchup], {
        x: table.x,
        y: table.y - 30,
        color: isStrong ? COLORS.good : COLORS.borderBlocked,
        size: 32,
      });
      effects.after(250, () => sound.play(isStrong ? "strong" : "weak"));
    }
    if (event.healed > 0) {
      effects.floatText(`+${event.healed}`, { ...owner, color: COLORS.good, size: 26 });
      effects.burst({ ...owner, color: COLORS.good, count: 16, speed: 120, life: 600, gravity: -60 });
      effects.after(300, () => sound.play("heal"));
    }
    if (event.drew > 0 && isMine) effects.after(300, () => sound.play("draw"));
  }

  #duelEndEffects(event, me) {
    const effects = this.#effects;

    if (event.winner !== me) {
      effects.flash(COLORS.demand, 0.3, 700);
      effects.after(300, () => sound.play("defeat"));
      return;
    }
    effects.confetti();
    effects.flash(COLORS.axe, 0.3, 700);
    effects.after(250, () => sound.play("victory"));
    this.#claimReward();
  }

  /** Cada vitória rende um sacramento, uma única vez (mesmo se a cena for recriada). */
  #claimReward() {
    const session = this.#session;
    if (session.rewardClaimed) return;

    session.rewardClaimed = true;
    session.reward = this.#callbacks.onVictory?.() ?? null;
    if (session.reward?.justUnlocked) this.#effects.after(1100, () => sound.play("unlock"));
  }
}

/** Cria o "loader" usado pelo hook usePixiApp para o duelo online. */
export function createOnlineSceneLoader(size, session, callbacks) {
  const layout = createLayout(size);
  return {
    size,
    preload: loadCardArt,
    setup: (app, art) => new OnlineScene(app, { layout, session, callbacks, art }),
  };
}
