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
    console, Promise, Image: window.Image,
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
    console.log('PASS: thumbnails, mixed files, filename escaping, removal, reset and core Preview isolation');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
