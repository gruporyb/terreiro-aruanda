/**
 * Anúncios (Google AdSense). Enquanto `client` ou o `slot` estiverem vazios,
 * o site mostra apenas espaços reservados ("Publicidade").
 *
 * Para ativar: crie as unidades de anúncio no AdSense e preencha abaixo.
 *   client: "ca-pub-XXXXXXXXXXXXXXXX"
 *   slots:  ids numéricos (como string) das unidades.
 * Para desligar tudo (inclusive os espaços): enabled = false.
 */
export const AD_CONFIG = Object.freeze({
  enabled: true,
  client: "",
  slots: Object.freeze({ left: "", right: "", footer: "" }),
});

/**
 * Onde os anúncios aparecem (precisa espelhar o CSS em styles.css):
 *  - telas largas (>= railBreakpoint): colunas laterais, uma de cada lado;
 *  - celulares e tablets: só uma faixa fixa no rodapé.
 */
export const AD_LAYOUT = Object.freeze({
  railWidth: 160,
  railGap: 16,
  pagePadding: 16,
  railBreakpoint: 1100,
  footerHeight: 50,
});
