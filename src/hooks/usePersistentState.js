import { useCallback, useState } from "react";

/**
 * useState que lembra o valor no localStorage. Se o armazenamento estiver
 * indisponível (modo privado, bloqueado), o valor vale só na sessão.
 * `validate` descarta valores salvos inválidos (ex.: dificuldade antiga).
 */
export function usePersistentState(key, initialValue, validate = () => true) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      const saved = raw === null ? initialValue : JSON.parse(raw);
      return validate(saved) ? saved : initialValue;
    } catch {
      return initialValue;
    }
  });

  const update = useCallback(
    (next) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* sem armazenamento: segue sem salvar */
      }
    },
    [key],
  );

  return [value, update];
}
