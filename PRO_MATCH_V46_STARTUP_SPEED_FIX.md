# Pro Match V46 Startup Speed Fix

- Keeps all V45 behavior and fixes only the Pro Match startup wait.
- The separate transaction-history request no longer blocks `startBlockPuzzleMatch`.
- Transaction history refreshes in the background after the match is created.
- This prevents a slow/cold MongoDB read from delaying the 3-second Pro Match countdown.
- Pause/Resume, 24-hour pending/refund, V44 Play Box sizing, Live Chat, and previous fixes are preserved.
