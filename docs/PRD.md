# PRD: Shadowbridge Prototype (one page)

## Goal
Test whether the core mechanic is fun: the player drags the sun, block shadows move, and Pip walks to the exit only through shadow.

## User stories
- As a player, I drag the sun around the board and see shadows update instantly.
- As a player, I press "Go" and keep turning the sun while Pip walks, guiding Pip through shadow to the exit.
- As a player, I pick a level and see which levels I have finished and my best move count.

## Screens (max 3)
1. Level select: 48 level buttons, each shows done/new/locked and best moves. A level unlocks when the one before it is done.
2. Game: top-down grid board, blocks, sun handle at the edge, Pip, exit, move counter, "Go" and "Restart" buttons.
3. Result overlay: "Pip made it!" or "Pip melted", with Retry / Next / Levels buttons.

## Game rules
- Board is a grid. Each cell is floor or a stone block.
- Sun has a direction (dragged around the board) and a fixed elevation. The sun snaps to fixed directions: 8 in early levels, more (16) in later levels. A block blocks the light: every floor cell behind it, up to the board edge, is in shadow.
- Start and exit are safe tiles: Pip never melts on them.
- A move = one sun drag (finger down to finger up). The sun can be dragged before Go and while Pip walks.
- After Go, Pip walks step by step through shadow toward the shadowed cell closest to the exit. With no shadow to move into, Pip waits.
- If the cell Pip stands on becomes lit, Pip melts and the level must be restarted. In levels 1-10 Pip first glows orange for 0.8 s, so the player can shade it again.
- If the cell Pip is stepping into becomes lit before Pip is halfway, Pip walks back.
- Pip cannot walk through blocks.
- Light stones (from level 43): always lit; they also light the four cells beside them, so those cells can never be shaded.
- Levels 1-3 are tutorials solved with one sun direction; every later level needs at least one sun turn after Go.
- Levels 1-4 and 11 show short hints that teach the rules.

## Data (on device only)
Per level: completed (yes/no) and best move count. Stored in the browser on the phone. No accounts, no server.

## Acceptance criteria
- Playable on iPhone Safari with one finger; shadows follow the drag without visible lag.
- All 48 levels are solvable. Levels 1-15 are easy (0-3 sun turns) with easy breather levels mixed in later; then 16 directions on 7x7, 16 on 9x9, and light stones from level 43.
- Progress survives closing and reopening the page.
- Game logic (shadows, path finding, win/lose) is covered by automated tests.

## Out of scope
- 3D, sound, settings, pause menu, stars, block rotation, moving blocks, tile types other than light stones, more than 48 levels, Stitch UI, Unity.
