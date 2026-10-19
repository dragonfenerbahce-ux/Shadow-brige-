import { type Cell, type Level, inBounds, isBlock, sameCell } from "./level";

const DIRS: Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

/** Shortest 4-directional path from start to exit over floor cells that pass `allowed`. */
export function findPath(level: Level, allowed: (cell: Cell) => boolean): Cell[] | null {
  const key = (c: Cell) => c.y * level.size + c.x;
  const prev = new Map<number, Cell | null>([[key(level.start), null]]);
  const queue: Cell[] = [level.start];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (sameCell(cur, level.exit)) {
      const path: Cell[] = [];
      for (let c: Cell | null = cur; c; c = prev.get(key(c)) ?? null) path.unshift(c);
      return path;
    }
    for (const d of DIRS) {
      const next = { x: cur.x + d.x, y: cur.y + d.y };
      if (!inBounds(level, next) || isBlock(level, next) || prev.has(key(next))) continue;
      if (!allowed(next)) continue;
      prev.set(key(next), cur);
      queue.push(next);
    }
  }
  return null;
}

export type WalkResult =
  | { outcome: "win"; path: Cell[] }
  | { outcome: "melt"; path: Cell[] }
  | { outcome: "stuck"; path: Cell[] };

/**
 * Decides what Pip does when the player presses Go.
 * win:  a shadow-only path exists; `path` ends at the exit.
 * melt: Pip takes the shortest floor path; `path` ends at the first lit cell.
 * stuck: blocks fully separate start and exit (a level design error).
 */
export function resolveWalk(level: Level, shadow: boolean[][]): WalkResult {
  const safe = (c: Cell) => sameCell(c, level.start) || sameCell(c, level.exit);
  const shaded = findPath(level, (c) => safe(c) || shadow[c.y][c.x]);
  if (shaded) return { outcome: "win", path: shaded };

  const any = findPath(level, () => true);
  if (!any) return { outcome: "stuck", path: [level.start] };
  const meltIndex = any.findIndex((c) => !safe(c) && !shadow[c.y][c.x]);
  return { outcome: "melt", path: any.slice(0, meltIndex + 1) };
}
