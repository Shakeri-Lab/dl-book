import fs from 'node:fs';
const OUT = '/private/tmp/claude-502/-Users-hs9hd-Library-CloudStorage-Box-Box-Teaching-6050-Video-lectures/0098e391-13df-469b-ace0-81a7a56d1f16/scratchpad/wave2b/sb/quantization-grid-subtract';
fs.mkdirSync(OUT, { recursive: true });

const VALUES = [-1.00, -0.79, -0.54, -0.11, 0.08, 0.31, 0.72, 1.00];
const L = { left: 50, right: 810, lineY: 70, labelY: 24, dotR: 7, ghostR: 4.5, lift: 15, tickH: 16, fineH: 10,
            tickLabelY: 102, laneY: 116, laneGap: 9, errorGap: 14, basinPad: 4, bracketY: 32, bracketLeg: 9, bracketLabelY: 22 };
const W = L.right - L.left, MAX = 1;
const px = w => L.left + (w + MAX) / (2 * MAX) * W;
const n2 = v => Number(v.toFixed(2));
const f2 = v => (v < 0 ? '\u2212' : '') + Math.abs(v).toFixed(2);
const t3 = v => { const s = Math.abs(v) < 1e-9 ? '0' : Math.abs(v).toFixed(3).replace(/0+$/, '').replace(/\.$/, ''); return (v < 0 ? '\u2212' : '') + s; };

const G3 = { s: 1 / 3, Q: 3, ticks: 7 };
const G8 = { s: 1 / 127, Q: 127, ticks: 255 };
const recon = g => VALUES.map(w => Math.round(w / g.s) * g.s);
G3.recon = recon(G3); G8.recon = recon(G8);
const rank = [0, 0, 1, 0, 1, 0, 0, 0];          // stack order inside a shared tick
const COLLIDER = [1, 2, 3, 4];
const lift = L.lift;

const line = `<line x1="${L.left}" y1="${L.lineY}" x2="${L.right}" y2="${L.lineY}" class="qg-line"></line>`;
const ticks3 = () => `<path d="${[-3,-2,-1,0,1,2,3].map(q => `M${n2(px(q*G3.s))} ${L.lineY-L.tickH}V${L.lineY+L.tickH}`).join('')}" class="qg-ticks"></path>`;
const ticks8 = () => { const d = []; for (let q = -127; q <= 127; q++) d.push(`M${n2(px(q*G8.s))} ${L.lineY-L.fineH}V${L.lineY+L.fineH}`); return `<path d="${d.join('')}" class="qg-ticks is-fine"></path>`; };
const endLabels = () => `<text x="${px(-1)}" y="${L.tickLabelY}" class="qg-tick-label" text-anchor="middle">\u22121.00</text><text x="${px(1)}" y="${L.tickLabelY}" class="qg-tick-label" text-anchor="middle">1.00</text>`;
const collLabel = () => `<text x="${n2(px(-2*G3.s))}" y="${L.tickLabelY}" class="qg-tick-label is-collision" text-anchor="middle">\u22120.667</text>`;
const rings = (cls = 'qg-ring') => [-2, 0].map(code => {
  const cx = px(code * G3.s), half = lift / 2, cy = L.lineY - half, r = half + L.dotR + 4;
  return `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}" class="${cls}"></circle>`;
}).join('');
const ties = () => [[1, -2], [2, -2], [3, 0], [4, 0]].map(([i, code]) => {
  const cx = px(code * G3.s), r = lift / 2 + L.dotR + 4, x = px(G8.recon[i]);
  const side = Math.sign(x - cx) || 1;
  return `<line x1="${n2(cx + side * r)}" y1="${L.lineY}" x2="${n2(x - side * L.dotR)}" y2="${L.lineY}" class="qg-tie"></line>`;
}).join('');
const dots = (pos, stacked) => VALUES.map((w, i) =>
  `<circle cx="${n2(px(pos[i]))}" cy="${n2(L.lineY - (stacked ? rank[i] * lift : 0))}" r="${L.dotR}" class="qg-dot"></circle>`).join('');
const valueLabels = (idx, opacity) => idx.map(i =>
  `<text x="${n2(px(VALUES[i]))}" y="${L.labelY}" class="qg-value" text-anchor="middle" opacity="${opacity}">${f2(VALUES[i])}</text>`).join('');
