import { useEffect } from "react";
import { Application } from "pixi.js";
import { CANVAS } from "../config/constants.js";

const MAX_RESOLUTION = 3;

/**
 * Resolução = densidade da tela x ampliação por CSS. Em tablets o canvas é
 * exibido maior que seu tamanho lógico; renderizar com mais pixels mantém
 * textos e ícones nítidos.
 */
function createAppOptions({ width, height }, cssWidth) {
  const density = window.devicePixelRatio || 1;
  const zoom = Math.max(1, cssWidth / width);
  return {
    width,
    height,
    background: CANVAS.background,
    antialias: true,
    resolution: Math.min(MAX_RESOLUTION, density * zoom),
    autoDensity: true,
  };
}

const destroyApp = (app) => app.destroy(true, { children: true });

/**
 * Cria uma aplicação Pixi dentro de `containerRef` e a destrói ao desmontar
 * (ou quando o `loader` muda, por exemplo ao girar o aparelho).
 *
 * @param {React.RefObject<HTMLElement>} containerRef elemento que receberá o canvas
 * @param {{ size: {width: number, height: number}, preload?: () => Promise<any>, setup: (app: Application, assets: any) => ({ dispose?: () => void } | void) }} loader
 *   `setup` pode devolver um objeto com `dispose()`, chamado ao desmontar
 */
export function usePixiApp(containerRef, loader) {
  useEffect(() => {
    const app = new Application();
    let isDisposed = false;
    let isInitialized = false;
    let scene = null;

    const mount = async () => {
      const cssWidth = containerRef.current.clientWidth;
      await app.init(createAppOptions(loader.size, cssWidth));
      isInitialized = true;
      const assets = await loader.preload?.();

      // O componente pode ter desmontado durante o init/preload (ex.: StrictMode).
      if (isDisposed) {
        destroyApp(app);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      scene = loader.setup(app, assets);
    };

    mount().catch((error) =>
      console.error("[Terreiro de Aruanda] Falha ao iniciar o Pixi:", error),
    );

    return () => {
      isDisposed = true;
      scene?.dispose?.();
      if (isInitialized) destroyApp(app);
    };
  }, [containerRef, loader]);
}
