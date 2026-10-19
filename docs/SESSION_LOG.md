# Session Log

Latest 5 entries only. Older entries are summarized at the bottom.

## 2026-10-19: Live-walk rule and new levels
- Done: Playtest said levels were too easy (one sun angle always solved them). Approved new rule: Pip walks live as far as shadow allows, player turns the sun during the walk, Pip melts if its cell gets lit; start/exit are safe. Rewrote path logic, added a solver (src/game/solver.ts), picked 3 generated levels needing 2, 3 and 4 sun phases. 21 tests pass (checked at 1-degree resolution); all 3 levels played through in headless Chromium using solver plans; wrong turn melts Pip. Test page republished.
- Next step: Product Owner plays the new levels on iPhone and says if they are fun and hard enough. Then: level select screen with saved progress.
- Struggled with: Level 1 solution needs only a small (5 degree) turn after the first walk; may feel fiddly. Watch the playtest.

## 2026-10-19: Levels 2-3 and Next button
- Done: Product Owner tested level 1 on iPhone (private claude.ai test page): smooth drag, solved it, asked for more levels. Added levels 2 and 3 (picked from generated candidates with narrow solution windows) and a Next level button. 23 unit tests pass; all 3 levels played through in headless Chromium at iPhone size. Test page republished at the same link.
- Next step: Product Owner plays levels 2-3 on iPhone and says if difficulty feels right. Then: level select screen with saved progress.
- Struggled with: Nothing new. Still open: approval of "start and exit are safe tiles" rule and English UI text.

## 2026-10-19: Setup, app choice, stack, first screen
- Done: Project docs and permissions; chose Shadowbridge core prototype; approved TypeScript + Vite + Canvas + Vitest; built the game screen for level 1 (sun drag, shadows, Go, win/melt). 14 unit tests pass; checked in headless Chromium at iPhone 13 size (melt, drag, win, restart).
- Next step: Product Owner tests level 1 on iPhone Safari and reports how the sun drag and shadows feel. Then: levels 2-3 and result overlay.
- Struggled with: First walk animation froze (negative time on first frame); fixed by clamping. First `npm install` attempt was blocked by the auto-mode classifier; pinned versions in package.json worked.
