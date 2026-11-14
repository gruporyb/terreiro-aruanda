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
 * @param {{ preload?: () => Promise<any>, setup: (app: Application, assets: any) => void }} loader
 *   objeto estável (fora do componente): `preload` carrega recursos, `setup` monta a cena
 */
export function usePixiApp(containerRef, loader) {
  useEffect(() => {
    const app = new Application();
    let isDisposed = false;
    let isInitialized = false;

    const mount = async () => {
      await app.init(APP_OPTIONS);
      isInitialized = true;
      const assets = await loader.preload?.();

      // O componente pode ter desmontado durante o init/preload (ex.: StrictMode).
      if (isDisposed) {
        destroyApp(app);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      loader.setup(app, assets);
    };

    mount().catch((error) =>
      console.error("[Terreiro de Aruanda] Falha ao iniciar o Pixi:", error),
    );

    return () => {
      isDisposed = true;
      if (isInitialized) destroyApp(app);
    };
  }, [containerRef, loader]);
}
