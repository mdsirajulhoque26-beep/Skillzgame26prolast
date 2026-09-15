# Pro Match V36 — Matchmaking Account Eligibility + Instant Result

Targeted fixes only. Existing V35/V34 behavior is preserved.

- Banned/deleted/missing users are never selected as new Pro Match matchmaking targets.
- An open group containing a banned/deleted/missing account is skipped for new matchmaking.
- Completed historical matches remain untouched and continue to appear in history.
- Live match status now derives the opponent score directly from the opponent session, so once the duel settles both players can see the correct WIN/LOST result and opponent score without waiting for a history refresh.
- Existing 1.5s status polling remains the result propagation mechanism; no unrelated game logic was changed.
