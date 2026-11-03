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

    module.export({Preview: Preview});
});
