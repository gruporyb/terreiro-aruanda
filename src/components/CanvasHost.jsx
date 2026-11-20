import { useMemo, useRef } from "react";
import { useCanvasSize } from "../hooks/useCanvasSize.js";
import { usePixiApp } from "../hooks/usePixiApp.js";

/**
 * Contêiner do canvas do jogo. O canvas é recriado quando o tamanho lógico
 * muda (ex.: girar o aparelho); o estado da partida vive fora dele.
 *
 * @param {{ createLoader: (size: {width: number, height: number}) => object, label: string }} props
 *   `createLoader` precisa ter identidade estável (use useMemo no pai)
 */
export default function CanvasHost({ createLoader, label }) {
  const containerRef = useRef(null);
  const size = useCanvasSize();
  const loader = useMemo(() => createLoader(size), [createLoader, size]);

  usePixiApp(containerRef, loader);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{ "--aspect": size.width / size.height }}
      aria-label={label}
    />
  );
}
