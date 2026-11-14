import { TextStyle } from "pixi.js";
import { CARD, COLORS } from "../config/constants";

export const createTitleStyle = () =>
  new TextStyle({
    fontFamily: "Georgia, serif",
    fontSize: 22,
    fontWeight: "bold",
    fill: COLORS.textTitle,
    align: "center",
    wordWrap: true,
    wordWrapWidth: CARD.width - CARD.padding * 2,
  });

export const createAttributesStyle = () =>
  new TextStyle({
    fontFamily: "Arial, sans-serif",
    fontSize: 16,
    fill: COLORS.textBody,
    lineHeight: 28,
  });
