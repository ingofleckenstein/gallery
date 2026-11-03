<?php

// php inline-images.php /path/to/yii/framework/Yii.php /path/to/protected/humhub
require $argv[1];
Yii::setAlias('@humhub', $argv[2]);
require __DIR__ . '/../../helpers/InlineImageThumbnails.php';

use humhub\modules\content\widgets\richtext\extensions\file\FileExtension;
use humhub\modules\gallery\helpers\InlineImageThumbnails;

function check($condition, $message) {
    if (!$condition) { throw new RuntimeException($message); }
}

$original = 'Hallo 😊 ![Bild](file-guid:owned "Bild" 0) '
    . '![Nochmals](file-guid:owned "Bild" 0) '
    . '![Fremd](file-guid:foreign "Fremd" 0) '
    . '[Dokument](file-guid:document "Notizen")';
$images = [];
$text = FileExtension::replaceLinkExtension($original, 'file-guid', static function ($match) use (&$images) {
    if (!$match->isImage() || $match->getExtensionId() !== 'owned') {
        return $match->getFull();
    }
    $images[$match->getExtensionId()] = [
        'title' => 'Überblick " onclick="alert(1)',
        'preview' => '/preview?guid=owned&v=preview-image',
        'original' => '/original?guid=owned',
    ];
    return '';
});
check(strpos($text, 'file-guid:owned') === false, 'Owned inline images must leave rendered text');
check(strpos($text, 'file-guid:foreign') !== false, 'Unresolved images must stay unchanged');
check(strpos($text, '[Dokument]') !== false, 'Ordinary attachment links must stay unchanged');
check(strpos($text, '😊') !== false, 'Unicode text must be retained');
check(count($images) === 1, 'Repeated images must produce one tile');

$html = InlineImageThumbnails::render($images, 'record-1');
$document = new DOMDocument();
@$document->loadHTML($html);
$image = $document->getElementsByTagName('img')->item(0);
$link = $document->getElementsByTagName('a')->item(0);
check($image->getAttribute('src') === '/preview?guid=owned&v=preview-image', 'Only preview in img src');
check($link->getAttribute('href') === '/original?guid=owned#.jpeg', 'Original only in gallery link');
check(!$link->hasAttribute('onclick'), 'Filename must not inject HTML attributes');
check($link->getAttribute('data-ui-gallery') === 'record-1', 'Per-record gallery grouping');
echo "PASS: HumHub parser, inline extraction, unresolved-file isolation, text preservation, deduplication, preview URLs and escaped filenames\n";
