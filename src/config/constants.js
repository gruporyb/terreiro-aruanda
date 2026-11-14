/** Configuração do jogo. Nenhum "número mágico" fora deste arquivo. */

export const CANVAS = Object.freeze({
  width: 800,
  height: 600,
  background: 0xf4f5f7,
});

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
  height: 210,
  radius: 10,
  padding: 10,
  badgeRadius: 11,
  /** Janela da ilustração da entidade (a largura é a da carta menos o padding). */
  art: Object.freeze({ top: 36, height: 70, radius: 6 }),
  titleTop: 110,
  dividerY: 158,
  statsTop: 164,
});

/** Área onde as cartas são soltas para serem jogadas. */
export const TABLE = Object.freeze({
  x: 170,
  y: 120,
  width: 460,
  height: 200,
  radius: 16,
});

export const HAND = Object.freeze({
  centerX: 400,
  baseY: 480,
  maxWidth: 700,
  maxStep: 130,
  arcDrop: 10,
  maxTilt: 0.1,
  /** De onde as cartas "saem" ao serem compradas (fora da tela, à direita). */
  spawn: Object.freeze({ x: 900, y: 540 }),
});

export const HUD = Object.freeze({
  margin: 24,
  barWidth: 220,
  barHeight: 12,
  barTop: 40,
  orbRadius: 8,
  orbSpacing: 24,
  orbTop: 56,
  messageY: 338,
});

export const END_TURN_BUTTON = Object.freeze({
  x: 650,
  y: 198,
  width: 130,
  height: 44,
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

export const RULES = Object.freeze({
  maxHarmony: 30,
  handSize: 5,
  handLimit: 7,
  startingAxe: 3,
  maxAxe: 6,
  copiesPerCard: 2,
  demand: Object.freeze({
    name: "Demanda pesada",
    health: 60,
    baseAttack: 7,
    attackGrowth: 2,
  }),
});
