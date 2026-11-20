import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../src/utils/random.js";
import { PVP_RULES } from "../src/game/pvp/pvpRules.js";
import { GameServer } from "./gameServer.js";
import { createFakeScheduler, createFakeTransport } from "./testing/fakes.js";

/** Servidor com relógio falso e dois jogadores já em partida. */
function startMatch(options = {}) {
  const scheduler = createFakeScheduler();
  const server = new GameServer({ rng: createSeededRandom(5), scheduler, ...options });
  const players = ["Ana", "Beto"].map((name) => {
    const transport = createFakeTransport();
    const connection = server.connect(transport);
    const send = (message) => connection.receive(JSON.stringify(message));
    return { name, transport, connection, send };
  });
  players.forEach((p) => p.send({ type: "queue.join", name: p.name }));

  const byRole = Object.fromEntries(players.map((p) => [p.transport.last("match.found").role, p]));
  return { scheduler, server, players, terreiro: byRole.terreiro, demanda: byRole.demanda };
}

const viewOf = (player) => player.transport.last("match.update").view;
const confirmMulligan = (match) => {
  match.terreiro.send({ type: "mulligan", cardIds: [] });
  match.demanda.send({ type: "mulligan", cardIds: [] });
};

describe("conexão e fila", () => {
  it("envia as regras ao conectar", () => {
    const server = new GameServer();
    const transport = createFakeTransport();
    server.connect(transport);
    const hello = transport.last("hello");
    expect(hello.rules.turnMs).toBe(PVP_RULES.turnMs);
    expect(hello.rules.mulliganMax).toBe(3);
  });

  it("o primeiro jogador espera; sair da fila é possível; não entra duas vezes", () => {
    const server = new GameServer();
    const transport = createFakeTransport();
    const connection = server.connect(transport);
    const send = (m) => connection.receive(JSON.stringify(m));

    send({ type: "queue.join", name: "Ana" });
    expect(transport.last("queue")).toMatchObject({ status: "waiting", waiting: 1 });
    expect(server.stats.queued).toBe(1);

    send({ type: "queue.join", name: "Ana" });
    expect(transport.last("error").code).toBe("already_queued");

    send({ type: "queue.leave" });
    expect(transport.last("queue").status).toBe("left");
    expect(server.stats.queued).toBe(0);
  });

  it("fechar a conexão tira o jogador da fila", () => {
    const server = new GameServer();
    const connection = server.connect(createFakeTransport());
    connection.receive(JSON.stringify({ type: "queue.join" }));
    connection.close();
    expect(server.stats.queued).toBe(0);
    expect(server.stats.connections).toBe(0);
  });
});

describe("pareamento", () => {
  it("o segundo jogador forma a partida: papéis distintos e nomes trocados", () => {
    const { players, terreiro, demanda, server } = startMatch();
    expect(terreiro.transport.last("match.found").matchId).toBe(demanda.transport.last("match.found").matchId);
    expect(terreiro.transport.last("match.found").opponent.name).toBe(demanda.name);
    expect(demanda.transport.last("match.found").opponent.name).toBe(terreiro.name);
    expect(terreiro === demanda).toBe(false);
    expect(server.stats).toMatchObject({ queued: 0, matches: 1, connections: 2 });
    // só o primeiro a chegar viu "aguardando"; quem fechou o par foi direto para a partida
    expect(players.filter((p) => p.transport.last("queue") !== null)).toHaveLength(1);
  });

  it("os dois começam iguais; cada um vê só a própria mão", () => {
    const { terreiro, demanda } = startMatch();
    const [a, b] = [viewOf(terreiro), viewOf(demanda)];
    expect(a.phase).toBe("mulligan");
    expect(a.you.life).toBe(b.you.life);
    expect(a.you.hand).toHaveLength(5);
    expect(a.opponent.handCount).toBe(5);
    expect(Object.hasOwn(a.opponent, "hand")).toBe(false);
    expect(a.demandElement).toBe(b.demandElement);
    expect(a.timer).toMatchObject({ kind: "mulligan", remainingMs: PVP_RULES.mulliganMs });
  });
});

