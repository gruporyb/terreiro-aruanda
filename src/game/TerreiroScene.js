import { END_TURN_BUTTON } from "../config/constants.js";
import { DragController } from "./DragController.js";
import { DropZone } from "./DropZone.js";
import { GameOverlay } from "./GameOverlay.js";
import { Hand } from "./Hand.js";
import { Hud } from "./Hud.js";
import {
  GAME_STATUS,
  canPlayCard,
  createGame,
  endTurn,
  playCard,
} from "./rules/gameLogic.js";
import { Button } from "./ui/Button.js";

/**
 * Orquestra a partida: guarda o estado (puro), conecta entrada do jogador às
 * regras e atualiza as views. É o único lugar que conhece todas as partes.
 */
export class TerreiroScene {
  #rng;
  #state;
  #table = new DropZone();
  #hand = new Hand();
  #hud = new Hud();
  #endTurnButton;
  #overlay;

  constructor(app, rng = Math.random) {
    this.#rng = rng;
    this.#state = createGame(rng);

    this.#endTurnButton = new Button({
      ...END_TURN_BUTTON,
      label: "Encerrar giro",
      onTap: () => this.#handleEndTurn(),
    });
    this.#overlay = new GameOverlay({ onRestart: () => this.#handleRestart() });

    new DragController(app.stage, {
      zone: this.#table,
      canStart: (view) => this.#isPlaying() && !view.isDismissing,
      onDrop: (view, isOverZone) => this.#handleDrop(view, isOverZone),
    });

    // Ordem de empilhamento: mesa, HUD, botão, mão (cartas por cima) e overlay.
    app.stage.addChild(
      this.#table,
      this.#hud,
      this.#endTurnButton,
      this.#hand,
      this.#overlay,
    );
    app.ticker.add((ticker) => this.#hand.tick(ticker));

    this.#render();
  }

  #isPlaying() {
    return this.#state.status === GAME_STATUS.PLAYING;
  }

  #handleDrop(view, isOverZone) {
    if (!isOverZone) return; // soltou fora da gira: a carta volta para a mão

    const check = canPlayCard(this.#state, view.card.id);
    if (!check.ok) {
      this.#hud.showMessage(check.reason);
      return;
    }
    this.#state = playCard(this.#state, view.card.id, this.#rng);
    this.#render();
  }

  #handleEndTurn() {
    this.#state = endTurn(this.#state, this.#rng);
    this.#render();
  }

  #handleRestart() {
    this.#hand.reset();
    this.#state = createGame(this.#rng);
    this.#render();
  }

  #render() {
    const state = this.#state;
    this.#hud.update(state);
    this.#hand.sync(state.hand, this.#table.center);
    this.#hand.setPlayable((card) => canPlayCard(state, card.id).ok);
    this.#endTurnButton.setEnabled(this.#isPlaying());
    this.#overlay.update(state.status);
  }
}

/** Função estável (fora do componente React) passada ao hook usePixiApp. */
export const createTerreiroScene = (app) => new TerreiroScene(app);
