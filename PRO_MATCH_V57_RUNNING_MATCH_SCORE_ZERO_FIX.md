# Pro Match V57 — Running Match Restore + Zero Score Protection

Targeted fixes for the two live-test problems:

1. A running Pro Match could rebuild/restart from a fresh board after a component/page remount, which also reset the local score to 0.
2. A submitted score could race with another legacy MongoDB `app_state` write and be written back as 0.

## Fixes
- Added a short-lived `sessionStorage` snapshot for active paid gameplay: board, pieces, seed, trio index, score, lines, combo/streak and timing state.
- On a Pro Match remount, the client restores the same live board when the server still reports the match as active instead of calling `initMatch()` and resetting the score.
- The snapshot is migrated from the provisional pre-server-start key to the real match ID as soon as the secure server start completes.
- Snapshots are cleared on successful submit, refund/exit, expired matches, and failed server start.
- Pro Match score writes are serialized through the existing Mongo lock so a concurrent stale full-state write cannot overwrite a just-submitted score with 0.

## Preserved
- Entry fees and prize amounts
- 3-minute timer and scoring rules
- Board/block mechanics and deterministic match seed
- Matchmaking behaviour
- Pause/Resume behaviour
- Existing Pending/History flow
- Other games and unrelated code

## Validation
- `node --check server/index.mjs` passed.
- `node --check server/store.mjs` passed.
- `git diff --check` was not available on the extracted ZIP because it is not a Git working tree.
- Full Vite build could not be run because the extracted ZIP does not contain `node_modules` (`vite: not found`).
