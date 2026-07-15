# Milestone 7M — Reusable Media Library and smart asset matching

## Product objective

Stop re-uploading and re-finding the same Club Bahia photos, flyers, logos, and videos for every event.

The Growth OS should preserve approved media as a reusable venue asset, recommend the strongest appropriate match for the current campaign, warn when an image or clip has been used too recently, and attach it to the existing post assembly in one action.

## Canonical media without duplicate files

Saving an approved event asset to the library does not copy the image or video binary.

The library creates one canonical metadata record pointing to the original Blob URL. Reusing the media for a new event creates only a lightweight event assignment containing:

- the new event ID;
- the target platform and role;
- the canonical library asset ID;
- the original public media URL;
- approved alt text; and
- the existing rights confirmation date.

This avoids repeated uploads, unnecessary storage use, and multiple conflicting copies of the same media.

## Encrypted catalog boundary

Images and videos remain publicly retrievable because Instagram and TikTok must be able to fetch them.

The reusable catalog is stored separately in the encrypted `media-library` Growth OS workspace. The encrypted record contains internal information that must not be exposed through public Blob metadata:

- rights basis and notes;
- photographer or performer credit;
- internal quality rating;
- tags, performers, and genres;
- collection assignments;
- usage history;
- usage count; and
- last-used time.

The generic browser workspace API cannot read or write the `media-library` workspace. All catalog access goes through the authenticated media-library API.

## Library collections

Built-in collections include:

- Club Bahia evergreen
- Venue exterior and signage
- Venue interior
- Crowd and dance-floor energy
- Live bands and musicians
- Azucar LA — Friday
- Azucar LA — Saturday
- Bahía Nocturna
- Performers and DJs
- Logos and brand marks

Staff can assign more than one collection to an asset.

## Asset metadata

Each reusable record can retain:

- original role and approved platforms;
- image, video, audio, or document type;
- portrait, square, landscape, vertical-video, or unknown orientation;
- quality rating from one to five;
- tags;
- performers;
- genres;
- accessibility alt text;
- rights basis;
- rights note;
- credit;
- internal notes;
- usage count and history; and
- active or archived status.

## Deterministic recommendations

The recommendation engine does not require an AI vision request. It ranks staff-reviewed metadata using auditable rules.

Positive signals include:

- exact recurring-template collection match;
- approved target platform;
- preferred asset role;
- suitable orientation;
- quality rating;
- matching performer, genre, or descriptive tags;
- approved evergreen status;
- completed alt text; and
- media that has not been used recently.

Negative signals include:

- usage within the last seven days;
- usage within the last three weeks;
- high lifetime reuse count;
- missing orientation;
- missing alt text; and
- incomplete rights details.

The manager sees the most important match reasons and warnings rather than an unexplained score.

## Recommendation lanes

Step 3 now recommends approved media separately for:

1. Instagram feed
2. Instagram Story
3. Instagram Reel and TikTok vertical video
4. Website event image

The vertical-video lane excludes images. The feed and website lanes require images. Story recommendations may include an appropriate portrait image or vertical video.

## One-action assignment

Selecting **Use for this post**:

1. creates or reuses a deterministic event assignment;
2. points it to the canonical media file;
3. records the library source ID;
4. records usage for that event and platform without double-counting retries; and
5. updates the existing post assembly primary asset.

The recommendation action does not publish or schedule the post.

## Global library workspace

`/admin/media` provides:

- search by name, tag, performer, genre, alt text, or note;
- active, archived, and all-status filters;
- image, video, audio, and document filters;
- collection filters;
- quality, usage, and format summaries;
- metadata editing;
- archive and restore; and
- direct access to the original media.

Media is now a first-class desktop and mobile Growth OS navigation destination.

## Event workflow

Inside an event’s **Choose media** step:

- approved event assets can be saved to the reusable library;
- the best library matches appear before the upload form;
- recently reused assets are visibly penalized;
- the manager can attach a recommendation in one action;
- the full library remains available through a direct link; and
- uploading a new asset remains available when the recommendations are not appropriate.

## Current scope boundary

This milestone does not yet:

- generate crops or resized derivatives;
- analyze image pixels with an AI vision model;
- trim or edit videos;
- create Reel or TikTok covers;
- import media from Instagram or TikTok accounts; or
- use performance analytics in ranking.

Those capabilities can build on the canonical library record without changing the event assignment contract.

## Verification coverage

- Recurring-template collection matches outrank generic media.
- Recently used media is penalized.
- Images are excluded from the vertical-video lane.
- Tags normalize and deduplicate.
- Library metadata validates.
- Event assignments validate canonical library references.
- The encrypted media-library workspace is excluded from the generic browser API.
- Existing event, campaign, queue, OAuth, publishing, and reservation tests continue to pass.
