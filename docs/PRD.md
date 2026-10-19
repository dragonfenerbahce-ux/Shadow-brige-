# PRD: Shadowbridge Prototype (one page)

## Goal
Test whether the core mechanic is fun: the player drags the sun, block shadows move, and Pip walks to the exit only through shadow.

## User stories
- As a player, I drag the sun around the board and see shadows update instantly.
- As a player, I press "Go" and keep turning the sun while Pip walks, guiding Pip through shadow to the exit.
- As a player, I pick a level and see which levels I have finished and my best move count.

## Screens (max 3)
1. Level select: 40 level buttons, each shows done/new/locked and best moves. A level unlocks when the one before it is done.
2. Game: top-down grid board, blocks, sun handle at the edge, Pip, exit, move counter, "Go" and "Restart" buttons.
3. Result overlay: "Pip made it!" or "Pip melted", with Retry / Next / Levels buttons.

## Game rules
- Board is a grid. Each cell is floor or a block with a height (1-3).
- Sun has a direction (dragged around the board) and a fixed elevation. The sun snaps to fixed directions: 8 in early levels, more (16) in later levels. A block casts shadow on the floor cells behind it, as many cells as its height.
- Start and exit are safe tiles: Pip never melts on them.
- A move = one sun drag (finger down to finger up). The sun can be dragged before Go and while Pip walks.
- After Go, Pip walks step by step through shadow toward the shadowed cell closest to the exit. With no shadow to move into, Pip waits.
- If the cell Pip stands on becomes lit, Pip melts and the level must be restarted.
- Pip cannot walk through blocks.
- Light stones (from level 35): always lit; they also light the four cells beside them, so those cells can never be shaded.
- Every level needs at least two different sun angles (it cannot be solved with one).

## Data (on device only)
Per level: completed (yes/no) and best move count. Stored in the browser on the phone. No accounts, no server.

## Acceptance criteria
- Playable on iPhone Safari with one finger; shadows follow the drag without visible lag.
- All 40 levels are solvable, none with a single sun direction. Difficulty grows slowly: 1-12 use 8 directions on 7x7, 13-20 use 16 on 7x7, 21-34 use 16 on 9x9, 35-40 add light stones. Early levels are quick (1-2 sun turns).
- Progress survives closing and reopening the page.
- Game logic (shadows, path finding, win/lose) is covered by automated tests.

## Out of scope
- 3D, sound, settings, pause menu, stars, block rotation, moving blocks, tile types other than light stones, more than 40 levels, Stitch UI, Unity.