const ghosts = idx => idx.map(i => `<circle cx="${n2(px(VALUES[i]))}" cy="${L.lineY}" r="${L.ghostR}" class="qg-ghost"></circle>`).join('');
const bars = idx => idx.map(i => {
  const y = L.laneY + rank[i] * L.laneGap;
  return `<line x1="${n2(px(VALUES[i]))}" y1="${y}" x2="${n2(px(G3.recon[i]))}" y2="${y}" class="qg-error"></line>`;
}).join('');

function svg(inner, aria) {
  return `<svg viewBox="0 0 860 176" role="img" aria-label="${aria}">${inner}</svg>`;
}

function page({ file, stage, title, question, intro, inner, aria, sliderIdx, readout, caption, clock, live, ghosted }) {
  const pct = [0.075, 0.275, 0.675, 1][sliderIdx === 3 ? 2 : 0];
  const thumb = [8.9, 50.6][0];
  const html = `<meta charset="utf-8"><title>${title}</title>
<script>window.MathJax={loader:{load:["ui/lazy"]},options:{lazyAlwaysTypeset:["head",'span[id^="eq-"]']},tex:{macros:{
 featurepart:["\\\\style{color:rgb(43,108,176)}{#1}",1],parameterpart:["\\\\style{color:rgb(192,86,33)}{#1}",1],
 targetpart:["\\\\style{color:rgb(128,90,213)}{#1}",1],predictionpart:["\\\\style{color:rgb(47,133,90)}{#1}",1],
 residualpart:["\\\\style{color:rgb(114,47,55)}{#1}",1]}}};</script>
<script defer src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"></script>
<style>
 :root{--qg-parameter:#c05621;--qg-error:#722f37;--qg-ink:#232d4b;--qg-scenery:#8994a2;--qg-faint:#d5dde5}
 body{margin:0;background:#fff;font-family:"Source Sans Pro","Segoe UI",system-ui,sans-serif;color:#1f2633;font-size:16px}
 .card{width:1100px;box-sizing:border-box;padding:26px 30px 30px;border:1px solid #dfe4ea;border-radius:10px;margin:0}
 .sum{color:#6b7480;font-weight:600;font-size:15px;margin:0 0 20px}
 h2{font-size:21px;line-height:1.32;margin:0 0 14px;color:#111a2b}
 .intro{font-size:15.5px;line-height:1.55;margin:0 0 18px;color:#2c3442}
 code{background:#f2f4f7;padding:1px 4px;border-radius:3px;font-size:14px;font-family:"SF Mono",Menlo,monospace}
 .pane{border:1px solid #e3e7ec;border-radius:9px;padding:20px 22px 14px}
 svg{display:block;width:100%;height:auto;overflow:visible;font-family:inherit}
 svg text{font-size:13px;font-variant-numeric:tabular-nums}
 .qg-line{stroke:var(--qg-scenery);stroke-width:1.5}
 .qg-ticks{fill:none;stroke:var(--qg-ink);stroke-width:2.6;stroke-linecap:round}
 .qg-ticks.is-fine{stroke-width:.75;stroke-linecap:butt;opacity:.62}
 .qg-tick-label{font-size:12px;fill:var(--qg-ink)}
 .qg-tick-label.is-collision{fill:var(--qg-error);font-weight:700}
 .qg-basin{fill:var(--qg-error);opacity:.10}
 .qg-bracket{fill:none;stroke:var(--qg-error);stroke-width:1.5}
 .qg-bracket-label{font-size:12px;fill:var(--qg-error);font-weight:600}
 .qg-value{font-size:13px;fill:var(--qg-parameter);font-weight:600}
 .qg-dot{fill:var(--qg-parameter);stroke:#fff;stroke-width:1.5}
 .qg-ghost{fill:none;stroke:var(--qg-parameter);stroke-width:1.6}
 .qg-ring{fill:none;stroke:var(--qg-error);stroke-width:1.8;stroke-dasharray:4 3}
 .qg-socket{fill:none;stroke:var(--qg-error);stroke-width:1.4;stroke-dasharray:4 3;opacity:.75}
 .qg-tie{stroke:var(--qg-error);stroke-width:1.1;stroke-dasharray:3 3;opacity:.7}
 .qg-error{stroke:var(--qg-error);stroke-width:3.4;stroke-linecap:round}
 .qg-longest{font-size:12px;fill:var(--qg-error);font-weight:700}
 .qg-stats,.qg-payload{font-size:13px;fill:var(--qg-ink)}
 .qg-slider{display:flex;align-items:center;gap:14px;margin:14px 0 2px;padding-left:110px}
 .qg-lab{color:var(--qg-parameter);font-style:italic;font-size:19px}
 .qg-track{width:430px}
 .rail{height:7px;border-radius:4px;background:#e4e8ed;position:relative}
 .fill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:var(--qg-parameter)}
 .knob{position:absolute;top:50%;width:17px;height:17px;border-radius:50%;background:var(--qg-parameter);transform:translate(-50%,-50%)}
 .stops{display:flex;justify-content:space-between;color:var(--qg-scenery);font-size:11.5px;margin-top:5px;padding:0 1px}
 .qg-out{color:var(--qg-parameter);font-size:16px}
 .fx{margin:14px 0 0;font-size:18px;padding-left:8px}
 .qg-def-s,.qg-def-Q,.qg-s,.qg-Q{transition:none}
 .dim .qg-def-s{opacity:.17}.dim .qg-def-Q{opacity:.17}
 .lit-s .qg-def-s{opacity:1}.lit-s .qg-def-Q{opacity:.17}
 .lit-Q .qg-def-Q{opacity:1}.lit-Q .qg-def-s{opacity:.17}
 .cap{margin:16px 0 0;padding:13px 16px;background:#f5f7fa;border-left:4px solid #232d4b;font-size:16.5px;color:#1f2633}
 .parameter-role{color:var(--qg-parameter);font-weight:700}
 .error-role{color:var(--qg-error);font-weight:700}
 .bar{display:flex;align-items:center;gap:14px;margin-top:14px;padding-top:12px;border-top:1px solid #edf0f3;color:#3b4554;font-size:14px}
 .play{width:0;height:0;border-left:13px solid #232d4b;border-top:8px solid transparent;border-bottom:8px solid transparent;margin-left:4px}
 .scrub{flex:1;height:7px;border-radius:4px;background:#e4e8ed;position:relative}
 .scrub .f{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:#232d4b}
 .scrub .k{position:absolute;top:50%;width:15px;height:15px;border-radius:50%;background:#232d4b;transform:translate(-50%,-50%)}
 .count{margin-left:10px;font-size:13px;color:#6b7480}
</style>
<div class="card">
 <p class="sum">\u25be Watch the mechanism: seven ticks for eight weights</p>
 <h2>${question}</h2>
 <p class="intro">${intro}</p>
 <div class="pane">
  ${svg(inner, aria)}
  <div class="qg-slider">
   <span class="qg-lab">b</span>
   <div class="qg-track">
    <div class="rail"><div class="fill" style="width:${pct * 100}%"></div><div class="knob" style="left:${pct * 100}%"></div></div>
    <div class="stops"><span>2</span><span>3</span><span>4</span><span>8</span></div>
   </div>
   <span class="qg-out"><i>b</i> = ${readout}</span>
  </div>
  <p class="fx ${stage}"><span id="eq-quantization-grid-1">\\( \\displaystyle \\widehat{w} = \\class{qg-s}{s}\\,\\operatorname{round}(\\parameterpart{w}/\\class{qg-s}{s}) \\qquad \\class{qg-def-s}{\\class{qg-s}{s} = \\frac{\\max|\\parameterpart{w}|}{\\class{qg-Q}{Q}}} \\qquad \\class{qg-def-Q}{\\class{qg-Q}{Q} = 2^{b-1}-1} \\)</span></p>
  <p class="cap">${caption}</p>
  <div class="bar"><div class="play"></div><div class="scrub"><div class="f" style="width:${clock[1] * 100}%"></div><div class="k" style="left:${clock[1] * 100}%"></div></div><span>${clock[0]} / 0:40</span><span>1.5\u00d7</span></div>
  <div class="count">live numbers on the picture: ${live}${ghosted ? ` &nbsp;\u00b7&nbsp; retired ghosts: ${ghosted}` : ''}</div>
 </div>
</div>`;
  fs.writeFileSync(`${OUT}/${file}`, html);
  console.log(file);
}

