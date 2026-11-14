import { useEffect, useState } from "react";
import { chooseCanvasSize, getChromeHeight } from "../config/layout.js";

const RESIZE_DEBOUNCE_MS = 250;

function readCanvasSize() {
  const viewport = window.visualViewport ?? window;
  const width = viewport.width ?? window.innerWidth;
  const height = viewport.height ?? window.innerHeight;
  return chooseCanvasSize(width, height - getChromeHeight(height));
}

/**
 * Tamanho lógico do canvas para a tela atual. Recalcula ao redimensionar ou
 * girar o aparelho e só devolve um novo objeto se o tamanho realmente mudou
 * (evita recriar o canvas à toa).
 */
export function useCanvasSize() {
  const [size, setSize] = useState(readCanvasSize);

  useEffect(() => {
    let timer;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSize((previous) => {
          const next = readCanvasSize();
          const isSame = next.width === previous.width && next.height === previous.height;
          return isSame ? previous : next;
        });
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return size;
}
