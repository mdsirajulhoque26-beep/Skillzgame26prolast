# Pro Match Async Matchmaking + Winner Sound

Implemented in this build:

- Entry fee is deducted immediately when a Pro Match is created.
- Every paid Pro Match player can start and finish their own 3-minute attempt immediately, even when no opponent is online.
- After score submission, an unmatched match remains PENDING and can be matched later.
- Multiple separate matches from the same player are allowed; they are independent sessions.
- A later player at the same fee/prize/player-count tier can join an existing open match.
- If the opponent arrives while the first player is still playing, the first player's game is never restarted.
- A newly matched player sees the opponent before their play box opens and receives the countdown.
- A previously submitted player keeps their submitted score when a later opponent joins.
- 3/5/7/10-player Pro Match groups also allow each paid player to play immediately; the group settles only after the required number of players have submitted.
- Pending sessions continue to expire/refund using the existing server timeout.
- Winner result already shows a Bengali congratulations message; this build also plays the existing Web Audio victory fanfare and haptic feedback exactly once when the match is settled as WON.
- Existing balance-protection and withdrawal-security code is preserved.
