# Session Log

Latest 5 entries only. Older entries are summarized at the bottom.

## 2026-10-19: Setup, app choice, stack, first screen
- Done: Project docs and permissions; chose Shadowbridge core prototype; approved TypeScript + Vite + Canvas + Vitest; built the game screen for level 1 (sun drag, shadows, Go, win/melt). 14 unit tests pass; checked in headless Chromium at iPhone 13 size (melt, drag, win, restart).
- Next step: Product Owner tests level 1 on iPhone Safari and reports how the sun drag and shadows feel. Then: levels 2-3 and result overlay.
- Struggled with: First walk animation froze (negative time on first frame); fixed by clamping. First `npm install` attempt was blocked by the auto-mode classifier; pinned versions in package.json worked.
