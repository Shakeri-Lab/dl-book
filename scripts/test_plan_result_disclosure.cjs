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

function fixture({ untilFound = true, javascript = true } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    ${panel("first")}${panel("second", false)}</body></html>`, {
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
  if (javascript) window.eval(script);
  const first = window.document.getElementById("first");
  const second = window.document.getElementById("second");
  return {
    dom, window, first, second, originalOutput, originalMarkup, originalFigureParent,
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

test("ordinary controls work without beforematch support", () => {
  const context = fixture({ untilFound: false });
  assert(!context.window.document.documentElement.classList.contains("plan-code-supports-until-found"));
  context.results.click();
  expectCodeClosed(context);
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
