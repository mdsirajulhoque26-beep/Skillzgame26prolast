# V40 — Live Support Reply Persistence Fix

Fixed a polling race where an older 4-second support-chat response could overwrite a newer admin reply in the UI. Both admin and player chat views now ignore stale responses using updatedAt, so sent replies remain visible.
