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

const pixel = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

function figureMarkup(id, kind) {
  if (kind === "none") return "";
  if (kind === "labelled") {
    // Quarto 1.10's form for a labelled figure cell: the float and its caption sit
    // inside the display output, and the #fig- anchor is the float's id.
    return `<div class="cell-output cell-output-display" id="${id}-figure">
      <div id="fig-${id}" class="quarto-float quarto-figure quarto-figure-center anchored">
      <figure class="quarto-float quarto-float-fig figure"><div aria-describedby="fig-${id}-caption">
      <img src="${pixel}" alt="A labelled figure" class="figure-img" width="10" height="5"></div>
      <figcaption id="fig-${id}-caption">Figure 1.1: A labelled figure.</figcaption></figure></div></div>`;
  }
  if (kind === "subfigures") {
    return `<div id="fig-${id}" class="quarto-float quarto-figure anchored" data-kind="subfigures">
      <figure class="quarto-float quarto-float-fig figure"><div>
      <div class="cell-output cell-output-display" id="${id}-sub-a"><img src="${pixel}" alt="Panel a"></div>
      <div class="cell-output cell-output-display" id="${id}-sub-b"><img src="${pixel}" alt="Panel b"></div>
      </div><figcaption>Figure 1.2: Two panels.</figcaption></figure></div>`;
  }
  return `<div class="cell-output cell-output-display" id="${id}-figure"><img alt="An existing figure" src="${pixel}"></div>`;
}

function panel(id, withResults = true, { figure = "plain", mixed = false } = {}) {
  const figureHtml = figureMarkup(id, figure);
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
      ${mixed ? figureHtml : ""}
      <div class="cell-output cell-output-stderr"><pre>expected warning</pre></div>
      <div class="cell-output cell-output-display"><pre>tensor([1])</pre></div>` : ""}
      ${mixed ? "" : figureHtml}
      <div class="cell-output cell-output-display" id="${id}-table"><table><tr><td>1</td></tr></table></div>
    </div></div>`;
}

