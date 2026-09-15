# V19 Security Hardening

- Added security response headers (HSTS on HTTPS, frame/content/referrer protections, permissions policy).
- Added API abuse/rate limiting and stricter JSON request size.
- Added optional `ALLOWED_ORIGINS` CORS allow-list while preserving same-origin/no-Origin requests.
- Authentication tokens now carry issued-at and unique token ID claims and remain HMAC signed/expiry checked.
- Registration and admin password reset require at least 8 characters for new/reset passwords. Existing passwords are not silently changed.
- Strengthened admin balance adjustment validation with finite/maximum amount checks.
- Arcade match finish is now locked server-side, checks that the caller belongs to the match, rejects arbitrary opponent-win claims, prevents double completion/payout, and removes the match from the queue.
- WebSocket messages have a 128 KB maximum and per-connection rate limiting.
- No client-provided balance or admin privilege is trusted.

## Important limitation
A browser-only website cannot reliably prove that an Android phone is rooted, bootloader-unlocked, or tampered with. Real rooted-device blocking requires a native Android wrapper/app using a platform integrity service (such as Google Play Integrity) and server-side verification. This V19 therefore does not falsely claim that rooted devices are already blocked.

## Remaining high-priority security work
Pool/Carrom physics are still client-side in V18. The next security phase should move shot validation/result determination to the server before treating those games as fully anti-cheat for real-money play.
