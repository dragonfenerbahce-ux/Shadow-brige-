import { type Cell, type Level, inBounds, isBlock, sameCell } from "./level";

const DIRS: Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function neighbors(level: Level, c: Cell): Cell[] {
  return DIRS.map((d) => ({ x: c.x + d.x, y: c.y + d.y })).filter((n) => inBounds(level, n) && !isBlock(level, n));
}

/** Start and exit are safe tiles; any other floor cell is safe only in shadow. */
export function isSafe(level: Level, shadow: boolean[][], c: Cell): boolean {
  return sameCell(c, level.start) || sameCell(c, level.exit) || shadow[c.y][c.x];
}

/** Walking distance from every floor cell to the exit, ignoring light. */
export function exitDistances(level: Level): number[][] {
  const dist = Array.from({ length: level.size }, () => Array<number>(level.size).fill(Infinity));
  dist[level.exit.y][level.exit.x] = 0;
  const queue: Cell[] = [level.exit];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const n of neighbors(level, cur)) {
      if (dist[n.y][n.x] !== Infinity) continue;
      dist[n.y][n.x] = dist[cur.y][cur.x] + 1;
      queue.push(n);
    }
  }
  return dist;
}

/**
 * Pip's next cell. Pip walks through safe cells toward the reachable safe cell
 * closest to the exit, and waits (returns null) when no such cell beats its own.
 */
export function nextStep(level: Level, shadow: boolean[][], from: Cell, toExit = exitDistances(level)): Cell | null {
  const key = (c: Cell) => c.y * level.size + c.x;
  const prev = new Map<number, Cell | null>([[key(from), null]]);
  const queue: Cell[] = [from];
  let best = from;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    // BFS order means the first cell found at a given exit distance is also the nearest to Pip.
    if (toExit[cur.y][cur.x] < toExit[best.y][best.x]) best = cur;
    for (const n of neighbors(level, cur)) {
      if (prev.has(key(n)) || !isSafe(level, shadow, n)) continue;
      prev.set(key(n), cur);
      queue.push(n);
    }
  }

  if (sameCell(best, from)) return null;
  let step = best;
  for (let p = prev.get(key(step)); p && !sameCell(p, from); p = prev.get(key(p))) step = p;
  return step;
}

/** Lets Pip walk at a fixed sun angle until it stops. Returns the cells visited, starting with `from`. */
export function walkUntilStop(level: Level, shadow: boolean[][], from: Cell, toExit = exitDistances(level)): Cell[] {
  const path = [from];
  for (let next = nextStep(level, shadow, from, toExit); next; next = nextStep(level, shadow, next, toExit)) {
    path.push(next);
  }
  return path;
}
