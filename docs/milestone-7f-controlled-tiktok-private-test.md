# Milestone 7F — Controlled TikTok private test

This checkpoint adds the first end-to-end TikTok publication proof without enabling public or scheduled TikTok posting.

## Safety boundary

The proof route always uses:

- `privacy_level: SELF_ONLY`
- comments disabled
- duets disabled
- stitches disabled
- one approved vertical video
- one human-confirmed submission
- one encrypted idempotent receipt

The interface does not allow a manager to select public visibility during this milestone, even when the TikTok client is already audited.

## Required server configuration

The controlled proof expects these server-only settings:

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_OAUTH_REDIRECT_URI`
- `TIKTOK_OPEN_ID`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_REFRESH_TOKEN`
- `TIKTOK_CONTENT_POSTING_ENABLED=true`
- `TIKTOK_VERIFIED_MEDIA_HOST`
- `TIKTOK_APP_AUDITED=true` only when public posting is later enabled

Encrypted Growth OS workspace storage must also remain configured. No token value is returned to the browser.

## Provider flow

1. The manager approves the shared vertical-video campaign item.
2. An approved `reel-video` asset is assigned for Instagram Reel or TikTok.
3. The manager opens Step 5 and verifies the authorized TikTok creator.
4. The server queries TikTok creator information again immediately before posting.
5. The route requires TikTok to offer `SELF_ONLY` for the connected creator.
6. The server verifies that the video uses HTTPS on the exact TikTok-verified media hostname.
7. An encrypted publication claim is written before TikTok is called.
8. The route initializes a `PULL_FROM_URL` Direct Post request.
9. The returned `publish_id` is persisted with `processing` status.
10. The manager polls TikTok status until `PUBLISH_COMPLETE` or `FAILED` is returned.

## Duplicate protection

The private test identity includes:

- event ID
- TikTok provider
- TikTok video content item
- stable caption version
- stable video URL version
- publish-now mode

A processing, completed, or uncertain receipt blocks duplicate submissions. Only provider failures classified as safe to retry may create a new attempt for the same identity.

## Status handling

- `PROCESSING_DOWNLOAD` and `PROCESSING_UPLOAD` remain in `processing`.
- `PUBLISH_COMPLETE` becomes `published` and retains the private-test warning.
- `FAILED` records TikTok's `fail_reason`.
- only TikTok's `internal` processing failure is automatically classified as safe to retry.
- provider status errors do not erase the existing processing receipt.

## Current routes

- `GET /api/admin/autopilot/tiktok/creator`
- `POST /api/admin/autopilot/tiktok/video/publish`
- `POST /api/admin/autopilot/tiktok/video/status`

All routes require an authenticated Growth OS role allowed to publish or inspect social connections.

## Scope boundary

This checkpoint does not yet add:

- self-service TikTok OAuth
- token refresh rotation
- public TikTok posting
- automatic polling workers or webhooks
- scheduled TikTok jobs
- TikTok photo posts
- analytics synchronization
- automatic video transcoding

The next checkpoint should replace environment-only account setup with self-service OAuth, persist renewable credentials server-side, and create the combined Instagram/TikTok scheduling queue after both controlled proofs have been completed against the real venue accounts.
