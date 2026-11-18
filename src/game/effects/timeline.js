/** Agenda ações para daqui a N ms, avançando pelo tempo do ticker (sem setTimeout). */
export class Timeline {
  #items = [];
  #now = 0;

  after(delayMs, callback) {
    this.#items.push({ at: this.#now + delayMs, callback });
  }

  get pendingCount() {
    return this.#items.length;
  }

  /** Executa, em ordem, tudo o que já venceu. */
  tick(deltaMS) {
    this.#now += deltaMS;
    const due = this.#items.filter((item) => item.at <= this.#now).sort((a, b) => a.at - b.at);
    this.#items = this.#items.filter((item) => item.at > this.#now);
    due.forEach((item) => item.callback());
  }
}
