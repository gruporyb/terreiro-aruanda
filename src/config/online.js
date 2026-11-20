/**
 * Endereço do servidor online.
 *  - Em produção, defina VITE_ONLINE_URL (ex.: wss://jogo.exemplo.com/ws).
 *  - Sem a variável, usa o mesmo domínio da página em /ws; no desenvolvimento
 *    o Vite repassa /ws para o servidor local (ver vite.config.js).
 */
export function resolveOnlineUrl(configuredUrl, location) {
  if (configuredUrl) return configuredUrl;
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${location.host}/ws`;
}
