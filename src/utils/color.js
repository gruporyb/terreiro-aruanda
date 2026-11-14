/** Converte 0xRRGGBB em "#rrggbb" para uso em CSS/SVG. */
export const toCssColor = (hex) => `#${hex.toString(16).padStart(6, "0")}`;
