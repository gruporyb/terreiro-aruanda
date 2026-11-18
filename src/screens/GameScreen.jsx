import GameCanvas from "../components/GameCanvas.jsx";
import SoundToggle from "../components/SoundToggle.jsx";
import { DIFFICULTIES } from "../data/difficulties.js";
import { isTutorialSession } from "../game/session.js";

/** Tela da partida: barra superior (menu, modo e som) e o canvas do jogo. */
export default function GameScreen({ session, isMuted, onToggleMute, onMenu, onTutorialFinish, onVictory }) {
  const modeLabel = isTutorialSession(session)
    ? "Tutorial"
    : DIFFICULTIES[session.difficulty].label;

  return (
    <div className="app">
      <header className="toolbar">
        <button type="button" className="button button--small" onClick={onMenu}>
          ← Menu
        </button>
        <span className="toolbar__mode">{modeLabel}</span>
        <SoundToggle isMuted={isMuted} onToggle={onToggleMute} />
      </header>
      <GameCanvas
        session={session}
        onMenu={onMenu}
        onTutorialFinish={onTutorialFinish}
        onVictory={onVictory}
      />
    </div>
  );
}
