import { describe, expect, it } from "vitest";
import { resolveOnlineUrl } from "./online.js";

describe("resolveOnlineUrl", () => {
  it("usa a URL configurada quando existe", () => {
    expect(resolveOnlineUrl("wss://jogo.exemplo.com/ws", { protocol: "https:", host: "x" })).toBe("wss://jogo.exemplo.com/ws");
  });

  it("senão, usa o mesmo domínio da página, com ws ou wss conforme o protocolo", () => {
    expect(resolveOnlineUrl(undefined, { protocol: "http:", host: "localhost:5173" })).toBe("ws://localhost:5173/ws");
    expect(resolveOnlineUrl("", { protocol: "https:", host: "jogo.com" })).toBe("wss://jogo.com/ws");
  });
});
