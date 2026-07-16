# Milestone 5C Live Preview Validation

Use the latest `codex/milestone-5c-manager-followup-tools` Preview deployment.

## Reservation intake

- Submit a general Friday or Saturday reservation.
- Confirm a real request number beginning with `CB-` is returned.
- Submit the exact same request again within 15 minutes.
- Confirm the original request number is returned and no duplicate inbox item appears.

## Reservation inbox

- Unlock with the owner/media access code.
- Confirm the campaign source, campaign, content, referrer, and landing page appear.
- Confirm the **Export CSV** action is visible.
- Open a reservation and confirm the **Ready-to-send messages** section appears.
- Test Request received, More information needed, Confirmation, and Waitlist templates.
- Confirm Text, Email, and Copy actions work on the Fold 6.
- Save a staff note and update the status.

## Security and truthfulness

- Confirm the request-received template does not promise a table.
- Confirm the confirmation template is separate and only used after approval.
- Confirm CSV export is unavailable without the owner session.
- Keep `RESERVATION_DATA_SECRET` unchanged after reservation records exist.

## Public funnel

- Verify homepage featured event.
- Verify `/events` and `/events/[slug]`.
- Verify event-specific reservation date locking.
- Verify tracked links preserve UTM values through submission.
