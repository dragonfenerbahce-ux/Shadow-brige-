import { describe, expect, it } from "vitest";
import { COACH_MESSAGES, coachView, coachesLevel, startsInFirstLevel } from "./coach";

describe("coachView", () => {
  it("points at the sun on level 1 before the first drag", () => {
    expect(coachView(1, false, false)).toEqual({
      pointAtSun: true,
      preview: true,
      pathReady: false,
      message: COACH_MESSAGES.drag,
    });
  });

  it("asks to keep turning when the path does not reach the door", () => {
    const view = coachView(1, true, false);
    expect(view.pointAtSun).toBe(false);
    expect(view.pathReady).toBe(false);
    expect(view.message).toBe(COACH_MESSAGES.turn);
  });

  it("asks for Go only once the player's own sun makes a full path", () => {
    expect(coachView(1, true, true)).toMatchObject({ pathReady: true, message: COACH_MESSAGES.go });
    // Before the player drags, a full path never triggers Go: the coach does not solve the level.
    expect(coachView(1, false, true).pathReady).toBe(false);
  });

  it("shows the path preview only on level 1", () => {
    expect(coachView(2, false, false)).toMatchObject({ pointAtSun: true, preview: false, message: null });
    expect(coachView(2, true, true).preview).toBe(false);
    expect(coachView(3, true, true).pathReady).toBe(false);
  });

  it("is off from level 4 on", () => {
    expect(coachView(4, false, true)).toEqual({ pointAtSun: false, preview: false, pathReady: false, message: null });
    expect(coachesLevel(3)).toBe(true);
    expect(coachesLevel(4)).toBe(false);
  });
});

describe("startsInFirstLevel", () => {
  it("sends only players with no finished level to level 1", () => {
    expect(startsInFirstLevel({})).toBe(true);
    expect(startsInFirstLevel({ 1: 3 })).toBe(false);
    expect(startsInFirstLevel({ 7: 5 })).toBe(false);
  });
});
