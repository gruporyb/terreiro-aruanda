/** Relógio falso: o tempo só passa quando o teste manda (`advance`). */
export function createFakeScheduler() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  return {
    now: () => now,
    setTimeout(callback, ms) {
      const id = nextId++;
      timers.set(id, { at: now + ms, callback });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    /** Avança o tempo, disparando em ordem os temporizadores que vencerem. */
    advance(ms) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        now = due[1].at;
        timers.delete(due[0]);
        due[1].callback();
      }
      now = target;
    },
  };
}

/** Conexão falsa que guarda tudo o que o servidor enviou. */
export function createFakeTransport() {
  const transport = {
    messages: [],
    closedWith: null,
    send: (text) => transport.messages.push(JSON.parse(text)),
    close: (code) => {
      transport.closedWith = code ?? 1000;
    },
    /** Mensagens de um tipo, da mais antiga para a mais recente. */
    ofType: (type) => transport.messages.filter((message) => message.type === type),
    /** A mais recente de um tipo. */
    last: (type) => transport.ofType(type).at(-1) ?? null,
  };
  return transport;
}
