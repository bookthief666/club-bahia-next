# Milestone 7E — Instagram and TikTok priority

Club Bahia's first two primary publishing lanes are now:

1. Instagram
2. TikTok

Facebook is treated as an optional cross-post destination available through the Meta connection. Google Business Profile remains a later local-discovery channel.

## Content architecture

A single approved vertical-video edit can be reused across both primary platforms, but it produces two separate publication drafts and jobs:

- Instagram Reel
- TikTok video

Each job keeps its own:

- caption
- hashtags
- title or cover text
- posting settings
- scheduled time
- idempotency key
- provider publication ID
- processing status
- live URL
- retry and failure history
- UTM attribution

This prevents the app from treating TikTok as a copy of Instagram while avoiding duplicate video-editing work.

## TikTok readiness settings

The server readiness screen recognizes these empty server-side configuration names:

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_OAUTH_REDIRECT_URI`
- `TIKTOK_OPEN_ID`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_REFRESH_TOKEN`
- `TIKTOK_VERIFIED_MEDIA_HOST`
- `TIKTOK_CONTENT_POSTING_ENABLED`
- `TIKTOK_APP_AUDITED`

Do not place real credential values in source control, screenshots, prompts, or browser-facing data.

## TikTok provider boundary

The server adapter now supports the three operations required for a guarded direct-post flow:

1. Query the authorized creator's current privacy and interaction settings.
2. Initialize a pull-from-URL vertical-video post.
3. Poll the asynchronous publication status using the returned publish ID.

The future publishing UI must not guess privacy, comment, duet, or stitch settings. It must use the current creator information returned for the authorized account.

## Public visibility boundary

A technically working TikTok Content Posting integration is not automatically ready for public publishing. The account and app require the appropriate Content Posting product and authorization, and unaudited clients remain restricted to private visibility.

The readiness screen therefore separates:

- developer-app setup
- account authorization
- posting scope and product setup
- verified media hosting
- client audit status
- encrypted publication receipts

## Media boundary

TikTok pull-from-URL media must use an exact verified HTTPS hostname. The adapter rejects any other hostname before contacting TikTok.

Event media can now be marked for TikTok in the Asset Studio. The existing `reel-video` role is presented as a shared vertical-video asset for Instagram Reel and TikTok.

## Current scope

Implemented:

- TikTok provider in the Promotion Autopilot domain
- TikTok readiness card and configuration checks
- TikTok event-media destination
- shared vertical-video package model
- platform-native Instagram and TikTok caption variants
- separate publishing jobs and attribution
- creator-info query adapter
- video initialization adapter
- asynchronous status adapter
- provider error handling and tests

Still gated:

- self-service TikTok OAuth
- encrypted refresh-token rotation
- live TikTok route and confirmation UI
- video technical validation and transcoding
- persistent TikTok publication receipts
- scheduled execution
- analytics synchronization

The next controlled proof should connect the authorized Club Bahia TikTok account, query its current creator settings, and prepare one private test publication before any public direct posting is enabled.
