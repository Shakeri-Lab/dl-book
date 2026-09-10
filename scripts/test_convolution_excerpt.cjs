#!/usr/bin/env node
// npm ci --prefix scripts/html-tests --ignore-scripts
// node --test scripts/test_convolution_excerpt.cjs
// DOM/state regression tests, not a substitute for narrow-screen visual QA.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createRequire } = require("node:module");
const scopedRequire = createRequire(path.join(__dirname, "html-tests", "package.json"));
const { JSDOM } = scopedRequire("jsdom");
const source = name => fs.readFileSync(path.join(__dirname, "..", "interactives", "convolution", name), "utf8");
const panel = source("panel.html");
const loader = source("loader.js");
const player = source("player.js");
const numberText = value => String(Object.is(value, -0) ? 0 : value);

function fakeFrames(window) {
  let now = 0;
  let nextId = 1;
  const pending = new Map();
  Object.defineProperty(window.performance, "now", { value: () => now, configurable: true });
  window.requestAnimationFrame = callback => {
    assert.equal(typeof callback, "function");
    const id = nextId++;
    pending.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = id => pending.delete(id);
  function frame(milliseconds) {
    assert(Number.isFinite(milliseconds) && milliseconds >= 0);
    now += milliseconds;
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach(callback => callback(now));
  }
  return {
    get size() { return pending.size; },
    frame,
    elapseWithoutFrame(milliseconds) { now += milliseconds; },
    advance(milliseconds) {
      const target = now + milliseconds;
      let calls = 0;
      while (now < target && pending.size) {
        assert(++calls <= 20000, "bounded clock advance must terminate");
        frame(Math.min(25, target - now));
      }
      now = target;
    },
  };
}

function fixture(t, hash = "", options = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body><main>${panel}</main></body></html>`, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: `https://book.example/chapters/07-filters-convolution.html${hash}`,
  });
  const { window } = dom;
  const document = window.document;
  const root = document.getElementById("convolution-excerpt");
  // JSDOM has dialog markup but not the browser's modal methods or Escape action.
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new window.Event("close"));
  };
  const clock = fakeFrames(window);
  window.matchMedia = () => ({ matches: Boolean(options.reducedMotion), addEventListener() {}, removeEventListener() {} });
  const query = selector => root.querySelector(selector);
  const cells = name => [...query(`[data-matrix="${name}"]`).querySelectorAll(":scope > span")];
  const values = name => cells(name).map(cell => cell.textContent);
  const scripts = () => [...document.querySelectorAll("script[src]")];
  // JSDOM has no layout. Give the drawing code independently controlled cell
  // rectangles, including narrower cards and cells for resize regression.
  let layoutWidth = options.layoutWidth || 800;
  const resizeCallbacks = [];
  const rectangle = (left, top, width, height) => ({
    x: left, y: top, left, top, width, height,
    right: left + width, bottom: top + height,
    toJSON() { return { left, top, width, height }; },
  });
  window.Element.prototype.getBoundingClientRect = function () {
    const origin = { left: 40, top: 80 };
    const boardHeight = 500;
    if (this.matches(".conv-excerpt__grids, .conv-excerpt__rays")) {
      return rectangle(origin.left, origin.top, layoutWidth, boardHeight);
    }
    const isCard = this.matches(".conv-excerpt__card");
    const matrix = this.matches("[data-matrix]") ? this
      : isCard ? this.querySelector("[data-matrix]") : this.closest("[data-matrix]");
    if (matrix) {
      const order = ["input", "kernel", "products", "output"].indexOf(matrix.dataset.matrix);
      const columns = 2;
      const cellSize = Math.min(32, layoutWidth / columns / 5);
      const count = matrix.dataset.matrix === "input" ? 4 : matrix.dataset.matrix === "output" ? 2 : 3;
      const left = origin.left + (order % columns) * layoutWidth / columns + 20;
      const top = origin.top + Math.floor(order / columns) * 240 + 60;
      if (isCard) return rectangle(left - 20, top - 60, layoutWidth / columns - 40, 210);
      const index = [...matrix.querySelectorAll(":scope > span")].indexOf(this);
      if (index >= 0) return rectangle(left + index % count * cellSize,
        top + Math.floor(index / count) * cellSize, cellSize, cellSize);
      return rectangle(left, top, count * cellSize, count * cellSize);
    }
    return rectangle(origin.left, origin.top, layoutWidth, boardHeight);
  };
  if (options.resizeObserver) {
    window.ResizeObserver = class {
      constructor(callback) { resizeCallbacks.push(callback); }
      observe() {}
      disconnect() {}
    };
  }
  let hidden = false;
  let fullscreenElement = null;
  let fullscreenRequests = 0;
  Object.defineProperty(document, "fullscreenElement", { get: () => fullscreenElement, configurable: true });
  if (options.fullscreen) {
    Object.defineProperty(document, "fullscreenEnabled", { value: true, configurable: true });
    query(".conv-excerpt__player").requestFullscreen = async () => {
      fullscreenRequests++;
      if (options.fullscreen === "reject") throw new Error("Fullscreen denied by browser");
      fullscreenElement = query(".conv-excerpt__player");
      document.dispatchEvent(new window.Event("fullscreenchange"));
    };
    document.exitFullscreen = async () => {
      fullscreenElement = null;
      document.dispatchEvent(new window.Event("fullscreenchange"));
    };
  }
  Object.defineProperty(document, "hidden", { get: () => hidden, configurable: true });
  Object.defineProperty(document, "visibilityState", { get: () => hidden ? "hidden" : "visible", configurable: true });
  t.after(() => window.close());
  return {
    window, document, root, clock, query, cells, values, scripts,
    button: action => query(`[data-action="${action}"]`),
    get step() { return Number(root.dataset.step); },
    get time() { return Number(root.dataset.time); },
    get fullscreenRequests() { return fullscreenRequests; },
    evaluateLoader() { window.eval(loader); },
    evaluatePlayer() { window.eval(player); },
    completeLoad() {
      const script = scripts().at(-1);
      assert(script, "opening should request the player script");
      window.eval(player);
      script.dispatchEvent(new window.Event("load"));
    },
    async toggle(open) {
      if (root.open === open) return;
      // JSDOM schedules native toggle asynchronously. Await that actual event;
      // dispatching a synthetic one leaves a second event waiting to pause Play.
      const toggled = new Promise(resolve => root.addEventListener("toggle", resolve, { once: true }));
      root.open = open;
      await toggled;
    },
    async settleToggle(action) {
      const toggled = new Promise(resolve => root.addEventListener("toggle", resolve, { once: true }));
      action();
      await toggled;
    },
    seek(seconds) {
      const slider = query('input[type="range"]');
      slider.value = String(seconds);
      slider.dispatchEvent(new window.Event("input", { bubbles: true }));
    },
    speed(value) {
      const select = query("select[data-speed]");
      select.value = String(value);
      select.dispatchEvent(new window.Event("change", { bubbles: true }));
    },
    resize(width) {
      layoutWidth = width;
      resizeCallbacks.forEach(callback => callback([]));
      window.dispatchEvent(new window.Event("resize"));
    },
    key(key, target = query(".conv-excerpt__player")) {
      const event = new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event;
    },
    dismissDialog() {
      const dialog = query(".conv-excerpt__dialog");
      const event = new window.Event("cancel", { cancelable: true });
      if (dialog.dispatchEvent(event)) dialog.close();
    },
    visibility(value) {
      hidden = value;
      document.dispatchEvent(new window.Event("visibilitychange"));
    },
  };
}

