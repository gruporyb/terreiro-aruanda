import { useState } from "react";
import { DEFAULT_DIFFICULTY, isDifficulty } from "./data/difficulties.js";
import { SESSION_MODE, createSession } from "./game/session.js";
import { usePersistentState } from "./hooks/usePersistentState.js";
import GameScreen from "./screens/GameScreen.jsx";
import MainMenu from "./screens/MainMenu.jsx";

/** Alterna entre o menu e a partida. `session === null` significa menu. */
export default function App() {
  const [difficulty, setDifficulty] = usePersistentState("terreiro.difficulty", DEFAULT_DIFFICULTY, isDifficulty);
  const [isTutorialDone, setTutorialDone] = usePersistentState("terreiro.tutorialDone", false, (v) => typeof v === "boolean");
  const [session, setSession] = useState(null);

  const goToMenu = () => setSession(null);
  const finishTutorial = () => {
    setTutorialDone(true);
    goToMenu();
  };

  if (session) {
    return <GameScreen session={session} onMenu={goToMenu} onTutorialFinish={finishTutorial} />;
  }

  return (
    <MainMenu
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      isTutorialDone={isTutorialDone}
      onPlay={() => setSession(createSession({ mode: SESSION_MODE.GAME, difficulty }))}
      onTutorial={() => setSession(createSession({ mode: SESSION_MODE.TUTORIAL }))}
    />
  );
}
