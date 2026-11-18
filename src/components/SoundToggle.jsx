/** Liga/desliga os efeitos sonoros. */
export default function SoundToggle({ isMuted, onToggle }) {
  return (
    <button
      type="button"
      className="button button--small"
      aria-pressed={!isMuted}
      onClick={onToggle}
    >
      Som: {isMuted ? "desligado" : "ligado"}
    </button>
  );
}
