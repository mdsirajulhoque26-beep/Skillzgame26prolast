# Pro Match V47 — Auto-Restart Race Fix

- Prevents the initial active-match restore request from overwriting a newly started Pro Match while the start request is still in flight.
- Ensures an older countdown interval cannot fire later and re-initialize the board.
- Preserves V46 fast Pro Match startup and V45 Practice-style Pause/Resume.
