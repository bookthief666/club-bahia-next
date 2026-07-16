# Milestone 7Q — Product scope reset and campaign results

## Why this milestone exists

The original Club Bahia Growth OS goal is operational, not to reproduce Canva, CapCut, Buffer, and a full CRM inside one application.

The core promise is:

1. enter confirmed event facts;
2. generate a strong platform-specific promotion package;
3. approve copy and media;
4. schedule or publish through controlled channels;
5. track reservation demand and confirmed guests; and
6. improve the next campaign from real outcomes.

Milestones 7M–7P created valuable media capabilities, but the advanced crop, graphic, and clip-editing tools had become too prominent in the routine workflow. Milestone 7Q restores the product hierarchy without deleting those investments.

## Product hierarchy

### Core workflow — always visible

- confirmed event facts and recurring-night templates;
- bilingual campaign generation and quality checks;
- platform-native caption and hashtag packages;
- recommended approved media or one new upload;
- campaign review and approval;
- tracked RSVP links;
- campaign timeline and publishing queue;
- provider readiness and manual fallback;
- reservation requests, confirmed guests, and source attribution; and
- clear next actions.

### Advanced production — retained but optional

- custom platform crops;
- event-branded graphic overlays;
- Reel and TikTok cover preparation; and
- multi-clip vertical-video sequencing.

These capabilities now live in collapsed, clearly labeled advanced-production sections. They are appropriate when a campaign lacks a finished asset, but they are not requirements for every Azucar Friday, Azucar Saturday, or other recurring night.

### Deferred until the core system is validated

- in-app MP4 concatenation and transcoding;
- animated overlay rendering;
- AI vision footage selection;
- beat detection and music synchronization;
- color grading and retouching;
- automated music licensing;
- background removal;
- full design-canvas behavior; and
- broad creative-suite functionality.

A finished vertical video can continue to be produced in a dedicated video tool and uploaded as one approved asset. Building a production-grade renderer is not justified until the weekly promotion workflow, real provider connections, and usage frequency prove that it will save more time than it costs to maintain.

## Simplified media workflow

Step 3 now presents the fastest path first:

1. accept a recommended approved library asset; or
2. upload one strong photo or finished vertical video.

The custom 15-second sequence editor is collapsed beneath an **Advanced production tool** section. Its copy explicitly states that it creates an edit recipe rather than a rendered MP4.

The global Media Library now opens with the searchable reusable catalog. Custom crops and branded graphic composition are collapsed beneath **Advanced production tools**.

## Simplified publishing workflow

The routine Publish step keeps these functions visible:

- website publication;
- tracked campaign links;
- campaign timeline;
- publishing queue and schedule; and
- manual launch and publication records.

The controlled Instagram image, Instagram Reel, and TikTok private proof panels now live together in one collapsed **Controlled provider testing** section. They remain available for production account validation but no longer appear to be three mandatory steps for every campaign.

## Step 6 — Results

The event workflow now ends with **Review results**.

The Results page aggregates only information the Growth OS can verify:

- reservation requests for the event;
- requested guest places;
- confirmed reservation requests;
- confirmed guests;
- confirmation rate;
- UTM source, medium, and content breakdowns;
- queue entries for the event;
- published, active, approval-needed, problem, and cancelled counts;
- provider publication links when recorded; and
- provider errors when present.

Reservations are matched by exact event ID. Legacy reservations without an event ID may match the exact normalized event title.

The API returns aggregates and publishing metadata only. It does not expose guest names, emails, telephone numbers, notes, or other personally identifying reservation data.

## No invented social analytics

The Results page does not estimate:

- reach;
- impressions;
- views;
- watch time;
- saves;
- shares;
- follower growth; or
- engagement rate.

Those metrics will appear only after real Meta and TikTok analytics permissions are connected and validated. Until then, the app explicitly states that provider analytics are unavailable while continuing to show trusted reservation attribution.

## Revised priority order

After Milestone 7Q, the recommended product order is:

1. validate the weekly workflow with real Club Bahia events;
2. configure the stable production domain and provider callbacks;
3. connect the real Meta account and complete supervised publication proofs;
4. connect TikTok and validate permitted publishing behavior;
5. activate a protected recurring scheduler appropriate to the hosting plan;
6. add provider analytics ingestion;
7. compare campaign activity with reservations and confirmed guests;
8. automate next-week Azucar campaign preparation; and
9. revisit MP4 rendering only when repeated real usage demonstrates demand.

## Verification coverage

- event-ID reservation matching;
- legacy exact-title fallback;
- requested and confirmed guest totals;
- source attribution aggregation;
- publishing-state aggregation;
- cross-event isolation;
- no fabricated provider analytics;
- six-step workflow routing;
- event Results page production route;
- event results API production route; and
- full repository tests, lint, TypeScript validation, and production build.
