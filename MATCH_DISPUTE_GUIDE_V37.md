# V37 — Match Dispute + App Rules Update

Targeted changes only; V36 matchmaking, score submission, history, streak, account eligibility, and admin match delete behavior are preserved.

## Player complaint flow
- Match History now has **Report Match Problem** for Pro Match records.
- Player selects a problem type and submits details.
- Server verifies that the match belongs to the logged-in player.
- Duplicate open complaints for the same player/match are blocked.
- Complaints are stored in `matchDisputes` with match/user/status/score/entry metadata.

## Admin complaint flow
- Admin Panel has a new **ম্যাচ অভিযোগ** tab.
- Admin can inspect player, opponent, Match ID, problem type, live match status/score, details and timestamp.
- Admin can mark a complaint **RESOLVED** or **REJECTED** with an optional note.
- Resolving/rejecting a complaint does not automatically change score, result, balance, or refund. Any financial/result correction remains a deliberate admin action.

## App Rules & Guidelines
- Added technical dispute/network/server-error reporting guidance.
- Added technical dispute review rules.
- Added fair-use, account, referral and fraud/abuse guidance.
- Existing Match History screen remains in place.

## Files changed
- `server/index.mjs`
- `src/services/backendApi.ts`
- `src/components/HistoryScreen.tsx`
- `src/components/AdminPanel.tsx`
- `src/components/modals/RulesModal.tsx`
- `MATCH_DISPUTE_GUIDE_V37.md`

No unrelated game engine, matchmaking, score, wallet, tournament or history logic was intentionally changed.
