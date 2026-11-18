import { useEffect } from "react";
import { AD_CONFIG } from "../config/ads.js";

const PLACEHOLDER_SIZE = { left: "160 × 600", right: "160 × 600", footer: "320 × 50" };

function loadAdSenseScript(client) {
  if (document.querySelector("script[data-adsbygoogle-loader]")) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.dataset.adsbygoogleLoader = "true";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(script);
}

/**
 * Espaço de anúncio. `placement`: "left" | "right" | "footer".
 * Sem client/slot configurados (config/ads.js) mostra só um espaço reservado.
 */
export default function AdSlot({ placement }) {
  const slot = AD_CONFIG.slots[placement];
  const isLive = Boolean(AD_CONFIG.client && slot);

  useEffect(() => {
    if (!isLive) return;
    loadAdSenseScript(AD_CONFIG.client);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* o AdSense recusa o mesmo espaço duas vezes (StrictMode em desenvolvimento) */
    }
  }, [isLive]);

  return (
    <aside className={`ad ad--${placement}`} aria-label="Publicidade">
      <span className="ad__label">Publicidade</span>
      {isLive ? (
        <ins
          className="adsbygoogle ad__unit"
          style={{ display: "block" }}
          data-ad-client={AD_CONFIG.client}
          data-ad-slot={slot}
          data-ad-format={placement === "footer" ? "horizontal" : "vertical"}
          data-full-width-responsive="false"
        />
      ) : (
        <div className="ad__placeholder">{PLACEHOLDER_SIZE[placement]}</div>
      )}
    </aside>
  );
}
