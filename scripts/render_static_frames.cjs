#!/usr/bin/env node
// Write a grammar scene's static fallback: the final frame, drawn by the scene's own
// player at t = duration inside the JSDOM harness, spliced back into panel.html between
// the <!-- static-frame --> markers, with the root's final class list. The panel is then
// what a reader without JavaScript sees, and scripts/test_<scene>_excerpt.cjs pins the
// committed markup to a fresh render so the two cannot drift.
//
//   node scripts/render_static_frames.cjs softmax-shift          # rewrite panel.html
//   node scripts/render_static_frames.cjs softmax-shift --check  # exit 1 if it would change
//
// Test-only JSDOM, like the harness it borrows; nothing here enters the published book.
const fs = require('node:fs');
const path = require('node:path');
const {ROOT, entry, fixture} = require('./html-tests/excerpt-harness.cjs');

const MARK = /(<!-- static-frame[^>]*-->\s*<g data-drawing>)[\s\S]*?(<\/g>\s*<!-- \/static-frame -->)/;
// A scene whose picture reflows for narrow panes may carry a second print of the final
// frame, laid out narrow, inside the same svg: a <g data-static-frame="narrow"
// data-width="…"> between static-frame-narrow markers. It is drawn at that declared width
// and scaled into the svg's own viewBox by its transform, and the scene's stylesheet shows
// it instead of the wide print when the pane is narrow and scripts are off.
const NARROW = /(<!-- static-frame-narrow[^>]*-->\s*)<g data-static-frame="narrow"[^>]*>[\s\S]*?(<\/g>\s*<!-- \/static-frame-narrow -->)/;
// The panel's own static viewBox declares the width its frame is drawn at: the width the
// scene's wide layout is designed for (the desktop page's figure), so that, scripts off,
// one user unit is one CSS pixel on that page and the fallback is not a shrunken picture.
const VIEWBOX = /<svg\b[^>]*\bviewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/;

// A second SVG print must not reuse the live drawing's IDs: otherwise its clip paths
// can resolve to the wide geometry even while that drawing is hidden. Rename only
// IDs declared inside this print and their local references; external links stay put.
function narrowIds(markup) {
  const ids = new Map([...markup.matchAll(/\sid=["']([^"']+)["']/g)]
    .map(match => [match[1], `${match[1]}--static-narrow`]));
  return markup
    .replace(/(\sid=)(["'])([^"']+)\2/g, (_, prefix, quote, id) => `${prefix}${quote}${ids.get(id)}${quote}`)
    .replace(/url\(\s*(["']?)#([^)'"\s]+)\1\s*\)/g,
      (match, quote, id) => ids.has(id) ? `url(${quote}#${ids.get(id)}${quote})` : match)
    .replace(/(\s(?:xlink:)?href=)(["'])#([^"']+)\2/g,
      (match, prefix, quote, id) => ids.has(id) ? `${prefix}${quote}#${ids.get(id)}${quote}` : match)
    .replace(/(\saria-(?:labelledby|describedby)=)(["'])([^"']*)\2/g,
      (_, prefix, quote, value) => `${prefix}${quote}${value.split(/\s+/).map(id => ids.get(id) || id).join(' ')}${quote}`);
}

async function staticFrame(name) {
  const scene = entry(name);
  const file = path.join(ROOT, 'interactives', scene.scene, 'panel.html');
  const panel = fs.readFileSync(file, 'utf8');
  if (!MARK.test(panel)) throw Error(`${scene.scene}/panel.html carries no static-frame markers`);
  const box = VIEWBOX.exec(panel);
  if (!box) throw Error(`${scene.scene}/panel.html declares no viewBox on its static svg`);
  const cleanups = [];
  const render = width => {
    const f = fixture({after: fn => cleanups.push(fn)}, name, {width});
    f.load(); f.open(); f.seek(scene.duration);
    return f;
  };
  const f = render(Number(box[1]));
  const drawing = f.$('[data-drawing]').innerHTML;
  const classes = [...f.root.classList].filter(cls => cls !== 'is-stacked').join(' ');
  const picture = f.$('[data-figure] svg');
  const viewBox = picture.getAttribute('viewBox');
  const title = picture.querySelector('title').textContent, described = picture.getAttribute('aria-label');
  const tag = new RegExp(`(<details id="${scene.id}" class=")[^"]*(")`);
  if (!tag.test(panel)) throw Error(`${scene.scene}/panel.html declares no class attribute on its root`);
  // The picture's accessible name and description are the player's too: they are composed
  // from the declared fixture, so the panel carries no second copy of the numbers.
  let after = panel.replace(MARK, (_, open, close) => `${open}${drawing}${close}`).replace(tag, `$1${classes}$2`)
    .replace(/(<svg\b[^>]*aria-label=")[^"]*(")/, `$1${described}$2`)
    .replace(/(<svg\b[^>]*>\s*<title>)[^<]*(<\/title>)/, `$1${title}$2`)
    .replace(/(<svg\b[^>]*\bviewBox=")[^"]*(")/, `$1${viewBox}$2`);
  const narrow = NARROW.exec(panel);
  if (narrow) {
    const declared = /<g data-static-frame="narrow"[^>]*\bdata-width="(\d+)"/.exec(narrow[0]);
    if (!declared) throw Error(`${scene.scene}/panel.html declares no data-width on its narrow static frame`);
    const n = render(Number(declared[1]));
    const [, , nw, nh] = n.$('[data-figure] svg').getAttribute('viewBox').split(/\s+/).map(Number);
    const [, , ww] = viewBox.split(/\s+/).map(Number);
    const group = `<g data-static-frame="narrow" data-width="${nw}" data-height="${nh}" transform="scale(${(ww / nw).toFixed(4)})">`;
    after = after.replace(NARROW, (_, open, close) => `${open}${group}${narrowIds(n.$('[data-drawing]').innerHTML)}${close}`);
  }
  for (const fn of cleanups) await fn();
  return {file, before: panel, after};
}

if (require.main === module) {
  const [name, flag] = process.argv.slice(2);
  if (!name) { console.error('usage: render_static_frames.cjs <scene> [--check]'); process.exit(2); }
  staticFrame(name).then(({file, before, after}) => {
    if (flag === '--check') {
      if (before !== after) { console.error(`${path.relative(ROOT, file)} is stale: run scripts/render_static_frames.cjs ${name}`); process.exit(1); }
      console.log(`${path.relative(ROOT, file)} is current`);
      return;
    }
    fs.writeFileSync(file, after);
    console.log(`${path.relative(ROOT, file)} ${before === after ? 'unchanged' : 'rewritten'}`);
  }).catch(error => { console.error(error.stack || error.message); process.exit(1); });
}

module.exports = {staticFrame};
