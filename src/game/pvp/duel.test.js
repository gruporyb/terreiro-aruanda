import { describe, expect, it } from "vitest";
import { RULES } from "../../config/constants.js";
import { ELEMENT, PASSE } from "../../data/cardCatalog.js";
import { createSeededRandom } from "../../utils/random.js";
import {
  DUEL_PHASE,
  END_REASON,
  createDuel,
  endTurn,
  forfeit,
  playCard,
  resolveMulliganTimeout,
  submitMulligan,
  viewFor,
} from "./duel.js";
import { PVP_RULES, ROLE, axeForRound } from "./pvpRules.js";

const { TERREIRO, DEMANDA } = ROLE;
const rng = () => createSeededRandom(11);

const card = (overrides = {}) => ({
  id: "teste#1",
  templateId: "teste",
  name: "Teste",
  element: ELEMENT.MATA, // neutra
  cost: 1,
  power: 4,
  defense: 0,
  passe: { type: PASSE.NONE, amount: 0 },
  ...overrides,
});

/** Duelo já em andamento (Demanda ativa), com mãos sob controle do teste. */
function playingDuel({ demandElement = ELEMENT.FOGO } = {}) {
  let duel = createDuel(rng(), PVP_RULES, { demandElement });
  for (const role of [TERREIRO, DEMANDA]) duel = submitMulligan(duel, role, [], rng()).duel;
  return duel;
}
const patch = (duel, role, changes) => ({
  ...duel,
  players: { ...duel.players, [role]: { ...duel.players[role], ...changes } },
});
const give = (duel, role, ...cards) => patch(duel, role, { hand: cards });

describe("createDuel", () => {
  it("os dois lados começam iguais em vida, com 5 cartas e na fase de troca", () => {
    const duel = createDuel(rng());
    expect(duel.phase).toBe(DUEL_PHASE.MULLIGAN);
    const [a, b] = [duel.players[TERREIRO], duel.players[DEMANDA]];
    expect(a.life).toBe(b.life);
    expect(a.life).toBe(PVP_RULES.maxLife);
    expect(a.hand).toHaveLength(RULES.handSize);
    expect(b.hand).toHaveLength(RULES.handSize);
    expect(a.shield + b.shield).toBe(0);
  });

  it("sorteia um elemento válido para a demanda", () => {
    expect([ELEMENT.FOGO, ELEMENT.AR, ELEMENT.TERRA, ELEMENT.AGUA].includes(createDuel(rng()).demandElement)).toBe(true);
  });
});

describe("troca de cartas (1ª rodada)", () => {
  it("troca até 3 cartas e mantém a mão com 5", () => {
    const duel = createDuel(rng());
    const ids = duel.players[TERREIRO].hand.slice(0, 3).map((c) => c.id);
    const { ok, duel: next, events } = submitMulligan(duel, TERREIRO, ids, rng());
    expect(ok).toBe(true);
    expect(next.players[TERREIRO].hand).toHaveLength(5);
    expect(next.players[TERREIRO].mulliganDone).toBe(true);
    expect(events[0]).toEqual({ type: "mulliganDone", role: TERREIRO, swapped: 3 });
    // as 2 cartas mantidas continuam; nenhuma carta se perde do baralho
    const keptIds = duel.players[TERREIRO].hand.slice(3).map((c) => c.id);
    expect(keptIds.every((id) => next.players[TERREIRO].hand.some((c) => c.id === id))).toBe(true);
    const total = next.players[TERREIRO].hand.length + next.players[TERREIRO].drawPile.length;
    expect(total).toBe(duel.players[TERREIRO].hand.length + duel.players[TERREIRO].drawPile.length);
  });

  it("recusa mais de 3, repetidas, inválidas e confirmação dupla", () => {
    const duel = createDuel(rng());
    const ids = duel.players[TERREIRO].hand.map((c) => c.id);
    expect(submitMulligan(duel, TERREIRO, ids.slice(0, 4), rng()).ok).toBe(false);
    expect(submitMulligan(duel, TERREIRO, [ids[0], ids[0]], rng()).ok).toBe(false);
    expect(submitMulligan(duel, TERREIRO, ["nao-existe"], rng()).ok).toBe(false);
    expect(submitMulligan(duel, TERREIRO, "x", rng()).ok).toBe(false);
    const once = submitMulligan(duel, TERREIRO, [], rng()).duel;
    expect(submitMulligan(once, TERREIRO, [], rng()).ok).toBe(false);
  });

  it("o duelo só começa quando os dois confirmam; a Demanda abre com Axé 3", () => {
    const duel = createDuel(rng());
    const first = submitMulligan(duel, TERREIRO, [], rng());
    expect(first.duel.phase).toBe(DUEL_PHASE.MULLIGAN);

    const second = submitMulligan(first.duel, DEMANDA, [], rng());
    expect(second.duel.phase).toBe(DUEL_PHASE.PLAYING);
    expect(second.duel.active).toBe(DEMANDA);
    expect(second.duel.round).toBe(1);
    expect(second.duel.players[DEMANDA].axe).toBe(PVP_RULES.startingAxe);
    expect(second.events.some((e) => e.type === "turnStart")).toBe(true);
  });

  it("o tempo esgotado confirma por quem não respondeu (mantém a mão)", () => {
    const duel = submitMulligan(createDuel(rng()), TERREIRO, [], rng()).duel;
    const before = duel.players[DEMANDA].hand;
    const result = resolveMulliganTimeout(duel, rng());
    expect(result.duel.phase).toBe(DUEL_PHASE.PLAYING);
    expect(result.duel.players[DEMANDA].hand.slice(0, 5)).toEqual(before);
    expect(resolveMulliganTimeout(result.duel, rng()).ok).toBe(false);
  });

  it("não troca depois que o duelo começou", () => {
    expect(submitMulligan(playingDuel(), DEMANDA, [], rng()).ok).toBe(false);
  });
});