/* ---- Frame A: beat 1 (t = 3) -- the question ------------------------------------- */
page({
  file: 'beat1.html', stage: 'dim', title: 'Beat 1 -- collide',
  question: 'Eight weights, seven ticks: two pairs already share a tick. What pulls them apart?',
  intro: 'The eight weights and the 3-bit grid above are the figure\u2019s left panel: <code>values</code> rounded onto <code>grid = np.arange(-3, 4) / 3</code>. Everything else here is computed.',
  inner: ticks3() + endLabels() + line + rings() + dots(G3.recon, true) + valueLabels(COLLIDER, 1),
  aria: 'Collide. Seven ticks; eight weights already on their nearest tick. \u22120.79 and \u22120.54 share one tick; \u22120.11 and 0.08 share another.',
  sliderIdx: 1, readout: '3 bits',
  caption: 'Four different <span class="parameter-role">weights</span>, two ticks \u2014 the grid cannot tell these pairs apart.',
  clock: ['0:03', 0.075], live: 7, ghosted: 0
});

/* ---- Frame B: beat 2 (t = 11) -- how far each moved ------------------------------ */
page({
  file: 'beat2.html', stage: 'dim', title: 'Beat 2 -- rounded',
  question: 'Eight weights, seven ticks: two pairs already share a tick. What pulls them apart?',
  intro: 'The eight weights and the 3-bit grid above are the figure\u2019s left panel: <code>values</code> rounded onto <code>grid = np.arange(-3, 4) / 3</code>. Everything else here is computed.',
  inner: ticks3() + endLabels() + collLabel() + bars(COLLIDER) + ghosts(COLLIDER) + line + rings() + dots(G3.recon, true) + valueLabels(COLLIDER, 1),
  aria: 'Rounded. Each of the four weights moved to its nearest tick; two pairs landed together, at \u22120.667 and at 0.',
  sliderIdx: 1, readout: '3 bits',
  caption: 'The grid rounds each to its nearest tick; two pairs land together.',
  clock: ['0:11', 0.275], live: 8, ghosted: 0
});

