# V25 – Match Submit Speed Fix

Targeted performance fix, preserving V24 functionality:
- Score submission now persists only the changed Mongo state arrays instead of rewriting the entire app-state document.
- Block Puzzle submit updates blockPuzzleMatches/users/transactions plus tournament/referral state when needed.
- Generic result submissions persist only resultSubmissions.
- The client no longer waits for a second transactions API request before showing the submitted result; transaction refresh continues in the background.
- No game rules, matchmaking, History UI, Settings, or Multiplayer configuration logic was intentionally changed.