describe("jogar cartas", () => {
  it("o ataque tira vida do adversário e a Defesa vira proteção de quem jogou", () => {
    const duel = give(playingDuel(), DEMANDA, card({ power: 5, defense: 3 }));
    const { duel: next, events } = playCard(duel, DEMANDA, "teste#1", rng());
    expect(next.players[TERREIRO].life).toBe(PVP_RULES.maxLife - 5);
    expect(next.players[DEMANDA].shield).toBe(3);
    expect(next.players[DEMANDA].axe).toBe(PVP_RULES.startingAxe - 1);
    expect(events[0]).toMatchObject({ type: "cardPlayed", role: DEMANDA, damage: 5, lifeDamage: 5 });
  });

  it("a proteção do adversário absorve antes da vida", () => {
    let duel = give(playingDuel(), DEMANDA, card({ power: 5 }));
    duel = patch(duel, TERREIRO, { shield: 3 });
    const { duel: next, events } = playCard(duel, DEMANDA, "teste#1", rng());
    expect(next.players[TERREIRO].shield).toBe(0);
    expect(next.players[TERREIRO].life).toBe(PVP_RULES.maxLife - 2);
    expect(events[0].absorbed).toBe(3);
  });

  it("descarrego tira proteção do adversário antes do dano", () => {
    let duel = give(playingDuel(), DEMANDA, card({ power: 4, passe: { type: PASSE.DESCARREGO, amount: 2 } }));
    duel = patch(duel, TERREIRO, { shield: 5 });
    const { duel: next, events } = playCard(duel, DEMANDA, "teste#1", rng());
    // 5 - 2 (descarrego) = 3 de proteção; o ataque de 4 gasta 3 e causa 1 de dano
    expect(events[0]).toMatchObject({ stripped: 2, absorbed: 3, lifeDamage: 1 });
    expect(next.players[TERREIRO].shield).toBe(0);
    expect(next.players[TERREIRO].life).toBe(PVP_RULES.maxLife - 1);
  });

  it("cura não passa da vida máxima", () => {
    let duel = give(playingDuel(), DEMANDA, card({ power: 0, passe: { type: PASSE.CURA, amount: 5 } }));
    duel = patch(duel, DEMANDA, { life: 28 });
    expect(playCard(duel, DEMANDA, "teste#1", rng()).duel.players[DEMANDA].life).toBe(30);
  });

  it("guia compra cartas", () => {
    const duel = give(playingDuel(), DEMANDA, card({ power: 0, passe: { type: PASSE.GUIA, amount: 2 } }));
    const next = playCard(duel, DEMANDA, "teste#1", rng()).duel;
    expect(next.players[DEMANDA].hand).toHaveLength(2);
  });

  it("elemento: o Terreiro sofre o ciclo contra a Demanda; a Demanda não", () => {
    // Terreiro (Água) contra demanda de Fogo: +30% (10 -> 13)
    let duel = playingDuel({ demandElement: ELEMENT.FOGO });
    duel = { ...endTurn(duel, DEMANDA, rng()).duel }; // vez do Terreiro
    duel = give(duel, TERREIRO, card({ element: ELEMENT.AGUA, power: 10 }));
    duel = patch(duel, DEMANDA, { life: 40, maxLife: 40 });
    const strong = playCard(duel, TERREIRO, "teste#1", rng());
    expect(strong.events[0]).toMatchObject({ damage: 13, matchup: "strong" });

    // Terreiro (Terra) contra Fogo: metade (5 -> 2)
    const weak = playCard(give(duel, TERREIRO, card({ element: ELEMENT.TERRA, power: 5 })), TERREIRO, "teste#1", rng());
    expect(weak.events[0]).toMatchObject({ damage: 2, matchup: "weak" });

    // Demanda (Água) atacando o Terreiro: sempre dano normal
    let asDemanda = give(playingDuel({ demandElement: ELEMENT.FOGO }), DEMANDA, card({ element: ELEMENT.AGUA, power: 10 }));
    asDemanda = patch(asDemanda, TERREIRO, { life: 40, maxLife: 40 });
    expect(playCard(asDemanda, DEMANDA, "teste#1", rng()).events[0]).toMatchObject({ damage: 10, matchup: "neutral" });
  });

  it("recusa jogada fora da vez, sem Axé ou com carta que não está na mão", () => {
    const duel = give(playingDuel(), TERREIRO, card());
    expect(playCard(duel, TERREIRO, "teste#1", rng()).ok).toBe(false); // vez da Demanda
    expect(playCard(give(playingDuel(), DEMANDA, card({ cost: 4 })), DEMANDA, "teste#1", rng()).ok).toBe(false);
    expect(playCard(playingDuel(), DEMANDA, "fantasma", rng()).ok).toBe(false);
  });

  it("zerar a vida do adversário encerra o duelo com vitória", () => {
    let duel = give(playingDuel(), DEMANDA, card({ power: 9 }));
    duel = patch(duel, TERREIRO, { life: 9 });
    const { duel: ended, events } = playCard(duel, DEMANDA, "teste#1", rng());
    expect(ended.phase).toBe(DUEL_PHASE.ENDED);
    expect(ended.winner).toBe(DEMANDA);
    expect(ended.endReason).toBe(END_REASON.LIFE);
    expect(events[events.length - 1].type).toBe("duelEnd");
    expect(playCard(ended, DEMANDA, "x", rng()).ok).toBe(false);
  });
});

