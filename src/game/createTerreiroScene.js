import { CABOCLO_SETE_MATAS } from "../data/cards";
import { Card } from "./Card";

const logCardPlayed = ({ name }) =>
  console.log(`[Terreiro de Aruanda] Carta jogada no terreiro: "${name}"`);

/**
 * Monta a cena do jogo no palco da aplicação Pixi.
 * O ticker é destruído junto com a app, então não há cleanup extra.
 */
export function createTerreiroScene(app) {
  const card = new Card(CABOCLO_SETE_MATAS, { onPlay: logCardPlayed });
  card.placeAt(app.screen.width / 2, app.screen.height / 2);

  app.stage.addChild(card);
  app.ticker.add((ticker) => card.tick(ticker));
}
