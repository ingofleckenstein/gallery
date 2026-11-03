# Stream attachment thumbnails (fork 1.7.3)

Based on upstream Gallery v1.7.2, targeting HumHub 1.18.x.

## Behaviour

- In Spaces with Gallery enabled, ordinary Post attachments use a separate
  thumbnail grid below the message. Tiles are at most 180 x 140 CSS pixels.
- Images retain their full aspect ratio (`object-fit: contain`). Original files
  are opened through HumHub's existing gallery links and grouping.
- The standard post composer and post edit form show 120px-wide image cards.
  HumHub still owns upload progress, file ownership, removal and submission.
- The preview uses the server-provided `thumbnailUrl`, not the original image.
- Non-image files retain HumHub's existing presentation. Audio playback is not
  changed in this release.
- Profiles, Spaces with Gallery disabled, comments, Chats and images embedded
  inside rich text are outside the scope of this release.

## Integration

`ShowFiles::EVENT_AFTER_RUN` wraps the core renderer output for Posts only.
Scoped CSS sizes its image grid without replacing templates or gallery links.
`FilePreview::EVENT_BEFORE_RUN` selects a dedicated JS Preview subclass for
the standard post composer and Post edit form. The subclass adds thumbnail
images after the core Preview creates its editable file item.

Files remain attached to their source Post. No copies, album records, extra
notifications, database migration or changes to access permissions are needed.
The existing StreamGallery continues to query posted image attachments.

## Installation

Update the existing `gallery` module in place using this fork. Keep the module
ID and existing data. **Do not uninstall or disable Gallery as an update step:**
upstream's disable handlers delete gallery content.

Refresh published assets/cache using the normal HumHub update procedure.
The fork remains restricted to HumHub 1.18.x, matching its upstream base.

## Verification before production

1. Enable Gallery in a test Space; upload landscape and tall images in a Post.
2. Check compact previews before sending, remove one and submit the remainder.
3. Open a thumbnail and navigate between the submitted images.
4. Edit the Post: existing images and new uploads must retain working removal.
5. Confirm the same images appear in the Space's existing posted-image gallery.
6. Repeat on a narrow mobile screen and with keyboard navigation.
7. Check a mixed image/document/audio Post; non-image attachments must still work.
8. Confirm disabled Spaces, profiles, comments and Chats are unaffected.
9. Check with a normal member and a non-member; file access must stay unchanged.

PHP/JavaScript syntax and an isolated runtime test against the original HumHub
1.18.5 file Preview are checked locally. A full HumHub database/browser test
requires a running test installation and is still required before deployment.

To repeat the runtime test, make `jsdom` and `jquery@3.7.1` available to Node
and run `node tests/runtime/stream-thumbnails.cjs /path/to/humhub.file.js`.
