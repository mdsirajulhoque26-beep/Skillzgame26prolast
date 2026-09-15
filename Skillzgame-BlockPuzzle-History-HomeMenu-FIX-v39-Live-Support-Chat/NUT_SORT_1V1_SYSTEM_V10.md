# Nut Sort 1v1 System v10

Nut Sort now follows the Block Puzzle Pro Match flow:
1. Entry-fee lobby with wallet/pending/history.
2. PLAY NOW deducts the configured Nut Sort entry fee and immediately starts the player attempt.
3. 180-second skill attempt with deterministic server seed.
4. Manual Submit or automatic submit at time-up/solved state.
5. Opponent may join asynchronously; higher submitted score wins.
6. Pending/submitted/completed matches use the same server-backed history feed.
7. Admin game Active/Home visibility and configured entry/prize remain authoritative.

The old client-side +50 score button was removed because it could create an artificial score.