async function initialized(t, options = {}) {
  const context = fixture(t, "", options);
  context.evaluateLoader();
  await context.toggle(true);
  context.completeLoad();
  // Timing tests deliberately use 1x. A separate test owns the public default.
  if (!options.useDefaultSpeed) context.speed(1);
  return context;
}

function assertStopped(context, step = context.step) {
  const time = context.time;
  const windowPosition = context.query(".conv-excerpt__window").getAttribute("style");
  assert.equal(context.clock.size, 0, "paused playback leaves no pending animation frame");
  assert.notEqual(context.button("play").dataset.state, "pause",
    "a paused transport never shows the pause icon");
  context.clock.advance(100000);
  assert.equal(context.step, step, "paused playback cannot advance");
  assert.equal(context.time, time, "pause preserves fractional time");
  assert.equal(context.query(".conv-excerpt__window").getAttribute("style"), windowPosition,
    "pause preserves the exact sliding-window position");
}

function near(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-8, message || `${actual} should equal ${expected}`);
}

function assertButtonName(button, name) {
  assert.equal(button.getAttribute("aria-label"), name);
  assert.equal(button.getAttribute("title"), name);
  assert.equal(button.querySelector(".conv-excerpt__sr-only").textContent, name);
  assert(button.querySelector('svg[aria-hidden="true"]'), "an icon never replaces the accessible button name");
  assert.equal(button.getAttribute("aria-pressed"), null,
    "a button whose accessible name changes is an action, not a toggle");
}

const displayTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

// Independent row/column loops compute all valid, unflipped 3x3 correlations.
// This reference does not import the player's positions or arithmetic helpers.
function reference(context) {
  const input = context.values("input").map(Number);
  const kernel = context.values("kernel").map(value => Number(value.replace("−", "-")));
  const patches = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const products = [];
      let sum = 0;
      for (let kr = 0; kr < 3; kr++) {
        for (let kc = 0; kc < 3; kc++) {
          const product = input[4 * (row + kr) + col + kc] * kernel[3 * kr + kc];
          products.push(product);
          sum += product;
        }
      }
      patches.push({ row, col, products, sum });
    }
  }
  return patches;
}

test("excerpt is closed by default and requests its player only on first open", async t => {
  const context = fixture(t);
  assert.equal(context.root.open, false);
  assert.equal(context.query(".conv-excerpt__controls").hidden, true);
  assert.equal(context.query(".conv-excerpt__timeline").hidden, true);
  assert.match(context.query(".conv-excerpt__transcript").textContent, /weights never change/);
  context.evaluateLoader();
  context.evaluateLoader();
  assert.equal(context.scripts().length, 0);
  assert.equal(context.clock.size, 0);
  await context.toggle(true);
  assert.equal(context.scripts().length, 1);
  assert.match(context.scripts()[0].src, /\/interactives\/convolution\/player\.js$/);
  assert.match(context.query(".conv-excerpt__loading").textContent, /Loading/);
  await context.toggle(false);
  await context.toggle(true);
  assert.equal(context.scripts().length, 1, "opening again during loading must not duplicate the request");
  context.completeLoad();
  assert.equal(context.query(".conv-excerpt__loading").textContent, "");
  assert.equal(context.root.dataset.ready, "true");
  assertStopped(context, 0);
  await context.toggle(false);
  await context.toggle(true);
  context.evaluateLoader();
  assert.equal(context.scripts().length, 1);
  assertStopped(context, 0);
});

test("initial and later deep links open the disclosure without autoplay", async t => {
  const initial = fixture(t, "#convolution-excerpt");
  await initial.settleToggle(() => initial.evaluateLoader());
  assert.equal(initial.root.open, true);
  assert.equal(initial.scripts().length, 1);
  initial.completeLoad();
  assertStopped(initial, 0);

  const later = fixture(t);
  later.evaluateLoader();
  later.window.history.replaceState(null, "", "#unrelated-section");
  later.window.dispatchEvent(new later.window.HashChangeEvent("hashchange"));
  assert.equal(later.root.open, false);
  assert.equal(later.scripts().length, 0);
  await later.settleToggle(() => {
    later.window.history.replaceState(null, "", "#convolution-excerpt");
    later.window.dispatchEvent(new later.window.HashChangeEvent("hashchange"));
  });
  later.completeLoad();
  assertStopped(later, 0);
});

test("load failure preserves the static witness and close/reopen retries successfully", async t => {
  const context = fixture(t);
  const fallback = ["input", "kernel", "products", "output"].map(name => context.values(name));
  const calculation = context.query(".conv-excerpt__calculation").textContent;
  context.evaluateLoader();
  await context.toggle(true);
  const failedScript = context.scripts()[0];
  failedScript.dispatchEvent(new context.window.Event("error"));
  assert.equal(failedScript.isConnected, false);
  assert.equal(context.scripts().length, 0);
  assert.match(context.query(".conv-excerpt__loading").textContent, /could not load.*static calculation.*retry/s);
  assert.deepEqual(["input", "kernel", "products", "output"].map(name => context.values(name)), fallback);
  assert.equal(context.query(".conv-excerpt__calculation").textContent, calculation);
  assert.equal(context.query(".conv-excerpt__controls").hidden, true);
  assert.equal(context.query(".conv-excerpt__timeline").hidden, true);
  assert.equal(context.root.dataset.ready, undefined);
  await context.toggle(false);
  await context.toggle(true);
  assert.equal(context.scripts().length, 1);
  assert.notEqual(context.scripts()[0], failedScript);
  context.completeLoad();
  assert.equal(context.query(".conv-excerpt__loading").textContent, "");
  assert.equal(context.query(".conv-excerpt__controls").hidden, false);
  assert.equal(context.query(".conv-excerpt__timeline").hidden, false);
  assertStopped(context, 0);
});

