#!/usr/bin/env node
/**
 * Gera as ilustrações das entidades com a API do Gemini e atualiza o manifesto.
 *
 *   GEMINI_API_KEY=... npm run art                    # gera as que faltam
 *   GEMINI_API_KEY=... npm run art -- --force         # regera todas
 *   GEMINI_API_KEY=... npm run art -- --only=exu-tranca-ruas,ze-do-coco
 *   npm run art:prompts                               # só imprime os prompts
 *   npm run art:manifest                              # só atualiza o manifesto
 *
 * Variáveis opcionais:
 *   GEMINI_IMAGE_MODEL  modelo de imagem (padrão: gemini-2.5-flash-image)
 *   GEMINI_API_BASE     endpoint base (padrão: https://generativelanguage.googleapis.com)
 */
import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CARD_CATALOG } from "../src/data/cardCatalog.js";
import { ENTITY_PROMPTS, STYLE_GUIDE } from "./artPrompts.mjs";

const OUT_DIR = fileURLToPath(new URL("../public/art/", import.meta.url));
const MANIFEST_PATH = `${OUT_DIR}manifest.json`;
const API_BASE = process.env.GEMINI_API_BASE ?? "https://generativelanguage.googleapis.com";
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ASPECT_RATIO = "3:2";
const PAUSE_BETWEEN_REQUESTS_MS = 1500;
const EXTENSION_BY_MIME = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const IMAGE_FILE_PATTERN = /^(.+)\.(png|jpe?g|webp)$/i;

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const onlyIds = args.find((a) => a.startsWith("--only="))?.slice(7).split(",") ?? null;

const buildPrompt = (id) => `${ENTITY_PROMPTS[id]}\n\n${STYLE_GUIDE}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const exists = (path) => access(path).then(() => true, () => false);

async function findExistingFile(id) {
  const files = await readdir(OUT_DIR);
  return files.find((file) => file.match(IMAGE_FILE_PATTERN)?.[1] === id) ?? null;
}

async function requestImage(prompt) {
  const response = await fetch(`${API_BASE}/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: ASPECT_RATIO },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((part) => part.inlineData && !part.thought)?.inlineData;
  if (!image) throw new Error("A resposta não trouxe imagem (talvez bloqueada pelo filtro de segurança).");
  return image;
}

async function generate(id) {
  const { data, mimeType } = await requestImage(buildPrompt(id));
  const extension = EXTENSION_BY_MIME[mimeType] ?? "png";
  await writeFile(`${OUT_DIR}${id}.${extension}`, Buffer.from(data, "base64"));
}

/** Reescreve o manifesto com as imagens que realmente existem na pasta. */
async function updateManifest() {
  const files = {};
  for (const { id } of CARD_CATALOG) {
    const file = await findExistingFile(id);
    if (file) files[id] = file;
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify({ files }, null, 2)}\n`);
  console.log(`Manifesto atualizado: ${Object.keys(files).length}/${CARD_CATALOG.length} imagens.`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  if (hasFlag("print")) {
    for (const { id, name } of CARD_CATALOG) {
      console.log(`\n=== ${name}  ->  salvar como public/art/${id}.png\n${buildPrompt(id)}`);
    }
    return;
  }
  if (hasFlag("manifest-only")) return updateManifest();

  if (!process.env.GEMINI_API_KEY) {
    console.error("Defina GEMINI_API_KEY (chave em https://aistudio.google.com/apikey).");
    process.exit(1);
  }

  const targets = CARD_CATALOG.filter(({ id }) => !onlyIds || onlyIds.includes(id));
  let failures = 0;

  for (const { id, name } of targets) {
    if (!ENTITY_PROMPTS[id]) {
      console.warn(`- ${name}: sem prompt em scripts/artPrompts.mjs, ignorada.`);
      continue;
    }
    if (!hasFlag("force") && (await findExistingFile(id))) {
      console.log(`- ${name}: já existe, pulando (use --force para regerar).`);
      continue;
    }
    try {
      process.stdout.write(`- ${name}: gerando... `);
      await generate(id);
      console.log("ok");
    } catch (error) {
      failures++;
      console.log(`falhou\n    ${error.message}`);
    }
    await sleep(PAUSE_BETWEEN_REQUESTS_MS);
  }

  await updateManifest();
  if (failures > 0) process.exitCode = 1;
}

main();
