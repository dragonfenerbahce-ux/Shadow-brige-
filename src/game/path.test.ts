import { describe, expect, it } from "vitest";
import { exitDistances, isSafe, nextStep, walkUntilStop } from "./path";
import { minPhases, solvableWithOneAngle } from "./solver";
import { LEVELS, type Level } from "./level";

// A 5x1 corridor: start on the left, exit on the right.
const corridor: Level = {
  id: 0,
  size: 5,
  blocks: [],
  start: { x: 0, y: 0 },
  exit: { x: 4, y: 0 },
  sunAngle: 0,
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

describe.each(LEVELS.map((level) => [level.id, level] as const))("level %i", (id, level) => {
  it("cannot be solved with one sun angle", () => {
    expect(solvableWithOneAngle(level)).toBe(false);
  });

  it("is solvable by turning the sun while Pip walks", () => {
    expect(minPhases(level)).not.toBeNull();
  });

  it("gets harder with each level", () => {
    expect(minPhases(level)).toBe(id + 1);
  });
});
