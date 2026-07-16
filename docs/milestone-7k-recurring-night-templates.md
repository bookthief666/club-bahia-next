# Milestone 7K — Recurring-night templates

## Product objective

Create the next recurring Club Bahia event and initialize its promotion campaign in approximately two minutes without re-entering the same resident-program facts every week.

## Built-in templates

### Azucar LA — Friday

- Suggests the next Friday in Los Angeles venue time.
- Creates a dated public event title.
- Prefills the verified resident performer and live cumbia, merengue, salsa, bachata, and Latin dance-music description.
- Uses bilingual, warm, energetic Friday-night campaign direction.
- Uses a lighter seven-touch recurring cadence to avoid overposting the same resident program.

### Azucar LA — Saturday

- Suggests the next Saturday.
- Uses the same resident-program facts with a higher-energy Saturday tone and CTA.
- Uses the lighter seven-touch recurring cadence.

### Bahía Nocturna — experimental Thursday

- Suggests the next Thursday.
- Prefills the monthly darkwave, post-punk, goth, synth, and Latin-alternative pilot direction.
- Uses a dark, cinematic, welcoming bilingual voice.
- Uses the complete ten-touch experimental-launch cadence.

## Snapshot architecture

Selecting a template saves a versioned template snapshot on the event. Existing events therefore retain the language, tone, hashtag families, visual direction, media preferences, and cadence that were reviewed when the event was created.

Changing a built-in template later does not silently rewrite old events or approved campaigns.

## Factual boundaries

Templates do not invent event-specific:

- admission or cover;
- age policy;
- reservation URL;
- guest talent;
- food or drink specials; or
- inventory and urgency claims.

The event form explicitly asks the manager to confirm those facts before publishing.

Event-specific values override template defaults everywhere.

## Campaign inheritance

Creating an event initializes its campaign brief with:

- target audience;
- tone;
- language;
- CTA;
- performers;
- genres;
- admission and age policy when confirmed;
- reservation link; and
- main attraction.

The deterministic campaign generator merges the template’s approved hashtag families and visual direction. The OpenAI request receives the same template context as internal guidance while retaining the event-specific factual precedence rules.

## Campaign cadences

### Resident weekend — seven touches

1. Weekly feed announcement
2. Midweek Story
3. Instagram Reel
4. TikTok vertical video
5. Day-before reservation reminder
6. Tonight Story
7. Thank-you and next weekend

### Experimental launch — ten touches

1. Main announcement
2. Performer spotlight
3. Story countdown
4. Instagram Reel
5. TikTok vertical video
6. Reservation reminder
7. Tomorrow Story
8. Tonight Story
9. Final-hours Story
10. Thank-you and next action

Both cadences retain late-event compression, Los Angeles scheduling, the 90-minute pre-event safety boundary, atomic queue preparation, and full-campaign approval gates.

## Verification

- Template date and title generation
- Immutable snapshot behavior
- Event-specific override precedence
- Campaign-brief initialization
- Template hashtag and visual-prompt inheritance
- Seven-touch resident cadence
- Ten-touch experimental cadence
- Full repository tests, lint, TypeScript validation, and production build
