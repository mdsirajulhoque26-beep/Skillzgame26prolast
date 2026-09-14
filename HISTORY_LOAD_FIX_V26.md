V26 History Load Fix

Based on V25. No game rules, matchmaking, settings, multiplayer, or submit-speed logic changed.

Fix:
- History now requests /pending-games and /block-puzzle/matches/mine in parallel instead of sequentially.
- If either read-only history endpoint is temporarily unavailable, the other can still populate History.
- History timeout increased from 12s to 18s to tolerate a cold/slow database connection without looping forever.
- If both endpoints fail, the existing retry UI is shown.