describe("troca e turnos", () => {
  it("troca de cartas de um jogador; depois da confirmação dos dois o duelo começa", () => {
    const match = startMatch();
    const ids = viewOf(match.terreiro).you.hand.slice(0, 3).map((c) => c.id);
    match.terreiro.send({ type: "mulligan", cardIds: ids });
    expect(viewOf(match.terreiro).you.mulliganDone).toBe(true);
    expect(viewOf(match.demanda).opponent.mulliganDone).toBe(true);
    expect(viewOf(match.terreiro).phase).toBe("mulligan");

    match.demanda.send({ type: "mulligan", cardIds: [] });
    const view = viewOf(match.terreiro);
    expect(view.phase).toBe("playing");
    expect(view.active).toBe("demanda");
    expect(view.timer).toMatchObject({ kind: "turn", remainingMs: PVP_RULES.turnMs });
  });

  it("recusa trocar mais de 3 cartas e avisa só quem errou", () => {
    const match = startMatch();
    const ids = viewOf(match.terreiro).you.hand.slice(0, 4).map((c) => c.id);
    const before = match.demanda.transport.messages.length;
    match.terreiro.send({ type: "mulligan", cardIds: ids });
    expect(match.terreiro.transport.last("error").code).toBe("invalid_action");
    expect(match.demanda.transport.messages.length).toBe(before);
  });

  it("o relógio de 30 s passa o turno sozinho", () => {
    const match = startMatch();
    confirmMulligan(match);
    expect(viewOf(match.terreiro).active).toBe("demanda");

    match.scheduler.advance(PVP_RULES.turnMs - 1);
    expect(viewOf(match.terreiro).active).toBe("demanda");
    match.scheduler.advance(1);

    const update = match.terreiro.transport.last("match.update");
    expect(update.view.active).toBe("terreiro");
    expect(update.events[0]).toEqual({ type: "turnEnd", role: "demanda", reason: "timeout" });
    expect(update.view.timer.remainingMs).toBe(PVP_RULES.turnMs); // relógio reinicia para o próximo turno
  });

  it("o tempo da troca de cartas também acaba (mantém as mãos)", () => {
    const match = startMatch();
    match.scheduler.advance(PVP_RULES.mulliganMs);
    expect(viewOf(match.terreiro).phase).toBe("playing");
  });

  it("o relógio corre enquanto se joga: o turno não ganha tempo extra por jogar", () => {
    const match = startMatch();
    confirmMulligan(match);
    match.scheduler.advance(10_000);
    const card = viewOf(match.demanda).you.hand[0];
    match.demanda.send({ type: "play", cardId: card.id });
    expect(viewOf(match.demanda).timer.remainingMs).toBe(PVP_RULES.turnMs - 10_000);
  });

  it("jogar uma carta avisa os dois, com o evento; fora da vez só dá erro a quem tentou", () => {
    const match = startMatch();
    confirmMulligan(match);
    const card = viewOf(match.demanda).you.hand[0];

    match.terreiro.send({ type: "play", cardId: viewOf(match.terreiro).you.hand[0].id });
    expect(match.terreiro.transport.last("error").message).toBe("Não é a sua vez.");

    match.demanda.send({ type: "play", cardId: card.id });
    for (const player of [match.terreiro, match.demanda]) {
      const update = player.transport.last("match.update");
      expect(update.events[0]).toMatchObject({ type: "cardPlayed", role: "demanda" });
      expect(update.events[0].card.id).toBe(card.id);
    }
    expect(viewOf(match.demanda).you.hand.some((c) => c.id === card.id)).toBe(false);
  });

  it("encerrar o turno passa a vez", () => {
    const match = startMatch();
    confirmMulligan(match);
    match.demanda.send({ type: "endTurn" });
    expect(viewOf(match.terreiro).active).toBe("terreiro");
  });
});

describe("fim da partida", () => {
  it("desistir ou cair dá a vitória ao adversário e libera a fila", () => {
    const match = startMatch();
    confirmMulligan(match);
    match.terreiro.connection.close();

    const view = viewOf(match.demanda);
    expect(view.phase).toBe("ended");
    expect(view.winner).toBe("you");
    expect(view.endReason).toBe("abandon");
    expect(view.timer).toBe(null);
    expect(match.server.stats.matches).toBe(0);

    // o sobrevivente pode procurar outra partida
    match.demanda.send({ type: "queue.join", name: "Beto" });
    expect(match.demanda.transport.last("queue").status).toBe("waiting");

    // e o relógio da partida acabada não faz mais nada
    const count = match.demanda.transport.messages.length;
    match.scheduler.advance(120_000);
    expect(match.demanda.transport.messages.length).toBe(count);
  });

  it("não se entra na fila durante uma partida", () => {
    const match = startMatch();
    match.terreiro.send({ type: "queue.join", name: "x" });
    expect(match.terreiro.transport.last("error").code).toBe("already_in_match");
  });
});

describe("robustez", () => {
  it("mensagens inválidas dão erro sem derrubar a conexão", () => {
    const server = new GameServer();
    const transport = createFakeTransport();
    const connection = server.connect(transport);
    connection.receive("lixo");
    connection.receive(JSON.stringify({ type: "hackear" }));
    expect(transport.ofType("error").map((e) => e.code)).toEqual(["invalid_message", "invalid_message"]);
    expect(transport.closedWith).toBe(null);
  });

  it("ações de partida sem estar em uma partida são recusadas", () => {
    const server = new GameServer();
    const transport = createFakeTransport();
    const connection = server.connect(transport);
    connection.receive(JSON.stringify({ type: "play", cardId: "x" }));
    expect(transport.last("error").code).toBe("not_in_match");
  });

  it("fecha a conexão que manda mensagens demais", () => {
    const scheduler = createFakeScheduler();
    const server = new GameServer({ scheduler, maxMessagesPerSecond: 5 });
    const transport = createFakeTransport();
    const connection = server.connect(transport);
    for (let i = 0; i < 6; i++) connection.receive(JSON.stringify({ type: "queue.leave" }));
    expect(transport.closedWith).toBe(1008);
  });

  it("o limite de mensagens renova com o tempo", () => {
    const scheduler = createFakeScheduler();
    const server = new GameServer({ scheduler, maxMessagesPerSecond: 5 });
    const transport = createFakeTransport();
    const connection = server.connect(transport);
    for (let i = 0; i < 5; i++) connection.receive(JSON.stringify({ type: "queue.leave" }));
    scheduler.advance(1500);
    for (let i = 0; i < 5; i++) connection.receive(JSON.stringify({ type: "queue.leave" }));
    expect(transport.closedWith).toBe(null);
  });
});
