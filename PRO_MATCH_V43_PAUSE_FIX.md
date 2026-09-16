V43 Fix: Pro Match Pause no longer shows Account unavailable.

Cause: the pause endpoint used req.authUserId, but the auth middleware provides the authenticated user as req.user. The endpoint now uses req.user first, preserving all V42 features.
