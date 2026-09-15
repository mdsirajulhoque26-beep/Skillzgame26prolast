# V29 — Safe Submit Recovery + Home Cache

Based on V28.

## Targeted fixes
- Restored the proven `auth` middleware for score submission. This avoids the V28 regression where the submit request could fail with an undefined-property error.
- Restored the 60-second lock lease so an in-progress match settlement cannot lose its lock during database work.
- Kept V25's partial persistence for score submission and the background transaction refresh.
- Kept V28's Home cache/silent refresh behavior so returning to Home does not show a full loading screen.

No intentional changes to History, Settings, Multiplayer, matchmaking rules, game cards, or game UI.
