import { Assets } from "pixi.js";
import { CARD_CATALOG } from "../data/cardCatalog.js";

const ART_BASE_URL = `${import.meta.env.BASE_URL}art/`;

/**
 * O manifesto (public/art/manifest.json) lista só as imagens que existem,
 * evitando requisições 404 para cartas ainda sem ilustração.
 * Formato: { "files": { "<id da carta>": "<arquivo>" } }
 */
async function fetchManifest() {
  try {
    const response = await fetch(`${ART_BASE_URL}manifest.json`);
    if (!response.ok) return {};
    const { files } = await response.json();
    return files ?? {};
  } catch {
    return {}; // sem manifesto válido: o jogo usa os emblemas de elemento
  }
}

/**
 * Carrega as ilustrações disponíveis.
 * @returns {Promise<Map<string, import("pixi.js").Texture>>} id do modelo -> textura
 */
export async function loadCardArt() {
  const files = await fetchManifest();
  const ids = CARD_CATALOG.map((card) => card.id).filter((id) => files[id]);

  const results = await Promise.allSettled(
    ids.map((id) => Assets.load(`${ART_BASE_URL}${files[id]}`)),
  );

  const art = new Map();
  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      art.set(ids[index], result.value);
    } else {
      console.warn(`[Terreiro de Aruanda] Não foi possível carregar a arte de "${ids[index]}".`);
    }
  });
  return art;
}
