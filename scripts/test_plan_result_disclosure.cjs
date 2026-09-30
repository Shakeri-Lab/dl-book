#!/usr/bin/env node
// Install with: npm ci --prefix scripts/html-tests --ignore-scripts
// Run with: node --test scripts/test_plan_result_disclosure.cjs
// This executes the real HTML interaction script; no book render or training runs.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createRequire } = require("node:module");
const scopedRequire = createRequire(path.join(__dirname, "html-tests", "package.json"));
const { JSDOM } = scopedRequire("jsdom");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "plan-code-interactions.html"), "utf8")
  .replace(/^<script>\s*/, "").replace(/\s*<\/script>\s*$/, "");

function panel(id, withResults = true) {
  return `<div class="plan-code" id="${id}">
    <div class="plan"><ol><li>Construct the witness.</li>
      <li>Measure the difference.</li><li>Audit the same difference.</li></ol></div>
    <div class="cell" id="${id}-cell"><div class="sourceCode">
      <pre class="sourceCode" tabindex="0"><code class="sourceCode">
        <span id="${id}-line1"><span class="co"># [1]</span></span>
        <span id="${id}-line2">x = 1</span>
        <span id="${id}-line3"><span class="co"># [2][3]</span></span>
        <span id="${id}-line4">print(x)</span>
      </code></pre><button class="code-copy-button">Copy</button></div>
      ${withResults ? `<div class="cell-output cell-output-stdout" id="${id}-stdout"><pre>verified: 1</pre></div>
      <div class="cell-output cell-output-stderr"><pre>expected warning</pre></div>
      <div class="cell-output cell-output-display"><pre>tensor([1])</pre></div>` : ""}
      <div class="cell-output cell-output-display" id="${id}-figure"><img alt="An existing figure" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="></div>
      <div class="cell-output cell-output-display" id="${id}-table"><table><tr><td>1</td></tr></table></div>
    </div></div>`;
}

function figureOnlyPanel(id) {
  return `<div class="plan-code plan-code-wide" id="${id}">
    <div class="plan"><ol><li>Draw the figure.</li></ol></div>
    <div class="cell" id="${id}-cell"><div class="sourceCode">
      <pre class="sourceCode" tabindex="0"><code class="sourceCode">
        <span id="${id}-line1"><span class="co"># [1]</span></span>
        <span id="${id}-line2">plt.show()</span>
      </code></pre><button class="code-copy-button">Copy</button></div>
      <div class="cell-output cell-output-display" id="${id}-figure"><div id="fig-${id}" class="quarto-float quarto-figure">
        <figure class="figure"><div><img class="figure-img" alt="A plot" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="></div>
        <figcaption>Figure 1: A plot.</figcaption></figure></div></div>
      <div class="cell-output cell-output-display" id="${id}-svg"><svg viewBox="0 0 1 1"><rect width="1" height="1"/></svg></div>
      <div class="cell-output cell-output-display" id="${id}-imgtable"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="><table><tr><td>2</td></tr></table></div>
    </div>
    <style>.mechanism-excerpt { color: #263445; }</style>
    <details class="mechanism-excerpt" id="${id}-excerpt"><summary>Watch the replay</summary></details>
    <script>/* replay loader */</script>
  </div>`;
}

