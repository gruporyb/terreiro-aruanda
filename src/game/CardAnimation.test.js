import { describe, expect, it } from "vitest";
import { ANIMATION } from "../config/constants";
import { CardAnimation } from "./CardAnimation";

const frame = (deltaMS = 16) => ({ deltaTime: deltaMS / 16.67, deltaMS });

describe("CardAnimation", () => {
  it("começa em repouso", () => {
    const { scale, offsetY } = new CardAnimation().update(frame());
    expect(scale).toBe(ANIMATION.restScale);
    expect(offsetY).toBe(0);
  });

  it("converge para a escala de hover e volta ao repouso", () => {
    const animation = new CardAnimation();
    animation.setHovered(true);
    let result;
    for (let i = 0; i < 120; i++) result = animation.update(frame());
    expect(result.scale).toBeCloseTo(ANIMATION.hoverScale, 3);

    animation.setHovered(false);
    for (let i = 0; i < 120; i++) result = animation.update(frame());
    expect(result.scale).toBeCloseTo(ANIMATION.restScale, 3);
  });

  it("pulso sobe (offset negativo) e termina em 0", () => {
    const animation = new CardAnimation();
    animation.triggerPulse();

    const midway = animation.update(frame(ANIMATION.pulseDurationMs / 2));
    expect(midway.offsetY).toBeCloseTo(-ANIMATION.pulseHeightPx, 3);

    const end = animation.update(frame(ANIMATION.pulseDurationMs));
    expect(end.offsetY).toBe(0);
  });
});
