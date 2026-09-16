# V50 — Play Box Final Viewport Fit Fix

Visual/layout-only correction based on V49.

- Reduces the square board height on shorter phone viewports so it does not crowd the Play Box or bottom controls.
- Removes the V44 tray scale transform that could enlarge the Play Box visually.
- Constrains the tray and its three slots to a predictable compact height.
- Keeps the existing 34px block tiles.
- Does not change game logic, drag/drop handlers, scoring, timer, Pause/Resume, Pro Match, Auto-Restart, Live Chat, or backend code.
