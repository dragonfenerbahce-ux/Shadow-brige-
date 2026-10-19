# Session Log

Latest 5 entries only. Older entries are summarized at the bottom.

## 2026-10-19: 40 levels and light stones
- Done: Generated 40 levels in difficulty tiers with the solver (turns 1-10, 7x7 and 9x9, 8 and 16 directions). Added light stones (src/game/level.ts `lights`, never shaded, light their 4 neighbours) from level 35 with an intro hint. Fixed a crash when opening a level of a different board size from level select (also in the published 10-level build). 186 tests pass; levels 1, 2, 21, 35, 38 played through in headless Chromium; all 40 levels opened from level select in both orders without errors.
- Next step: Product Owner plays on iPhone, especially levels 1-10 (should be quick) and 35+ (light stones). Then: result overlay or next mechanic.
- Struggled with: Level select bug was missed because earlier browser tests only used the Next button; now the test opens every level from the grid.

## 2026-10-19: 10 levels, level select, saved progress
- Done: Moved levels to src/game/levels.ts and grew to 10 (turns needed: 2,3,4,5,6,9 on 7x7; 6,7,8,9 on 9x9). Added level select screen and saved progress (src/progress.ts, browser storage, levels unlock in order). 59 tests pass; all 10 levels played through in headless Chromium; progress survived a reload. Test page republished.
- Next step: Product Owner plays the 10 levels on iPhone. Then decide the first new mechanic ("light stone" tile proposed instead of a bomb).
- Struggled with: Product Owner suggested a bomb tile; proposed a light-themed tile instead to keep the calm style. Many solutions are "keep turning one way"; watch for repetition.

## 2026-10-19: Snapped sun directions and easier levels
- Done: Playtest of live-walk levels: shadows felt inconsistent, too hard. Approved snapping: 8 directions early, 16 later. Added per-level `directions`, sun stop dots, slower Pip, sun ring moved outside the board. Solver now models a careful player (Pip walks after every notch). New levels need 2, 3 and 5 notch turns. 25 tests pass; all 3 levels played through in headless Chromium. Test page republished. Pushed earlier commits.
- Next step: Product Owner plays on iPhone: are shadows predictable now, is difficulty right? Then: level select screen with saved progress.
- Struggled with: First solver assumed Pip stands still while the sun turns; real play melted Pip on level 3. Fixed by modelling a walk after every notch.

## 2026-10-19: Live-walk rule and new levels
- Done: Playtest said levels were too easy (one sun angle always solved them). Approved new rule: Pip walks live as far as shadow allows, player turns the sun during the walk, Pip melts if its cell gets lit; start/exit are safe. Rewrote path logic, added a solver (src/game/solver.ts), picked 3 generated levels needing 2, 3 and 4 sun phases. 21 tests pass (checked at 1-degree resolution); all 3 levels played through in headless Chromium using solver plans; wrong turn melts Pip. Test page republished.
- Next step: Product Owner plays the new levels on iPhone and says if they are fun and hard enough. Then: level select screen with saved progress.
- Struggled with: Level 1 solution needs only a small (5 degree) turn after the first walk; may feel fiddly. Watch the playtest.

## 2026-10-19: Levels 2-3 and Next button
- Done: Product Owner tested level 1 on iPhone (private claude.ai test page): smooth drag, solved it, asked for more levels. Added levels 2 and 3 (picked from generated candidates with narrow solution windows) and a Next level button. 23 unit tests pass; all 3 levels played through in headless Chromium at iPhone size. Test page republished at the same link.
- Next step: Product Owner plays levels 2-3 on iPhone and says if difficulty feels right. Then: level select screen with saved progress.
- Struggled with: Nothing new. Still open: approval of "start and exit are safe tiles" rule and English UI text.

## Older entries (summary)
- 2026-10-18/19: Project setup (CLAUDE.md, docs, permissions, Git/GitHub); chose Shadowbridge core prototype over simpler apps.
- Approved stack: TypeScript + Vite + Canvas 2D + Vitest; Product Owner tests via a private claude.ai test page.
- First playable level 1 (one-angle rule), then 3 levels; playtest said too easy, which led to the live-walk rule.
