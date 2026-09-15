# Universal Match History – V24

Fixes the History screen remaining on the loading spinner.
- History initial load runs once when the screen mounts instead of restarting on every AppContext refresh.
- A 12-second UI timeout prevents a stalled API request from leaving an endless spinner.
- Network/API failure now shows a retry button.
- Manual refresh still reloads the history.
- Keeps the V23 settings and flexible multiplayer changes.
