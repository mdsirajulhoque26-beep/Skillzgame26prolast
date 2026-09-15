# V17 Changes — Larger, Smoother, Exact Block Drop

- Increased tray block tile size from 18px to 21px.
- Increased the floating drag-piece tile size from 24px to 28px (w-7/h-7).
- Reworked drag tracking to use requestAnimationFrame, reducing unnecessary renders during touch/pointer movement.
- The finger/pointer is now the exact placement anchor: the piece preview is calculated from the board cell directly under the pointer.
- Removed the previous automatic nearby-cell fallback/smart snapping that could move a block to a different location.
- Invalid drops are rejected rather than silently relocated.
- Existing game scoring, line clearing, match flow, tournament flow, and backend logic were not intentionally changed.