test("static fallback products, output, and signed kernel match the independent calculation", t => {
  const context = fixture(t);
  const patches = reference(context);
  const expectedKernel = ["−1", "0", "1", "−2", "0", "2", "−1", "0", "1"];
  assert.deepEqual(context.values("kernel"), expectedKernel);
  assert.deepEqual(context.values("products"), patches[0].products.map(numberText));
  assert.deepEqual(context.values("output"), patches.map(patch => numberText(patch.sum)));
  assert.equal(context.query(".conv-excerpt__calculation").textContent,
    `${patches[0].products.map(numberText).join(" + ")} = ${numberText(patches[0].sum)}`);
  assert.equal(context.query('[data-matrix="output"]').getAttribute("aria-label"),
    `Completed output: ${patches[0].sum}, ${patches[1].sum}; ${patches[2].sum}, ${patches[3].sum}.`);
});

test("initial stage withholds products and unwritten outputs instead of showing false zeros", async t => {
  const context = await initialized(t);
  assert.deepEqual(context.values("products"), Array(9).fill("·"));
  assert.deepEqual(context.values("output"), Array(4).fill("·"));
  assert.match(context.query('[data-matrix="products"]').getAttribute("aria-label"), /not computed yet/);
  assert.equal(context.query('[data-matrix="output"]').getAttribute("aria-label"),
    "Output, by row: not computed, not computed, not computed, not computed.");
  assert.equal(context.query(".conv-excerpt__calculation strong"), null);
  assertButtonName(context.button("play"), "Play");
  assert.equal(context.query('input[type="range"]').value, "0");
  assert.equal(context.query('input[type="range"]').min, "0");
  assert.equal(context.query('input[type="range"]').max, "40");
  assert.equal(context.query('input[type="range"]').step, "0.01");
  assert.equal(context.query("#convolution-time").textContent, "0:00 / 0:40");
  assert.match(context.query('input[type="range"]').getAttribute("aria-valuetext"), /Step 1 of 16/);
  assert.deepEqual(context.values("kernel"), ["−1", "0", "1", "−2", "0", "2", "−1", "0", "1"]);
  assertStopped(context, 0);
});

test("one compact on-pane transport contains only named play and fullscreen icon buttons", async t => {
  const context = await initialized(t, { useDefaultSpeed: true });
  const controls = context.query(".conv-excerpt__controls");
  assert.equal(context.root.querySelectorAll(".conv-excerpt__controls").length, 1);
  assert(context.query(".conv-excerpt__player").contains(controls));
  assert.deepEqual([...controls.querySelectorAll("button")].map(button => button.dataset.action),
    ["play", "fullscreen"]);
  assert.deepEqual([...context.root.querySelectorAll("button[data-action]")].map(button => button.dataset.action),
    ["play", "fullscreen"], "no separate Replay, Previous, Next, or Reset buttons remain");
  assertButtonName(context.button("play"), "Play");
  assertButtonName(context.button("fullscreen"), "Expand");
  for (const selector of [".conv-excerpt__timeline", "#convolution-time", "select[data-speed]"]) {
    assert(controls.contains(context.query(selector)), `${selector} belongs to the shared transport bar`);
  }
  assert.equal(context.query("select[data-speed]").value, "1.5");
  for (const selector of ['label[for="convolution-step"]', "#convolution-keyboard"]) {
    assert(context.query(selector).classList.contains("conv-excerpt__sr-only"),
      `${selector} stays available to assistive technology without crowding the diagram`);
  }
});

test("the faster 1.5x default remains paused until Play and advances by elapsed wall time", async t => {
  const context = await initialized(t, { useDefaultSpeed: true });
  assert.equal(context.query("select[data-speed]").value, "1.5");
  assertStopped(context, 0);
  context.button("play").click();
  context.clock.frame(5000 / 3);
  near(context.time, 2.5, "1.5x covers 2.5 content seconds in 1666.67 wall-clock milliseconds");
  assert.equal(context.step, 1);
  context.button("play").click();
  assertStopped(context, 1);
});

test("all sixteen stages agree with independent arithmetic and keep the kernel unchanged", async t => {
  const context = await initialized(t);
  const patches = reference(context);
  const visitOrder = [0, 1, 3, 2]; // top-left, top-right, bottom-right, bottom-left
  const phases = ["Place", "Multiply", "Sum", "Slide"];
  const kernelValues = context.values("kernel");
  const inputValues = context.values("input");
  for (let step = 0; step < 16; step++) {
    const seconds = step * 2.5;
    context.seek(seconds);
    const visit = Math.floor(step / 4);
    const phase = step % 4;
    const patch = patches[visitOrder[visit]];
    const written = new Set(visitOrder.slice(0, visit + (phase >= 2 ? 1 : 0)));
    const expectedOutput = patches.map((item, i) => written.has(i) ? numberText(item.sum) : "·");
    assert.equal(context.step, step);
    near(context.time, seconds);
    assert.deepEqual(context.values("products"), phase === 0 ? Array(9).fill("·") : patch.products.map(numberText), `products at step ${step}`);
    assert.deepEqual(context.values("output"), expectedOutput, `partial output at step ${step}`);
    assert.deepEqual(context.cells("output").map(cell => cell.classList.contains("is-written")),
      patches.map((_, i) => written.has(i)));
    assert.deepEqual(context.cells("output").map(cell => cell.classList.contains("is-active")),
      patches.map((_, i) => i === visitOrder[visit]));
    assert.equal(context.query('[data-matrix="output"]').getAttribute("aria-label"),
      `Output, by row: ${expectedOutput.map(value => value === "·" ? "not computed" : value).join(", ")}.`);
    assert.equal(context.query(".conv-excerpt__window").style.left, `${patch.col * 25}%`);
    assert.equal(context.query(".conv-excerpt__window").style.top, `${patch.row * 25}%`);
    assert.match(context.query('[data-matrix="input"]').getAttribute("aria-label"),
      new RegExp(`row ${patch.row + 1}, column ${patch.col + 1}`));
    assert.equal(context.query(".conv-excerpt__stages .is-current").textContent, phases[phase]);
    assert.equal(context.root.querySelectorAll(".conv-excerpt__stages .is-current").length, 1);
    assert.equal(context.query('input[type="range"]').getAttribute("aria-valuetext"),
      `${displayTime(seconds)} of 0:40. Step ${step + 1} of 16. ${phases[phase]}. Patch ${visit + 1} of 4.`);
    assert.equal(context.query("#convolution-time").textContent, `${displayTime(seconds)} / 0:40`);
    if (phase >= 2) {
      assert.equal(context.query(".conv-excerpt__calculation").textContent,
        `${patch.products.map(numberText).join(" + ")} = ${numberText(patch.sum)}`);
      assert.equal(context.query(".conv-excerpt__calculation strong").textContent, numberText(patch.sum));
    } else {
      assert.equal(context.query(".conv-excerpt__calculation strong"), null);
    }
    assert.deepEqual(context.values("kernel"), kernelValues, "guidance never changes a fixed weight");
    assert.deepEqual(context.values("input"), inputValues);
    assertStopped(context, step);
  }
  assert.deepEqual(context.values("output"), patches.map(patch => numberText(patch.sum)));
  assert.deepEqual(context.values("kernel"), ["−1", "0", "1", "−2", "0", "2", "−1", "0", "1"]);
  context.seek(40);
  assertButtonName(context.button("play"), "Replay");
  assert.equal(context.query("#convolution-time").textContent, "0:40 / 0:40");
});

