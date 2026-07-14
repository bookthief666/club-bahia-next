# Milestone 7G — Self-service social account authorization

## Goal

Allow the Club Bahia Owner or Manager to connect Instagram/Meta and TikTok from Publishing Connections without copying provider tokens into the browser or chat.

## Security boundary

- Only authenticated Owner and Manager sessions can start, renew, or disconnect provider authorization.
- OAuth callbacks require a signed, short-lived state value bound to the current admin user and an HTTP-only same-site cookie.
- Return destinations are restricted to `/admin` paths.
- Provider authorization material is stored only in the encrypted `autopilot-credential` workspace kind.
- `autopilot-credential` is excluded from the generic browser workspace API.
- Browser responses expose only account labels, scopes, expiry dates, renewal availability, and health status.
- Disconnecting app access clears local encrypted provider material while preserving an append-only audit revision.

## Meta flow

1. Owner or Manager presses **Connect Instagram / Meta**.
2. The server creates signed state and redirects to the configured Meta authorization page.
3. Meta returns an authorization code to the exact registered callback.
4. The server exchanges the code, requests long-lived authorization, and discovers accessible Facebook Pages with linked Instagram professional accounts.
5. When one eligible Club Bahia account is available—or the configured Page ID identifies it—the encrypted Page authorization and Instagram account ID are saved.
6. Controlled Instagram publishing prefers the encrypted connection and retains environment-based authorization only as a migration fallback.

Required provider application configuration:

- Meta application ID and secret
- exact callback URL
- pinned Graph API version
- Club Bahia Facebook Page linked to an Instagram professional account
- approved permissions used by the controlled publishing flow

## TikTok flow

1. Owner or Manager presses **Connect TikTok**.
2. The server creates signed state and redirects to TikTok Login Kit for `user.info.basic` and `video.publish`.
3. TikTok returns an authorization code to the exact registered callback.
4. The server exchanges the code and stores the encrypted access and renewal material, granted scopes, open ID, and expiry dates.
5. **Renew TikTok access** uses the stored renewal material and replaces both values atomically.
6. The TikTok private-test publisher prefers the encrypted connection and rejects expired authorization until renewed or reconnected.

TikTok requires an absolute registered callback. Production callbacks must use HTTPS.

## Routes

- `GET /api/admin/autopilot/oauth/meta/start`
- `GET /api/admin/autopilot/oauth/meta/callback`
- `GET /api/admin/autopilot/oauth/tiktok/start`
- `GET /api/admin/autopilot/oauth/tiktok/callback`
- `GET /api/admin/autopilot/oauth/connections`
- `POST /api/admin/autopilot/oauth/tiktok/refresh`
- `POST /api/admin/autopilot/oauth/disconnect`

## Current scope boundary

This milestone does not enable unattended publishing. The explicit Meta live switch and TikTok Content Posting switch remain separate safety gates. Public TikTok posting remains gated by provider audit status. The next milestone adds durable publishing jobs and scheduled execution only after real Club Bahia account connections are verified.
