import { describe, expect, it } from "vitest";
import { findPath, resolveWalk } from "./path";
import { computeShadows } from "./shadows";
import { LEVELS, type Level } from "./level";

const corridor: Level = {
  id: 0,
  size: 3,
  blocks: [{ x: 1, y: 0, h: 1 }],
  start: { x: 0, y: 1 },
  exit: { x: 2, y: 1 },
  sunAngle: 0,
};

const allLit = (size: number) => Array.from({ length: size }, () => Array<boolean>(size).fill(false));

describe("findPath", () => {
  it("finds the shortest path around blocks", () => {
    expect(findPath(corridor, () => true)).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]);
  });

  it("returns null when no path is allowed", () => {
    expect(findPath(corridor, () => false)).toBeNull();
  });
});

describe("resolveWalk", () => {
  it("wins when the path is in shadow", () => {
    const shadow = allLit(3);
    shadow[1][1] = true;
    const result = resolveWalk(corridor, shadow);
    expect(result.outcome).toBe("win");
    expect(result.path.at(-1)).toEqual(corridor.exit);
  });

  it("melts on the first lit cell", () => {
    const result = resolveWalk(corridor, allLit(3));
    expect(result).toEqual({ outcome: "melt", path: [{ x: 0, y: 1 }, { x: 1, y: 1 }] });
  });

  it("treats start and exit as safe", () => {
    const tiny: Level = { ...corridor, blocks: [], size: 2, start: { x: 0, y: 0 }, exit: { x: 1, y: 0 } };
    expect(resolveWalk(tiny, allLit(2)).outcome).toBe("win");
  });
});

describe.each(LEVELS.map((level) => [level.id, level] as const))("level %i", (_id, level) => {
  const winsAt = (angle: number) => resolveWalk(level, computeShadows(level, angle)).outcome === "win";
  const winningAngles = Array.from({ length: 360 }, (_, a) => a).filter(winsAt);

  it("is not solved at the starting sun angle", () => {
    expect(winsAt(level.sunAngle)).toBe(false);
  });

  it("is solvable at some sun angle", () => {
    expect(winningAngles.length).toBeGreaterThan(0);
  });

  it("is not trivial: most sun angles fail", () => {
    expect(winningAngles.length).toBeLessThan(120);
  });

  it("never leaves Pip stuck behind blocks", () => {
    expect(resolveWalk(level, computeShadows(level, level.sunAngle)).outcome).not.toBe("stuck");
  });
});