test("Multiply rays join one matching input and kernel position to its product in every patch", async t => {
  const context = await initialized(t);
  assert.equal(context.query("select[data-component]"), null,
    "the rays replace the position dropdown instead of adding another control");
  const rays = context.query(".conv-excerpt__rays");
  assert.equal(rays.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(rays.getAttribute("aria-hidden"), "true");
  assert.equal(rays.getAttribute("focusable"), "false");
  assert(context.query(".conv-excerpt__grids").contains(rays));
  const input = context.values("input").map(Number);
  const kernel = context.values("kernel").map(value => Number(value.replace("−", "-")));
  const patches = reference(context);
  const visitOrder = [0, 1, 3, 2];
  for (let visit = 0; visit < 4; visit++) {
    const patch = patches[visitOrder[visit]];
    context.seek((visit * 4 + 1) * 2.5);
    const inputIndex = 4 * patch.row + patch.col + 2;
    for (const [name, selected] of [["input", inputIndex], ["kernel", 2], ["products", 2]]) {
      assert.deepEqual(context.cells(name).map(cell => cell.classList.contains("is-component")),
        context.cells(name).map((_, i) => i === selected), `${name}: patch ${visit}`);
    }
    assert.equal(rays.querySelectorAll("path[data-ray]").length, 3);
    for (const [kind, from, to] of [
      ["input", `input:${inputIndex}`, "multiply"],
      ["kernel", "kernel:2", "multiply"],
      ["product", "multiply", "products:2"],
    ]) {
      const ray = rays.querySelector(`path[data-ray="${kind}"]`);
      assert(ray, `${kind} ray exists in patch ${visit}`);
      assert.equal(ray.dataset.from, from);
      assert.equal(ray.dataset.to, to);
      assert.match(ray.getAttribute("d"), /^M/);
      assert.doesNotMatch(ray.getAttribute("d"), /NaN|Infinity|undefined/);
    }
    assert.equal(rays.querySelector('[data-operation="multiply"]').textContent.trim(), "×");
    assert.match(context.query(".conv-excerpt__caption").textContent,
      new RegExp(`input \\(${patch.row + 1}, ${patch.col + 3}\\).*kernel \\(1, 3\\).*product \\(1, 3\\)`),
      "the caption states the same coordinate mapping without relying on rays or color");
    assert.match(context.query(".conv-excerpt__caption").textContent, /predict.*sum/i,
      "the ray preview does not reveal the sum before the next phase");
    assert(context.query(".conv-excerpt__calculation").textContent.includes(
      `${numberText(input[inputIndex])} × ${numberText(kernel[2])} = ${numberText(patch.products[2])}`));
    assert.deepEqual(context.values("products"), patch.products.map(numberText));
    assert.deepEqual(context.values("input").map(Number), input);
    assert.deepEqual(context.values("kernel").map(value => Number(value.replace("−", "-"))), kernel);
  }
});

test("Sum rays collect all nine products into the correct output without dropping zero terms", async t => {
  const context = await initialized(t);
  const patches = reference(context);
  const visitOrder = [0, 1, 3, 2];
  for (let visit = 0; visit < 4; visit++) {
    context.seek((visit * 4 + 2) * 2.5);
    const rays = context.query(".conv-excerpt__rays");
    const terms = [...rays.querySelectorAll('path[data-ray="term"]')];
    assert.equal(rays.querySelectorAll("path[data-ray]").length, 10);
    assert.deepEqual(terms.map(ray => Number(ray.dataset.term)).sort((a, b) => a - b),
      Array.from({ length: 9 }, (_, index) => index));
    for (const ray of terms) {
      assert.equal(ray.dataset.from, `products:${ray.dataset.term}`);
      assert.equal(ray.dataset.to, "sum");
      assert.match(ray.getAttribute("d"), /^M/);
      assert.doesNotMatch(ray.getAttribute("d"), /NaN|Infinity|undefined/);
    }
    const output = rays.querySelector('path[data-ray="output"]');
    assert.equal(output.dataset.from, "sum");
    assert.equal(output.dataset.to, `output:${visitOrder[visit]}`);
    assert.equal(rays.querySelector('[data-operation="sum"]').textContent.trim(), "+");
    const patch = patches[visitOrder[visit]];
    assert.equal(context.query(".conv-excerpt__calculation").textContent,
      `${patch.products.map(numberText).join(" + ")} = ${numberText(patch.sum)}`,
      "the text alternative retains every term and its result independently of SVG");
    assert.match(context.query(".conv-excerpt__caption").textContent,
      new RegExp(`row ${patch.row + 1}, column ${patch.col + 1}`));
  }
});

test("placing and sliding clear every ray, operation node, and component outline", async t => {
  const context = await initialized(t);
  for (let visit = 0; visit < 4; visit++) {
    for (const phase of [0, 3]) {
      context.seek((visit * 4 + 2) * 2.5);
      context.seek((visit * 4 + phase) * 2.5 + 1);
      assert.equal(context.query(".conv-excerpt__rays").children.length, 0,
        `no stale rays remain in phase ${phase}, patch ${visit}`);
      assert.equal(context.query(".conv-excerpt__calculation").querySelectorAll("[data-term].is-component").length, 0);
      for (const name of ["input", "kernel", "products"]) {
        assert.equal(context.cells(name).filter(cell => cell.classList.contains("is-component")).length, 0,
          `${name}: no stale component outline during phase ${phase}, patch ${visit}`);
      }
    }
  }
});

for (const resizeObserver of [false, true]) {
  test(`rays follow responsive geometry while paused (${resizeObserver ? "ResizeObserver" : "resize fallback"})`, async t => {
    const context = await initialized(t, { resizeObserver });
    for (const seconds of [2.5, 5]) {
      context.resize(800);
      context.seek(seconds);
      const paths = () => [...context.query(".conv-excerpt__rays").querySelectorAll("path[data-ray]")]
        .map(ray => ({ from: ray.dataset.from, to: ray.dataset.to, d: ray.getAttribute("d") }));
      const before = paths();
      const values = ["input", "kernel", "products", "output"].map(name => context.values(name));
      context.resize(360);
      const after = paths();
      assert.equal(after.length, before.length);
      assert.deepEqual(after.map(({ from, to }) => [from, to]), before.map(({ from, to }) => [from, to]),
        "layout changes geometry, not the arithmetic mapping");
      assert.notDeepEqual(after.map(ray => ray.d), before.map(ray => ray.d),
        "paths must be remeasured for narrower cards, not frozen pixel coordinates");
      after.forEach(ray => assert.doesNotMatch(ray.d, /NaN|Infinity|undefined/));
      assert.deepEqual(["input", "kernel", "products", "output"].map(name => context.values(name)), values);
      near(context.time, seconds);
      assertStopped(context);
    }
  });
}

test("keyboard stepping, Home, and range seeking replace extra transport buttons and stop playback", async t => {
  const context = await initialized(t);
  context.key("ArrowLeft");
  assert.equal(context.step, 0);
  context.key("ArrowRight");
  assert.equal(context.step, 1);
  context.key("ArrowLeft");
  assert.equal(context.step, 0);
  for (const [action, expected] of [
    [() => context.key("ArrowRight"), 15],
    [() => context.key("ArrowLeft"), 10],
    [() => context.key("Home"), 0],
    [() => context.seek(30.25), 30.25],
  ]) {
    context.seek(12.5);
    context.button("play").click();
    assert.equal(context.clock.size, 1);
    action();
    near(context.time, expected);
    assert.equal(context.query('input[type="range"]').value, String(expected));
    assertStopped(context, Math.floor(expected / 2.5));
  }
  context.seek(37.5);
  context.key("ArrowRight");
  near(context.time, 40);
  assertStopped(context, 15);
  context.seek(13.25);
  context.key("ArrowLeft");
  near(context.time, 10.75, "Left seeks back exactly one phase duration from fractional time");
  context.key("ArrowLeft");
  near(context.time, 8.25, "repeated Left keeps the fractional playhead position");
  context.key("Home");
  assert.deepEqual(context.values("output"), Array(4).fill("·"));
  assert.deepEqual(context.values("products"), Array(9).fill("·"));
  assertStopped(context, 0);
});

test("Play starts only on request, pauses, stops at the end, and Replay restarts at zero", async t => {
  const context = await initialized(t);
  assertStopped(context, 0);
  context.button("play").click();
  assert.equal(context.step, 0, "Play leaves time to read the first stage");
  assert.equal(context.clock.size, 1);
  assertButtonName(context.button("play"), "Pause");
  assert.equal(context.button("play").dataset.state, "pause");
  context.clock.advance(2499);
  assert.equal(context.step, 0);
  near(context.time, 2.499);
  context.clock.advance(1);
  assert.equal(context.step, 1);
  context.clock.advance(2500);
  assert.equal(context.step, 2);
  context.clock.advance(750);
  context.button("play").click();
  near(context.time, 5.75);
  assertStopped(context, 2);
  context.button("play").click();
  context.clock.advance(500);
  near(context.time, 6.25, "resuming does not reset the fractional phase");
  context.clock.advance(100000);
  assert.equal(context.step, 15);
  near(context.time, 40);
  assertButtonName(context.button("play"), "Replay");
  assertStopped(context, 15);
  context.button("play").click();
  assert.equal(context.step, 0);
  assert.deepEqual(context.values("output"), Array(4).fill("·"));
  assert.deepEqual(context.values("products"), Array(9).fill("·"));
  assert.equal(context.clock.size, 1);
  assertButtonName(context.button("play"), "Pause");
  context.clock.advance(2500);
  assert.equal(context.step, 1);
  context.key("Home");
  near(context.time, 0);
  assertStopped(context, 0);
  context.button("play").click();
  assert.equal(context.clock.size, 1, "Home then Play restarts with exactly one pending frame");
  context.clock.advance(1250);
  near(context.time, 1.25);
});

for (const reason of ["close", "Escape", "visibility", "pagehide"]) {
  test(`playback pauses on ${reason} and does not restart itself`, async t => {
    const context = await initialized(t);
    context.button("play").click();
    context.clock.advance(5750);
    assert.equal(context.step, 2);
    if (reason === "close") await context.toggle(false);
    if (reason === "Escape") context.key("Escape", context.button("play"));
    if (reason === "visibility") context.visibility(true);
    if (reason === "pagehide") context.window.dispatchEvent(new context.window.Event("pagehide"));
    assertStopped(context, 2);
    if (reason === "close") await context.toggle(true);
    if (reason === "visibility") context.visibility(false);
    if (reason === "pagehide") context.window.dispatchEvent(new context.window.Event("pageshow"));
    assertStopped(context, 2);
    context.button("play").click();
    context.clock.advance(2500);
    assert.equal(context.step, 3, "an explicit Play can resume from the preserved stage");
    near(context.time, 8.25);
  });
}

test("evaluating the player twice preserves state without duplicating controls or listeners", async t => {
  const context = await initialized(t);
  context.seek(15);
  const markup = context.root.innerHTML;
  context.evaluatePlayer();
  assert.equal(context.step, 6);
  assert.equal(context.root.innerHTML, markup);
  context.key("ArrowRight");
  assert.equal(context.step, 7, "one key press advances one stage");
  context.button("play").click();
  assert.equal(context.clock.size, 1, "one click starts exactly one animation frame");
  context.evaluatePlayer();
  assert.equal(context.clock.size, 1);
  context.clock.advance(2500);
  assert.equal(context.step, 8);
  context.button("play").click();
  assertStopped(context, 8);
});

test("speed choices preserve position, apply immediately, and never start playback themselves", async t => {
  const context = await initialized(t);
  assert.deepEqual([...context.query("select[data-speed]").options].map(option => option.value),
    ["0.5", "1", "1.5", "2"]);
  context.seek(7.75);
  for (const speed of [0.5, 1, 1.5, 2]) {
    context.speed(speed);
    near(context.time, 7.75);
    assertStopped(context, 3);
  }
  context.speed(0.5);
  context.button("play").click();
  context.clock.advance(1000);
  near(context.time, 8.25);
  context.speed(2);
  near(context.time, 8.25, "changing speed cannot jump the playhead");
  assert.equal(context.clock.size, 1);
  context.clock.advance(1000);
  near(context.time, 10.25, "new speed applies to the next elapsed interval");
  context.speed(1.5);
  context.clock.advance(1000);
  near(context.time, 11.75);
  context.speed("unsupported");
  context.clock.advance(1000);
  near(context.time, 12.75, "invalid values use a safe 1x rate");
});

test("elapsed time, not frame count, owns playback and partial-frame pause", async t => {
  const context = await initialized(t);
  context.button("play").click();
  context.clock.frame(5250);
  near(context.time, 5.25, "one delayed frame advances by its actual elapsed time");
  assert.equal(context.step, 2);
  context.clock.elapseWithoutFrame(125);
  context.button("play").click();
  near(context.time, 5.375, "Pause records time since the last frame as well");
  assertStopped(context, 2);
  context.button("play").click();
  context.clock.elapseWithoutFrame(125);
  context.speed(2);
  near(context.time, 5.5, "the old rate owns time before the rate switch");
  context.clock.frame(500);
  near(context.time, 6.5, "the new rate owns time after the rate switch");
  context.clock.frame(100000);
  near(context.time, 40, "a delayed frame cannot run past the endpoint");
  assertStopped(context, 15);
});

test("the window slides continuously right, down, and left, and pause freezes its geometry", async t => {
  const context = await initialized(t);
  const box = context.query(".conv-excerpt__window");
  for (const [time, left, top] of [
    [7.5, 0, 0], [8.75, 12.5, 0], [10, 25, 0],
    [17.5, 25, 0], [18.75, 25, 12.5], [20, 25, 25],
    [27.5, 25, 25], [28.75, 12.5, 25], [30, 0, 25],
    [38.75, 0, 25], [40, 0, 25],
  ]) {
    context.seek(time);
    near(parseFloat(box.style.left), left, `left at ${time}s`);
    near(parseFloat(box.style.top), top, `top at ${time}s`);
    assertStopped(context);
  }
  context.seek(8);
  context.button("play").click();
  context.clock.advance(500);
  context.button("play").click();
  near(context.time, 8.5);
  near(parseFloat(box.style.left), 10);
  assertStopped(context, 3);
});

test("reduced motion retains explicit timed playback without sliding interpolation", async t => {
  const context = await initialized(t, { reducedMotion: true });
  context.seek(8.75);
  const box = context.query(".conv-excerpt__window");
  assert.equal(box.style.left, "0%");
  assert.equal(box.style.top, "0%");
  context.button("play").click();
  context.clock.advance(1250);
  near(context.time, 10);
  assert.equal(box.style.left, "25%");
  assert.equal(box.style.top, "0%");
  assert.equal(context.clock.size, 1);
});

test("focused-player keyboard shortcuts toggle and seek without taking over native controls", async t => {
  const context = await initialized(t);
  const surface = context.query(".conv-excerpt__player");
  assert.equal(surface.getAttribute("tabindex"), "0");
  surface.focus();
  assert.equal(context.key(" ").defaultPrevented, true);
  assert.equal(context.clock.size, 1);
  context.clock.advance(1250);
  assert.equal(context.key("k").defaultPrevented, true);
  near(context.time, 1.25);
  assertStopped(context, 0);
  context.key("ArrowRight");
  near(context.time, 3.75);
  assertStopped(context, 1);
  context.key("ArrowLeft");
  near(context.time, 1.25);
  context.key("ArrowLeft");
  near(context.time, 0);
  context.key("End");
  near(context.time, 40);
  context.key("ArrowRight");
  near(context.time, 40);
  context.key("Home");
  near(context.time, 0);

  for (const control of [context.button("play"), context.query('input[type="range"]'),
    context.query("select[data-speed]")]) {
    control.focus();
    for (const key of [" ", "k", "ArrowRight", "ArrowLeft", "Home", "End"]) {
      assert.equal(context.key(key, control).defaultPrevented, false, `${key} remains owned by ${control.tagName}`);
      near(context.time, 0);
      assert.equal(context.clock.size, 0);
    }
  }
  context.button("play").click();
  context.clock.advance(1250);
  context.key("Escape", context.query("select[data-speed]"));
  near(context.time, 1.25);
  assertStopped(context, 0);
});

test("native fullscreen toggles only the player and exit pauses its preserved time", async t => {
  const context = await initialized(t, { fullscreen: "success" });
  assert.equal(context.button("fullscreen").hidden, false);
  assertButtonName(context.button("fullscreen"), "Fullscreen");
  assert.equal(context.document.fullscreenElement, null);
  context.button("fullscreen").click();
  await Promise.resolve();
  assert.equal(context.fullscreenRequests, 1);
  assert.equal(context.document.fullscreenElement, context.query(".conv-excerpt__player"));
  assertButtonName(context.button("fullscreen"), "Exit fullscreen");
  assertStopped(context, 0);
  context.button("play").click();
  context.clock.advance(1250);
  context.button("fullscreen").click();
  await Promise.resolve();
  assert.equal(context.document.fullscreenElement, null);
  assertButtonName(context.button("fullscreen"), "Fullscreen");
  assert.equal(context.fullscreenRequests, 1);
  near(context.time, 1.25);
  assertStopped(context, 0);
});

test("without native fullscreen, Expand uses a modal and restores the same player and focus", async t => {
  const context = await initialized(t);
  const button = context.button("fullscreen");
  const surface = context.query(".conv-excerpt__player");
  const originalParent = surface.parentElement;
  const dialog = context.query(".conv-excerpt__dialog");
  assert.equal(button.hidden, false);
  assertButtonName(button, "Expand");
  assert.equal(dialog.open, false);
  context.seek(8.75);
  button.focus();
  button.click();
  assert.equal(dialog.open, true);
  assert.equal(surface.parentElement, dialog);
  assert.equal(surface.classList.contains("is-expanded"), true);
  assertButtonName(button, "Exit expanded view");
  near(context.time, 8.75);
  assertStopped(context, 3);
  context.button("play").click();
  context.clock.advance(500);
  button.click();
  assert.equal(dialog.open, false);
  assert.equal(surface.parentElement, originalParent);
  assert.equal(surface.nextElementSibling, dialog);
  assert.equal(surface.classList.contains("is-expanded"), false);
  assertButtonName(button, "Expand");
  assert.equal(context.document.activeElement, button);
  near(context.time, 9.25);
  assertStopped(context, 3);
});

for (const reason of ["Escape", "close disclosure"]) {
  test(`expanded-view ${reason} pauses and restores the in-page player`, async t => {
    const context = await initialized(t);
    const surface = context.query(".conv-excerpt__player");
    const originalParent = surface.parentElement;
    const dialog = context.query(".conv-excerpt__dialog");
    context.button("fullscreen").click();
    context.button("play").click();
    context.clock.advance(1250);
    if (reason === "Escape") context.dismissDialog();
    else await context.toggle(false);
    assert.equal(dialog.open, false);
    assert.equal(surface.parentElement, originalParent);
    assert.equal(surface.classList.contains("is-expanded"), false);
    near(context.time, 1.25);
    assertStopped(context, 0);
  });
}

test("a rejected fullscreen request reports status without losing the readable player", async t => {
  const context = await initialized(t, { fullscreen: "reject" });
  context.seek(13.25);
  context.button("fullscreen").click();
  await new Promise(resolve => context.window.setTimeout(resolve, 0));
  assert.equal(context.fullscreenRequests, 1);
  assert.equal(context.document.fullscreenElement, null);
  const notice = context.query(".conv-excerpt__notice");
  assert.equal(notice.getAttribute("role"), "status");
  assert(notice.textContent.trim().length > 0, "fullscreen failure must not be silent");
  assert.equal(context.query(".conv-excerpt__controls").hidden, false);
  near(context.time, 13.25);
  assertStopped(context, 5);
});

test("the transport exposes no pressed state and follows data-state instead", async t => {
  const context = await initialized(t);
  const controls = context.query(".conv-excerpt__controls");
  assert.equal(controls.querySelectorAll("[aria-pressed]").length, 0,
    "buttons whose accessible name changes are actions, not toggles");
  assert.equal(context.button("play").dataset.state, "play");
  context.button("play").click();
  assert.equal(context.button("play").dataset.state, "pause");
  context.button("play").click();
  assert.equal(context.button("play").dataset.state, "play");
  context.seek(40);
  assert.equal(context.button("play").dataset.state, "replay");
  assert.equal(controls.querySelectorAll("[aria-pressed]").length, 0);
});

test("Expand flips the fullscreen button between data-state expand and contract", async t => {
  const context = await initialized(t);
  const button = context.button("fullscreen");
  const dialog = context.query(".conv-excerpt__dialog");
  assert.equal(button.dataset.state, "expand");
  button.click();
  assert.equal(dialog.open, true);
  assert.equal(button.dataset.state, "contract");
  assert.equal(button.getAttribute("aria-pressed"), null);
  button.click();
  assert.equal(dialog.open, false);
  assert.equal(button.dataset.state, "expand");
});

test("native fullscreen flips the fullscreen button between expand and contract", async t => {
  const context = await initialized(t, { fullscreen: "success" });
  const button = context.button("fullscreen");
  assert.equal(button.dataset.state, "expand");
  button.click();
  await Promise.resolve();
  assert.equal(context.document.fullscreenElement, context.query(".conv-excerpt__player"));
  assert.equal(button.dataset.state, "contract");
  button.click();
  await Promise.resolve();
  assert.equal(context.document.fullscreenElement, null);
  assert.equal(button.dataset.state, "expand");
  assert.equal(button.getAttribute("aria-pressed"), null);
});

test("one declared duration fills the scrubber range, the clock, and the readout", async t => {
  const context = await initialized(t);
  const slider = context.query('input[type="range"]');
  // 16 phases of 2.5 s. The player computes it; no literal 40 remains in the markup path.
  assert.equal(context.root.dataset.duration, "40");
  assert.equal(slider.max, context.root.dataset.duration);
  assert.equal(context.query("[data-duration]").textContent, " / 0:40");
  assert.equal(context.query("[data-elapsed]").textContent, "0:00");
  context.seek(40);
  assert.match(slider.getAttribute("aria-valuetext"), /^0:40 of 0:40\. /);
  assert.equal(context.query("#convolution-time").textContent, "0:40 / 0:40");
});

test("the convolution pane declares no beats, so arrows keep the fixed 2.5 s step", async t => {
  const context = await initialized(t);
  assert.equal(context.query(".conv-excerpt__player").dataset.beats, undefined);
  for (const expected of [2.5, 5, 7.5, 10]) {
    context.key("ArrowRight");
    near(context.time, expected);
  }
  for (const expected of [7.5, 5]) {
    context.key("ArrowLeft");
    near(context.time, expected);
  }
  assertStopped(context, 2);
  // No `data-beats` means the fixture audit's beat comparison skips this scene, so the
  // manifest's beat list is bound here instead: it must mirror the grid the player plays.
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "interactives", "manifest.json"), "utf8"));
  const scene = manifest.scenes.find(entry => entry.id === "convolution-excerpt");
  assert(scene, "the manifest must still carry the convolution scene");
  const constant = name => {
    const found = player.match(new RegExp(`const ${name} = (\\d+(?:\\.\\d+)?);`));
    assert(found, `interactives/convolution/player.js no longer defines ${name}`);
    return Number(found[1]);
  };
  const lastStep = constant("lastStep");
  const phaseSeconds = constant("phaseSeconds");
  assert.deepEqual(scene.beats, Array.from({ length: lastStep + 1 }, (_, index) => index * phaseSeconds));
  assert.equal(scene.duration, (lastStep + 1) * phaseSeconds);
});

