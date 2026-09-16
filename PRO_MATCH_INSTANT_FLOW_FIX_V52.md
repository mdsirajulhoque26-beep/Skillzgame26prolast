# Pro Match Instant Flow Fix V52

## What changed
- Pro Match start no longer uses the full `auth` database read followed by another full `loadDb()` inside the lock. The signed token is verified locally and the live user is loaded once inside the existing lock.
- The existing entry-fee, balance, admin configuration, player-count, prize, matchmaking, seed, timer, and transaction logic remain unchanged.
- In-game match-status polling no longer performs the duplicate `auth` database read. Each heartbeat authenticates the signed token locally and performs one read while the player continues playing.
- Solo score submission no longer performs a second full `app_state` read after the atomic score update. The already-read match/user snapshot is returned directly.
- History/transaction refresh remains background work and is not on the gameplay critical path.

## Intended flow
1. User taps Pro Match.
2. Server validates the paid match and creates it with one MongoDB state read inside the existing safety lock.
3. Client starts the normal game/countdown immediately after the authoritative match response.
4. Match status checks run in the background while the player plays.
5. At time-up, score is written through the fast atomic submission path; solo submissions return without another full database read.

## Safety
Paid entry validation is still server-authoritative. The client is not allowed to bypass balance/configuration checks merely to make the UI appear faster.

## Verification
- `node --check server/index.mjs` passed.
- `node --check server/store.mjs` passed.
- Frontend build could not be run because dependencies are not installed in the provided working copy (`vite: not found`).
