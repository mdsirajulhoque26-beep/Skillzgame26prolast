# Pro Match V45 — Practice-Style Pause/Resume

- Pro Match Pause now changes the UI state immediately, like Practice Mode.
- Pro Match Resume now changes the UI state immediately, like Practice Mode.
- Server Pause/Resume remains synchronized in the background so the unused 3-minute time is preserved.
- Pause/Resume endpoints use the signed session token directly instead of the full auth middleware, preventing a stale user snapshot from producing the `Account unavailable` alert for an otherwise valid active match.
- All V44 Play Box/block sizing and previous fixes are preserved.
