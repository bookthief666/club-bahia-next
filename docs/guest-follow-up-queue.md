# Guest Follow-Up Queue

## Purpose

The Guest Follow-Up Queue adds an operational reminder layer to the existing encrypted Reservations Inbox.

It does not replace the full request record, message templates, staff notes, CSV export, or status controls. It answers one narrower question:

> Which guest requests need attention now?

## Route

```text
/admin/reservations/follow-up
```

The Guests workspace now has two views:

- **Follow-up queue** — urgency, reminders, and upcoming decisions.
- **All requests** — full contact details, message templates, notes, status history, and export.

Both routes remain behind the signed staff session and the private reservation/media access session.

## Priority lanes

Each reservation is classified deterministically.

### Needs first reply

A website request whose status is still `new`.

It becomes urgent when:

- it has waited at least one hour;
- the requested date is tomorrow or tonight; or
- the requested date has already passed.

### Follow-up due

A non-terminal request whose explicit `followUpAt` timestamp is now due or overdue.

### Event decision needed

A contacted or waitlisted request whose reservation date is within two days, or any active request whose reservation date has passed.

### Reminder scheduled

A contacted or waitlisted request with a future `followUpAt` timestamp.

### Confirmed upcoming

A confirmed request arriving within the next seven days.

### Active and closed

Other active requests remain visible without being treated as urgent. Cancelled and completed requests are closed.

## Reminder controls

Staff can save:

- a reminder in two hours;
- a reminder tomorrow at 11:00 AM Los Angeles time;
- a reminder at 11:00 AM on the day before the requested date; or
- no reminder.

When a new request receives a reminder, the explicit action also marks it contacted. Opening a text, email, or phone link alone does not change the request because the application cannot verify that the message or call was completed.

Confirming, cancelling, or completing a request clears its reminder automatically.

## Communication boundary

The queue opens the same human-reviewed message templates already available in the full Reservations Inbox.

It does not:

- send texts or emails automatically;
- claim a table is confirmed before staff approves it;
- create provider messaging credentials;
- notify guests without an explicit staff action;
- create a second customer database; or
- expose guest information outside the protected reservation session.

## Storage

`followUpAt` is an optional ISO timestamp stored inside the existing encrypted reservation record.

Existing records remain valid because the field is optional. No separate reminder database or migration is required.

The protected CSV export includes `Follow Up At` so managers can audit or archive reminder state.

## Time rules

All day-based presets use `America/Los_Angeles`.

- Tomorrow means 11:00 AM on the following Los Angeles calendar day.
- Day before event means 11:00 AM on the calendar day before the requested reservation date.
- When that day-before time has already passed, the system falls back to two hours from now.

## Safety rules

- The queue never sends a message merely because a reminder is due.
- Staff must explicitly choose the next status and reminder.
- Terminal outcomes clear reminders.
- The full request screen remains the place for detailed notes and export.
- The route is included in production route and authentication smoke checks.
