<?php

use humhub\modules\gallery\Events;
use humhub\modules\file\widgets\ShowFiles;
use humhub\modules\file\widgets\FilePreview;
use humhub\modules\content\widgets\richtext\AbstractRichText;
use humhub\modules\space\widgets\Menu;
use humhub\modules\space\widgets\Sidebar as SpaceSidebar;
use humhub\modules\user\widgets\ProfileMenu;
use humhub\modules\user\widgets\ProfileSidebar;

return [
    'id' => 'gallery',
    'class' => 'humhub\modules\gallery\Module',
    'namespace' => 'humhub\modules\gallery',
    'events' => [
        ['class' => AbstractRichText::class, 'event' => AbstractRichText::EVENT_BEFORE_RUN, 'callback' => [Events::class, 'onRichTextBeforeRun']],
        ['class' => ShowFiles::class, 'event' => ShowFiles::EVENT_AFTER_RUN, 'callback' => [Events::class, 'onShowFilesAfterRun']],
        ['class' => FilePreview::class, 'event' => FilePreview::EVENT_BEFORE_RUN, 'callback' => [Events::class, 'onFilePreviewBeforeRun']],
        ['class' => Menu::class,'event' => Menu::EVENT_INIT, 'callback' => [Events::class, 'onSpaceMenuInit']],
        ['class' => ProfileMenu::class,'event' => ProfileMenu::EVENT_INIT, 'callback' => [Events::class,'onProfileMenuInit']],
        ['class' => SpaceSidebar::class, 'event' => SpaceSidebar::EVENT_INIT, 'callback' => [Events::class, 'onSpaceSidebarInit']],
        ['class' => ProfileSidebar::class, 'event' => ProfileSidebar::EVENT_INIT, 'callback' => [Events::class, 'onProfileSidebarInit']],
    ],
];
