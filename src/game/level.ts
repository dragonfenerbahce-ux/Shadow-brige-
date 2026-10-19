export interface Cell {
  x: number;
  y: number;
}

export interface Block extends Cell {
  /** Block height in cells (1-3). A block casts this many cells of shadow. */
  h: number;
}

export interface Level {
  id: number;
  size: number;
  blocks: Block[];
  /** Start and exit are safe tiles: Pip does not melt on them. */
  start: Cell;
  exit: Cell;
  /** Initial sun angle in degrees. 0 = sun to the right, 90 = sun below (screen y grows down). */
  sunAngle: number;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isBlock(level: Level, cell: Cell): boolean {
  return level.blocks.some((b) => sameCell(b, cell));
}

export function inBounds(level: Level, cell: Cell): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < level.size && cell.y < level.size;
}

export const LEVEL_1: Level = {
  id: 1,
  size: 7,
  blocks: [
    { x: 1, y: 2, h: 2 },
    { x: 3, y: 2, h: 2 },
    { x: 5, y: 2, h: 2 },
  ],
  start: { x: 0, y: 3 },
  exit: { x: 6, y: 3 },
  sunAngle: 90,
};