test("the step is announced once, by the scrubber, with no second describing label", async t => {
  const context = await initialized(t);
  const slider = context.query('input[type="range"]');
  assert.equal(slider.getAttribute("aria-describedby"), null,
    "the scrubber's own aria-valuetext is the announcement; a description would repeat it");
  assert.equal(context.document.getElementById("convolution-step-label"), null);
  assert.equal(context.root.querySelectorAll("[aria-describedby]").length, 1,
    "only the player pane still points at the keyboard help");
  assert.equal(context.query(".conv-excerpt__player").getAttribute("aria-describedby"), "convolution-keyboard");
  assert.equal(context.query('label[for="convolution-step"]').textContent, "Playback position");
  for (const step of [0, 3, 7, 15]) {
    context.seek(step * 2.5);
    assert.match(slider.getAttribute("aria-valuetext"), /Step \d+ of 16/);
    assert.equal(slider.getAttribute("aria-valuetext").match(/Step \d+ of 16/g).length, 1);
    assert.match(slider.getAttribute("aria-valuetext"), new RegExp(`Step ${step + 1} of 16`));
  }
  assert.doesNotMatch(panel, /convolution-step-label/,
    "the sr-only step label is gone from the static markup too");
  assert.doesNotMatch(player, /convolution-step-label/);
});

