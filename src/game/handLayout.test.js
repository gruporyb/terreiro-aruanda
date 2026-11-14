import { describe, expect, it } from "vitest";
import { CARD } from "../config/constants.js";
import { createLayout } from "../config/layout.js";
import { computeHandLayout } from "./handLayout.js";

const hand = createLayout({ width: 800, height: 540 }).hand;

describe("computeHandLayout", () => {
  it("retorna lista vazia sem cartas", () => {
    expect(computeHandLayout(0, hand)).toEqual([]);
  });

  it("centraliza uma carta única, sem rotação", () => {
    const [slot] = computeHandLayout(1, hand);
    expect(slot.x).toBe(hand.centerX);
    expect(slot.y).toBe(hand.baseY);
    expect(slot.rotation).toBe(0);
  });

  it("é simétrico em torno do centro", () => {
    const slots = computeHandLayout(5, hand);
    expect(slots[2].x).toBe(hand.centerX);
    expect(slots[0].x + slots[4].x).toBeCloseTo(hand.centerX * 2, 5);
    expect(slots[0].rotation).toBeCloseTo(-slots[4].rotation, 5);
    expect(slots[0].y).toBeGreaterThan(slots[2].y);
  });

  it("comprime o espaçamento para caber na largura máxima", () => {
    const slots = computeHandLayout(7, hand);
    expect(slots[6].x - slots[0].x).toBeLessThan(hand.maxWidth - CARD.width + 0.001);
  });
});
