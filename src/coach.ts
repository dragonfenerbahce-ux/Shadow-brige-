import type { Progress } from "./progress";

/**
 * The first-play coach: small, contextual hints on the first levels.
 * It never moves the sun itself; it only points at it and shows what the
 * player's own sun position does.
 */

/** Levels where the sun pulses until the first drag and board taps get a nudge. */
export const COACH_LEVELS = 3;
/** The only level that previews Pip's dark path and pulses Go when the path reaches the door. */
export const PREVIEW_LEVEL = 1;

export const COACH_MESSAGES = {
  drag: "Drag the sun to move the shadows.",
  turn: "Keep turning: the dark path must reach the door.",
  go: "The dark path reaches the door. Press Go!",
  tapBoard: "Drag the sun, not Pip.",
  waiting: "Pip needs a dark path. Turn the sun.",
};

export interface CoachView {
  /** Pulse the sun and show the "Drag the sun" bubble next to it. */
  pointAtSun: boolean;
  /** Show dots where Pip would walk with the current sun. */
  preview: boolean;
  /** The dark path reaches the door: glow the door and pulse Go. */
  pathReady: boolean;
  /** Message to show, or null to leave the current one. */
  message: string | null;
}

const OFF: CoachView = { pointAtSun: false, preview: false, pathReady: false, message: null };

/**
 * What the coach shows before Go.
 * `dragged`: the player has turned the sun on this level.
 * `reachesExit`: with the current sun, Pip's walk ends at the door.
 */
export function coachView(levelId: number, dragged: boolean, reachesExit: boolean): CoachView {
  if (levelId > COACH_LEVELS) return OFF;
  const preview = levelId === PREVIEW_LEVEL;
  if (!dragged) {
    return { pointAtSun: true, preview, pathReady: false, message: preview ? COACH_MESSAGES.drag : null };
  }
  if (!preview) return OFF;
  return reachesExit
    ? { pointAtSun: false, preview, pathReady: true, message: COACH_MESSAGES.go }
    : { pointAtSun: false, preview, pathReady: false, message: COACH_MESSAGES.turn };
}

/** Board taps and Pip waiting after Go get a hint only on the coached levels. */
export function coachesLevel(levelId: number): boolean {
  return levelId <= COACH_LEVELS;
}

/** A player with no finished level opens straight into level 1; everyone else sees the level list. */
export function startsInFirstLevel(progress: Progress): boolean {
  return Object.keys(progress).length === 0;
}