test("a link to the transcript opens the excerpt and the transcript, still paused", async t => {
  const context = fixture(t, "#convolution-transcript");
  const transcript = context.query("#convolution-transcript");
  assert.equal(transcript.tagName, "DETAILS");
  assert.equal(transcript.open, false);
  assert.equal(context.root.open, false);
  // Assert synchronously, so a regression fails here instead of hanging on the toggle.
  const toggled = new Promise(resolve => context.root.addEventListener("toggle", resolve, { once: true }));
  context.evaluateLoader();
  assert.equal(context.root.open, true);
  assert.equal(transcript.open, true, "every details between the root and the target opens");
  assert.equal(context.scripts().length, 1);
  await toggled;
  context.completeLoad();
  assert.match(transcript.textContent, /weights never change/);
  assertStopped(context, 0);
});

test("any hash inside the excerpt opens it; a hash outside or unresolved never does", async t => {
  const context = fixture(t);
  context.evaluateLoader();
  const navigate = hash => {
    context.window.history.replaceState(null, "", hash);
    context.window.dispatchEvent(new context.window.HashChangeEvent("hashchange"));
  };
  for (const hash of ["#unrelated-section", "#convolution-step-label", "#"]) {
    navigate(hash);
    assert.equal(context.root.open, false, `${hash} resolves to nothing inside the excerpt`);
    assert.equal(context.scripts().length, 0);
  }
  // A descendant that is not itself a disclosure still opens the root.
  const toggled = new Promise(resolve => context.root.addEventListener("toggle", resolve, { once: true }));
  navigate("#convolution-keyboard");
  assert.equal(context.root.open, true);
  await toggled;
  assert.equal(context.query("#convolution-transcript").open, false,
    "only the disclosures on the path to the target open");
  assert.equal(context.scripts().length, 1);
  context.completeLoad();
  assertStopped(context, 0);
});