describe("turnos e rodadas", () => {
  it("passa a vez; a rodada avança quando volta para quem abre; o Axé cresce igual para os dois", () => {
    let duel = playingDuel();
    expect(duel.active).toBe(DEMANDA);

    duel = endTurn(duel, DEMANDA, rng()).duel;
    expect(duel.active).toBe(TERREIRO);
    expect(duel.round).toBe(1);
    expect(duel.players[TERREIRO].axe).toBe(axeForRound(1));

    duel = endTurn(duel, TERREIRO, rng()).duel;
    expect(duel.active).toBe(DEMANDA);
    expect(duel.round).toBe(2);
    expect(duel.players[DEMANDA].axe).toBe(axeForRound(2));

    duel = endTurn(duel, DEMANDA, rng()).duel;
    expect(duel.players[TERREIRO].axe).toBe(axeForRound(2)); // mesmo Axé da Demanda na rodada
  });

  it("o Axé para de crescer no máximo", () => {
    expect(axeForRound(1)).toBe(3);
    expect(axeForRound(4)).toBe(RULES.maxAxe);
    expect(axeForRound(20)).toBe(RULES.maxAxe);
  });

  it("a proteção dura até o início do próximo turno de quem a criou", () => {
    let duel = give(playingDuel(), DEMANDA, card({ power: 0, defense: 4 }));
    duel = playCard(duel, DEMANDA, "teste#1", rng()).duel;
    duel = endTurn(duel, DEMANDA, rng()).duel;
    expect(duel.players[DEMANDA].shield).toBe(4); // ainda protege durante o turno do adversário
    duel = endTurn(duel, TERREIRO, rng()).duel;
    expect(duel.players[DEMANDA].shield).toBe(0); // expirou ao começar o turno dela
  });

  it("repõe a mão até 5 no início do turno", () => {
    let duel = give(playingDuel(), TERREIRO, card());
    duel = endTurn(duel, DEMANDA, rng()).duel;
    expect(duel.players[TERREIRO].hand).toHaveLength(RULES.handSize);
  });

  it("só quem está ativo encerra o turno; e registra o motivo", () => {
    const duel = playingDuel();
    expect(endTurn(duel, TERREIRO, rng()).ok).toBe(false);
    const events = endTurn(duel, DEMANDA, rng(), "timeout").events;
    expect(events[0]).toEqual({ type: "turnEnd", role: DEMANDA, reason: "timeout" });
  });
});

describe("abandono e visão", () => {
  it("quem abandona perde", () => {
    const ended = forfeit(playingDuel(), TERREIRO).duel;
    expect(ended.winner).toBe(DEMANDA);
    expect(ended.endReason).toBe(END_REASON.ABANDON);
    expect(forfeit(ended, DEMANDA).ok).toBe(false);
  });

  it("a visão mostra a própria mão e esconde a do adversário", () => {
    const duel = playingDuel();
    const view = viewFor(duel, TERREIRO, { kind: "turn", remainingMs: 1000, totalMs: 30000 });
    expect(view.you.hand).toHaveLength(5);
    expect(view.opponent.handCount).toBe(5);
    expect(Object.hasOwn(view.opponent, "hand")).toBe(false);
    expect(Object.hasOwn(view.opponent, "drawPile")).toBe(false);
    expect(view.timer.remainingMs).toBe(1000);
    expect(view.winner).toBe(null);
    expect(viewFor(forfeit(duel, TERREIRO).duel, DEMANDA).winner).toBe("you");
    expect(viewFor(forfeit(duel, TERREIRO).duel, TERREIRO).winner).toBe("opponent");
  });
});
