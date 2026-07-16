# Milestone 7D — Controlled Instagram image publishing

This checkpoint introduces the first real social publishing adapter while preserving a strict safety boundary.

## What it publishes

The Step 5 promotion screen can publish one approved `instagram-feed` campaign item using its assigned approved image and final caption.

The action is visible in the interface but remains disabled until all required server-side configuration checks pass.

## Required server configuration

The controlled proof uses these server-only settings:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_OAUTH_REDIRECT_URI`
- `META_GRAPH_API_VERSION`
- `META_FACEBOOK_PAGE_ID`
- `META_INSTAGRAM_ACCOUNT_ID`
- `META_PAGE_ACCESS_TOKEN`
- `META_PUBLISH_ENABLED=true`

Optional:

- `META_ALLOWED_MEDIA_HOSTS` — comma-separated exact HTTPS media hostnames in addition to the production site. Public Vercel Blob hosts are permitted automatically.

Existing encrypted workspace storage must also be configured:

- `BLOB_READ_WRITE_TOKEN`
- `GROWTH_OS_DATA_SECRET`, `RESERVATION_DATA_SECRET`, or `ADMIN_AUTH_SECRET` with at least 32 characters

No token value is returned to the browser or stored in campaign records.

## Publication flow

1. The manager approves the Instagram campaign copy.
2. An approved image is assigned to the Instagram feed package.
3. The manager reviews the exact image and caption in Step 5.
4. The browser asks for explicit confirmation.
5. The server verifies the authenticated role and live-publishing configuration.
6. The server verifies that the image is publicly readable from an approved HTTPS host.
7. A durable encrypted publication claim is written before Meta is called.
8. The server creates the Instagram media container and publishes it.
9. The Meta publication ID, permalink when available, attempt count, and warning state are saved as an encrypted receipt.
10. The normal campaign execution record is updated with the live URL and published status.

## Duplicate protection

The publication identity is derived from:

- event ID
- provider
- campaign item ID
- stable caption version
- stable media URL version
- publish-now mode

An existing published receipt is returned instead of creating another post. An active or uncertain attempt blocks another request until the operator verifies the real Instagram account.

## Failure behavior

- Failure while creating the media container is marked as safe to retry because no publication request has been sent yet.
- Failure or timeout while publishing the container is treated as uncertain and requires manual Instagram verification before another attempt.
- A publication that succeeds but whose permalink cannot yet be read remains published and stores a warning.
- A publication that succeeds but whose receipt cannot be saved returns the provider ID and marks the result for review rather than retrying automatically.

## Access boundary

Encrypted publication claims use the internal `autopilot-publication` workspace kind. The generic browser workspace API accepts only events, growth campaigns, post assembly, and publishing execution records. Publication claims can only be read or written by server-side publishing code.

## Scope boundary

This checkpoint does not yet add:

- Facebook Page publishing
- Instagram carousel, Reel, or Story publishing
- OAuth account-selection screens
- encrypted refresh-token rotation
- scheduled background execution
- campaign-wide one-click approval
- analytics synchronization

Those capabilities follow after the controlled single-image proof is verified against the authorized Club Bahia account.
