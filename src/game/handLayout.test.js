import { describe, expect, it } from "vitest";
import { CARD, HAND } from "../config/constants.js";
import { computeHandLayout } from "./handLayout.js";

describe("computeHandLayout", () => {
  it("retorna lista vazia sem cartas", () => {
    expect(computeHandLayout(0)).toEqual([]);
  });

  it("centraliza uma carta única, sem rotação", () => {
    const [slot] = computeHandLayout(1);
    expect(slot.x).toBe(HAND.centerX);
    expect(slot.y).toBe(HAND.baseY);
    expect(slot.rotation).toBe(0);
  });

  it("é simétrico em torno do centro", () => {
    const slots = computeHandLayout(5);
    expect(slots[2].x).toBe(HAND.centerX);
    expect(slots[0].x + slots[4].x).toBeCloseTo(HAND.centerX * 2, 5);
    expect(slots[0].rotation).toBeCloseTo(-slots[4].rotation, 5);
    expect(slots[0].y).toBeGreaterThan(slots[2].y);
  });

  it("comprime o espaçamento para caber na largura máxima", () => {
    const slots = computeHandLayout(7);
    const span = slots[6].x - slots[0].x;
    expect(span).toBeLessThan(HAND.maxWidth - CARD.width + 0.001);
  });
});
