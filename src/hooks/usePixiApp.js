import { useEffect } from "react";
import { Application } from "pixi.js";
import { CANVAS } from "../config/constants.js";

const APP_OPTIONS = {
  width: CANVAS.width,
  height: CANVAS.height,
  background: CANVAS.background,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
};

const destroyApp = (app) => app.destroy(true, { children: true });

/**
 * Cria uma aplicação Pixi dentro de `containerRef` e a destrói ao desmontar.
 *
 * @param {React.RefObject<HTMLElement>} containerRef elemento que receberá o canvas
 * @param {(app: Application) => void} setupScene função estável (fora do componente)
 */
export function usePixiApp(containerRef, setupScene) {
  useEffect(() => {
    const app = new Application();
    let isDisposed = false;
    let isInitialized = false;

    const mount = async () => {
      await app.init(APP_OPTIONS);
      isInitialized = true;

      // O componente pode ter desmontado durante o init (ex.: React StrictMode).
      if (isDisposed) {
        destroyApp(app);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      setupScene(app);
    };

    mount().catch((error) =>
      console.error("[Terreiro de Aruanda] Falha ao iniciar o Pixi:", error),
    );

    return () => {
      isDisposed = true;
      if (isInitialized) destroyApp(app);
    };
  }, [containerRef, setupScene]);
}
