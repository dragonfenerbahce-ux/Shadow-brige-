import { describe, expect, it } from "vitest";
import { exitDistances, isSafe, nextStep, walkUntilStop } from "./path";
import { minTurns, solvableWithOneAngle } from "./solver";
import { snapAngle, type Level } from "./level";
import { LEVELS } from "./levels";

// A 5x1 corridor: start on the left, exit on the right.
const corridor: Level = {
  id: 0,
  size: 5,
  blocks: [],
  start: { x: 0, y: 0 },
  exit: { x: 4, y: 0 },
  sunAngle: 0,
  directions: 8,
};

/** Builds a shadow grid for `level` from the x positions shaded in each row. */
function shade(level: Level, cells: [number, number][]): boolean[][] {
  const grid = Array.from({ length: level.size }, () => Array<boolean>(level.size).fill(false));
  for (const [x, y] of cells) grid[y][x] = true;
  return grid;
}

describe("isSafe", () => {
  it("treats start and exit as safe even in light", () => {
    const lit = shade(corridor, []);
    expect(isSafe(corridor, lit, corridor.start)).toBe(true);
    expect(isSafe(corridor, lit, corridor.exit)).toBe(true);
    expect(isSafe(corridor, lit, { x: 2, y: 0 })).toBe(false);
  });
});

describe("exitDistances", () => {
  it("counts steps around blocks", () => {
    const level: Level = { ...corridor, size: 3, blocks: [{ x: 1, y: 0, h: 1 }], exit: { x: 2, y: 0 } };
    expect(exitDistances(level)[0][0]).toBe(4);
  });
});

describe("nextStep", () => {
  it("waits when the next cell is lit", () => {
    expect(nextStep(corridor, shade(corridor, []), corridor.start)).toBeNull();
  });

  it("walks as far as the shadow reaches", () => {
    const shadow = shade(corridor, [[1, 0], [2, 0]]);
    expect(walkUntilStop(corridor, shadow, corridor.start)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it("reaches the exit through a full shadow path", () => {
    const shadow = shade(corridor, [[1, 0], [2, 0], [3, 0]]);
    expect(walkUntilStop(corridor, shadow, corridor.start).at(-1)).toEqual(corridor.exit);
  });

  it("does not walk away from the exit", () => {
    const level: Level = { ...corridor, size: 5, start: { x: 2, y: 0 } };
    const shadow = shade(level, [[1, 0], [0, 0]]);
    expect(nextStep(level, shadow, level.start)).toBeNull();
  });
});

/** Fewest one-notch sun turns after Go, per level. */
const EXPECTED_TURNS = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 3, 3, 4, 4, 5, 5, 6, 7, 5, 5, 5, 5, 7, 8, 8, 8, 9, 9, 9, 9, 9, 9, 2, 2, 3, 6, 10, 10];

describe.each(LEVELS.map((level, i) => [level.id, level, EXPECTED_TURNS[i]] as const))("level %i", (_id, level, turns) => {
  it("cannot be solved with one sun angle", () => {
    expect(solvableWithOneAngle(level)).toBe(false);
  });

  it("is solvable by turning the sun while Pip walks", () => {
    expect(minTurns(level)).not.toBeNull();
  });

  it("needs the planned number of sun turns", () => {
    expect(minTurns(level)).toBe(turns);
  });

  it("starts with the sun on one of its directions", () => {
    expect(snapAngle(level, level.sunAngle)).toBe(level.sunAngle);
  });
});

describe.each(LEVELS.filter((l) => l.lights).map((l) => [l.id, l] as const))("light stones in level %i", (_id, level) => {
  it("make the level harder than without them", () => {
    const plain = { ...level, lights: undefined };
    const plainTurns = solvableWithOneAngle(plain) ? 0 : minTurns(plain);
    expect(plainTurns === null || plainTurns < minTurns(level)!).toBe(true);
  });
});

describe("snapAngle", () => {
  it("snaps to the nearest direction", () => {
    expect(snapAngle(corridor, 50)).toBe(45);
    expect(snapAngle(corridor, 350)).toBe(0);
    expect(snapAngle({ ...corridor, directions: 16 }, 30)).toBe(22.5);
  });
});
