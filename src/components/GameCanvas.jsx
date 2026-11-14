import { useRef } from "react";
import { CANVAS } from "../config/constants.js";
import { terreiroSceneLoader } from "../game/TerreiroScene.js";
import { usePixiApp } from "../hooks/usePixiApp.js";

export default function GameCanvas() {
  const containerRef = useRef(null);
  usePixiApp(containerRef, terreiroSceneLoader);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{ width: CANVAS.width, height: CANVAS.height }}
      aria-label="Mesa do jogo Terreiro de Aruanda"
    />
  );
}
