import { describe, expect, it } from "vitest";
import { CLIENT, DEFAULT_NAME, MAX_NAME_LENGTH, parseClientMessage, sanitizeName } from "./protocol.js";

const parse = (value) => parseClientMessage(typeof value === "string" ? value : JSON.stringify(value));

describe("sanitizeName", () => {
  it("limpa, limita o tamanho e usa um nome padrão quando vazio", () => {
    expect(sanitizeName("  Maria   Clara  ")).toBe("Maria Clara");
    expect(sanitizeName("a".repeat(100))).toHaveLength(MAX_NAME_LENGTH);
    expect(sanitizeName("x\u0000y\u001fz")).toBe("xyz");
    expect(sanitizeName("   ")).toBe(DEFAULT_NAME);
    expect(sanitizeName(42)).toBe(DEFAULT_NAME);
    expect(sanitizeName(undefined)).toBe(DEFAULT_NAME);
  });
});

describe("parseClientMessage", () => {
  it("aceita as mensagens válidas", () => {
    expect(parse({ type: CLIENT.QUEUE_JOIN, name: "Ana" })).toEqual({ ok: true, message: { type: "queue.join", name: "Ana" } });
    expect(parse({ type: CLIENT.QUEUE_LEAVE }).ok).toBe(true);
    expect(parse({ type: CLIENT.END_TURN }).ok).toBe(true);
    expect(parse({ type: CLIENT.PLAY, cardId: "ze-do-coco#1" }).message.cardId).toBe("ze-do-coco#1");
    expect(parse({ type: CLIENT.MULLIGAN, cardIds: ["a", "b"] }).message.cardIds).toEqual(["a", "b"]);
    expect(parse({ type: CLIENT.MULLIGAN, cardIds: [] }).ok).toBe(true);
  });

  it("ignora campos extras (não repassa o que não conhece)", () => {
    const result = parse({ type: CLIENT.END_TURN, role: "terreiro", admin: true });
    expect(result.message).toEqual({ type: "endTurn" });
  });

  it("rejeita lixo, tipos desconhecidos e campos malformados", () => {
    expect(parse("isto não é json").ok).toBe(false);
    expect(parse("[1,2]").ok).toBe(false);
    expect(parse("null").ok).toBe(false);
    expect(parse({ type: "hackear" }).ok).toBe(false);
    expect(parse({ type: CLIENT.PLAY }).ok).toBe(false);
    expect(parse({ type: CLIENT.PLAY, cardId: 123 }).ok).toBe(false);
    expect(parse({ type: CLIENT.PLAY, cardId: "x".repeat(200) }).ok).toBe(false);
    expect(parse({ type: CLIENT.MULLIGAN, cardIds: "a" }).ok).toBe(false);
    expect(parse({ type: CLIENT.MULLIGAN, cardIds: [1] }).ok).toBe(false);
    expect(parse({ type: CLIENT.MULLIGAN, cardIds: new Array(11).fill("a") }).ok).toBe(false);
  });

  it("rejeita mensagens enormes", () => {
    expect(parse(JSON.stringify({ type: CLIENT.QUEUE_JOIN, name: "a".repeat(5000) })).ok).toBe(false);
  });
});
