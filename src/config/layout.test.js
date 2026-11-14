import { describe, expect, it } from "vitest";
import { CARD, RULES } from "./constants.js";
import { chooseCanvasSize, createLayout, getChromeHeight } from "./layout.js";
import { computeHandLayout } from "../game/handLayout.js";

describe("chooseCanvasSize", () => {
  it("paisagem: altura fixa, largura segue a proporção dentro dos limites", () => {
    expect(chooseCanvasSize(1024, 700)).toEqual({ width: 790, height: 540 }); // tablet
    expect(chooseCanvasSize(844, 346)).toEqual({ width: 1000, height: 540 }); // celular deitado (limitado)
    expect(chooseCanvasSize(700, 700)).toEqual({ width: 720, height: 540 }); // quase quadrado
  });

  it("retrato: largura fixa, altura segue a proporção dentro dos limites", () => {
    expect(chooseCanvasSize(390, 760)).toEqual({ width: 480, height: 900 }); // celular em pé
    expect(chooseCanvasSize(768, 940)).toEqual({ width: 480, height: 760 }); // tablet em pé
  });

  it("reserva menos espaço de interface em telas baixas", () => {
    expect(getChromeHeight(390)).toBeLessThan(getChromeHeight(800));
  });
});

const SIZES = [
  { width: 720, height: 540 },
  { width: 800, height: 540 },
  { width: 1000, height: 540 },
  { width: 480, height: 760 },
  { width: 480, height: 900 },
];

describe("createLayout", () => {
  for (const size of SIZES) {
    const label = `${size.width}x${size.height}`;
    const layout = createLayout(size);
    const { table, endTurnButton: button, hand } = layout;

    it(`${label}: mesa e botão ficam dentro da tela e não se sobrepõem`, () => {
      expect(table.x).toBeGreaterThan(-1);
      expect(table.x + table.width).toBeLessThan(size.width + 1);
      expect(button.x).toBeGreaterThan(-1);
      expect(button.x + button.width).toBeLessThan(size.width + 1);
      expect(button.y + button.height).toBeLessThan(size.height + 1);

      const overlapsTable =
        button.x < table.x + table.width &&
        button.x + button.width > table.x &&
        button.y < table.y + table.height &&
        button.y + button.height > table.y;
      expect(overlapsTable).toBe(false);
    });

    it(`${label}: a mão cheia cabe na largura e abaixo da mesa e do botão`, () => {
      const slots = computeHandLayout(RULES.handLimit, hand);
      expect(slots[0].x - CARD.width / 2).toBeGreaterThan(-1);
      expect(slots[slots.length - 1].x + CARD.width / 2).toBeLessThan(size.width + 1);

      const handTop = hand.baseY - CARD.height / 2;
      expect(handTop).toBeGreaterThan(table.y + table.height - 1);
      if (layout.isPortrait) expect(handTop).toBeGreaterThan(button.y + button.height);
      expect(hand.baseY + CARD.height / 2 + hand.arcDrop).toBeLessThan(size.height + 1);
    });
  }

  it("identifica retrato e paisagem", () => {
    expect(createLayout({ width: 480, height: 760 }).isPortrait).toBe(true);
    expect(createLayout({ width: 800, height: 540 }).isPortrait).toBe(false);
  });
});
