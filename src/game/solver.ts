import { type Cell, type Level, sameCell } from "./level";
import { computeShadows } from "./shadows";
import { exitDistances, isSafe, walkUntilStop } from "./path";

/** Shadows for each of the level's sun directions, indexed by direction. */
function shadowTable(level: Level): boolean[][][] {
  const step = 360 / level.directions;
  return Array.from({ length: level.directions }, (_, i) => computeShadows(level, i * step));
}

/** True when Pip reaches the exit at one fixed sun angle, with no sun changes after Go. */
export function solvableWithOneAngle(level: Level): boolean {
  const toExit = exitDistances(level);
  return shadowTable(level).some((shadow) => sameCell(walkUntilStop(level, shadow, level.start, toExit).at(-1)!, level.exit));
}

/**
 * Minimum number of one-notch sun turns needed after Go, or null if unsolvable.
 * Models a careful player: after every notch Pip walks until it stops, and the
 * cell Pip stands on must still be safe at the next notch.
 */
export function minTurns(level: Level): number | null {
  const toExit = exitDistances(level);
  const shadows = shadowTable(level);
  const count = level.directions;
  const key = (c: Cell, a: number) => (c.y * level.size + c.x) * count + a;

  // Before Go, Pip is on the safe start tile, so any direction can be chosen.
  let frontier: { cell: Cell; dir: number }[] = [];
  const seen = new Set<number>();
  for (let d = 0; d < count; d++) {
    frontier.push({ cell: level.start, dir: d });
    seen.add(key(level.start, d));
  }

  for (let turns = 0; frontier.length > 0 && turns <= count * 4; turns++) {
    const next: { cell: Cell; dir: number }[] = [];
    for (const { cell, dir } of frontier) {
      const end = walkUntilStop(level, shadows[dir], cell, toExit).at(-1)!;
      if (sameCell(end, level.exit)) return turns;
      for (const d of [(dir + 1) % count, (dir - 1 + count) % count]) {
        if (!isSafe(level, shadows[d], end) || seen.has(key(end, d))) continue;
        seen.add(key(end, d));
        next.push({ cell: end, dir: d });
      }
    }
    frontier = next;
  }
  return null;
}
