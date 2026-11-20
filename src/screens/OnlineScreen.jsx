import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OnlineCanvas from "../components/OnlineCanvas.jsx";
import SoundToggle from "../components/SoundToggle.jsx";
import { resolveOnlineUrl } from "../config/online.js";
import { ROLE } from "../game/pvp/pvpRules.js";
import { useOnlineSession } from "../hooks/useOnlineSession.js";
import { ONLINE_STATUS } from "../online/onlineState.js";

const CONFIRM_LEAVE = "Sair agora conta como desistência e o oponente vence. Deseja sair?";

function QueueWait({ onCancel }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="status-panel" role="status">
      <div className="spinner" aria-hidden="true" />
      <h2 className="status-panel__title">Procurando um oponente...</h2>
      <p>Tempo de espera: {seconds}s</p>
      <p className="status-panel__hint">
        Ao encontrar alguém, um de vocês será o Terreiro e o outro a Demanda.
      </p>
      <button type="button" className="button" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  );
}

function Connecting({ onCancel }) {
  return (
    <div className="status-panel" role="status">
      <div className="spinner" aria-hidden="true" />
      <h2 className="status-panel__title">Conectando ao servidor...</h2>
      <button type="button" className="button" onClick={onCancel}>
        Voltar
      </button>
    </div>
  );
}

function ConnectionProblem({ message, onRetry, onExit }) {
  return (
    <div className="status-panel" role="alert">
      <h2 className="status-panel__title">Sem conexão</h2>
      <p>{message}</p>
      <div className="status-panel__actions">
        <button type="button" className="button button--primary" onClick={onRetry}>
          Tentar novamente
        </button>
        <button type="button" className="button" onClick={onExit}>
          Voltar ao menu
        </button>
      </div>
    </div>
  );
}

/** Fluxo online: conectar, entrar na fila, duelar. */
export default function OnlineScreen({ nickname, isMuted, onToggleMute, onExit, onRetry, onVictory }) {
  const url = useMemo(() => resolveOnlineUrl(import.meta.env.VITE_ONLINE_URL, window.location), []);
  const { session, state } = useOnlineSession(url);
  const hasJoined = useRef(false);

  // Ao conectar, entra direto na fila (uma única vez; "jogar de novo" usa `rematch`).
  useEffect(() => {
    if (state.status === ONLINE_STATUS.CONNECTED && !hasJoined.current) {
      hasJoined.current = true;
      session.joinQueue(nickname);
    }
  }, [state.status, session, nickname]);

  const rematch = useCallback(() => session.joinQueue(nickname), [session, nickname]);

  const { status } = state;
  const isInMatch = status === ONLINE_STATUS.MATCHED;
  const isDuelVisible = isInMatch || status === ONLINE_STATUS.ENDED;

  const leave = () => {
    if (isInMatch && !window.confirm(CONFIRM_LEAVE)) return;
    onExit();
  };
  const cancelQueue = () => {
    session.leaveQueue();
    onExit();
  };

  if (status === ONLINE_STATUS.CLOSED) {
    return (
      <div className="app">
        <ConnectionProblem
          message={state.error?.message ?? "Não foi possível conectar ao servidor."}
          onRetry={onRetry}
          onExit={onExit}
        />
      </div>
    );
  }

  if (!isDuelVisible) {
    return (
      <div className="app">
        {status === ONLINE_STATUS.QUEUED ? <QueueWait onCancel={cancelQueue} /> : <Connecting onCancel={onExit} />}
      </div>
    );
  }

  const roleLabel = state.role === ROLE.DEMANDA ? "Demanda" : "Terreiro";
  return (
    <div className="app">
      <header className="toolbar">
        <button type="button" className="button button--small" onClick={leave}>
          {isInMatch ? "Desistir" : "← Menu"}
        </button>
        <span className="toolbar__mode">Online: {roleLabel}</span>
        <SoundToggle isMuted={isMuted} onToggle={onToggleMute} />
      </header>
      <OnlineCanvas session={session} onMenu={onExit} onRematch={rematch} onVictory={onVictory} />
    </div>
  );
}
