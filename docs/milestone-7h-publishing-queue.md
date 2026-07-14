# Milestone 7H — Durable Instagram and TikTok publishing queue

## Product outcome

Club Bahia can now prepare separate Instagram and TikTok publication jobs, assign exact delivery times, approve each post, and monitor the queue from the Home dashboard.

The queue is intentionally provider-aware:

- Instagram feed image jobs may execute unattended after the controlled image proof and account connection are ready.
- Instagram Reel jobs share the approved vertical edit but remain paused until the Reel provider proof is complete.
- TikTok video jobs keep their own caption and schedule but remain paused until public Direct Post has passed the controlled account and audit boundary.

## Queue storage

The single-venue pilot stores jobs in the internal encrypted `autopilot-queue` workspace. It is not exposed through the generic browser workspace API.

Each job stores:

- event and content identity;
- provider and destination;
- approved caption and media URL;
- scheduled UTC instant;
- content and media versions;
- stable idempotency identity;
- approval mode and approved versions;
- attempt count and maximum attempts;
- active worker lease;
- retry time and error;
- provider publication ID and live URL.

Optimistic workspace revisions prevent two workers from successfully claiming the same due job. A short worker lease protects a job while its provider request is in flight. The separate encrypted publication receipt remains the final exactly-once boundary at the provider level.

## Retry behavior

A failed job is retried only when the provider stage is classified as safe.

- Retry delay begins at five minutes.
- Each subsequent retry doubles the delay.
- Delay is capped at two hours.
- Attempts are capped per job.
- Uncertain provider results stop immediately for human review.

## Manager workflow

In Step 5:

1. review the exact caption and approved media;
2. choose the publishing time;
3. add or update the shared queue job;
4. approve the scheduled post;
5. return to Home to monitor the Today queue.

The Home dashboard separates:

- publishing today;
- posts needing approval; and
- provider, media, or proof problems.

An Owner or Manager may run due jobs manually from Home. The same worker route accepts a protected recurring trigger.

## Scheduler endpoint

`GET|POST /api/admin/autopilot/scheduler/run`

- Browser/manual runs require an authenticated Owner or Manager session.
- Recurring runs require a bearer value matching `CRON_SECRET` or the migration alias `PUBLISHING_CRON_SECRET`.
- Each invocation processes at most five due jobs.
- The route records completion, safe retry, or final failure before returning.

## Vercel deployment boundary

Vercel Cron calls routes with HTTP GET and can attach `CRON_SECRET` as a bearer authorization header. No cron schedule is committed in this milestone because the correct frequency depends on the Vercel plan:

- Hobby permits only one run per day and has hour-level timing precision, which is not suitable for scheduled social publishing.
- Pro and Enterprise permit per-minute schedules.

After the project plan is confirmed, a production schedule such as every five minutes can be added to `vercel.json` for the scheduler route. Cron expressions run in UTC; the queue itself stores UTC timestamps while the interface displays Club Bahia times in `America/Los_Angeles`.

## Current safety boundary

Automatic execution is enabled only for Instagram single-image feed jobs after all Meta readiness checks pass.

Still gated:

- Instagram Reel execution;
- Instagram carousel and Story publishing;
- public TikTok execution;
- TikTok photo posts;
- automatic provider analytics synchronization;
- recurring production cron configuration.

These restrictions prevent the queue from treating an unproven provider format as production-ready merely because it has a scheduled time.
