# V35 — Pro Match status and opponent-score consistency

Targeted fixes:

1. Matchmaking only joins OPEN PENDING/PLAYING/SUBMITTED groups. COMPLETED/refunded duel members can never become a target for a new Pro Match.
2. Player History no longer treats SUBMITTED as completed. A submitted score remains in Pending & Match History until the duel is actually settled to COMPLETED.
3. `/api/history` returns the matched opponent session's real score, so a completed loser can see the score that beat them instead of `0`. It also falls back to the duelId when opponentUserId is missing.

V34's matchmaking and streak fixes are preserved; unrelated features are untouched.
