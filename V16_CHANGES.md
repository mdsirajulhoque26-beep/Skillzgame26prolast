# SkillzGame V16 — 11 fixes

1. Tournament submit now opens the Tournament Rank List directly.
2. Tournament no longer shows the generic incomplete/pending Duel recovery screen after submit.
3. Submitted Block Puzzle/Tournament sessions remain visible in the user's Match History/Pending & History view, with Tournament labels.
4. Tournament Join starts the Tournament game directly; no opponent-finding/VS matchmaking screen.
5. 3-Day Leaderboard prize distribution is dynamically add/remove-able instead of fixed to 3 ranks.
6. Tournament prize distribution is dynamically add/remove-able up to the configured Max Players.
7. Admin can delete Approved/Rejected Deposit requests; deletion does not alter balances or user transaction history.
8. Admin can delete Approved/Rejected Withdrawal requests; deletion does not alter balances or user transaction history.
9. User transaction API is limited to the most recent 30 days; transaction records are separate from admin request records.
10. Block Puzzle OUT OF MOVES detection now checks the newly generated trio even when the previous trio was fully consumed.
11. Admin Settings now support bKash Agent and Binance / USDT payment details with enable/disable controls; user deposit/withdraw method lists honor those settings.

Tournament sessions are excluded from the normal 3-hour duel pending-refund cleanup, and Tournament Rank List data is available from a dedicated endpoint.
