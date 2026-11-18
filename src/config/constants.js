/** Configuração do jogo. Nenhum "número mágico" fora deste arquivo. */

export const CANVAS = Object.freeze({ background: 0xf4f5f7 });

export const FONT = Object.freeze({
  display: "Georgia, serif",
  body: "Arial, sans-serif",
});

export const COLORS = Object.freeze({
  cardFill: 0xffffff,
  cardDisabled: 0xf3f4f6,
  borderIdle: 0xd1d5db,
  borderActive: 0x10b981,
  borderBlocked: 0xef4444,
  textTitle: 0x1f2937,
  textBody: 0x4b5563,
  textMuted: 0x6b7280,
  track: 0xe5e7eb,
  harmony: 0x10b981,
  demand: 0xef4444,
  axe: 0xf59e0b,
  shield: 0x2563eb,
  good: 0x16a34a,
  badge: 0x1f2937,
  badgeDisabled: 0x9ca3af,
  button: 0x1f2937,
  buttonHover: 0x374151,
  buttonDisabled: 0x9ca3af,
  buttonText: 0xffffff,
  overlay: 0xf4f5f7,
});

export const BORDER_WIDTH = Object.freeze({ idle: 2, active: 3 });

export const CARD = Object.freeze({
  width: 136,
  height: 216,
  radius: 10,
  padding: 10,
  badgeRadius: 13,
  /** Janela da ilustração (a largura é a da carta menos o padding). */
  art: Object.freeze({ top: 40, height: 64, radius: 6 }),
  titleTop: 108,
  dividerY: 146,
  statsTop: 152,
  /** Colunas de atributos: ícone em cima, valor embaixo. */
  stat: Object.freeze({ iconSize: 22, valueSize: 18, valueGap: 4, inactiveAlpha: 0.35 }),
});

export const Z_INDEX = Object.freeze({ hovered: 100, leaving: 500, dragging: 1000 });

export const MOTION = Object.freeze({
  restScale: 1,
  hoverScale: 1.12,
  dragScale: 1.1,
  hoverLift: 36,
  /** Fração da distância percorrida por frame (0..1), por unidade de deltaTime. */
  smoothing: 0.22,
  dragSmoothing: 0.5,
  alphaSmoothing: 0.2,
  pulseDurationMs: 350,
  pulseHeightPx: 30,
  fadedAlpha: 0.02,
});

/** Regras comuns a todas as dificuldades (as que variam ficam em data/difficulties.js). */
export const RULES = Object.freeze({
  handSize: 5,
  handLimit: 7,
  maxAxe: 6,
  copiesPerCard: 2,
});
