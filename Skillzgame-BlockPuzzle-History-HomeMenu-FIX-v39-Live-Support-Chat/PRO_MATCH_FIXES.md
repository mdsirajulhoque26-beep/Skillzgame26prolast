# Pro Match Fixes

This build changes only the Pro Match flow and the Block Puzzle live transport handling.

## Fixed
- Entry fee is deducted once, then the player remains in server-side matchmaking until a real opponent is paired.
- A Pro Match no longer starts a solo 3-minute game immediately after charging the entry fee.
- Both paired players receive the same server start time (3-second countdown) and the same server-authoritative game seed.
- Prize amounts are server-authoritative for the six supported Pro Match tiers: 20/35, 30/50, 60/100, 120/200, 250/420, 500/850.
- Client-supplied prize values are ignored by the server.
- For a paired Pro Match, submitted score/lines/best-combo come from the server live state rather than an arbitrary client score.
- The live WebSocket client now stores the opponent's authoritative board state when STATE/MOVE_ACCEPTED messages arrive.

## Safety / scope
- Practice and Tournament flows were not intentionally changed.
- Arcade Pool/Carrom code was not changed.
- Wallet/deposit/withdraw code was not changed.
- Existing matchmaking/refund endpoints remain in place; unmatched Pro Matches stay refundable during the existing pending window.

## Validation
- `node --check server/index.mjs` passed.
- `node --check server/liveServer.mjs` passed.
- Full TypeScript/Vite build could not be completed in this environment because package installation was unavailable; the source archive itself contains the original dependency declarations.

## V24 - Asynchronous Pro Match flow
- Pro Match now starts the player's own 3-minute game immediately after entry fee is charged.
- The player can finish and submit the score even when no opponent is currently online.
- The match remains eligible for an opponent for exactly 3 hours from entry.
- If no opponent joins within that 3-hour window, the entry fee is automatically refunded.
- If an opponent joins later, the opponent receives the same server-generated game seed and gets their own 3-minute attempt.
- A previously submitted player's score/status is never restarted or overwritten when the opponent joins.
- When both scores are submitted, the server settles the duel automatically.
- Other game modes were not intentionally changed.
