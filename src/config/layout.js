import { clamp } from "../utils/math.js";
import { AD_LAYOUT } from "./ads.js";

/**
 * Layout responsivo. O tamanho lógico do canvas depende do formato da tela:
 *  - paisagem (celular deitado, tablet, desktop): altura fixa, largura variável;
 *  - retrato (celular em pé): largura fixa, altura variável.
 * O canvas é depois ampliado/reduzido por CSS para caber na tela, então
 * telas maiores (tablets) enxergam tudo maior sem mudar nenhuma regra.
 * Tudo aqui é função pura, testada sem navegador.
 */

const LANDSCAPE = Object.freeze({ height: 540, minWidth: 720, maxWidth: 1000 });
const PORTRAIT = Object.freeze({ width: 480, minHeight: 760, maxHeight: 900 });
const MARGIN = 24;
const SIZE_STEP = 10;
const TABLE_RADIUS = 16;
const TUTORIAL_PANEL_HEIGHT = 140;

const HAND_STYLE = Object.freeze({ maxStep: 130, arcDrop: 10, maxTilt: 0.1 });
const HUD_STYLE = Object.freeze({ barHeight: 14, orbRadius: 9, orbSpacing: 26 });

const TOOLBAR_HEIGHT = Object.freeze({ tall: 70, short: 50 });

/**
 * Espaço (px CSS) que NÃO é do canvas: barra superior e anúncios. Espelha o CSS.
 *  - telas largas: colunas de anúncio dos dois lados (tiram largura);
 *  - demais telas: faixa de anúncio fixa no rodapé (tira altura).
 */
export function getChromeSize({ width, height }, adsEnabled = true) {
  const hasRails = adsEnabled && width >= AD_LAYOUT.railBreakpoint;
  const hasFooter = adsEnabled && !hasRails;
  const toolbar = height <= 500 ? TOOLBAR_HEIGHT.short : TOOLBAR_HEIGHT.tall;

  return {
    width: hasRails ? 2 * (AD_LAYOUT.railWidth + AD_LAYOUT.railGap) + 2 * AD_LAYOUT.pagePadding : 0,
    height: toolbar + (hasFooter ? AD_LAYOUT.footerHeight : 0),
  };
}

const roundToStep = (value) => Math.round(value / SIZE_STEP) * SIZE_STEP;

/** Escolhe o tamanho lógico do canvas para a área disponível (em px CSS). */
export function chooseCanvasSize(availableWidth, availableHeight) {
  const aspect = availableWidth / availableHeight;

  if (aspect >= 1) {
    const width = clamp(roundToStep(LANDSCAPE.height * aspect), LANDSCAPE.minWidth, LANDSCAPE.maxWidth);
    return { width, height: LANDSCAPE.height };
  }
  const height = clamp(roundToStep(PORTRAIT.width / aspect), PORTRAIT.minHeight, PORTRAIT.maxHeight);
  return { width: PORTRAIT.width, height };
}

const makeRect = (x, y, width, height) => ({
  x,
  y,
  width,
  height,
  center: { x: x + width / 2, y: y + height / 2 },
});

function buildLandscape({ width, height }) {
  const tableWidth = clamp(width - 360, 420, 560);
  const table = makeRect((width - tableWidth) / 2, 96, tableWidth, 206);
  const tableRight = table.x + table.width;

  const gutter = width - tableRight;
  const buttonWidth = Math.min(150, gutter - MARGIN);
  const button = makeRect(
    tableRight + (gutter - buttonWidth) / 2,
    table.center.y - 24,
    buttonWidth,
    48,
  );

  const barWidth = clamp((width - MARGIN * 2 - 200) / 2, 180, 280);
  const hud = {
    ...HUD_STYLE,
    harmony: { x: MARGIN, y: 10, barX: MARGIN, barY: 38, barWidth },
    demand: {
      x: width - MARGIN,
      y: 10,
      anchorX: 1,
      barX: width - MARGIN - barWidth,
      barY: 38,
      barWidth,
      matchup: { x: width - MARGIN, y: 58, anchorX: 1 },
    },
    axe: { x: width / 2, y: 8, orbsX: width / 2, orbsY: 50 },
    turn: { x: MARGIN, y: table.y },
    shield: { x: MARGIN, y: table.y + 28 },
    attack: { x: button.center.x, y: button.y - 32, anchorX: 0.5 },
  };

  return { table, button, hud, handBaseY: height - 120, handMaxWidth: width - 80 };
}

function buildPortrait({ width, height }) {
  const contentWidth = width - MARGIN * 2;
  const table = makeRect(MARGIN, 180, contentWidth, 226);
  const button = makeRect((width - 220) / 2, table.y + table.height + 14, 220, 52);

  const hud = {
    ...HUD_STYLE,
    harmony: { x: MARGIN, y: 10, barX: MARGIN, barY: 34, barWidth: contentWidth },
    demand: {
      x: MARGIN,
      y: 56,
      barX: MARGIN,
      barY: 80,
      barWidth: contentWidth,
      matchup: { x: width - MARGIN, y: 59, anchorX: 1 },
    },
    axe: { x: width / 2, y: 98, orbsX: width / 2, orbsY: 132 },
    turn: { x: MARGIN, y: 152 },
    shield: { x: width / 2, y: 152, anchorX: 0.5 },
    attack: { x: width - MARGIN, y: 152, anchorX: 1 },
  };

  return { table, button, hud, handBaseY: height - 125, handMaxWidth: width - MARGIN };
}

/** @param {{ width: number, height: number }} size tamanho lógico do canvas */
export function createLayout(size) {
  const { width, height } = size;
  const isPortrait = height > width;
  const parts = isPortrait ? buildPortrait(size) : buildLandscape(size);

  return {
    width,
    height,
    isPortrait,
    table: { ...parts.table, radius: TABLE_RADIUS },
    endTurnButton: parts.button,
    hud: parts.hud,
    /** Painel de dicas do tutorial: ocupa a parte de cima da gira. */
    tutorial: {
      x: parts.table.x + 12,
      y: parts.table.y + 6,
      width: parts.table.width - 24,
      height: TUTORIAL_PANEL_HEIGHT,
    },
    /** A mensagem fica dentro da gira, perto da borda inferior. */
    message: {
      x: parts.table.center.x,
      y: parts.table.y + parts.table.height - 30,
      wrapWidth: parts.table.width - 32,
    },
    hand: {
      ...HAND_STYLE,
      centerX: width / 2,
      baseY: parts.handBaseY,
      maxWidth: parts.handMaxWidth,
      /** De onde as cartas "saem" ao serem compradas (fora da tela). */
      spawn: { x: width + 160, y: height + 40 },
    },
  };
}
