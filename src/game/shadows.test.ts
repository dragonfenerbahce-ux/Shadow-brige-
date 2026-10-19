import { describe, expect, it } from "vitest";
import { computeShadows } from "./shadows";
import type { Level } from "./level";

const oneBlock = (h: number): Level => ({
  id: 0,
  size: 5,
  blocks: [{ x: 2, y: 2, h }],
  start: { x: 0, y: 0 },
  exit: { x: 4, y: 4 },
  sunAngle: 0,
});

function shadedCells(grid: boolean[][]): string[] {
  const out: string[] = [];
  grid.forEach((row, y) => row.forEach((s, x) => s && out.push(`${x},${y}`)));
  return out;
}

describe("computeShadows", () => {
  it("casts shadow away from a sun on the right", () => {
    expect(shadedCells(computeShadows(oneBlock(1), 0))).toEqual(["1,2"]);
  });

  it("casts as many cells as the block height", () => {
    expect(shadedCells(computeShadows(oneBlock(2), 0))).toEqual(["0,2", "1,2"]);
  });

  it("casts shadow downward when the sun is above", () => {
    expect(shadedCells(computeShadows(oneBlock(2), 270))).toEqual(["2,3", "2,4"]);
  });

  it("casts a connected diagonal shadow", () => {
    // Sun up-left: shadow goes down-right and covers side cells too.
    expect(shadedCells(computeShadows(oneBlock(1), 225))).toEqual(["3,2", "2,3", "3,3"]);
  });

  it("never marks the block cell itself", () => {
    const grid = computeShadows(oneBlock(3), 45);
    expect(grid[2][2]).toBe(false);
  });

  it("stays inside the board", () => {
    const grid = computeShadows(oneBlock(3), 180);
    expect(grid).toHaveLength(5);
    grid.forEach((row) => expect(row).toHaveLength(5));
  });
});
