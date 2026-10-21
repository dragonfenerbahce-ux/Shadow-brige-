# Session Log

Latest 5 entries only. Older entries are summarized at the bottom.

## 2026-10-21: Result card, Pip hop, exit sparkle, #unlock test link
- Done: Added `#unlock` link (all levels open for the Product Owner). Product Owner synced the repo to the Mac with GitHub Desktop. Built the result card (win: title, moves, New best/Best, Next/Retry/Levels; melt: Retry/Levels), Pip hops on each step, sparkle at the exit before the card. 218 tests pass; win and melt cards and every button checked in headless Chromium; all 48 levels played through via the card's Next button.
- Next step: Product Owner tries the new card on iPhone. Then pick: sound, a new mechanic, or a friend playtest round.
- Struggled with: Full 48-level browser run hit the 10-minute command limit after adding card waits; split into two parallel halves.

## 2026-10-20: Shadows to the board edge, all 48 levels rebuilt
- Done: Product Owner marked level 18: cells behind a block were lit (shadow length = block height felt wrong). Approved: shadows reach the board edge, heights removed. Regenerated all 48 levels with the same turn curve (0,0,0,1,...,11). 217 tests pass; all 48 levels played through in one headless Chromium run (timed from solver walk lengths); all 48 open from level select.
- Next step: Product Owner and friend replay on iPhone. Then pick the next feature (result screen, visual polish, or new mechanic).
- Struggled with: Nothing new; the timed full play-through now makes checking every level practical.

## 2026-10-20: Beginner-friendly start after a friend's playtest
- Done: Friend quit at level 3 in 30 s ("too hard", "behind the block but the sun hit me"). Added 0.8 s orange warning in levels 1-10, walk-back when the next cell gets lit, smaller Pip so its cell's shade shows, 3 one-direction tutorial levels, 5 easy breather levels (48 total) and hints on levels 1-4 and 11. 218 tests pass; levels 1-15 played through in headless Chromium; warning saves Pip on level 4 and is off on level 11; all 48 levels open from level select.
- Next step: Same friend plays again on iPhone; compare how far they get. Then: result overlay or more mechanics.
- Struggled with: Browser test first waited too short for long walks (level 7), which looked like a bug but was not.

## 2026-10-19: 40 levels and light stones
- Done: Generated 40 levels in difficulty tiers with the solver (turns 1-10, 7x7 and 9x9, 8 and 16 directions). Added light stones (src/game/level.ts `lights`, never shaded, light their 4 neighbours) from level 35 with an intro hint. Fixed a crash when opening a level of a different board size from level select (also in the published 10-level build). 186 tests pass; levels 1, 2, 21, 35, 38 played through in headless Chromium; all 40 levels opened from level select in both orders without errors.
- Next step: Product Owner plays on iPhone, especially levels 1-10 (should be quick) and 35+ (light stones). Then: result overlay or next mechanic.
- Struggled with: Level select bug was missed because earlier browser tests only used the Next button; now the test opens every level from the grid.

## 2026-10-19: 10 levels, level select, saved progress
- Done: Moved levels to src/game/levels.ts and grew to 10 (turns needed: 2,3,4,5,6,9 on 7x7; 6,7,8,9 on 9x9). Added level select screen and saved progress (src/progress.ts, browser storage, levels unlock in order). 59 tests pass; all 10 levels played through in headless Chromium; progress survived a reload. Test page republished.
- Next step: Product Owner plays the 10 levels on iPhone. Then decide the first new mechanic ("light stone" tile proposed instead of a bomb).
- Struggled with: Product Owner suggested a bomb tile; proposed a light-themed tile instead to keep the calm style. Many solutions are "keep turning one way"; watch for repetition.

## Older entries (summary)
- 2026-10-18/19: Project setup (CLAUDE.md, docs, permissions, Git/GitHub); chose Shadowbridge core prototype over simpler apps.
- Approved stack: TypeScript + Vite + Canvas 2D + Vitest; Product Owner tests via a private claude.ai test page.
- First playable level 1 (one-angle rule), then 3 levels; playtest said too easy, which led to the live-walk rule (Pip walks while the sun turns), then a second playtest made the sun snap to fixed directions (8, later 16).
