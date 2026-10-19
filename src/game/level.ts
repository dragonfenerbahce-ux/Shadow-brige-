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
