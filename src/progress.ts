/** Best (fewest) moves per finished level id. A level is finished when it has an entry. */
export type Progress = Record<number, number>;

// v4: all levels were rebuilt when shadows started reaching the board edge.
const KEY = "shadowbridge.progress.v4";

type Store = Pick<Storage, "getItem" | "setItem">;

/** The browser's storage, or null where it is blocked (private mode, sandboxed frames). */
export function browserStore(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadProgress(store: Store | null): Progress {
  try {
    const raw = store?.getItem(KEY);
    const data: unknown = raw ? JSON.parse(raw) : {};
    if (typeof data !== "object" || data === null) return {};
    const out: Progress = {};
    for (const [id, best] of Object.entries(data)) {
      if (typeof best === "number" && best >= 0) out[Number(id)] = best;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveProgress(store: Store | null, progress: Progress): void {
  try {
    store?.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Progress is a convenience; the game keeps working without it.
  }
}

/** Records a win, keeping the lower move count. */
export function recordWin(progress: Progress, levelId: number, moves: number): Progress {
  const best = progress[levelId];
  return { ...progress, [levelId]: best === undefined ? moves : Math.min(best, moves) };
}

/** Level 1 is always open; every other level opens when the one before it is finished. */
export function isUnlocked(progress: Progress, levelId: number): boolean {
  return levelId === 1 || progress[levelId - 1] !== undefined;
}
