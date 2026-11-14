import { Graphics } from "pixi.js";
import { ICON_PATHS, ICON_VIEWBOX } from "../../config/icons.js";
import { parsePath, tracePath } from "../../utils/svgPath.js";

const commandsByIcon = new Map();

function getCommands(name) {
  if (!commandsByIcon.has(name)) {
    if (!ICON_PATHS[name]) throw new Error(`Ícone desconhecido: "${name}"`);
    commandsByIcon.set(name, parsePath(ICON_PATHS[name]));
  }
  return commandsByIcon.get(name);
}

/**
 * Cria um ícone vetorial centralizado na origem (0, 0).
 * Basta posicionar o Graphics devolvido no centro desejado.
 */
export function createIcon(name, { size, color, alpha = 1 }) {
  const graphics = new Graphics();
  tracePath(graphics, getCommands(name), {
    scale: size / ICON_VIEWBOX,
    x: -size / 2,
    y: -size / 2,
  });
  return graphics.fill({ color, alpha });
}
