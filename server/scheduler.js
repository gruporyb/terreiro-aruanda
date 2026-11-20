/**
 * Relógio injetável: o servidor nunca chama setTimeout/Date.now diretamente,
 * então os testes avançam o tempo sem esperar de verdade.
 */
export const realScheduler = Object.freeze({
  now: () => Date.now(),
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle),
});
