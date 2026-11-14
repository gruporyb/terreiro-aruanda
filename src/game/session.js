import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "../data/difficulties.js";
import { createGame } from "./rules/gameLogic.js";
import { createTutorialGame } from "./tutorial/tutorialGame.js";

export const SESSION_MODE = Object.freeze({ GAME: "game", TUTORIAL: "tutorial" });

/**
 * Sessão: guarda a partida fora do Pixi. Sobrevive à recriação do canvas
 * (ex.: ao girar o aparelho) e carrega o modo, a dificuldade e o passo do tutorial.
 */
export const createSession = ({ mode = SESSION_MODE.GAME, difficulty = DEFAULT_DIFFICULTY } = {}) => ({
  mode,
  difficulty,
  state: null,
  tutorialStep: 0,
});

export const isTutorialSession = (session) => session.mode === SESSION_MODE.TUTORIAL;

/** Cria uma partida nova conforme o modo e a dificuldade da sessão. */
export function createGameForSession(session, rng = Math.random) {
  if (isTutorialSession(session)) return createTutorialGame(rng);
  return createGame(rng, { ruleset: DIFFICULTIES[session.difficulty].ruleset });
}
