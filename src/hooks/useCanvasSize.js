import { useEffect, useState } from "react";
import { AD_CONFIG } from "../config/ads.js";
import { chooseCanvasSize, getChromeSize } from "../config/layout.js";

const RESIZE_DEBOUNCE_MS = 250;

function readCanvasSize() {
  const viewport = window.visualViewport ?? window;
  const size = {
    width: viewport.width ?? window.innerWidth,
    height: viewport.height ?? window.innerHeight,
  };
  const chrome = getChromeSize(size, AD_CONFIG.enabled);
  return chooseCanvasSize(size.width - chrome.width, size.height - chrome.height);
}

/**
 * Tamanho lógico do canvas para a tela atual (já descontando barra e anúncios).
 * Recalcula ao redimensionar ou girar o aparelho e só devolve um novo objeto
 * se o tamanho realmente mudou (evita recriar o canvas à toa).
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
