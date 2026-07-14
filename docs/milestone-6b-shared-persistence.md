# Milestone 6B — Shared Growth OS persistence foundation

This checkpoint replaces browser-only operational state with authenticated, encrypted, cross-device storage.

## Shared records

The following records now use the shared workspace API:

- event catalog and event edits
- campaign briefs, generated copy, approval state, and revision history
- post-to-media assignments
- manual publishing execution status, notes, schedules, and final URLs

Existing browser-local records are migrated automatically the first time each workspace is opened after deployment. A local record is removed only after the server confirms the migration.

## Storage and security

- Every read and write requires a valid Growth OS admin session.
- Workspace payloads are encrypted with AES-256-GCM before entering Vercel Blob.
- Blob objects contain encrypted envelopes, not readable event or campaign data.
- A dedicated `GROWTH_OS_DATA_SECRET` is recommended.
- Until that variable is added, the server falls back to `RESERVATION_DATA_SECRET`, then `ADMIN_AUTH_SECRET`.
- All three secrets must be at least 32 characters when used for this storage layer.
- Records are append-only revisions instead of destructive overwrites.
- Every revision records the authenticated user, role, update time, and revision number.
- Stale clients receive an HTTP 409 conflict instead of silently replacing a newer revision.

## Required configuration

- `BLOB_READ_WRITE_TOKEN`
- one of:
  - `GROWTH_OS_DATA_SECRET` (recommended)
  - `RESERVATION_DATA_SECRET`
  - `ADMIN_AUTH_SECRET`

## Current scope boundary

This checkpoint persists the existing operational models. It does not yet add a visible activity-history screen, offline editing, external social publishing, or automatic conflict merging.
