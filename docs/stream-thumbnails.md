# Stream attachment thumbnails (fork 1.7.5)

Based on upstream Gallery v1.7.2, targeting HumHub 1.18.x.

## Behaviour

- In Spaces with Gallery enabled, ordinary Post attachments use a separate
  thumbnail grid below the message. Tiles are at most 96 x 80 CSS pixels.
- Images retain their full aspect ratio (`object-fit: contain`). Original files
  are opened through HumHub's existing gallery links and grouping.
- The standard post composer and post edit form show 120px-wide image cards.
  HumHub still owns upload progress, file ownership, removal and submission.
- The preview uses the server-provided `thumbnailUrl`, not the original image.
- Non-image files retain HumHub's existing presentation. Audio playback is not
  changed in this release.
- Uploaded inline images in rich-text messages and comments (including video
  comments) are extracted into a separate thumbnail area at render time.
  Only files assigned to that record and readable by the viewer are resolved.
- The stored text is untouched. Originals are not emitted as inline img sources;
  only preview files load until the viewer opens a gallery link.
- Profiles and Spaces with Gallery disabled remain unaffected. External images
  and emoji are not moved into the thumbnail area.

## Integration

`ShowFiles::EVENT_AFTER_RUN` wraps core attachment output for content and comments.
Scoped CSS sizes its image grid without replacing templates or gallery links.
`FilePreview::EVENT_BEFORE_RUN` selects a dedicated JS Preview subclass for
the standard post composer and Post edit form. The subclass adds thumbnail
images after the core Preview creates its editable file item.

Files remain attached to their source Post. No copies, album records, extra
notifications, database migration or changes to access permissions are needed.
The existing StreamGallery continues to query posted image attachments.
It now also joins files via `content_id`, including inline images and comment
images previously omitted by `show_in_stream=1`. Only published parent content
is included, with the existing container visibility rules and an additional
file/content access check before rendering an entry.

`AbstractRichText::EVENT_BEFORE_RUN` uses HumHub's FileExtension parser to extract
authorized image references from the widget's text only. A per-instance afterRun
handler appends the server-rendered thumbnail grid. This runs before ProseMirror
renders Markdown in the browser; a PHP afterRun HTML rewrite alone would not work.

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
8. Confirm disabled Spaces, profiles and Chats are unaffected.
9. Check with a normal member and a non-member; file access must stay unchanged.
10. Add inline images to a video comment; check compact output and posted-image
    gallery inclusion. Existing comments should work without editing/resubmitting.

PHP/JavaScript syntax and an isolated runtime test against the original HumHub
1.18.5 file Preview are checked locally. A full HumHub database/browser test
requires a running test installation and is still required before deployment.

To repeat the runtime test, make `jsdom` and `jquery@3.7.1` available to Node
and run `node tests/runtime/stream-thumbnails.cjs /path/to/humhub.file.js`.

## Browser-rendered images (1.7.5)

All supported rich-text output is marked, including messages without file-guid references.
A MutationObserver sizes legacy images and images rendered after AJAX/PJAX updates.
Emoji and editable content are excluded. Uploaded references still use server previews;
legacy/external image URLs retain their existing source and can load the original.
Inline files and attachments share gallery-<record unique ID>, while replies use their own ID.
The existing HumHub viewer handles clicks, previous/next, closing and keyboard navigation.

The default GitHub branch is currently master (upstream); these fork changes target main.
Install main or the explicit fork version, then refresh published assets.
