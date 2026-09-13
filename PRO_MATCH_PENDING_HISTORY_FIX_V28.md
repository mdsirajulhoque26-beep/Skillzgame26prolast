# Pro Match Pending History Fix V28

- Match History now refreshes from the server before opening, so newly-created or submitted PENDING matches are visible immediately.
- A failed history request no longer silently replaces the existing local history with an empty array.
- Existing server-backed history behavior remains intact; PENDING matches are sorted to the top.

## V29 — Locked gameplay viewport
- Gameplay screen only is now fixed to the visible app area between the existing Header and BottomNav.
- Prevents page/document vertical scrolling while playing without changing scrolling behavior on lobby, history, wallet, profile, or other screens.
- Board/tray/controls are arranged in a constrained flex layout so HUD, timer, score, help, board, block tray, and bottom controls remain visible without overlapping.
- Added responsive board sizing for shorter Android screens.
- No match, scoring, matchmaking, history, or backend logic was changed.
