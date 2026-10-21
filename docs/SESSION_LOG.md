# Session Log

Latest 5 entries only. Older entries are summarized at the bottom.

## 2026-10-21: First-play coach experiment
- Done: Added src/coach.ts (coach decisions, tested) and coach marks in src/render.ts; wired into src/main.ts. New players start in level 1; existing progress keeps the level list. 226 tests pass; 19 browser checks pass (new/existing player, board tap, wrong/right sun, Go pulse, waiting message, level 2 and 4 behaviour); all 48 levels still play through. No changes to src/game/.
- Next step: Playtest with 3 people who never saw the game: time to first sun drag, time to win level 1, furthest level, can they explain the goal. Success: 2 of 3 drag within 5 s, win level 1 under 30 s, reach level 4.
- Struggled with: Playwright will not click a pulsing button by default (test uses force); a board-tap nudge kept the bubble visible during dragging until the nudge was cleared on drag start.

## 2026-10-21: Sound, background fix, title-tap test mode
- Done: Fixed the repeating background on long pages, then a white background inside the Claude app (gradient now on body). Added a title-tap (5x) test switch because `#unlock` may not reach the page in Claude's viewer; Product Owner confirmed it works. Added synthesized music and effects (src/audio.ts) with a sound on/off button. 220 tests pass; in headless Chromium the audio starts only after the first tap, notes play for ticks/steps/win, and the mute choice survives a reload.
- Next step: Product Owner listens on iPhone (with and without the silent switch) and says if music/effects feel right. Then: friend playtest round.
- Struggled with: A fixed pseudo-element background did not show in Claude's iOS viewer; keep backgrounds on body.

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

## Older entries (summary)
- 2026-10-18/19: Project setup (CLAUDE.md, docs, permissions, Git/GitHub); chose Shadowbridge core prototype over simpler apps.
- Approved stack: TypeScript + Vite + Canvas 2D + Vitest; Product Owner tests via a private claude.ai test page.
- First playable level 1 (one-angle rule), then 3 levels; playtest said too easy, which led to the live-walk rule (Pip walks while the sun turns), then a second playtest made the sun snap to fixed directions (8, later 16); levels grew to 10 with a level select and saved progress, then 40 levels with light stones.
