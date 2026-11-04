// Run with jsdom/jquery available and the path to HumHub 1.18.5 humhub.file.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const window = new JSDOM('<div id="preview"></div>').window;
const $ = require('jquery')(window);
$.fx.off = true;

function Widget(node, options) { this.$ = $(node); this.options = options || {}; }
Widget.prototype.hide = function () { this.$.hide(); };
const object = {
    inherits(child, parent) {
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
    },
    isArray: Array.isArray
};
const modules = {
    'ui.widget': {Widget},
    'ui.progress': {Progress: function () {}},
    util: {object, string: {
        encode: value => $('<div>').text(value).html(),
        template: (template, values) => template.replace(/\{([^}]+)\}/g, (_, key) => values[key] ?? '')
    }},
    client: {}, action: {}, event: {}, i18n: {},
    'ui.view': {isSmall: () => true}
};
const context = vm.createContext({
    console, Promise, Image: window.Image, document: window.document,
    MutationObserver: window.MutationObserver,
    humhub: {module(name, factory) {
        factory({export: exports => { modules[name] = exports; }}, name => {
            assert.ok(modules[name], 'Missing dependency: ' + name);
            return modules[name];
        }, $);
    }}
});
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../../resources/js/stream-thumbnails.js'), 'utf8'), context);

async function main() {
    const Preview = modules['gallery.streamThumbnails'].Preview;
    const preview = new Preview($('#preview'), {fileEdit: true, preventPopover: true});
    preview.init([]);
    const image = {guid: 'image-1', name: '<img src=x onerror=alert(1)>.jpg', mimeIcon: 'mime-image', thumbnailUrl: '/preview/image-1'};
    preview.add({...image});
    preview.add({guid: 'document-1', name: 'notes.pdf', mimeIcon: 'mime-pdf'});
    preview.add({guid: 'audio-1', name: 'voice.mp3', mimeIcon: 'mime-audio'});
    preview.add({guid: 'image-2', name: 'tall.jpg', mimeIcon: 'mime-image', thumbnailUrl: '/preview/image-2'});
    assert.equal(preview.getFileCount(), 4);
    assert.equal(preview.$.find('img').length, 2);
    assert.equal(preview.$.find('img').first().attr('src'), image.thumbnailUrl);
    assert.equal(preview.$.find('img[onerror]').length, 0, 'Filename must remain text');
    assert.equal(preview.$.find('.file_upload_remove_link').length, 4);
    assert.equal(preview.$.find('.gallery-stream-upload-image').length, 2);

    let removed = false;
    preview.source = {options: {}, delete(file) { removed = file.guid === 'image-1'; return Promise.resolve({}); }};
    preview.$.find('[data-preview-guid="image-1"] .file_upload_remove_link').trigger('click');
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(removed, 'Core remove action must still call the upload source');
    assert.equal(preview.getFileCount(), 3);
    assert.equal(preview.$.find('[data-preview-guid="image-1"]').length, 0);

    preview.reset();
    assert.equal(preview.getFileCount(), 0);
    preview.add({guid: 'image-3', name: 'again.png', mimeIcon: 'mime-image', thumbnailUrl: '/preview/image-3'});
    assert.equal(preview.$.find('img').length, 1, 'New upload after reset');

    const original = new modules.file.Preview($('<div>'), {fileEdit: true, preventPopover: true});
    original.init([{...image}]);
    assert.equal(original.$.find('img').length, 0, 'Global core Preview must be unchanged');

    // Use HumHub's actual gallery handler to verify navigation membership.
    let opened;
    context.blueimp = {Gallery(links, options) { opened = {links, options}; }};
    vm.runInContext(fs.readFileSync(path.resolve(path.dirname(process.argv[2]),
        '../../../../../../static/js/humhub/humhub.ui.gallery.js'), 'utf8'), context);
    modules['ui.gallery'].init();
    $('body').append('<div class="gallery-stream-richtext" data-gallery-stream-group="gallery-post-1">' +
        '<p><img src="/old.jpg" alt="Old photo"><img class="emoji" src="/emoji.svg"></p></div>' +
        '<a id="attachment" href="/attachment.jpg" data-ui-gallery="gallery-post-1">Attachment</a>' +
        '<div id="unaffected"><img src="/unaffected.jpg"></div>');
    modules['gallery.streamThumbnails'].init();
    const first = $('.gallery-stream-thumbnail-link').first();
    assert.equal(first.attr('href'), '/old.jpg');
    first.trigger('click');
    assert.equal(opened.links.length, 2, 'Inline photo and attachment share the carousel');
    assert.equal(opened.options.index, first[0], 'Viewer opens the clicked photo');
    assert.equal($('.emoji').parent().is('a'), false, 'Emoji stay untouched');
    assert.equal($('#unaffected img').parent().is('a'), false, 'Disabled containers stay untouched');
    $('body').append('<div class="gallery-stream-richtext" data-gallery-stream-group="gallery-comment-2">' +
        '<img src="/new.jpg"><img src="/second.jpg">' +
        '<div contenteditable="true"><img src="/editor.jpg"></div></div>');
    await new Promise(resolve => setImmediate(resolve));
    const reply = $('[data-gallery-stream-group="gallery-comment-2"]');
    assert.equal(reply.find('.gallery-stream-thumbnail-link').length, 2, 'AJAX reply processed');
    reply.find('a').first().trigger('click');
    assert.equal(opened.links.length, 2, 'Reply carousel excludes parent images');
    modules['gallery.streamThumbnails'].init();
    assert.equal(reply.find('a a').length, 0, 'Repeated initialization is idempotent');
    console.log('PASS: legacy images, AJAX replies, core carousel grouping, emoji/editor isolation');
    console.log('PASS: thumbnails, mixed files, filename escaping, removal, reset and core Preview isolation');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
