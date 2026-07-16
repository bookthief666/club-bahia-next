# Milestone 7N — Platform-ready media derivatives

## Product objective

Turn one approved Club Bahia image or video into reviewed platform-ready image versions without altering the original file, leaving the Growth OS, or re-uploading the same source repeatedly.

The workflow should be practical on the Fold 6:

1. choose a reusable image or video;
2. choose a platform format;
3. move the focal point;
4. adjust zoom;
5. inspect conservative safe-area guides;
6. generate a JPEG draft;
7. approve the exact version; and
8. let future event assignments use that approved version automatically where appropriate.

## Supported presets

### Instagram feed portrait

- 1080 × 1350
- 4:5 aspect ratio
- intended as the primary Instagram feed image

### Instagram square

- 1080 × 1080
- 1:1 aspect ratio
- useful as a reusable feed, email, or cross-platform fallback

### Instagram Story

- 1080 × 1920
- 9:16 aspect ratio
- includes conservative top and bottom interface guides

### Instagram Reel cover

- 1080 × 1920
- 9:16 aspect ratio
- includes conservative interface guides
- includes a central profile-grid preview guide

### TikTok cover

- 1080 × 1920
- 9:16 aspect ratio
- reserves additional right-side and bottom space for interface controls and captions

### Website event hero

- 1600 × 900
- 16:9 aspect ratio
- includes a responsive center-area guide

### Google Business image

- 1200 × 900
- 4:3 aspect ratio
- prepared for a future Google Business Profile workflow

The safe-area overlays are conservative Club Bahia editing guides. They are not presented as provider guarantees because platform interfaces can change by device, placement, and application version.

## Non-destructive architecture

The canonical library asset remains unchanged.

Every generated version stores:

- a stable derivative ID;
- source library asset ID;
- preset ID;
- public Blob URL and pathname;
- exact output dimensions;
- focal X and Y positions;
- zoom;
- optional video frame time;
- draft or approved state;
- creation time; and
- update time.

Regenerating one preset replaces only that preset’s public JPEG and encrypted recipe. It does not change the original file or any other format.

## Privacy and provider delivery boundary

The generated JPEG must be publicly retrievable so Instagram, TikTok, the website, and future Google publishing can fetch it.

The following remain inside the encrypted server-only media-library catalog:

- focal point;
- zoom;
- selected video frame time;
- approval state;
- canonical source relationship;
- rights metadata;
- internal notes; and
- usage history.

The browser receives the source through an authenticated same-origin proxy. The proxy resolves the URL from the encrypted catalog rather than accepting an arbitrary remote URL. This prevents the derivative renderer from becoming an unrestricted server-side fetch endpoint.

## Local browser rendering

Derivatives are rendered in the manager’s browser with Canvas:

- source image decoding or video frame extraction;
- cover-crop calculation;
- focal-point positioning;
- one-to-three-times zoom;
- high-quality image smoothing; and
- JPEG output.

No external image-processing vendor receives the venue media.

The finished JPEG is uploaded directly to the authorized Vercel Blob derivative path. The encrypted catalog record is saved only after the upload succeeds.

JPEG, PNG, and WebP sources provide the most reliable browser rendering. Some browsers may not decode HEIC directly even though the original upload system accepts HEIC for storage.

## Image and video behavior

Images can produce:

- feed portrait;
- square;
- Story;
- Reel cover;
- TikTok cover;
- website hero; and
- Google Business image.

Videos can produce:

- Instagram Reel cover; and
- TikTok cover.

For videos, the manager selects the source frame in seconds before generating the cover.

A static Reel or TikTok cover can never replace the finished vertical video. The publishing assignment continues to use the approved video file, while the cover remains a separate approved derivative for future provider support and review.

## Draft and approval workflow

Every generated derivative begins in draft.

The manager must inspect the generated JPEG and explicitly approve it before the recommendation and event-assignment systems treat it as platform-ready.

Returning an approved derivative to draft immediately removes its automatic-assignment eligibility.

The Platform Version Builder shows:

- applicable preset chips;
- approved count;
- complete-set count;
- draft count;
- live crop preview;
- conservative safe-area overlays;
- focal controls;
- zoom control;
- video frame control when applicable;
- one-format generation; and
- batch draft generation.

Batch generation uses the current focal point and zoom for all applicable presets. Each version still requires independent review and approval.

## Event assignment behavior

When a manager selects reusable media for an event:

- Instagram feed prefers an approved feed portrait, then an approved square;
- Instagram Story prefers an approved Story derivative;
- website prefers an approved website hero;
- without an approved derivative, the original remains available with a visible warning;
- Reel and TikTok continue to use the approved finished video, not a static cover.

Derivative-backed event assignments preserve:

- canonical library asset ID;
- exact derivative ID;
- generated media dimensions;
- public delivery URL;
- alt text;
- rights confirmation; and
- original source history.

## Recommendation refinements

An approved platform-ready version receives a meaningful ranking boost and the reason:

> Approved platform-ready crop is available

When a feed, Story, or website crop is missing, the manager sees:

> No approved platform crop yet; the original will be used

Vertical-video recommendations also identify whether both Instagram and TikTok covers are approved, one is approved, or neither is ready.

Existing ranking signals remain active:

- recurring-template match;
- platform approval;
- role;
- orientation;
- quality;
- tags;
- alt text;
- rights completeness;
- recent usage; and
- lifetime reuse.

## Current scope boundary

Milestone 7N does not yet:

- add text, logos, dates, or graphic overlays to derivatives;
- remove backgrounds;
- retouch or enhance images;
- trim, concatenate, caption, or transcode video;
- automatically detect faces or subjects;
- import assets from social accounts;
- guarantee provider UI safe areas; or
- rank crops using performance analytics.

These capabilities can build on the same canonical-source and approved-derivative contract.

## Verification coverage

- Preset IDs are unique and dimensions are positive.
- Cover crops preserve the requested aspect ratio without stretching.
- Focal points and zoom are clamped safely.
- Legacy media records without derivatives remain readable.
- Draft derivatives are excluded from automatic selection.
- Approved feed, Story, and website derivatives are selected correctly.
- Platform-ready versions outrank otherwise identical originals.
- Event assignments preserve canonical derivative references.
- Static covers cannot replace a Reel or TikTok video.
- Existing event, campaign, media-library, queue, OAuth, publishing, and reservation tests continue to pass.
