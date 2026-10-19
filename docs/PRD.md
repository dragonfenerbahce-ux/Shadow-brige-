# PRD: Shadowbridge Prototype (one page)

## Goal
Test whether the core mechanic is fun: the player drags the sun, block shadows move, and Pip walks to the exit only through shadow.

## User stories
- As a player, I drag the sun around the board and see shadows update instantly.
- As a player, I press "Go" and watch Pip walk; Pip reaches the exit through shadow or melts in the light.
- As a player, I pick a level and see which levels I have finished and my best move count.

## Screens (max 3)
1. Level select: 3 level buttons, each shows done/not done and best moves.
2. Game: top-down grid board, blocks, sun handle at the edge, Pip, exit, move counter, "Go" and "Restart" buttons.
3. Result overlay: "Pip made it!" or "Pip melted", with Retry / Next / Levels buttons.

## Game rules
- Board is a grid. Each cell is floor or a block with a height (1-3).
- Sun has a direction (dragged around the board) and a fixed elevation. A block casts shadow on the floor cells behind it, as many cells as its height.
- A move = one sun drag (finger down to finger up).
- On "Go": if a path of shadowed floor cells joins start and exit, Pip walks it and wins. Otherwise Pip walks the shortest floor path and melts on the first lit cell.
- Pip cannot walk through blocks.

## Data (on device only)
Per level: completed (yes/no) and best move count. Stored in the browser on the phone. No accounts, no server.

## Acceptance criteria
- Playable on iPhone Safari with one finger; shadows follow the drag without visible lag.
- All 3 levels are solvable and each needs at least one sun change.
- Progress survives closing and reopening the page.
- Game logic (shadows, path finding, win/lose) is covered by automated tests.

## Out of scope
- 3D, sound, settings, pause menu, stars, block rotation, moving blocks, more than 3 levels, Stitch UI, Unity.
