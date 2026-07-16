# Milestone 6A — Production Admin Authentication Foundation

## Purpose

Replace the Preview-only mock admin boundary with a signed, server-verified Growth OS session that works on phones, tablets, and laptops.

## Production variables

Configure these as server-only Vercel variables:

- `ADMIN_AUTH_SECRET` — at least 32 random characters; signs session tokens
- `ADMIN_OWNER_NAME` — display name for the owner account
- `ADMIN_OWNER_PASSWORD` — at least 12 characters
- `ADMIN_MANAGER_NAME` — optional manager display name
- `ADMIN_MANAGER_PASSWORD` — optional manager password, at least 12 characters

Set `ADMIN_DEV_AUTH_ENABLED=false` in Production.

Do not prefix any authentication value with `NEXT_PUBLIC_`.

## Session behavior

- Passwords are compared using constant-length SHA-256 digests and are never returned to the browser.
- Successful login creates a signed, HTTP-only, same-site cookie.
- Production cookies are marked Secure.
- Sessions expire after 12 hours.
- Tampered and expired tokens are rejected.
- Failed login attempts are throttled per server instance.
- `/admin` pages redirect to `/login` without a valid session.
- The login page is excluded from search indexing.
- A visible Sign out action clears the session.

## Protected server operations

The signed session now authorizes:

- Campaign generation
- Event-media listing and metadata changes
- Event-media upload token creation
- Website Preview/public event publishing
- Reservation inbox reads and updates
- Reservation CSV exports

During migration, Vercel Preview deployments without production credentials can continue using the temporary media access code. Once production authentication is configured, the signed session replaces that extra unlock step.

## Review checklist

1. Add temporary Preview values for `ADMIN_AUTH_SECRET` and `ADMIN_OWNER_PASSWORD`.
2. Open `/admin` in a private browser tab and confirm redirect to `/login`.
3. Verify an incorrect password is rejected.
4. Verify the owner password opens Growth OS.
5. Confirm Event Media, AI generation, website Preview publishing, Reservations, and CSV export work without entering the legacy media code.
6. Sign out and confirm `/admin` is protected again.
7. Add an optional manager password and confirm the Manager account appears on the login page.
8. Confirm the same account can sign in independently on a phone and laptop.

## Remaining production work

Authentication does not by itself make browser-local operational data shared. Events, campaign workspaces, post assignments, and execution status still need server-side persistence in the next milestone.
