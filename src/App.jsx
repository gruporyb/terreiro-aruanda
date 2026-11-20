import { useCallback, useEffect, useRef, useState } from "react";
import SiteLayout from "./components/SiteLayout.jsx";
import { DEFAULT_DIFFICULTY, isDifficulty } from "./data/difficulties.js";
import { sound } from "./game/audio/sound.js";
import {
  createProgress,
  isDifficultyUnlocked,
  isValidProgress,
  registerVictory,
} from "./game/progress.js";
import { SESSION_MODE, createSession } from "./game/session.js";
import { usePersistentState } from "./hooks/usePersistentState.js";
import GameScreen from "./screens/GameScreen.jsx";
import MainMenu from "./screens/MainMenu.jsx";
import OnlineScreen from "./screens/OnlineScreen.jsx";

/** Alterna entre o menu, a partida solo/tutorial e o duelo online. */
export default function App() {
  const [savedDifficulty, setDifficulty] = usePersistentState("terreiro.difficulty", DEFAULT_DIFFICULTY, isDifficulty);
  const [isTutorialDone, setTutorialDone] = usePersistentState("terreiro.tutorialDone", false, (v) => typeof v === "boolean");
  const [progress, setProgress] = usePersistentState("terreiro.progress", createProgress(), isValidProgress);
  const [isMuted, setMuted] = usePersistentState("terreiro.muted", false, (v) => typeof v === "boolean");
  const [nickname, setNickname] = usePersistentState("terreiro.nickname", "", (v) => typeof v === "string");
  // Qual tela está aberta: null = menu; { kind: "solo", session } ou { kind: "online" }.
  const [screen, setScreen] = useState(null);
  const [onlineAttempt, setOnlineAttempt] = useState(0); // muda para reconectar do zero

  // Uma dificuldade salva que ainda está bloqueada volta ao padrão.
  const difficulty = isDifficultyUnlocked(savedDifficulty, progress) ? savedDifficulty : DEFAULT_DIFFICULTY;

  // O motor de som segue o estado "mudo"; e o áudio é liberado no primeiro toque.
  useEffect(() => {
    sound.setMuted(isMuted);
  }, [isMuted]);
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // A cena chama isto na vitória; o ref evita contar errado se duas vitórias vierem seguidas.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const handleVictory = useCallback(() => {
    const { progress: next, reward } = registerVictory(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    return reward;
  }, [setProgress]);

  const goToMenu = () => setScreen(null);
  const startSolo = (session) => setScreen({ kind: "solo", session });
  const finishTutorial = () => {
    setTutorialDone(true);
    goToMenu();
  };
  const toggleMute = () => setMuted(!isMuted);

  return (
    <SiteLayout>
      {screen?.kind === "solo" && (
        <GameScreen
          session={screen.session}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onMenu={goToMenu}
          onTutorialFinish={finishTutorial}
          onVictory={handleVictory}
        />
      )}
      {screen?.kind === "online" && (
        <OnlineScreen
          key={onlineAttempt}
          nickname={nickname}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onExit={goToMenu}
          onRetry={() => setOnlineAttempt((attempt) => attempt + 1)}
          onVictory={handleVictory}
        />
      )}
      {!screen && (
        <MainMenu
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          progress={progress}
          isTutorialDone={isTutorialDone}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          nickname={nickname}
          onNicknameChange={setNickname}
          onPlay={() => startSolo(createSession({ mode: SESSION_MODE.GAME, difficulty }))}
          onOnline={() => setScreen({ kind: "online" })}
          onTutorial={() => startSolo(createSession({ mode: SESSION_MODE.TUTORIAL }))}
        />
      )}
    </SiteLayout>
  );
}