function fixture({ untilFound = true, javascript = true, proseWrap = false, figure = "plain",
  mixed = false, secondFigure = "plain" } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>
    ${panel("first", true, { figure, mixed })}${panel("second", false, { figure: secondFigure })}
    <p id="after-panels">Prose after the panels.</p></body></html>`, {
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
  const originalFigureParent = window.document.getElementById("first-cell");
  if (proseWrap) originalFigureParent.classList.add("prose-output-wrap");
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

function expectFigureBelow(context, panelElement, unitId) {
  const unit = context.window.document.getElementById(unitId);
  const region = panelElement.nextElementSibling;
  assert(region.classList.contains("plan-code-figures"));
  assert.equal(unit.parentElement, region);
  assert.equal(unit.closest(".plan-code"), null);
  for (let node = unit; node; node = node.parentElement) {
    assert.equal(node.getAttribute("hidden"), null);
    assert.equal(node.getAttribute("aria-hidden"), null);
  }
  assert(!unit.classList.contains("plan-code-until-found-output"));
  return region;
}

test("both disclosures start closed; plain outputs move once, figures wait below, tables stay", () => {
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
  expectFigureBelow(context, first, "first-figure");
  expectFigureBelow(context, second, "second-figure");
  assert.equal(window.document.querySelectorAll("#first-figure").length, 1);
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
  assert.equal(context.first.nextElementSibling.childElementCount, 0);
  context.results.click();
  assert(context.first.classList.contains("plan-code-showing-all"));
  assert.equal(context.results.getAttribute("aria-expanded"), "false");
  context.all.click();
  expectCodeClosed(context);
  assert.equal(context.originalOutput.parentElement.className, "plan-code-results");
  expectFigureBelow(context, context.first, "first-figure");
  assert.equal(context.all.textContent, "Show all code");
  context.dom.window.close();
});

test("mixed stdout/figure/stdout sequences and original nodes survive every round trip", () => {
  // A mixed output cell: printed, figure, printed, printed, then a table.
  const context = fixture({ mixed: true });
  const { window, first } = context;
  for (let turn = 0; turn < 3; turn += 1) {
    context.results.click();
    expectCodeClosed(context);
    expectFigureBelow(context, first, "first-figure");
    context.all.click();
    assert.deepEqual([...first.querySelectorAll(".cell-output")].map(output => output.id),
      ["first-stdout", "first-figure", "plan-code-0-output-2", "plan-code-0-output-3", "first-table"]);
    assert.equal(first.nextElementSibling.childElementCount, 0);
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
  assert.equal(context.window.document.getElementById("first-figure").parentElement.id, "first-cell");
  assert.equal(context.window.document.querySelectorAll(".plan-code-figures").length, 0);
  context.dom.window.close();
});

test("D8: a labelled figure and caption stay visible below the closed panel, anchor included", () => {
  const context = fixture({ figure: "labelled" });
  const { window, first, results, originalOutput } = context;
  const doc = window.document;
  const float = doc.getElementById("fig-first");
  expectCodeClosed(context);
  const region = expectFigureBelow(context, first, "first-figure");
  assert.equal(float.closest(".plan-code-figures"), region);
  assert.equal(float.closest("[hidden], [aria-hidden='true'], .plan-code"), null);
  assert.equal(float.querySelector("figcaption").textContent, "Figure 1.1: A labelled figure.");
  assert.equal(region.previousElementSibling, first);
  // Printed stdout keeps today's place: behind Reveal results, closed.
  assert.equal(results.getAttribute("aria-expanded"), "false");
  assert.equal(originalOutput.parentElement.className, "plan-code-results");
  assert.equal(originalOutput.getAttribute("hidden"), "until-found");
  for (const control of [results, context.all, ...context.steps]) {
    assert(!control.getAttribute("aria-controls").split(" ").includes("first-figure"));
  }
  // A plan step opens the full listing: the figure returns under its source, after
  // the printed result, and the step highlight is unchanged.
  context.steps[2].click();
  assert.deepEqual([...first.querySelectorAll(".plan-code-line-active")].map(x => x.id),
    ["first-line3", "first-line4"]);
  assert.equal(doc.getElementById("first-figure").parentElement.id, "first-cell");
  assert.deepEqual([...first.querySelectorAll(".cell-output")].map(output => output.id),
    ["first-stdout", "plan-code-0-output-1", "plan-code-0-output-2", "first-figure", "first-table"]);
  assert.equal(region.childElementCount, 0);
  assert.equal(first.nextElementSibling, region);
  context.steps[2].click();
  expectCodeClosed(context);
  expectFigureBelow(context, first, "first-figure");
  // Native search opens the code; Escape closes it and the figure waits below again.
  doc.getElementById("first-line2").dispatchEvent(new window.Event("beforematch", { bubbles: true }));
  assert.equal(first.dataset.activePlanStep, "1");
  assert.equal(doc.getElementById("first-figure").parentElement.id, "first-cell");
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
  expectCodeClosed(context);
  expectFigureBelow(context, first, "first-figure");
  // Opening another panel leaves this panel's figure in view.
  context.second.querySelector(".plan-step-button").click();
  expectFigureBelow(context, first, "first-figure");
  assert.equal(doc.getElementById("second-figure").parentElement.id, "second-cell");
  context.dom.window.close();
});

test("D8: subfigures travel as one float; a panel without figures gains no region", () => {
  const context = fixture({ figure: "subfigures", secondFigure: "none" });
  const { window, first, second } = context;
  const doc = window.document;
  const region = expectFigureBelow(context, first, "fig-first");
  assert.equal(region.querySelectorAll(".cell-output-display").length, 2);
  assert.equal(region.querySelector("figcaption").textContent, "Figure 1.2: Two panels.");
  assert.equal(doc.getElementById("first-sub-a").getAttribute("hidden"), null);
  assert.equal(second.nextElementSibling.id, "after-panels");
  assert.equal(doc.querySelectorAll(".plan-code-figures").length, 1);
  context.all.click();
  assert.equal(doc.getElementById("fig-first").parentElement.id, "first-cell");
  assert.equal(region.childElementCount, 0);
  context.all.click();
  expectFigureBelow(context, first, "fig-first");
  context.dom.window.close();
});

test("D8: figures stay visible without beforematch support too", () => {
  const context = fixture({ untilFound: false, figure: "labelled" });
  expectCodeClosed(context);
  expectFigureBelow(context, context.first, "first-figure");
  context.steps[0].click();
  assert.equal(context.window.document.getElementById("first-figure").parentElement.id, "first-cell");
  context.steps[0].click();
  expectFigureBelow(context, context.first, "first-figure");
  context.dom.window.close();
});
