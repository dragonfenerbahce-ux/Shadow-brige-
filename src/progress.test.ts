import { describe, expect, it } from "vitest";
import { isUnlocked, loadProgress, recordWin, saveProgress } from "./progress";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("progress", () => {
  it("starts empty", () => {
    expect(loadProgress(memoryStore())).toEqual({});
    expect(loadProgress(null)).toEqual({});
  });

  it("saves and loads wins", () => {
    const store = memoryStore();
    saveProgress(store, recordWin({}, 1, 4));
    expect(loadProgress(store)).toEqual({ 1: 4 });
  });

  it("keeps the best move count", () => {
    expect(recordWin({ 1: 4 }, 1, 6)).toEqual({ 1: 4 });
    expect(recordWin({ 1: 4 }, 1, 3)).toEqual({ 1: 3 });
  });

  it("ignores broken saved data", () => {
    const store = memoryStore();
    store.setItem("shadowbridge.progress.v3", "not json");
    expect(loadProgress(store)).toEqual({});
    store.setItem("shadowbridge.progress.v3", '{"1":"x","2":5}');
    expect(loadProgress(store)).toEqual({ 2: 5 });
  });

  it("survives a store that throws", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadProgress(broken)).toEqual({});
    expect(() => saveProgress(broken, { 1: 2 })).not.toThrow();
  });

  it("unlocks levels in order", () => {
    expect(isUnlocked({}, 1)).toBe(true);
    expect(isUnlocked({}, 2)).toBe(false);
    expect(isUnlocked({ 1: 3 }, 2)).toBe(true);
    expect(isUnlocked({ 1: 3 }, 3)).toBe(false);
  });
});