function fixture({ untilFound = true, javascript = true, proseWrap = false } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    ${panel("first")}${panel("second", false)}${figureOnlyPanel("third")}</body></html>`, {
    runScripts: "outside-only", pretendToBeVisual: true,
  });
  const { window } = dom;
  if (untilFound) {
    window.document.documentElement.onbeforematch = null;
  } else {
    for (let prototype = window.document.documentElement; prototype; prototype = Object.getPrototypeOf(prototype)) {
      if (Object.hasOwn(prototype, "onbeforematch")) delete prototype.onbeforematch;
    }
  }
  window.matchMedia = () => ({ matches: false });
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const computed = window.getComputedStyle.bind(window);
  window.getComputedStyle = (element) => computed(element);
  const originalOutput = window.document.getElementById("first-stdout");
  const originalMarkup = originalOutput.outerHTML;
  const originalFigureParent = window.document.getElementById("first-figure").parentElement;
  if (proseWrap) originalFigureParent.classList.add("prose-output-wrap");
  if (javascript) window.eval(script);
  const first = window.document.getElementById("first");
  const second = window.document.getElementById("second");
  const third = window.document.getElementById("third");
  return {
    dom, window, first, second, third, originalOutput, originalMarkup, originalFigureParent,
    results: first.querySelector(".plan-code-reveal-results"),
    all: first.querySelector(".plan-code-show-all"),
    steps: [...first.querySelectorAll(".plan-step-button")],
  };
}

function expectCodeClosed(context) {
  assert(context.first.classList.contains("plan-code-code-collapsed"));
  assert.equal(context.first.querySelector("pre.sourceCode").getAttribute("tabindex"), "-1");
  for (const line of context.first.querySelectorAll("code.sourceCode > span")) {
    assert.equal(line.getAttribute("hidden"), "until-found");
  }
}

test("both disclosures start closed; plain outputs move once, rich figures stay put", () => {
  const context = fixture();
  const { first, second, results, originalOutput, originalFigureParent, window } = context;
  expectCodeClosed(context);
  assert.equal(results.textContent, "Reveal results");
  assert.equal(results.getAttribute("aria-expanded"), "false");
  assert(first.classList.contains("plan-code-results-collapsed"));
  const region = first.querySelector(".plan-code-results");
  assert.equal(region.querySelectorAll(".cell-output").length, 3);
  assert.equal(window.document.querySelectorAll("#first-stdout").length, 1);
  assert.equal(region.querySelector("#first-stdout"), originalOutput);
  assert.equal(originalOutput.textContent, "verified: 1");
  assert.equal(window.document.getElementById("first-figure").parentElement, originalFigureParent);
  assert.equal(window.document.getElementById("first-table").parentElement, originalFigureParent);
  assert.equal(second.querySelector(".plan-code-reveal-results"), null);
  for (const control of [context.all, ...context.steps]) {
    assert(control.getAttribute("aria-controls").split(" ").includes(region.id));
  }
  assert.deepEqual(results.getAttribute("aria-controls").split(" "),
    [...region.querySelectorAll(".cell-output")].map(output => output.id));
  assert.equal(region.getAttribute("aria-label"), "Printed results");
  assert.equal(region.getAttribute("aria-hidden"), "true");
  context.dom.window.close();
});

// jsdom resolves the injected stylesheet, so check what it does to every
// ancestor: nothing between a figure and the page may be hidden or clipped.
function expectRendered(context, element) {
  for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
    const style = context.window.getComputedStyle(node);
    const name = node.id || node.className || node.tagName;
    assert.notEqual(style.display, "none", `${element.id}: ${name} is display:none`);
    assert(!(style.position === "absolute" && /inset\(50%\)/.test(style.clipPath)),
      `${element.id}: ${name} is clipped`);
  }
}

function expectFiguresInView(context) {
  expectRendered(context, context.window.document.getElementById("third-excerpt"));
  for (const id of ["first-figure", "second-figure", "third-figure", "third-svg"]) {
    const figure = context.window.document.getElementById(id);
    expectRendered(context, figure);
    assert.equal(figure.getAttribute("hidden"), null, `${id} must never be hidden`);
    assert.equal(figure.getAttribute("aria-hidden"), null, `${id} must stay in the accessibility tree`);
    assert(figure.classList.contains("plan-code-figure-output"));
    assert(!figure.classList.contains("plan-code-until-found-output"));
    assert(figure.parentElement.classList.contains("plan-code-figure-holder"));
  }
}

test("figures show while code is closed; source, printed text and tables stay collapsed", () => {
  const context = fixture();
  const { window, first } = context;
  expectCodeClosed(context);
  expectFiguresInView(context);
  // The table is not a plot: it collapses with the code, searchable until found.
  assert.equal(window.document.getElementById("first-table").getAttribute("hidden"), "until-found");
  assert(window.document.getElementById("first-table").classList.contains("plan-code-until-found-output"));
  // The injected clip spares the figure's cell but still clips its other children.
  const css = window.document.querySelector("style[data-plan-code-until-found]").textContent;
  assert.match(css, /\.plan-code-until-found-container:not\(\.plan-code-figure-holder\)/);
  assert.match(css, /\.plan-code-figure-holder\s*>\s*:not\(\.plan-code-figure-output\)/);
  // No figure output is named by the results control; the source controls still own the cell.
  assert(!context.results.getAttribute("aria-controls").split(" ").includes("first-figure"));
  assert(context.all.getAttribute("aria-controls").split(" ").includes("first-cell"));
  for (const control of [context.results, context.all, context.steps[1], context.all, context.steps[1]]) {
    control.click();
    expectFiguresInView(context);
  }
  window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
  expectCodeClosed(context);
  expectFiguresInView(context);
  assert.equal(first.querySelector("#first-cell > .plan-code-figure-output"), window.document.getElementById("first-figure"));
  context.dom.window.close();
});

test("a figure-only cell needs no results control and its figure never collapses", () => {
  const context = fixture();
  const { window, third } = context;
  assert(third.classList.contains("plan-code-code-collapsed"));
  assert.equal(third.querySelector(".plan-code-reveal-results"), null);
  assert(window.document.getElementById("third-cell").classList.contains("plan-code-figure-holder"));
  assert.equal(window.document.getElementById("third-line2").getAttribute("hidden"), "until-found");
  third.querySelector(".plan-code-show-all").click();
  assert(!third.classList.contains("plan-code-code-collapsed"));
  third.querySelector(".plan-code-show-all").click();
  assert(third.classList.contains("plan-code-code-collapsed"));
  expectFiguresInView(context);
  context.dom.window.close();
});

test("a replay placed after a cell stays outside the code disclosure", () => {
  const context = fixture();
  const excerpt = context.window.document.getElementById("third-excerpt");
  assert(!excerpt.classList.contains("plan-code-until-found-container"));
  assert.equal(excerpt.getAttribute("hidden"), null);
  const controls = context.third.querySelector(".plan-code-show-all").getAttribute("aria-controls").split(" ");
  assert(!controls.includes("third-excerpt"));
  assert(controls.includes("third-cell"));
  // Its stylesheet and loader are never regions: clipping would render their text.
  for (const child of context.third.querySelectorAll(":scope > style, :scope > script")) {
    assert(!child.classList.contains("plan-code-until-found-container"));
    assert(!child.id || !controls.includes(child.id));
    assert.equal(context.window.getComputedStyle(child).display, "none");
  }
  context.dom.window.close();
});

test("svg outputs count as figures; an output that also holds a table does not", () => {
  const context = fixture();
  const { window } = context;
  const svg = window.document.getElementById("third-svg");
  assert(svg.classList.contains("plan-code-figure-output"));
  expectRendered(context, svg);
  const mixed = window.document.getElementById("third-imgtable");
  assert(!mixed.classList.contains("plan-code-figure-output"));
  assert.equal(mixed.getAttribute("hidden"), "until-found");
  context.dom.window.close();
});

test("results reveal and close without changing source, plan selection, or copy focus", () => {
  const context = fixture();
  context.results.click();
  expectCodeClosed(context);
  assert.equal(context.results.getAttribute("aria-expanded"), "true");
  assert.equal(context.originalOutput.getAttribute("hidden"), null);
  assert.equal(context.first.querySelector(".plan-code-results").getAttribute("aria-hidden"), null);
  assert.equal(context.first.dataset.activePlanStep, undefined);
  assert.equal(context.first.querySelectorAll(".plan-code-line-active").length, 0);
  assert.equal(context.first.querySelector(".code-copy-button").getAttribute("tabindex"), "-1");
  context.results.click();
  expectCodeClosed(context);
  assert.equal(context.originalOutput.getAttribute("hidden"), "until-found");
  context.dom.window.close();
});

test("Show all retains its legacy behavior while results can close independently", () => {
  const context = fixture();
  context.all.click();
  assert(context.first.classList.contains("plan-code-showing-all"));
  assert(!context.first.classList.contains("plan-code-code-collapsed"));
  assert.equal(context.first.querySelector("pre.sourceCode").getAttribute("tabindex"), "0");
  assert.equal(context.results.getAttribute("aria-expanded"), "true");
  assert.equal(context.originalOutput.parentElement.id, "first-cell");
  assert.deepEqual([...context.first.querySelectorAll(".cell-output")].map(output => output.id),
    ["first-stdout", "plan-code-0-output-1", "plan-code-0-output-2", "first-figure", "first-table"]);
  assert.equal(context.first.querySelector(".plan-code-results").childElementCount, 0);
  context.results.click();
  assert(context.first.classList.contains("plan-code-showing-all"));
  assert.equal(context.results.getAttribute("aria-expanded"), "false");
  context.all.click();
  expectCodeClosed(context);
  assert.equal(context.originalOutput.parentElement.className, "plan-code-results");
  assert.equal(context.all.textContent, "Show all code");
  context.dom.window.close();
});

test("mixed stdout/figure/stdout sequences and original nodes survive every round trip", () => {
  const context = fixture();
  const { window, first } = context;
  // The first fixture supplies three printed nodes before its figure. Move the
  // figure between their origin placeholders to represent a mixed output cell.
  const figure = window.document.getElementById("first-figure");
  const origins = [...window.document.getElementById("first-cell").childNodes]
    .filter(node => node.nodeType === window.Node.COMMENT_NODE);
  origins[1].before(figure);
  for (let turn = 0; turn < 3; turn += 1) {
    context.results.click();
    expectCodeClosed(context);
    context.all.click();
    assert.deepEqual([...first.querySelectorAll(".cell-output")].map(output => output.id),
      ["first-stdout", "first-figure", "plan-code-0-output-1", "plan-code-0-output-2", "first-table"]);
    assert.equal(window.document.querySelectorAll("#first-stdout").length, 1);
    assert.equal(window.document.getElementById("first-stdout"), context.originalOutput);
    context.all.click();
  }
  context.dom.window.close();
});

test("fused markers, repeated selection, and cross-panel clearing are preserved", () => {
  const context = fixture();
  context.steps[1].click();
  const active = () => [...context.first.querySelectorAll(".plan-code-line-active")].map(x => x.id);
  assert.deepEqual(active(), ["first-line3", "first-line4"]);
  assert.equal(context.results.getAttribute("aria-expanded"), "true");
  context.steps[2].click();
  assert.deepEqual(active(), ["first-line3", "first-line4"]);
  context.steps[2].click();
  expectCodeClosed(context);
  context.results.click();
  context.second.querySelector(".plan-step-button").click();
  assert.equal(context.results.getAttribute("aria-expanded"), "false");
  context.dom.window.close();
});

test("native-search event opens matching code or just the result, then Escape clears", () => {
  const context = fixture();
  context.originalOutput.dispatchEvent(new context.window.Event("beforematch", { bubbles: true }));
  expectCodeClosed(context);
  assert.equal(context.results.getAttribute("aria-expanded"), "true");
  context.window.document.dispatchEvent(new context.window.KeyboardEvent("keydown", { key: "Escape" }));
  assert.equal(context.results.getAttribute("aria-expanded"), "false");
  context.window.document.getElementById("first-line4").dispatchEvent(
    new context.window.Event("beforematch", { bubbles: true })
  );
  assert.equal(context.first.dataset.activePlanStep, "2");
  assert.equal(context.results.getAttribute("aria-expanded"), "true");
  context.window.document.dispatchEvent(new context.window.KeyboardEvent("keydown", { key: "Escape" }));
  expectCodeClosed(context);
  context.dom.window.close();
});

test("prose outputs retain their opt-in wrapping through results/code round trips", () => {
  const context = fixture({ proseWrap: true });
  const selector = ".prose-output-wrap .cell-output-stdout pre, .cell-output-stdout.prose-output-wrap pre";
  const pre = context.originalOutput.querySelector("pre");
  assert(pre.matches(selector));
  context.results.click();
  assert(pre.matches(selector));
  expectCodeClosed(context);
  context.all.click();
  assert(pre.matches(selector));
  assert.equal(context.originalOutput.parentElement.id, "first-cell");
  context.all.click();
  context.results.click();
  assert(pre.matches(selector));
  assert.equal(context.first.querySelector("pre.sourceCode").matches(selector), false);
  context.dom.window.close();
  const ordinary = fixture();
  ordinary.results.click();
  assert.equal(ordinary.originalOutput.querySelector("pre").matches(selector), false);
  ordinary.dom.window.close();
});

test("ordinary controls work without beforematch support", () => {
  const context = fixture({ untilFound: false });
  assert(!context.window.document.documentElement.classList.contains("plan-code-supports-until-found"));
  expectFiguresInView(context);
  context.results.click();
  expectCodeClosed(context);
  expectFiguresInView(context);
  assert.equal(context.originalOutput.getAttribute("hidden"), null);
  context.steps[0].click();
  assert.equal(context.first.dataset.activePlanStep, "1");
  context.dom.window.close();
});

test("without JavaScript the canonical code/output markup is unchanged and visible", () => {
  const context = fixture({ javascript: false });
  assert.equal(context.results, null);
  assert.equal(context.originalOutput.outerHTML, context.originalMarkup);
  assert.equal(context.originalOutput.parentElement.id, "first-cell");
  assert.equal(context.first.querySelectorAll("[hidden]").length, 0);
  assert.equal(context.first.querySelector("pre.sourceCode").getAttribute("tabindex"), "0");
  context.dom.window.close();
});