/* ---- Frame C: beat 4 (t = 27) -- the payoff -------------------------------------- */
page({
  file: 'payoff.html', stage: 'lit-Q', title: 'Payoff -- open the grid',
  question: 'Eight weights, seven ticks: two pairs already share a tick. What pulls them apart?',
  intro: 'The eight weights and the 3-bit grid above are the figure\u2019s left panel: <code>values</code> rounded onto <code>grid = np.arange(-3, 4) / 3</code>. Everything else here is computed.',
  inner: ticks8() + endLabels() + `<g opacity="1">${rings('qg-socket')}</g>` + line + ties() + dots(G8.recon, false)
       + valueLabels(COLLIDER, 1)
       + `<text x="${L.left}" y="149" class="qg-stats" text-anchor="start">255 ticks</text>`,
  aria: 'Open the grid. 255 ticks; every weight has a tick of its own. No collisions. The two sockets are where the pairs stood.',
  sliderIdx: 3, readout: '8 bits',
  caption: '255 ticks instead of seven \u2014 every <span class="parameter-role">weight</span> gets a tick of its own.',
  clock: ['0:27', 0.675], live: 8, ghosted: 0
});

/* ---- Frame D: beat 5 (t = 40) -- the final hold ---------------------------------- */
page({
  file: 'final.html', stage: 'dim', title: 'Final hold -- the price',
  question: 'Eight weights, seven ticks: two pairs already share a tick. What pulls them apart?',
  intro: 'The eight weights and the 3-bit grid above are the figure\u2019s left panel: <code>values</code> rounded onto <code>grid = np.arange(-3, 4) / 3</code>. Everything else here is computed.',
  inner: ticks3() + endLabels() + line + rings() + dots(G3.recon, true)
       + valueLabels([1, 2, 3, 4, 5, 6], 0.38)
       + `<text x="${L.left}" y="149" class="qg-payload" text-anchor="start">0.375 GB per billion weights</text>`,
  aria: 'The price. Back at seven ticks the two pairs share their ticks again; three bits cost 0.375 GB per billion weights against 1 GB at eight.',
  sliderIdx: 1, readout: '3 bits',
  caption: 'Three bits <span class="error-role">merge</span> the pairs again \u2014 and cost three-eighths of eight-bit storage.',
  clock: ['0:40', 1], live: 4, ghosted: 6
});
