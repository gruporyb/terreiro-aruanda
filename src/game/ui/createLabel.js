import { Text, TextStyle } from "pixi.js";
import { COLORS, FONT } from "../../config/constants.js";

/** Cria um Text com as opções mais comuns, para evitar repetição de estilo. */
export function createLabel(
  text,
  {
    size = 14,
    bold = false,
    color = COLORS.textTitle,
    font = FONT.body,
    x = 0,
    y = 0,
    anchorX = 0,
    anchorY = 0,
    align = "left",
    wrapWidth,
  } = {},
) {
  const label = new Text({
    text,
    style: new TextStyle({
      fontFamily: font,
      fontSize: size,
      fontWeight: bold ? "bold" : "normal",
      fill: color,
      align,
      wordWrap: wrapWidth !== undefined,
      wordWrapWidth: wrapWidth ?? 100,
    }),
  });
  label.anchor.set(anchorX, anchorY);
  label.position.set(x, y);
  return label;
}
