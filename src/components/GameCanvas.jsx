import { useMemo } from "react";
import { createSceneLoader } from "../game/TerreiroScene.js";
import { useStableCallbacks } from "../hooks/useStableCallbacks.js";
import CanvasHost from "./CanvasHost.jsx";

/** Canvas da partida solo (contra a demanda) e do tutorial. */
export default function GameCanvas({ session, onMenu, onTutorialFinish, onVictory }) {
  const callbacks = useStableCallbacks({ onMenu, onTutorialFinish, onVictory });
  const createLoader = useMemo(
    () => (size) => createSceneLoader(size, session, callbacks),
    [session, callbacks],
  );

  return <CanvasHost createLoader={createLoader} label="Mesa do jogo Terreiro de Aruanda" />;
}
