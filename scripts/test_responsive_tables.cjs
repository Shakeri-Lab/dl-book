#!/usr/bin/env node
// npm ci --prefix scripts/html-tests --ignore-scripts
// node --test scripts/test_responsive_tables.cjs
// jsdom checks DOM/accessibility state with explicit layout measurements; actual
// intrinsic sizing and document overflow still require the narrow-browser audit.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createRequire } = require("node:module");
const scopedRequire = createRequire(path.join(__dirname, "html-tests", "package.json"));
const { JSDOM } = scopedRequire("jsdom");
const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "responsive-figures.html"), "utf8")
  .replace(/^<script>\s*/, "").replace(/\s*<\/script>\s*$/, "");

function fixture() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav><table id="outside"><tr><td>Navigation</td></tr></table></nav>
    <main class="content">
      <table id="plain"><caption>Paired results</caption><thead><tr><th scope="col">Gain</th></tr></thead>
        <tbody><tr><td>0.37 <button>Inspect</button>
          <table id="nested"><tr><td>Nested detail</td></tr></table></td></tr></tbody></table>
      <table id="fits"><tr><td>Small table</td></tr></table>
      <figure class="quarto-float-tbl"><figcaption id="numbered-caption">Table 15.1: Families</figcaption>
        <div aria-describedby="numbered-caption"><table id="numbered"><tr><td>Family</td></tr></table></div></figure>
      <section id="the-route-at-a-glance"><table id="route"><tr><td>Five parts</td></tr></table></section>
      <details><summary>Inspect later</summary><table id="hidden"><tr><td>Details</td></tr></table></details>
      <div class="table-responsive"><table id="wrapped"><tr><td>Existing wrapper</td></tr></table></div>
      <div class="quarto-figure"><div id="wide"><img class="figure-img" alt="A wide mechanism."></div></div>
    </main></body></html>`, { runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  const measures = new Map([
    ["plain", [340, 482]], ["fits", [340, 340]], ["numbered", [340, 460]],
    ["route", [340, 700]], ["hidden", [0, 0]], ["wrapped", [340, 420]], ["wide", [340, 700]],
  ]);
  const keyFor = element => element.querySelector("table")?.id || element.id;
  Object.defineProperties(window.HTMLElement.prototype, {
    clientWidth: { get() { return measures.get(keyFor(this))?.[0] || 0; } },
    scrollWidth: { get() { return measures.get(keyFor(this))?.[1] || 0; } },
  });
  const scrolls = [];
  window.HTMLElement.prototype.scrollBy = function (options) { scrolls.push([this, options.left]); };
  const media = new window.EventTarget();
  media.matches = true;
  window.matchMedia = () => media;
  const pending = [];
  window.requestAnimationFrame = callback => pending.push(callback);
  const flush = () => { while (pending.length) pending.splice(0).forEach(callback => callback()); };
  const observers = [];
  window.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(element) { this.targets.add(element); }
  };
  const fonts = new window.EventTarget();
  fonts.ready = Promise.resolve();
  Object.defineProperty(window.document, "fonts", { value: fonts });
  const image = window.document.querySelector("img");
  Object.defineProperties(image, {
    complete: { value: true }, naturalWidth: { value: 1000 }, naturalHeight: { value: 250 },
  });
  const originals = new Map([...window.document.querySelectorAll("table")]
    .map(table => [table.id, [table, table.outerHTML, table.parentElement]]));
  window.eval(script);
  flush();
  return { dom, window, measures, originals, media, observers, fonts, flush, scrolls,
    frame: id => window.document.getElementById(id).parentElement };
}

test("ordinary tables get local frames without changing native table content or captions", () => {
  const context = fixture();
  for (const id of ["plain", "fits", "hidden"]) {
    assert(context.frame(id).classList.contains("responsive-table-frame"), `${id} needs a local table frame`);
  }
  for (const [id, [table, markup]] of context.originals) {
    assert.equal(context.window.document.getElementById(id), table);
    assert.equal(table.outerHTML, markup);
  }
  assert.equal(context.frame("outside"), context.originals.get("outside")[2]);
  assert.equal(context.frame("nested"), context.originals.get("nested")[2]);
  assert.equal(context.frame("numbered"), context.originals.get("numbered")[2]);
  assert.equal(context.frame("wrapped"), context.originals.get("wrapped")[2]);
  assert.equal(context.window.document.getElementById("numbered-caption").parentElement,
    context.frame("numbered").parentElement);
  assert.equal(context.frame("numbered").getAttribute("aria-describedby"), "numbered-caption");
  context.window.eval(script);
  context.flush();
  assert.equal(context.window.document.querySelectorAll(".responsive-table-frame .responsive-table-frame").length, 0);
  assert.equal(context.window.document.querySelectorAll(".responsive-route-table-frame").length, 1);
  context.dom.window.close();
});

test("only actual overflowing frames get a tab stop, labeled region, and scroll cue", () => {
  const context = fixture();
  for (const id of ["plain", "numbered", "route", "wrapped"]) {
    const frame = context.frame(id);
    assert.equal(frame.getAttribute("tabindex"), "0", id);
    assert.equal(frame.getAttribute("role"), "region", id);
    assert(frame.classList.contains("is-overflowing"), id);
  }
  assert.match(context.frame("plain").getAttribute("aria-label"), /Paired results/);
  assert.match(context.frame("numbered").getAttribute("aria-label"), /Table 15.1: Families/);
  for (const id of ["fits", "hidden"]) {
    assert.equal(context.frame(id).getAttribute("tabindex"), null, id);
    assert.equal(context.frame(id).getAttribute("role"), null, id);
    assert(!context.frame(id).classList.contains("is-overflowing"), id);
  }
  context.measures.set("route", [340, 340]);
  context.measures.set("wide", [340, 340]);
  context.window.dispatchEvent(new context.window.Event("resize"));
  context.flush();
  assert.equal(context.frame("route").getAttribute("tabindex"), null);
  assert.equal(context.window.document.getElementById("wide").getAttribute("tabindex"), null);
  const frame = context.frame("plain");
  frame.dispatchEvent(new context.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
  assert.deepEqual(context.scrolls.map(([, left]) => left), [204]);
  frame.querySelector("button").dispatchEvent(new context.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
  assert.equal(context.scrolls.length, 1, "do not steal descendant controls' arrow keys");
  context.dom.window.close();
});

test("resize, loaded media/fonts, and expanded disclosures refresh overflow state", async () => {
  const context = fixture();
  context.measures.set("plain", [600, 600]);
  context.window.dispatchEvent(new context.window.Event("resize"));
  context.flush();
  assert.equal(context.frame("plain").getAttribute("tabindex"), null);
  context.measures.set("plain", [340, 482]);
  context.fonts.dispatchEvent(new context.window.Event("loadingdone"));
  context.flush();
  assert.equal(context.frame("plain").getAttribute("tabindex"), "0");
  context.measures.set("hidden", [340, 450]);
  context.frame("hidden").closest("details").dispatchEvent(new context.window.Event("toggle"));
  context.flush();
  assert.equal(context.frame("hidden").getAttribute("tabindex"), "0");
  context.measures.set("hidden", [0, 0]);
  context.window.document.dispatchEvent(new context.window.Event("hidden.bs.collapse"));
  context.flush();
  assert.equal(context.frame("hidden").getAttribute("tabindex"), null);
  context.measures.set("fits", [340, 500]);
  context.window.document.querySelector("img").dispatchEvent(new context.window.Event("load"));
  context.flush();
  assert.equal(context.frame("fits").getAttribute("tabindex"), "0");
  assert(context.observers.some(observer => observer.targets.has(context.frame("plain"))));
  assert(context.observers.some(observer => observer.targets.has(context.originals.get("plain")[0])));
  context.measures.set("plain", [340, 340]);
  context.observers.forEach(observer => observer.callback());
  context.flush();
  assert.equal(context.frame("plain").getAttribute("tabindex"), null);
  await context.fonts.ready;
  context.flush();
  context.dom.window.close();
});

test("route and wide-figure behavior remains local, without stale wide-screen focus stops", () => {
  const context = fixture();
  assert(context.frame("route").classList.contains("responsive-route-table-frame"));
  assert(!context.frame("route").classList.contains("responsive-table-frame"));
  assert.equal(context.frame("route").getAttribute("aria-label"),
    "Five-part route table. Scroll horizontally to inspect.");
  const wide = context.window.document.getElementById("wide");
  assert(wide.classList.contains("responsive-wide-figure-frame"));
  assert.equal(wide.getAttribute("tabindex"), "0");
  context.measures.set("route", [900, 900]);
  context.measures.set("wide", [900, 900]);
  context.media.matches = false;
  context.media.dispatchEvent(new context.window.Event("change"));
  context.flush();
  for (const frame of [wide, context.frame("route")]) {
    assert.equal(frame.getAttribute("tabindex"), null);
    assert.equal(frame.getAttribute("aria-label"), null);
    assert(!frame.classList.contains("is-overflowing"));
  }
  context.dom.window.close();
});
