# Decisions

Only approved decisions go here. Format: decision, date, reason, alternative considered, trade-off.

## Stack
TypeScript + Vite + HTML Canvas 2D, tested with Vitest. Runs in iPhone Safari as a web page.
Dev tools (pinned): typescript 7.0.2, vite 8.3.4, vitest 5.0.5. No runtime dependencies.
Requires Node.js 22.12+ on the Mac.

## Commands
- Type check: `npm run typecheck` (runs `tsc --noEmit`)
- Tests: `npm test` (runs `vitest run`)
- Run app: `npm run dev` (runs `vite --host`). On the Mac open the printed `Local` URL; on the iPhone (same Wi-Fi) open the printed `Network` URL in Safari.
- Install tools (once, after cloning): `npm install`

## Decision log

### 2026-10-18: First app is a Shadowbridge core prototype
- Decision: Build a one-weekend prototype of the Shadowbridge core mechanic (drag the sun, Pip walks only in shadow), 3 levels, max 3 screens.
- Reason: Tests whether the mechanic is fun before committing to an 8+ week Unity game; meets all first-app criteria.
- Alternative considered: Start the full Shadowbridge game directly in Unity.
- Trade-off: No 3D look, sound or full UI in this version.

### 2026-10-19: Stack is TypeScript + Vite + Canvas 2D + Vitest
- Decision: Build the prototype as a browser game in TypeScript with Vite and Canvas 2D; test game logic with Vitest.
- Reason: Free, testable on iPhone via Safari over Wi-Fi, and Claude can run tests and the app in its own environment.
- Alternative considered: Unity 6 (3D URP), developed and tested only on the Mac.
- Trade-off: Code will not carry over to Unity; iPhone Safari touch handling needs extra care.

### 2026-10-19: Game UI text is in English
- Decision: All in-game text (buttons, messages) is English.
- Reason: Shadowbridge targets an international audience.
- Alternative considered: Turkish UI text.
- Trade-off: Turkish friends testing the prototype read English labels.

### 2026-10-19: Pip walks live while the player turns the sun
- Decision: After Go, Pip walks step by step as far as the current shadow allows and waits otherwise; the player keeps turning the sun during the walk. Pip melts if its own cell becomes lit. Start and exit are safe tiles.
- Reason: Playtest showed the one-angle rule was too easy: sweeping the sun always revealed the answer.
- Alternative considered: Keep the one-angle rule and make harder levels with narrower solution windows.
- Trade-off: Bigger rewrite of game logic and levels; turning the sun while protecting Pip needs some finger skill.

### 2026-10-19: Sun snaps to fixed directions (8 early, 16 later)
- Decision: The sun snaps to 8 directions in early levels; later levels use more (level 3: 16). Stops are shown as dots on the sun ring.
- Reason: Playtest said shadows felt inconsistent and levels were too hard; free angles made shadows jump between cells and needed degree-level precision.
- Alternative considered: Keep free angles and draw the real shadow shape as a soft area.
- Trade-off: Less smooth, "magical" sun movement; fewer distinct level ideas per board.
