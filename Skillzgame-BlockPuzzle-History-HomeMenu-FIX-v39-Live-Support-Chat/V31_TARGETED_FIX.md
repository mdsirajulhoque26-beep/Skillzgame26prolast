V31 TARGETED FIX

Only two requested issues are targeted:
1. Faster Block Puzzle score submission using an atomic MongoDB update for the player's own score before any settlement work.
2. Admin Block Puzzle completed/refunded match deletion uses the dedicated admin Block Puzzle delete endpoint and refreshes the list.

Home loading behavior from V28/V29/V30 is preserved.
History V27 fast API behavior is preserved.
Settings, Multiplayer, matchmaking, game cards, and other game logic are intentionally unchanged.

For multiplayer/tournament matches, the existing locked settlement path is retained for payout/data integrity and runs only when settlement is actually required.
