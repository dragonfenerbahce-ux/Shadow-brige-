import { type Level, isBlock, litByStone } from "./level";

const HALF = 0.5;
const EPS = 1e-9;

/** Allowed values of t for which |offset - t * dir| <= HALF, or null when none. */
function axisRange(offset: number, dir: number): [number, number] | null {
  if (Math.abs(dir) < EPS) {
    return Math.abs(offset) <= HALF + EPS ? [-Infinity, Infinity] : null;
  }
  const a = (offset - HALF) / dir;
  const b = (offset + HALF) / dir;
  return a < b ? [a, b] : [b, a];
}

/**
 * Returns shadow[y][x] = true for floor cells in shadow.
 * Each block's square is swept away from the sun for `h` cells; a floor cell is
 * in shadow when its center lies inside that swept square. Cells lit by a light
 * stone are never in shadow.
 */
export function computeShadows(level: Level, sunAngleDeg: number): boolean[][] {
  const rad = (sunAngleDeg * Math.PI) / 180;
  // Shadow points away from the sun.
  const dx = -Math.cos(rad);
  const dy = -Math.sin(rad);
  const grid = Array.from({ length: level.size }, () => Array<boolean>(level.size).fill(false));

  for (const block of level.blocks) {
    for (let y = 0; y < level.size; y++) {
      for (let x = 0; x < level.size; x++) {
        if (grid[y][x] || isBlock(level, { x, y }) || litByStone(level, { x, y })) continue;
        const rx = axisRange(x - block.x, dx);
        const ry = axisRange(y - block.y, dy);
        if (!rx || !ry) continue;
        const lo = Math.max(rx[0], ry[0], 0);
        const hi = Math.min(rx[1], ry[1], block.h);
        if (lo <= hi + EPS) grid[y][x] = true;
      }
    }
  }
  return grid;
}
