import { useEffect, useState } from "react";
import { OnlineSession } from "../online/OnlineSession.js";

/**
 * Abre a conexão com o servidor online enquanto o componente existir e fecha
 * ao sair (no meio de uma partida, isso conta como desistência).
 * @returns {{ session: OnlineSession, state: object }}
 */
export function useOnlineSession(url) {
  const [session] = useState(() => new OnlineSession({ url }));
  const [state, setState] = useState(session.state);

  useEffect(() => {
    const unsubscribe = session.subscribe(setState);
    session.connect();
    return () => {
      unsubscribe();
      session.close();
    };
  }, [session]);

  return { session, state };
}
