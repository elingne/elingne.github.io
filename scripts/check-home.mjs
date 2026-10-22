import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function validateMain(app, template) {
  for (const marker of ['.hero-profile', 'async function loadMain(', 'async function loadCharacters(', 'async function loadPairs(']) {
    assert(app.includes(marker), `public/app.js is not the home app: missing ${marker}`);
  }
  assert(!/KOREAN_HOLIDAYS|calendar-api-error|function renderCalendar\(/.test(app), 'Calendar code found in public/app.js');
  for (const match of app.matchAll(/document\.getElementById\("([^"]+)"\)/g)) {
    assert(template.includes(`id="${match[1]}"`), `Main template is missing #${match[1]}`);
  }
}

const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const config = JSON.parse(read('wrangler.jsonc'));
assert.equal(config.name, 'elingne-home', 'Wrong Cloudflare Worker');
assert.equal(config.assets.directory, './public', 'Wrong assets directory');
assert.equal(config.main, 'src/worker.js', 'Wrong server entry');
assert(!fs.existsSync(path.join(root, 'app.js')), 'Unexpected root app.js; use public/app.js');
const index = read('public/index.html');
assert(index.includes('id="spa-view"') && index.includes('src="spa.js"'), 'Wrong home index.html');
assert(index.includes('src="data-client.js"'), 'Missing home API client');
const spa = read('public/spa.js');
const end = spa.indexOf('const spaView =');
assert(end > 0, 'Missing SPA templates');
const templates = vm.runInNewContext(spa.slice(0, end) + '\nSPA_TEMPLATES;', {}, {timeout:1000});
for (const view of ['main', 'character', 'pair', 'admin']) assert(templates[view], `Missing ${view} view`);
const app = read('public/app.js');
validateMain(app, templates.main);
assert.throws(() => validateMain('const KOREAN_HOLIDAYS = {};', templates.main));
assert.throws(() => validateMain(app, templates.main.replace('id="new-character-btn"', 'id="missing-button"')));
for (const file of ['app.js', 'character.js', 'pair.js', 'admin.js', 'data-client.js', 'bgm-player.js', 'image-cropper.js']) {
  new vm.Script(read(`public/${file}`), {filename:file});
}
console.log('Home deployment check passed (including calendar and missing-element rejection).');
