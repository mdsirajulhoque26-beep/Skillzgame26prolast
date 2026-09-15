# Pro Match fixes

## Fixed

1. `emptyBoard is not defined`
   - `server/index.mjs` now defines the 10x10 server-side empty board helper used by multiplayer live-state initialization.

2. Two-player matchmaking could fail to pair a fresh waiting player
   - When the target player had no `duelId` yet, the old join logic built the new group from only the newly-created session and omitted the target.
   - The join logic now always includes the matched target and assigns the shared duel/group to both players.

3. Existing asynchronous score handling
   - A player who already finished their 3-minute attempt and is waiting as `PENDING`/`SUBMITTED` is not reset into a new game when an opponent joins.
   - The newly joined player can play their 3-minute attempt against the stored score.

4. Opponent references
   - When a group becomes full, each participant receives an opponent reference so the client can display the matched opponent consistently.
