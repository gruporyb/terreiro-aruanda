import { useEffect, useMemo, useRef } from "react";

/**
 * Devolve funções com identidade estável que sempre chamam a versão mais
 * recente dos callbacks. Necessário porque mudar o loader do canvas a cada
 * render o recriaria. Os NOMES dos callbacks devem ser sempre os mesmos.
 */
export function useStableCallbacks(callbacks) {
  const latest = useRef(callbacks);
  useEffect(() => {
    latest.current = callbacks;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps -- nomes fixos por contrato; só `latest` muda
  return useMemo(
    () =>
      Object.fromEntries(
        Object.keys(callbacks).map((name) => [name, (...args) => latest.current[name]?.(...args)]),
      ),
    [],
  );
}
