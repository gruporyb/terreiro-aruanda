/**
 * Fila virtual: quem entra espera até haver outro jogador. Ao formar um par
 * (por ordem de chegada), os papéis são sorteados: um será o Terreiro e o
 * outro a Demanda.
 */
export class Matchmaker {
  #waiting = [];
  #rng;
  #onMatch;

  /** @param {{ onMatch: (pair: { terreiro: object, demanda: object }) => void, rng?: () => number }} options */
  constructor({ onMatch, rng = Math.random }) {
    this.#onMatch = onMatch;
    this.#rng = rng;
  }

  get size() {
    return this.#waiting.length;
  }

  has(player) {
    return this.#waiting.includes(player);
  }

  /** @returns {boolean} false se o jogador já estava na fila */
  join(player) {
    if (this.has(player)) return false;
    this.#waiting.push(player);
    this.#pairWaitingPlayers();
    return true;
  }

  /** @returns {boolean} true se o jogador estava na fila */
  leave(player) {
    const index = this.#waiting.indexOf(player);
    if (index === -1) return false;
    this.#waiting.splice(index, 1);
    return true;
  }

  #pairWaitingPlayers() {
    while (this.#waiting.length >= 2) {
      const first = this.#waiting.shift();
      const second = this.#waiting.shift();
      const [terreiro, demanda] = this.#rng() < 0.5 ? [first, second] : [second, first];
      this.#onMatch({ terreiro, demanda });
    }
  }
}
