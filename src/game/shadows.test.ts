import { describe, expect, it } from "vitest";
import { computeShadows } from "./shadows";
import type { Level } from "./level";

const oneBlock = (): Level => ({
  id: 0,
  size: 5,
  blocks: [{ x: 2, y: 2 }],
  start: { x: 0, y: 0 },
  exit: { x: 4, y: 4 },
  sunAngle: 0,
  directions: 8,
});

function shadedCells(grid: boolean[][]): string[] {
  const out: string[] = [];
  grid.forEach((row, y) => row.forEach((s, x) => s && out.push(`${x},${y}`)));
  return out;
}

describe("computeShadows", () => {
  it("casts shadow away from a sun on the right, to the board edge", () => {
    expect(shadedCells(computeShadows(oneBlock(), 0))).toEqual(["0,2", "1,2"]);
  });

  it("casts shadow downward when the sun is above", () => {
    expect(shadedCells(computeShadows(oneBlock(), 270))).toEqual(["2,3", "2,4"]);
  });

  it("casts a connected diagonal shadow", () => {
    // Sun up-left: shadow goes down-right and covers side cells too.
    expect(shadedCells(computeShadows(oneBlock(), 225))).toEqual(["3,2", "2,3", "3,3", "4,3", "3,4", "4,4"]);
  });

  it("cannot shade a light stone or the cells beside it", () => {
    const level = { ...oneBlock(), lights: [{ x: 1, y: 3 }] };
    // Without the stone the shadow would cover 0,2 and 1,2; 1,2 sits beside the stone.
    expect(shadedCells(computeShadows(level, 0))).toEqual(["0,2"]);
  });

  it("never marks the block cell itself", () => {
    const grid = computeShadows(oneBlock(), 45);
    expect(grid[2][2]).toBe(false);
  });

  it("stays inside the board", () => {
    const grid = computeShadows(oneBlock(), 180);
    expect(grid).toHaveLength(5);
    grid.forEach((row) => expect(row).toHaveLength(5));
  });
});
