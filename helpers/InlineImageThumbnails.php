<?php

namespace humhub\modules\gallery\helpers;

/** Render only authorized, record-owned images resolved by the caller. */
class InlineImageThumbnails
{
    public static function render(array $files, string $galleryId): string
    {
        $escape = static fn ($value) => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $result = '<div class="gallery-stream-inline-images">';
        foreach ($files as $file) {
            $result .= '<a href="' . $escape($file['original'] . '#.jpeg') . '" data-ui-gallery="' . $escape($galleryId)
                . '" title="' . $escape($file['title']) . '"><img src="' . $escape($file['preview'])
                . '" alt="' . $escape($file['title']) . '" loading="lazy" decoding="async"></a>';
        }
        return $result . '</div>';
    }
}
