<?php

namespace humhub\modules\gallery\assets;

use humhub\assets\AppAsset;
use humhub\components\assets\AssetBundle;

class StreamThumbnailAssets extends AssetBundle
{
    public $sourcePath = '@gallery/resources';

    public $css = ['css/stream-thumbnails.css'];

    public $js = ['js/stream-thumbnails.js'];

    public $depends = [AppAsset::class];
}
