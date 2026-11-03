<?php

/**
 * @link https://www.humhub.org/
 * @copyright Copyright (c) 2015 HumHub GmbH & Co. KG
 * @license https://www.humhub.com/licences
 */

namespace humhub\modules\gallery;

use humhub\modules\gallery\helpers\Url;
use humhub\modules\gallery\models\forms\ContainerSettings;
use humhub\modules\gallery\widgets\GallerySnippet;
use humhub\helpers\Html;
use humhub\modules\gallery\assets\StreamThumbnailAssets;
use humhub\modules\post\models\Post;
use humhub\modules\space\models\Space;
use Yii;

/**
 * The event handler for the gallery module.
 *
 * @package humhub.modules.gallery
 * @since 1.0
 * @author Sebastian Stumpf
 */
class Events
{
    /** Keep HumHub's converters, file permissions and gallery links intact. */
    public static function onShowFilesAfterRun($event)
    {
        $widget = $event->sender;
        if (!$widget->object instanceof Post || !$widget->preview || trim((string) $event->result) === '') {
            return;
        }

        if (!static::hasStreamThumbnails($widget->object->content->container)) {
            return;
        }

        StreamThumbnailAssets::register($widget->view);
        $event->result = Html::tag('div', $event->result, ['class' => 'gallery-stream-attachments']);
    }

    /** Use a separate JS widget rather than patching every file preview globally. */
    public static function onFilePreviewBeforeRun($event)
    {
        $widget = $event->sender;
        if (!$widget->edit || $widget->jsWidget !== 'file.Preview') {
            return;
        }

        $container = null;
        if ($widget->model instanceof Post) {
            $container = $widget->model->content->container;
        } elseif (in_array($widget->id, ['contentFormFiles_preview', 'contentFormFiles_previewModal'], true)) {
            $controller = Yii::$app->controller;
            if ($controller !== null && $controller->hasProperty('contentContainer')) {
                $container = $controller->contentContainer;
            }
        }

        if (!static::hasStreamThumbnails($container)) {
            return;
        }

        StreamThumbnailAssets::register($widget->view);
        $widget->jsWidget = 'gallery.streamThumbnails.Preview';
        $widget->preventPopover = true;
        Html::addCssClass($widget->options, 'gallery-stream-upload-preview');
    }

    protected static function hasStreamThumbnails($container): bool
    {
        return $container instanceof Space && $container->moduleManager->isEnabled('gallery');
    }

    public static function onSpaceMenuInit($event)
    {
        try {
            if ($event->sender->space !== null && $event->sender->space->moduleManager->isEnabled('gallery')) {

                $event->sender->addItem([
                    'label' => Yii::t('GalleryModule.base', 'Gallery'),
                    'group' => 'modules',
                    'url' => Url::toGalleryOverview($event->sender->space),
                    'icon' => '<i class="fa fa-picture-o"></i>',
                    'isActive' => (Yii::$app->controller->module && Yii::$app->controller->module->id == 'gallery'),
                ]);
            }
        } catch (\Throwable $e) {
            Yii::error($e);
        }
    }

    public static function onSpaceSidebarInit($event)
    {
        try {
            /** @var Module $module */
            $module = Yii::$app->getModule('gallery');

            if ($event->sender->space !== null && $event->sender->space->moduleManager->isEnabled('gallery')) {
                $event->sender->addWidget(GallerySnippet::class, ['contentContainer' => $event->sender->space], ['sortOrder' => (int) $module->settings->contentContainer($event->sender->space)->get(ContainerSettings::SETTING_SORT_ORDER)]);
            }
        } catch (\Throwable $e) {
            Yii::error($e);
        }
    }

    public static function onProfileMenuInit($event)
    {
        try {
            if ($event->sender->user !== null && $event->sender->user->moduleManager->isEnabled('gallery')) {
                $event->sender->addItem([
                    'label' => Yii::t('GalleryModule.base', 'Gallery'),
                    'url' => Url::toGalleryOverview($event->sender->user),
                    'icon' => '<i class="fa fa-picture-o"></i>',
                    'isActive' => (Yii::$app->controller->module && Yii::$app->controller->module->id == 'gallery'),
                ]);
            }
        } catch (\Throwable $e) {
            Yii::error($e);
        }
    }

    public static function onProfileSidebarInit($event)
    {
        try {
            /** @var Module $module */
            $module = Yii::$app->getModule('gallery');

            if ($event->sender->user !== null && $event->sender->user->moduleManager->isEnabled('gallery')) {
                $event->sender->addWidget(GallerySnippet::class, ['contentContainer' => $event->sender->user], ['sortOrder' => (int) $module->settings->contentContainer($event->sender->user)->get(ContainerSettings::SETTING_SORT_ORDER)]);
            }
        } catch (\Throwable $e) {
            Yii::error($e);
        }
    }
}
