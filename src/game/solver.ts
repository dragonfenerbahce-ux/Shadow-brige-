import { type Cell, type Level, sameCell } from "./level";
import { computeShadows } from "./shadows";
import { exitDistances, isSafe, walkUntilStop } from "./path";

/** Sun angle resolution used for level checks, in degrees. */
export const ANGLE_STEP = 1;
const ANGLES = 360 / ANGLE_STEP;

function shadowTable(level: Level): boolean[][][] {
  return Array.from({ length: ANGLES }, (_, i) => computeShadows(level, i * ANGLE_STEP));
}

/** True when Pip reaches the exit at one fixed sun angle, with no sun changes after Go. */
export function solvableWithOneAngle(level: Level): boolean {
  const toExit = exitDistances(level);
  return shadowTable(level).some((shadow) => sameCell(walkUntilStop(level, shadow, level.start, toExit).at(-1)!, level.exit));
}

/**
 * Minimum number of sun "phases" needed to win, or null if unsolvable.
 * A phase = let Pip walk until it stops. Between phases the sun turns step by step,
 * and Pip's cell must stay safe at every angle it passes through.
 */
export function minPhases(level: Level): number | null {
  const toExit = exitDistances(level);
  const shadows = shadowTable(level);
  const key = (c: Cell, a: number) => (c.y * level.size + c.x) * ANGLES + a;

  // Before Go, Pip is on the safe start tile, so any angle can be chosen.
  let frontier = new Map<number, { cell: Cell; angle: number }>();
  for (let a = 0; a < ANGLES; a++) frontier.set(key(level.start, a), { cell: level.start, angle: a });
  const seen = new Set<number>(frontier.keys());

  for (let phase = 1; phase <= 6 && frontier.size > 0; phase++) {
    // Walk phase.
    const stops: { cell: Cell; angle: number }[] = [];
    for (const { cell, angle } of frontier.values()) {
      const end = walkUntilStop(level, shadows[angle], cell, toExit).at(-1)!;
      if (sameCell(end, level.exit)) return phase;
      stops.push({ cell: end, angle });
    }
    // Turn phase: every angle reachable by turning while Pip's cell stays safe.
    const next = new Map<number, { cell: Cell; angle: number }>();
    for (const stop of stops) {
      for (const dir of [1, -1]) {
        for (let i = 1; i < ANGLES; i++) {
          const a = (stop.angle + dir * i + ANGLES) % ANGLES;
          if (!isSafe(level, shadows[a], stop.cell)) break;
          const k = key(stop.cell, a);
          if (!seen.has(k)) {
            seen.add(k);
            next.set(k, { cell: stop.cell, angle: a });
          }
        }
      }
    }
    frontier = next;
  }
  return null;
}
