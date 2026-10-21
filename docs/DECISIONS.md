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

### 2026-10-19: 10 levels with level select and saved progress
- Decision: Grow from 3 to 10 levels (8 directions on 7x7, then 16 directions on 7x7, then 16 on 9x9). Add a level select screen; progress (best moves per level) is saved in the browser on the phone; levels unlock in order.
- Reason: Playtest liked the snapped-sun levels and asked for more, with growing sun directions and board size.
- Alternative considered: Add a new tile mechanic (bomb) at the same time.
- Trade-off: Ten levels with one rule may feel repetitive; a new mechanic waits until these are played.

### 2026-10-19: 40 levels with a slow ramp; light stones from level 35
- Decision: 40 levels. Early levels are quick (1-2 sun turns); the old level 8 difficulty (9x9, 16 directions, about 7 turns) arrives around levels 21-25; levels 26-34 are harder; light stones start at level 35 with an intro hint. Saved progress moved to a new storage key because level numbers changed.
- Reason: Product Owner found the 10-level ramp good but steep (stuck around level 8) and wanted more, faster early levels, with the light tile around levels 35-40.
- Alternative considered: A bomb tile; rejected earlier for not fitting the calm light/shadow theme.
- Trade-off: Earlier saved progress on the phone is reset once.

### 2026-10-20: Beginner-friendly start (48 levels, warning, tutorials)
- Decision: In levels 1-10 Pip glows orange for 0.8 s in the sun before melting; Pip walks back if its next cell is lit mid-step; Pip is drawn smaller so its cell's shade stays visible. Three new one-direction tutorial levels open the game, easy levels are mixed in (48 levels in total), and levels 1-4 and 11 show hints. Saved progress moved to a new storage key.
- Reason: A friend's first playtest: quit at level 3 after 30 seconds, found it too hard, and felt "I was behind the block but the sun hit me".
- Alternative considered: Keep instant melting everywhere and only add hints.
- Trade-off: The warning makes early levels easier to brute-force; progress on phones is reset once; light stones now start at level 43.

### 2026-10-20: Shadows reach the board edge; block heights removed
- Decision: A block's shadow continues behind it all the way to the board edge. Blocks no longer have heights or numbers. All 48 levels were regenerated with the same difficulty curve; saved progress moved to a new storage key.
- Reason: Product Owner's playtest (with a marked screenshot of level 18): cells right behind a block were lit, which felt physically wrong; the height numbers were abstract.
- Alternative considered: Keep heights and draw blocks as 3D pillars so short shadows look natural.
- Trade-off: Less puzzle variety without heights; boards get darker; progress on phones is reset once.

### 2026-10-21: Test mode link opens every level
- Decision: A page link ending with `#unlock` opens all levels; the normal link keeps levels unlocking in order. Update 2026-10-21: tapping the "Shadowbridge" title 5 times on the level list also toggles this test mode (saved on the phone), because the link hash may not reach the page inside Claude's viewer.
- Reason: Product Owner tests levels often and should not have to replay earlier ones.
- Alternative considered: Unlock every level for everyone.
- Trade-off: Anyone who learns the `#unlock` link can skip ahead.

### 2026-10-21: Sound is synthesized with Web Audio
- Decision: Music (a soft four-chord sunset pad with bell notes) and effects (sun tick, step, warning, melt, win) are generated in code with the Web Audio API; no sound files. A round button bottom-right turns sound on/off, saved on the device. Sound starts after the first tap; on iPhone it asks for "playback" so the silent switch should not mute it (Safari 16.4+).
- Reason: Free, no licenses, no new dependencies, tiny page size.
- Alternative considered: Free recorded music and effect files.
- Trade-off: Sounds are simpler and more "electronic" than recorded ones; only the Product Owner can judge how they sound.

### 2026-10-21: First-play coach (onboarding experiment)
- Decision: New players (no finished level) open straight into level 1; players with progress still see the level list. On levels 1-3 the sun pulses with a "Drag the sun" bubble until the first drag, a tap on the board says "Drag the sun, not Pip.", and if Pip waits after Go for over 1 s the game says "Pip needs a dark path. Turn the sun." On level 1 only, dots preview where Pip would walk with the player's current sun; when they reach the door, the door glows and Go pulses. The coach never moves the sun itself.
- Reason: Playtests: players did not understand the controls and quit within about 30 seconds. Code review showed silent board taps, a "frozen" Go on wrong sun angles, and a long text-only hint after a 48-level list.
- Alternative considered: A separate instruction screen before level 1; path preview on levels 1-3.
- Trade-off: The level 1 preview makes that level close to self-solving; levels 2-3 keep the puzzle.
