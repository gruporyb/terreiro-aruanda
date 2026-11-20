import { MATCHUP, MATCHUP_LABEL } from "../game/rules/elements.js";

const WHO = Object.freeze({ you: "Você", opponent: "O oponente" });

function describeCardPlayed(event, who) {
  const { card, damage, matchup, absorbed, lifeDamage, healed, stripped, drew } = event;
  const parts = [];

  if (damage > 0) {
    const note = matchup === MATCHUP.NEUTRAL ? "" : ` (${MATCHUP_LABEL[matchup]})`;
    parts.push(absorbed > 0 ? `-${lifeDamage} de vida, ${absorbed} bloqueado(s)${note}` : `-${damage} de vida${note}`);
  }
  if (card.defense > 0) parts.push(`+${card.defense} de proteção`);
  if (stripped > 0) parts.push(`descarrego: -${stripped} de proteção do alvo`);
  if (healed > 0) parts.push(`cura +${healed}`);
  if (drew > 0) parts.push(`+${drew} carta(s)`);

  return `${who} jogou ${card.name}${parts.length ? `: ${parts.join(", ")}` : ""}.`;
}

/**
 * Narra um evento do duelo para o jogador `myRole`. Devolve null para eventos
 * que não merecem texto.
 */
export function describeEvent(event, myRole) {
  const who = (role) => (role === myRole ? WHO.you : WHO.opponent);

  switch (event.type) {
    case "mulliganDone":
      return event.swapped > 0
        ? `${who(event.role)} trocou ${event.swapped} carta(s).`
        : `${who(event.role)} manteve a mão.`;
    case "turnStart":
      return event.role === myRole ? "Sua vez! Arraste uma carta até a gira." : "Vez do oponente.";
    case "turnEnd":
      if (event.reason !== "timeout") return null;
      return event.role === myRole ? "Seu tempo acabou." : "O tempo do oponente acabou.";
    case "cardPlayed":
      return describeCardPlayed(event, who(event.role));
    case "duelEnd":
      if (event.winner !== myRole) return "Derrota.";
      return event.reason === "abandon" ? "O oponente desistiu. Vitória!" : "Vitória!";
    default:
      return null;
  }
}

/** Texto de situação, quando nenhum evento recente precisa ser narrado. */
export function describeStatus(view, mulliganMax) {
  if (view.phase === "mulligan") {
    return view.you.mulliganDone
      ? "Aguardando o oponente confirmar a troca..."
      : `Troque até ${mulliganMax} cartas: toque nas que quer trocar.`;
  }
  if (view.phase === "ended") return view.winner === "you" ? "Vitória!" : "Derrota.";
  return view.active === view.you.role ? "Sua vez! Arraste uma carta até a gira." : "Vez do oponente.";
}

/** Textos da tela final do duelo online. */
export function describeEnding(view) {
  if (view.winner === "you") {
    return {
      title: "Vitória!",
      subtitle: view.endReason === "abandon" ? "O oponente desistiu da batalha." : "Você derrotou o oponente.",
    };
  }
  return { title: "Derrota.", subtitle: "O oponente venceu esta batalha." };
}