test("the panel names its fixed weights as the manuscript's vertical Sobel detector", async t => {
  const context = fixture(t);
  const kernelCard = context.query('[data-matrix="kernel"]').closest(".conv-excerpt__card");
  const intro = context.query(".conv-excerpt__intro").textContent;
  // Read before any script runs: the static fallback carries the name.
  assert.match(intro, /vertical Sobel edge detector/);
  assert.match(intro, /filter zoo below/, "the panel is injected above that section's heading");
  assert.match(kernelCard.querySelector(".conv-excerpt__label").textContent, /vertical Sobel/);
  assert.match(context.query('[data-matrix="kernel"]').getAttribute("aria-label"), /vertical Sobel/);
  assert.doesNotMatch(intro + kernelCard.textContent, /learn|train/i,
    "naming the detector must not imply the weights were learned");
  // True to the manuscript: these are the nine weights the filter zoo prints.
  const chapter = fs.readFileSync(path.join(__dirname, "..", "chapters", "part2", "07-filters-convolution.qmd"), "utf8");
  assert(chapter.includes('"Sobel (vert.)": torch.tensor([[-1., 0., 1.], [-2., 0., 2.], [-1., 0., 1.]])'));
  assert.deepEqual(context.values("kernel"), ["−1", "0", "1", "−2", "0", "2", "−1", "0", "1"]);
  assert.match(chapter, /^## The filter zoo$/m);
  // The player never rewrites either name while it runs.
  const running = await initialized(t);
  const label = () => running.query('[data-matrix="kernel"]').closest(".conv-excerpt__card")
    .querySelector(".conv-excerpt__label").textContent;
  const before = label();
  running.seek(37.5);
  assert.equal(label(), before);
  assert.match(running.query('[data-matrix="kernel"]').getAttribute("aria-label"), /vertical Sobel/);
});

test("integration: the excerpt is HTML-only, keyed on one heading, and declared in the config", () => {
  const filter = fs.readFileSync(path.join(__dirname, "..", "filters", "convolution-excerpt.lua"), "utf8");
  assert.match(filter, /^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/,
    "the non-HTML guard is the first executable line, so the PDF is untouched");
  assert.match(filter, /07%-filters%-convolution%.qmd\$/);
  assert.match(filter, /== "The filter zoo"/);
  assert.match(filter, /pandoc\.RawBlock\("html",[\s\S]*?\), header\}/,
    "the panel is inserted above the heading it names");
  assert.match(filter, /assert\(inserted == 1/);
  const config = fs.readFileSync(path.join(__dirname, "..", "_quarto.yml"), "utf8");
  const section = (key, text) => {
    const start = text.indexOf(`\n${key}`);
    assert(start >= 0, `${key} is missing from _quarto.yml`);
    const rest = text.slice(start + 1 + key.length);
    const end = rest.search(/\n\S/);
    return end < 0 ? rest : rest.slice(0, end);
  };
  assert.match(section("  resources:", config), /^\s+- interactives\/convolution\/player\.js$/m);
  const filters = section("filters:", config);
  for (const name of ["filters/convolution-excerpt.lua", "filters/mechanism-excerpts.lua"])
    assert.match(filters, new RegExp(`^\\s+- ${name.replace(/[/.]/g, "\\$&")}$`, "m"), `${name} must run`);
});

test("the scrubber names the step without repeating the live caption", async t => {
  const context = await initialized(t);
  const caption = context.query(".conv-excerpt__caption");
  const slider = context.query('input[type="range"]');
  for (let step = 0; step < 16; step++) {
    for (const seconds of [step * 2.5, step * 2.5 + 1.25]) {
      context.seek(seconds);
      const spoken = caption.textContent.trim();
      const valuetext = slider.getAttribute("aria-valuetext");
      assert(spoken.length > 0, `no caption at ${seconds}s`);
      assert(!valuetext.includes(spoken),
        `aria-valuetext repeats the caption at ${seconds}s:\n  caption   ${spoken}\n  valuetext ${valuetext}`);
    }
  }
});
