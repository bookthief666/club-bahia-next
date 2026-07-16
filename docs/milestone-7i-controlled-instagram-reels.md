# Milestone 7I — Controlled Instagram Reel Proof

## Product boundary

Instagram Reel automation cannot be enabled safely until the real Club Bahia Meta account has completed a controlled video publication. This milestone builds that proof without making the shared scheduler capable of unattended Reel posting.

The manager workflow is deliberately split into three durable steps:

1. Create the Meta Reel upload container.
2. Poll the container until Meta reports that processing is finished.
3. Confirm the final live publication in a separate action.

Creating the container does not publish the Reel. Refreshing status does not publish the Reel. Only the final action with the explicit `PUBLISH_READY_REEL` confirmation can call `media_publish`.

## Provider routes

- `GET /api/admin/autopilot/meta/instagram/reel/readiness`
- `POST /api/admin/autopilot/meta/instagram/reel/initialize`
- `POST /api/admin/autopilot/meta/instagram/reel/status`
- `POST /api/admin/autopilot/meta/instagram/reel/commit`

All routes require an authenticated Growth OS administrator. Live actions are limited to Owner, Manager, and Marketing roles.

## Secure media boundary

The proof accepts only a public HTTPS video from:

- the configured Club Bahia site hostname;
- an explicitly listed `META_ALLOWED_MEDIA_HOSTS` hostname; or
- public Vercel Blob storage.

Private, loopback, link-local, and redirected unapproved hosts are rejected. The selected URL must return a video content type. The controlled proof currently accepts files up to the Growth OS media limit of 250 MB.

## Durable receipt

The proof stores an encrypted internal receipt in the existing `autopilot-publication` workspace under a Reel-specific hashed key. The browser never receives provider authorization.

The receipt records:

- stable idempotency identity;
- event and content item;
- caption hash;
- approved video URL;
- feed-sharing selection;
- attempt count;
- Meta container ID;
- container processing status;
- final media ID;
- permalink and provider timestamp;
- warnings, errors, and safe-retry state.

Active, completed, uncertain, and unsafe prior attempts prevent an accidental duplicate proof.

## Failure classification

- Container creation failures are retryable because they do not create a live post.
- Container processing errors and expiration remain visible in the saved receipt.
- A lost or uncertain response during the final `media_publish` step stops in manual review.
- A successful live publication whose final receipt cannot be stored is returned as `needs-review` with the provider media ID and permalink when available.

## Interface

Step 5 now includes a Controlled Reel Proof panel with:

- the exact approved vertical video;
- the exact Instagram-specific caption and hashtags;
- account, proof-switch, and encrypted-storage checks;
- separate Create, Refresh, and Publish buttons;
- plain-language provider status;
- live permalink after completion.

The final publish button always requires a second browser confirmation that explicitly states the Reel will go live on Club Bahia's real Instagram account.

## Deployment switch

`META_REELS_PROOF_ENABLED=false` by default.

It may be set to `true` only when:

- the Club Bahia professional Instagram account is connected;
- `META_PUBLISH_ENABLED=true` has been approved for the controlled session;
- the Graph API version is pinned;
- the approved video is publicly reachable; and
- the person running the proof understands that Step 3 creates a real public Reel.

## Scheduler boundary

The shared queue still treats `instagram-reel` as `provider-proof-required`. Approving a scheduled Reel moves it to a paused/problem state rather than allowing the scheduler worker to execute it.

Automatic Reel execution requires a later checkpoint that:

1. completes and reviews this real proof;
2. records an explicit production-enablement flag;
3. adds asynchronous container processing to the scheduler; and
4. verifies duplicate protection across worker retries and provider delays.

## Review checklist

1. Confirm the panel remains gated while `META_REELS_PROOF_ENABLED` is false.
2. Confirm an approved vertical video and approved Reel copy are required.
3. Confirm Create Container does not produce a live Instagram post.
4. Confirm the encrypted receipt stores the Meta container ID.
5. Confirm status polling reaches `FINISHED` before the final button appears.
6. Confirm the final button requires an explicit live-publication confirmation.
7. Confirm the final receipt stores the media ID and permalink.
8. Confirm repeating the same operation restores or reuses the receipt rather than intentionally publishing a duplicate.
9. Confirm scheduled Reel jobs remain paused after this milestone.
