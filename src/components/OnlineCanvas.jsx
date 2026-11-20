import { useMemo } from "react";
import { createOnlineSceneLoader } from "../game/online/OnlineScene.js";
import { useStableCallbacks } from "../hooks/useStableCallbacks.js";
import CanvasHost from "./CanvasHost.jsx";

/** Canvas do duelo online. */
export default function OnlineCanvas({ session, onMenu, onRematch, onVictory }) {
  const callbacks = useStableCallbacks({ onMenu, onRematch, onVictory });
  const createLoader = useMemo(
    () => (size) => createOnlineSceneLoader(size, session, callbacks),
    [session, callbacks],
  );

  return <CanvasHost createLoader={createLoader} label="Duelo online do Terreiro de Aruanda" />;
}
