import { AD_CONFIG } from "../config/ads.js";
import AdSlot from "./AdSlot.jsx";

/**
 * Moldura do site: conteúdo no centro e anúncios nas laterais (telas largas)
 * ou numa faixa fixa no rodapé (celulares e tablets). O CSS decide qual aparece.
 */
export default function SiteLayout({ children }) {
  const hasAds = AD_CONFIG.enabled;

  return (
    <div className={hasAds ? "site" : "site site--no-ads"}>
      {hasAds && <AdSlot placement="left" />}
      <div className="site__main">{children}</div>
      {hasAds && <AdSlot placement="right" />}
      {hasAds && <AdSlot placement="footer" />}
    </div>
  );
}
