# Pro Match V49 Startup Speed Optimization

Preserves V47 auto-restart protection and V48 visual fixes.
- Removes the full historical Pro Match expiration scan from the critical startup path.
- Uses partial MongoDB persistence for only users, blockPuzzleMatches, and transactions on Pro Match start.
- Does not change 1v1 rules, score, timer, Pause/Resume, matchmaking rules, prizes, or game UI.
