/**
 * Ícones do jogo como caminhos SVG (caixa 24x24), usando só os comandos
 * absolutos M, L, C e Z, sem furos. A MESMA fonte desenha os ícones no Pixi
 * (createIcon) e na legenda em HTML (IconLegend), garantindo que sejam iguais.
 */

export const ICON_VIEWBOX = 24;

export const ICON_PATHS = Object.freeze({
  // Espada: ataque
  attack:
    "M12 0.5 L14.8 14 L9.2 14 Z M4.5 14 L19.5 14 L19.5 16.8 L4.5 16.8 Z M10.7 16.8 L13.3 16.8 L13.3 21.2 L10.7 21.2 Z M9.3 21.2 L14.7 21.2 L14.7 23.5 L9.3 23.5 Z",
  // Escudo: defesa
  defense:
    "M12 1 L21.5 4.5 L21.5 11 C21.5 17 17.5 21 12 23 C6.5 21 2.5 17 2.5 11 L2.5 4.5 Z",
  // Coração: passe de cura
  cura:
    "M12 21.5 C4 15 1.5 11.5 1.5 8 C1.5 5 3.9 2.8 6.7 2.8 C9 2.8 11 4 12 6 C13 4 15 2.8 17.3 2.8 C20.1 2.8 22.5 5 22.5 8 C22.5 11.5 20 15 12 21.5 Z",
  // Duas cartas: passe de guia (compra cartas)
  guia:
    "M4.17 4.65 L11.66 5.97 L9.23 19.75 L1.74 18.43 Z M12.34 5.97 L19.83 4.65 L22.26 18.43 L14.77 19.75 Z",
  // Faísca: passe de descarrego (enfraquece o ataque da demanda)
  descarrego:
    "M12 0.5 L14.6 9.4 L23.5 12 L14.6 14.6 L12 23.5 L9.4 14.6 L0.5 12 L9.4 9.4 Z",
});

export const ICON_COLORS = Object.freeze({
  attack: 0xb91c1c,
  defense: 0x2563eb,
  cura: 0xe11d48,
  guia: 0x7c3aed,
  descarrego: 0xd97706,
});
