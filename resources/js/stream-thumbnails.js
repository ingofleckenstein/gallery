humhub.module('gallery.streamThumbnails', function (module, require, $) {
    'use strict';

    var FilePreview = require('file').Preview;
    var object = require('util').object;

    var Preview = function (node, options) {
        FilePreview.call(this, node, options);
    };

    object.inherits(Preview, FilePreview);

    Preview.prototype.add = function (file) {
        // Base implementation owns upload bookkeeping and the remove action.
        FilePreview.prototype.add.call(this, file);
        if (!this.isImage(file) || !file.thumbnailUrl) {
            return;
        }

        var $item = this.$list.children().last();
        $item.addClass('gallery-stream-upload-image');
        $('<img>', {
            src: file.thumbnailUrl,
            alt: '',
            loading: 'lazy',
            decoding: 'async'
        }).prependTo($item);
    };

    // ProseMirror renders images after the PHP widget and also after AJAX
    // comment updates. Observe only marked output, never editor contents.
    var observer;
    var refresh = function () {
        $('.gallery-stream-richtext').each(function () {
            var $root = $(this);
            var group = $root.attr('data-gallery-stream-group');
            $root.find('img').each(function () {
                var $image = $(this);
                if ($image.is('.emoji, .twemoji, [data-emoji]') ||
                    $image.closest('[contenteditable="true"], .ProseMirror, .oembed').length ||
                    $image.hasClass('gallery-stream-thumbnail')) {
                    return;
                }
                var source = $image.attr('src');
                if (!source || !/^(https?:\/\/|\/)/i.test(source)) {
                    return;
                }
                var $link = $image.closest('a');
                if (!$link.length) {
                    $image.wrap($('<a>', {href: source}));
                    $link = $image.parent();
                }
                $image.addClass('gallery-stream-thumbnail');
                $link.addClass('gallery-stream-thumbnail-link')
                    .attr('href', source).attr('data-ui-gallery', group)
                    .attr('title', $image.attr('alt') || '');
                // ui.gallery reads jQuery's cached data when opening a link.
                $link.data('ui-gallery', group);
            });
        });
    };
    var init = function () {
        if (!observer) {
            observer = new MutationObserver(function (mutations) {
                if (mutations.some(function (mutation) {
                    return mutation.type === 'childList' || mutation.attributeName === 'src';
                })) {
                    refresh();
                }
            });
            observer.observe(document.body, {childList: true, subtree: true,
                attributes: true, attributeFilter: ['src']});
        }
        refresh();
    };

    module.export({Preview: Preview, init: init, initOnPjaxLoad: true});
});
