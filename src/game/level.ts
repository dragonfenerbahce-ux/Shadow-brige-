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
  /** Number of directions the sun snaps to (8 = every 45 degrees). */
  directions: number;
}

/** Snaps an angle to the nearest of the level's sun directions, in [0, 360). */
export function snapAngle(level: Level, angle: number): number {
  const step = 360 / level.directions;
  return ((Math.round(angle / step) * step) % 360 + 360) % 360;
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
    { x: 4, y: 0, h: 2 },
    { x: 0, y: 1, h: 1 },
    { x: 6, y: 2, h: 2 },
    { x: 2, y: 3, h: 3 },
  ],
  start: { x: 3, y: 6 },
  exit: { x: 3, y: 0 },
  sunAngle: 90,
  directions: 8,
};

export const LEVEL_2: Level = {
  id: 2,
  size: 7,
  blocks: [
    { x: 4, y: 0, h: 2 },
    { x: 0, y: 1, h: 2 },
    { x: 3, y: 2, h: 3 },
  ],
  start: { x: 3, y: 6 },
  exit: { x: 3, y: 0 },
  sunAngle: 90,
  directions: 8,
};

export const LEVEL_3: Level = {
  id: 3,
  size: 7,
  blocks: [
    { x: 3, y: 3, h: 3 },
    { x: 4, y: 3, h: 1 },
    { x: 1, y: 5, h: 1 },
    { x: 2, y: 6, h: 2 },
  ],
  start: { x: 0, y: 3 },
  exit: { x: 6, y: 3 },
  sunAngle: 90,
  directions: 16,
};

export const LEVELS: Level[] = [LEVEL_1, LEVEL_2, LEVEL_3];
