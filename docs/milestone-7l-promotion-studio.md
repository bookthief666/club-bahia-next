# Milestone 7L — Promotion Studio and refined campaign composer

## Product objective

Make campaign creation feel like one focused operational task rather than a collection of dashboards.

The manager should be able to:

1. confirm campaign direction;
2. generate one complete package;
3. compare useful channel-specific choices;
4. edit or improve only what needs attention;
5. approve each deliverable; and
6. continue directly to media.

## Interface simplification

The former growth workspace exposed separate overview, campaign, timeline, and asset tabs in addition to a guide, provider banner, audit panel, campaign brief, status filters, content cards, and revision history.

The new Promotion Studio replaces that internal tab system with one continuous workspace.

### Persistent event context

The Studio header keeps the event name, venue-local date and time, room, event status, recurring template, approval count, review count, and quality score visible.

### Progressive campaign direction

The default setup shows only the decisions usually needed for generation:

- primary goal;
- language;
- voice preset;
- main attraction;
- CTA; and
- reservation or ticket URL.

Internal audience, performers, genres, time wording, admission, age policy, food or drink special, address, and budget remain in a collapsed advanced section.

### Task-oriented review queue

The manager can filter by:

- Needs review
- Instagram
- Reels + TikTok
- Website + direct
- All

The default queue is Needs review rather than a generic overview.

### Platform previews

Every deliverable has a compact Club Bahia preview with:

- platform identity;
- selected version;
- character count;
- hashtag count;
- number of choices;
- approval state;
- inline quality notes; and
- the exact copy that will move forward.

### One obvious next action

A mobile-safe action bar always states the current task:

- set campaign direction;
- review remaining channels; or
- continue to media.

Nothing publishes from the Promotion Studio.

## Refined campaign package

The AI and deterministic fallback now produce a validated structured package rather than one generic body per channel.

### Instagram feed

- short caption;
- recommended standard caption;
- long caption;
- primary and alternate hooks;
- branded hashtag group;
- local-discovery hashtag group;
- music-community hashtag group;
- factual alt text; and
- visual-generation prompt.

### Instagram Story

- concise multi-frame sequence;
- hook frame;
- atmosphere or talent frame;
- verified-detail frame;
- CTA frame;
- interaction recommendations; and
- factual alt text.

### Reels and TikTok

One shared 15-second edit plan produces two independent platform packages:

- Instagram Reel caption, title, hashtags, cover guidance, and posting notes;
- TikTok caption, title, hashtags, immediate-hook guidance, and posting notes.

The two captions must remain different. The shared edit plan is not overwritten when a platform caption is selected or copied.

### Email and SMS

- multiple materially different email subjects;
- email preheader;
- recommended email body;
- multiple SMS choices;
- 300-character validation; and
- opt-out validation for every SMS choice.

## Generation boundary correction

The campaign API validation layer now preserves the event’s:

- performers;
- genres;
- admission;
- age policy;
- reservation URL;
- flyer URL; and
- recurring-template snapshot.

Previously, those newer fields could be removed by request parsing before reaching the server generator.

Event facts continue to override recurring-template and venue defaults.

## Quality gates

The deterministic report now checks:

- single public event name;
- internal audience leakage;
- rough placeholder language;
- generic hype;
- Spanish and bilingual CTA consistency;
- temporary URLs;
- missing conversion URL;
- cross-channel repetition;
- useful Instagram caption choices;
- focused Instagram hashtag count;
- Story-frame completeness and density;
- separate Reel and TikTok captions;
- duplicate short-video captions;
- complete short-video edit plan;
- visual alt text;
- email subject choices;
- SMS length; and
- SMS opt-out language.

Blocking platform-package omissions disable approval on the affected card.

## Revision and technical details

Provider provenance, deterministic issues, connection access, and revision restoration remain available in a collapsed Quality & history drawer below the primary workspace.

Improving the full package preserves the prior revision. Improving one channel returns only that channel to draft.

## Verification coverage

- Full event and recurring-template context survives request validation.
- Rich structured AI packages validate.
- Deterministic fallback produces separate Instagram Reel and TikTok variants.
- Caption choices are ordered and deduplicated.
- Hashtag groups are deduplicated.
- Review filters follow operational tasks.
- Missing short-video platform variants block approval.
- Duplicate Reel and TikTok captions are detected.
- Hashtag focus and visual alt text are checked.
- Existing campaign, queue, OAuth, publishing, reservation, and event tests continue to pass.
