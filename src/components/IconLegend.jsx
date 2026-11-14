import { ICON_COLORS, ICON_PATHS, ICON_VIEWBOX } from "../config/icons.js";
import { ICON_LEGEND } from "../data/iconLegend.js";
import { toCssColor } from "../utils/color.js";

/** Legenda dos ícones, desenhada com os mesmos caminhos SVG usados no jogo. */
export default function IconLegend() {
  return (
    <ul className="legend">
      {ICON_LEGEND.map(({ icon, label, description }) => (
        <li key={icon} className="legend__item">
          <svg
            className="legend__icon"
            viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
            aria-hidden="true"
          >
            <path d={ICON_PATHS[icon]} fill={toCssColor(ICON_COLORS[icon])} />
          </svg>
          <span>
            <strong>{label}:</strong> {description}
          </span>
        </li>
      ))}
    </ul>
  );
}
