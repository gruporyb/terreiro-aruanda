import GameCanvas from "../components/GameCanvas.jsx";
import { DIFFICULTIES } from "../data/difficulties.js";
import { isTutorialSession } from "../game/session.js";

/** Tela da partida: barra superior (menu e modo) e o canvas do jogo. */
export default function GameScreen({ session, onMenu, onTutorialFinish }) {
  const modeLabel = isTutorialSession(session)
    ? "Tutorial"
    : `Dificuldade: ${DIFFICULTIES[session.difficulty].label}`;

  return (
    <div className="app">
      <header className="toolbar">
        <button type="button" className="button button--small" onClick={onMenu}>
          ← Menu
        </button>
        <span className="toolbar__mode">{modeLabel}</span>
      </header>
      <GameCanvas session={session} onMenu={onMenu} onTutorialFinish={onTutorialFinish} />
    </div>
  );
}
