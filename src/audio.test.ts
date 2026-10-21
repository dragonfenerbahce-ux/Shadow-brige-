import { describe, expect, it } from "vitest";
import { initAudio, isMuted, toggleMuted } from "./audio";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("sound setting", () => {
  it("starts with sound on and remembers turning it off", () => {
    const store = memoryStore();
    initAudio(store);
    expect(isMuted()).toBe(false);
    toggleMuted();
    initAudio(store);
    expect(isMuted()).toBe(true);
  });

  it("works without storage", () => {
    initAudio(null);
    expect(isMuted()).toBe(false);
    expect(toggleMuted()).toBe(true);
  });
});
