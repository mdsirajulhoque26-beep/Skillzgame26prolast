# Pro Match V41 Fix

Targeted fixes only; all V40 features are preserved.

1. Solo Pro Match no-opponent window: 24 hours instead of 3 hours.
2. Auto-refund cleanup now correctly includes solo `SUBMITTED` sessions with no `duelId`, while never refunding a real grouped duel.
3. Pro Match starts with the same 3-second countdown as Practice Match and does not wait for an opponent.
4. Added guards against a slow active-match boot/poll response re-running `initMatch()` and making a fresh Pro Match appear to restart.
