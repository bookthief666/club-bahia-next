# Milestone 4A — Shared Event Asset Studio

## Purpose

Add the first real execution-layer tool to the Club Bahia Growth Workspace: secure cloud upload and organization for flyers, images, finished Reels, raw video, audio, logos, and printable PDFs.

## Storage architecture

- Media files upload directly from the browser to a public Vercel Blob store.
- Large files do not pass through the Next.js server.
- Each asset is stored under an event-specific immutable path:

```text
club-bahia/events/{eventId}/assets/{assetId}/{filename}
```

- Asset metadata is stored beside the file as `metadata.json`.
- Listing the event library reads metadata records from Blob, so the library is shared across browsers rather than tied to one device.
- Metadata records contain the event assignment, role, platform assignments, approval state, alt text, notes, file type, size, and usage-rights confirmation.

## Temporary preview security

Production authentication is not implemented yet. To avoid exposing the upload-token route on public preview URLs, media access requires:

```text
BLOB_READ_WRITE_TOKEN=
ADMIN_ASSET_UPLOAD_SECRET=
```

The temporary access code is entered in the Event Asset Studio and stored only in `sessionStorage`. It is sent in the `x-admin-asset-key` header. The server compares it using a timing-safe comparison before issuing upload tokens or allowing metadata changes.

This temporary gate must be replaced by real authenticated users before production launch.

## Supported uploads

- JPEG, PNG, WebP, GIF, HEIC, and HEIF images
- MP4, MOV, and WebM video
- MP3, M4A, and WAV audio
- PDF flyers
- Maximum file size: 250 MB each
- Files above 100 MB use multipart client upload

## Event organization

Every asset receives:

- event ID
- asset role
- destination platforms
- approval status
- alt text
- notes
- usage-rights confirmation

Supported roles include primary flyer, feed creative, Story creative, finished Reel, raw footage, performer photo, venue photo, logo, audio, printable flyer, and other.

## Media readiness

The studio tracks four initial requirements:

1. approved primary flyer
2. approved feed creative
3. approved Story creative
4. approved Reel video

Draft uploads do not satisfy readiness until a human approves them.

## Mobile workflow

From the Fold 6, an operator can:

1. open an event and tap **Media**
2. unlock the protected asset studio
3. choose files from gallery, camera storage, Downloads, or cloud storage
4. select an asset role and destination platforms
5. confirm usage permission
6. upload with progress reporting
7. preview images, video, audio, or PDFs
8. edit platform assignments, alt text, and notes
9. approve the final asset
10. delete obsolete files

## Current scope boundary

This milestone does not yet:

- resize or crop images automatically
- transcode or assemble video
- generate thumbnails or platform variants
- attach an asset directly to a specific campaign content item
- publish assets to the Club Bahia website or social platforms
- provide production authentication
- maintain a relational database

These are the next layers after cloud upload and event-level organization are verified.

## Acceptance criteria

1. The project builds without Blob environment variables.
2. The studio clearly reports when storage is not configured.
3. An unauthorized request cannot list, upload, update, or delete assets.
4. A configured preview accepts supported files from a mobile browser.
5. Upload progress is visible.
6. Uploaded media appears in the event library after metadata registration.
7. Video and audio can be previewed in-browser.
8. Asset roles and destination platforms can be edited.
9. Only approved assets satisfy the media-readiness checklist.
10. Deleting an asset removes both the media file and metadata record.
