# Pro Match V56 — Live Score Privacy + Locked Play Box + No Restart

Targeted fixes only:
- Removed the LIVE OPPONENT panel from the gameplay area.
- Player-facing match payloads no longer expose an opponent's in-progress score/board data; opponent score is exposed only after the duel is COMPLETED.
- WebSocket live transport no longer broadcasts opponent score/board state.
- Locked the 10x10 play-box geometry so layout changes do not resize/reposition it during play.
- Added a same-match initialization guard to prevent a delayed restore/poll response from rebuilding the board mid-match.
- Pending result view does not populate the opponent's current/live score.

Unrelated game rules, scoring, entry fee, prize, timer duration, and board mechanics were not intentionally changed.
