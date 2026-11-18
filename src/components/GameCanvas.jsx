import { useEffect, useMemo, useRef } from "react";
import { createSceneLoader } from "../game/TerreiroScene.js";
import { useCanvasSize } from "../hooks/useCanvasSize.js";
import { usePixiApp } from "../hooks/usePixiApp.js";

/**
 * Contêiner do canvas do jogo. O canvas é recriado quando o tamanho lógico
 * muda (ex.: girar o aparelho); a `session` mantém a partida.
 */
export default function GameCanvas({ session, onMenu, onTutorialFinish, onVictory }) {
  const containerRef = useRef(null);
  const size = useCanvasSize();

  // Callbacks estáveis: o loader não pode mudar a cada render (recriaria o canvas).
  const latest = useRef({ onMenu, onTutorialFinish, onVictory });
  useEffect(() => {
    latest.current = { onMenu, onTutorialFinish, onVictory };
  });
  const callbacks = useMemo(
    () => ({
      onMenu: () => latest.current.onMenu(),
      onTutorialFinish: () => latest.current.onTutorialFinish(),
      onVictory: () => latest.current.onVictory(),
    }),
    [],
  );

  const loader = useMemo(
    () => createSceneLoader(size, session, callbacks),
    [size, session, callbacks],
  );
  usePixiApp(containerRef, loader);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{ "--aspect": size.width / size.height }}
      aria-label="Mesa do jogo Terreiro de Aruanda"
    />
  );
}
