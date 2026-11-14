import { describe, expect, it } from "vitest";
import { MOTION } from "../config/constants.js";
import { CardMotion } from "./CardMotion.js";

const frame = (deltaMS = 16) => ({ deltaTime: deltaMS / 16.67, deltaMS });
const run = (motion, frames, deltaMS = 16) => {
  let pose;
  for (let i = 0; i < frames; i++) pose = motion.update(frame(deltaMS));
  return pose;
};

describe("CardMotion", () => {
  it("segue o slot definido", () => {
    const motion = new CardMotion();
    motion.setSlot({ x: 200, y: 300, rotation: 0.1 });
    const pose = run(motion, 200);
    expect(pose.x).toBeCloseTo(200, 2);
    expect(pose.y).toBeCloseTo(300, 2);
    expect(pose.rotation).toBeCloseTo(0.1, 3);
  });

  it("no hover sobe e aumenta; ao sair, volta", () => {
    const motion = new CardMotion();
    motion.placeAt(100, 400);
    motion.setHovered(true);
    let pose = run(motion, 200);
    expect(pose.y).toBeCloseTo(400 - MOTION.hoverLift, 2);
    expect(pose.scale).toBeCloseTo(MOTION.hoverScale, 3);

    motion.setHovered(false);
    pose = run(motion, 200);
    expect(pose.y).toBeCloseTo(400, 2);
    expect(pose.scale).toBeCloseTo(MOTION.restScale, 3);
  });

  it("durante o arraste acompanha o ponteiro e depois retorna ao slot", () => {
    const motion = new CardMotion();
    motion.placeAt(100, 400);
    motion.startDrag({ x: 100, y: 400 });
    motion.moveDrag({ x: 500, y: 200 });
    const dragged = run(motion, 100);
    expect(dragged.x).toBeCloseTo(500, 1);
    expect(dragged.y).toBeCloseTo(200, 1);
    expect(motion.isDragging).toBe(true);

    motion.endDrag();
    const back = run(motion, 300);
    expect(back.x).toBeCloseTo(100, 1);
    expect(back.y).toBeCloseTo(400, 1);
  });

  it("jogada: pulsa para cima e só então desaparece", () => {
    const motion = new CardMotion();
    motion.placeAt(400, 220);
    motion.dismiss();

    const midway = motion.update(frame(MOTION.pulseDurationMs / 2));
    expect(midway.y).toBeCloseTo(220 - MOTION.pulseHeightPx, 2);
    expect(midway.alpha).toBeCloseTo(1, 2);
    expect(motion.isDismissed).toBe(false);

    run(motion, 400);
    expect(motion.isDismissed).toBe(true);
  });
});
