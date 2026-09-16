# Pro Match V55 — Pending Score Sync Fix

Targeted follow-up to V54 based on live testing.

## Fixed
- A submitted score shown correctly on the result screen could later appear as `0 pts` in Pending/History because a concurrent legacy full-state write could overwrite the fast score update.
- After multiplayer/tournament settlement, the player's final score fields are atomically reinforced so the submitted score remains authoritative.
- Pending/History is refreshed immediately after a successful submit instead of waiting for the periodic 5-second refresh.
- The in-game opponent connection label now says `SYNCING` when the low-latency WebSocket is unavailable, rather than implying that gameplay is blocked. HTTP matchmaking/status polling remains the source of truth.

## Not changed
- Entry fees
- Prize amounts/distribution
- Score calculation
- 3-minute timer
- Board/block gameplay rules
- Matchmaking rules
- Other games
