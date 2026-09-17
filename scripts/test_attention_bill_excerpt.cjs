#!/usr/bin/env node
// Test-only counting, geometry, and interaction checks. Nothing here is shipped.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {ROOT, read, entry, chapterSource, numbers, close, canonicalMarkup,
  fixture, registerTransportTests, registerBeatHoldTest, registerGrammarTests} = require('./html-tests/excerpt-harness.cjs');
const {staticFrame} = require('./render_static_frames.cjs');

const NAME = 'attention-bill-excerpt', scene = entry(NAME);
const widths = [240,296,360,519,520,553,599,600,713];
const attr = (node, name) => Number(node.getAttribute(name));
const declared = f => ({width:Number(f.root.dataset.imageWidth), height:Number(f.root.dataset.imageHeight),
  start:Number(f.root.dataset.patchStart), end:Number(f.root.dataset.patchEnd)});
const drawing = f => f.$('[data-drawing]');
// Count complete tile origins, then ordered query/key pairs (self-pairs included).
// This is independent of the player's product-and-square implementation. No CLS
// token is appended: the manuscript explicitly omits it from this illustration.
function count(width, height, patch) {
  assert(width > 0 && height > 0 && patch > 0);
  assert.equal(width % patch, 0); assert.equal(height % patch, 0);
  const tiles = [];
  for (let y=0;y<height;y+=patch) for (let x=0;x<width;x+=patch) tiles.push([x,y]);
  let pairs = 0;
  for (const query of tiles) for (const key of tiles) { void query; void key; pairs++; }
  return {tokens:tiles.length, entries:pairs};
}
function expected(fx) {
  const start=count(fx.width,fx.height,fx.start), end=count(fx.width,fx.height,fx.end);
  return {start,end, tokenRatio:end.tokens/start.tokens, entryRatio:end.entries/start.entries};
}
function checkCounts(f, fx) {
  const want=expected(fx), d=f.root.dataset;
  for (const [key,value] of Object.entries({startTokens:want.start.tokens,endTokens:want.end.tokens,
    startEntries:want.start.entries,endEntries:want.end.entries})) {
    assert.equal(Number(d[key]),value,key);
    assert(Number.isSafeInteger(Number(d[key])), 'shapes and cardinalities are integers, never tween values');
  }
  return want;
}
const visible = node => node && !node.closest('[hidden]');
const mark = (f,name) => drawing(f).querySelector(`[data-value="${name}"]`);
const numericText = node => node.textContent.replace(/[,\s]/g,'');
function vertices(node) {
  const items=node.getAttribute('d').match(/[MLHV]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);
  const points=[]; let x=0,y=0;
  for(let i=0;i<items.length;) {
    const command=items[i++];
    if(command==='M'||command==='L') {x=Number(items[i++]);y=Number(items[i++]);}
    else if(command==='H') x=Number(items[i++]);
    else if(command==='V') y=Number(items[i++]);
    else assert.fail(`unexpected path command ${command}`);
    points.push([x,y]);
  }
  return points;
}

// JSDOM has no text layout. As in the layernorm and SVD suites, a label's extent is a
// conservative 0.6 em per character at its declared size; browser review owns real glyphs.
function textBox(node) {
  const size=attr(node,'font-size'),length=Array.from(node.textContent).length*size*0.6;
  const x=attr(node,'x'),y=attr(node,'y'),anchor=node.getAttribute('text-anchor')||'start';
  assert(['start','middle','end'].includes(anchor));
  const before=anchor==='end'?length:anchor==='middle'?length/2:0;
  const transform=node.getAttribute('transform')||'';
  if(!transform) return {left:x-before,right:x-before+length,top:y-0.8*size,bottom:y+0.25*size};
  // The only transform the scene uses: a quarter turn about the label's own anchor.
  assert.equal(transform,`rotate(-90 ${x} ${y})`);
  return {left:x-0.8*size,right:x+0.25*size,top:y-(length-before),bottom:y+before};
}
const overlap=(a,b,gap=0)=>a.left<b.right+gap&&b.left<a.right+gap&&a.top<b.bottom+gap&&b.top<a.bottom+gap;
const rectBox=node=>({left:attr(node,'x'),right:attr(node,'x')+attr(node,'width'),
  top:attr(node,'y'),bottom:attr(node,'y')+attr(node,'height')});
// Every link segment is axis-aligned, so a segment is a degenerate box.
const segments=node=>{const p=vertices(node);return p.slice(1).map((point,i)=>({left:Math.min(p[i][0],point[0]),
  right:Math.max(p[i][0],point[0]),top:Math.min(p[i][1],point[1]),bottom:Math.max(p[i][1],point[1])}));};
const visibleTexts=f=>[...drawing(f).querySelectorAll('text')].filter(visible);

registerTransportTests(NAME,{witness:/38(?:,|\s)?416/,
  anchors:['attention-bill-playback-help'],width:713});
registerBeatHoldTest(NAME);
registerGrammarTests(NAME);

test('attention bill: the existing manuscript owns the image, patch sizes, exact counts, and insertion', t => {
  const f=fixture(t,NAME),fx=declared(f),chapter=chapterSource(NAME);
  assert.deepEqual(fx,{width:224,height:224,start:32,end:16});
  for (const literal of scene.fixture.literals) assert(chapter.includes(literal),literal);
  assert.equal(scene.qmd,'chapters/part4/16-vit-scaling.qmd');
  assert.equal(scene.anchor.type,'before-heading');
  assert.equal(scene.anchor.target,'A Fashion rematch, not a referendum');
  assert.deepEqual(scene.beats,[0,5,10,15,20,25,30,35]); assert.equal(scene.duration,40);
  assert.match(chapter,/Ignoring `\[CLS\]`/);
  assert(chapter.includes('$49^2=2{,}401$') && chapter.includes('$196^2=38{,}416$'));
  f.load(); f.open();
  assert.deepEqual(checkCounts(f,fx),{start:{tokens:49,entries:2401},end:{tokens:196,entries:38416},
    tokenRatio:4,entryRatio:16});
  assert.notEqual((49+1)**2,2401); assert.notEqual((196+1)**2,38416);
});

test('attention bill: every frame is one of the two exact patch configurations, never a morph', t => {
  const f=fixture(t,NAME),fx=declared(f); f.load(); f.open();
  for(let n=0;n<=160;n++) {
    const time=n/4; f.seek(time); const want=checkCounts(f,fx),d=f.root.dataset;
    const current=time<20?want.start:want.end,patch=time<20?fx.start:fx.end;
    assert.equal(d.transitioning,'false');
    assert.equal(Number(d.geometryFraction),time<20?0:1);
    assert.equal(Number(d.currentPatch),patch);
    assert.equal(Number(d.currentTokens),current.tokens); assert.equal(Number(d.currentEntries),current.entries);
    assert.equal(Number(d.patchRows),fx.height/patch); assert.equal(Number(d.patchColumns),fx.width/patch);
    assert.equal(Number(d.visiblePatchCount),current.tokens);
    assert.equal([...drawing(f).querySelectorAll('[data-patch-cell]')].filter(visible).length,current.tokens,
      'one actual image-grid cell for each patch, not an interpolated cardinality');
    assert.doesNotMatch(mark(f,'tokens').textContent,/resizing|between endpoints|fractional/i);
    assert.equal(Number(d.tokenRatio),4); assert.equal(Number(d.entryRatio),16);
  }
});

test('attention bill: counts and the sixteenfold answer are earned in separate reveals', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const time of [0,2.5,4.99]) {
    f.seek(time);
    assert(!visible(mark(f,'tokens'))); assert(!visible(mark(f,'entries'))); assert(!visible(mark(f,'ratio')));
    const accessible=[f.$('[data-caption]').textContent,f.$('[data-figure] svg').getAttribute('aria-label'),
      f.$('[data-controls] input[type="range"]').getAttribute('aria-valuetext')].join(' ');
    assert.doesNotMatch(accessible,/\b49\b|2,?401|38,?416|sixteen|16\s*[×x]/i);
  }
  f.seek(5); assert(visible(mark(f,'tokens'))); assert.match(numericText(mark(f,'tokens')),/49/);
  assert(!visible(mark(f,'entries')));
  f.seek(10); assert(!visible(mark(f,'entries')),'trace the token roles before counting all pairs');
  f.seek(15); assert(visible(mark(f,'entries'))); assert.match(numericText(mark(f,'entries')),/2401/);
  for(const time of [15,19.99,20,24.99,25,29.99]) {
    f.seek(time); assert(!visible(mark(f,'ratio')));
    assert.doesNotMatch(f.$('[data-caption]').textContent,/sixteen|16\s*[×x]/i);
  }
  f.seek(20);
  assert.match(numericText(mark(f,'tokens')),/196/); assert.match(numericText(mark(f,'entries')),/38416/);
  f.seek(30); assert(visible(mark(f,'ratio'))); assert.match(numericText(mark(f,'ratio')),/16/);
});

test('attention bill: changed valid image fixtures propagate through both token and ordered-pair counts', t => {
  for (const fx of [{width:192,height:128,start:32,end:16},{width:128,height:128,start:32,end:16}]) {
    const f=fixture(t,NAME);
    f.root.dataset.imageWidth=String(fx.width); f.root.dataset.imageHeight=String(fx.height);
    f.root.dataset.patchStart=String(fx.start); f.root.dataset.patchEnd=String(fx.end);
    f.load(); f.open();
    for(const time of [...scene.beats,40]) {
      f.seek(time); const want=checkCounts(f,fx),patch=time<20?fx.start:fx.end;
      const current=time<20?want.start:want.end;
      assert.equal(Number(f.root.dataset.currentTokens),current.tokens);
      assert.equal(Number(f.root.dataset.currentEntries),current.entries);
      assert.equal(Number(f.root.dataset.patchRows),fx.height/patch);
      assert.equal(Number(f.root.dataset.patchColumns),fx.width/patch);
      assert.equal([...drawing(f).querySelectorAll('[data-patch-cell]')].filter(visible).length,current.tokens);
    }
    const image=mark(f,'image').textContent;
    assert(image.includes(String(fx.width)) && image.includes(String(fx.height)), 'the pictured image dimensions follow the fixture too');
  }
});

test('attention bill: the image really tiles into seven or fourteen patches per axis', t => {
  for(const fx of [{width:224,height:224,start:32,end:16},{width:192,height:128,start:32,end:16}]) {
    const f=fixture(t,NAME);
    f.root.dataset.imageWidth=String(fx.width); f.root.dataset.imageHeight=String(fx.height);
    f.load(); f.open();
    for(const width of widths) {
      f.resize(width);
      for(const time of [0,5,10,19.99,20,25,40]) {
        f.seek(time);
        const patch=time<20?fx.start:fx.end,columns=fx.width/patch,rows=fx.height/patch;
        const cells=[...drawing(f).querySelectorAll('[data-patch-cell]')].filter(visible);
        assert.equal(cells.length,columns*rows);
        const cellWidth=attr(cells[0],'width'),cellHeight=attr(cells[0],'height');
        assert(cellWidth>0 && cellHeight>0); close(cellWidth,cellHeight);
        const left=Math.min(...cells.map(cell=>attr(cell,'x'))),top=Math.min(...cells.map(cell=>attr(cell,'y')));
        const positions=new Set();
        for(const cell of cells) {
          close(attr(cell,'width'),cellWidth); close(attr(cell,'height'),cellHeight);
          const column=(attr(cell,'x')-left)/cellWidth,row=(attr(cell,'y')-top)/cellHeight;
          close(column,Math.round(column)); close(row,Math.round(row));
          assert(column>=-1e-10 && column<columns-1e-10 && row>=-1e-10 && row<rows-1e-10);
          positions.add(`${Math.round(row)},${Math.round(column)}`);
          assert.equal(Number(cell.dataset.row),Math.round(row));
          assert.equal(Number(cell.dataset.column),Math.round(column));
          assert.equal(Number(cell.dataset.index),Math.round(row)*columns+Math.round(column));
        }
        assert.equal(positions.size,columns*rows,'each spatial patch occurs once');
        const extentWidth=Math.max(...cells.map(cell=>attr(cell,'x')+attr(cell,'width')))-left;
        const extentHeight=Math.max(...cells.map(cell=>attr(cell,'y')+attr(cell,'height')))-top;
        close(extentWidth/extentHeight,fx.width/fx.height);
        close(extentWidth*extentHeight,cells.length*cellWidth*cellHeight,1e-8);
      }
    }
  }
});

test('attention bill: one selected patch connects to both its query row and its key column', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,9.99,10,12.5,14.99,15,20,25,30,40]) {
      f.seek(time);
      const active=time>=10 && time<15;
      // Token i is patch i in raster order, and it owns row i and column i of the score grid.
      const index=Number(f.root.dataset.patchIndex);
      assert(Number.isInteger(index)&&index>0&&index<Number(f.root.dataset.startTokens)-1,
        'an interior token: row 0 and column 0 lie under the square\'s own border');
      const patch=f.$(`[data-patch-cell="${index}"]`),highlight=f.$('[data-patch-highlight]');
      const row=f.$('[data-score-row]'),column=f.$('[data-score-column]');
      const rowLink=f.$('[data-patch-link="row"]'),columnLink=f.$('[data-patch-link="column"]');
      for(const node of [highlight,row,column]) assert.equal(Number(node.dataset.index??node.dataset.tokenIndex),index);
      for(const node of [highlight,row,column,rowLink,columnLink]) assert.equal(Boolean(visible(node)),active);
      if(!active) continue;
      assert.equal(Number(patch.dataset.index),index);
      for(const coordinate of ['x','y','width','height']) close(attr(highlight,coordinate),attr(patch,coordinate));
      const square=f.$('[data-score-square]'),unit=Number(f.root.dataset.pixelsPerEntry);
      close(attr(row,'x'),attr(square,'x')); close(attr(row,'y'),attr(square,'y')+index*unit,1e-10);
      close(attr(column,'x'),attr(square,'x')+index*unit,1e-10); close(attr(column,'y'),attr(square,'y'));
      close(attr(row,'width'),attr(square,'width')); close(attr(row,'height'),unit);
      close(attr(column,'width'),unit); close(attr(column,'height'),attr(square,'height'));
      const source=[attr(patch,'x')+attr(patch,'width')/2,attr(patch,'y')+attr(patch,'height')/2];
      const targets=[[attr(row,'x'),attr(row,'y')+attr(row,'height')/2],
        [attr(column,'x')+attr(column,'width')/2,attr(column,'y')]];
      for(const [index,link] of [rowLink,columnLink].entries()) {
        const target=targets[index],points=vertices(link);
        assert(points.length>=2); assert.match(link.getAttribute('d'),/^M\s/);
        // Verify the rendered path as well as its inspectable endpoint receipt.
        for(const [axis,position] of [['x',0],['y',1]]) {
          close(attr(link,`data-source-${axis}`),source[position],1e-10);
          close(attr(link,`data-target-${axis}`),target[position],1e-10);
          close(points[0][position],source[position],1e-10);
          close(points.at(-1)[position],target[position],1e-10);
        }
      }
      assert.match(f.$('[data-caption]').textContent,/query.*key|key.*query/i);
    }
  }
});

test('attention bill: the quadratic mixing term is distinct from token-linear projection and feedforward terms', t => {
  const f=fixture(t,NAME),fx=declared(f),want=expected(fx);
  // No numerical width is taught here. Several test-only widths demonstrate
  // cancellation when d is fixed, rather than asserting a whole-block ratio.
  for(const d of [1,32,64,128]) {
    assert.equal((want.end.entries*d)/(want.start.entries*d),16);
    assert.equal((want.end.tokens*d*d)/(want.start.tokens*d*d),4);
    // Test-only counterexample to including patch embedding in the 4x claim:
    // its input dimension changes with patch area, unlike block projections.
    for(const channels of [1,3])
      assert.equal(want.end.tokens*fx.end**2*channels*d,want.start.tokens*fx.start**2*channels*d);
  }
  const boundary=f.$('.mechanism-boundary').textContent;
  assert.match(boundary,/\[CLS\]/); assert.match(boundary,/head/i);
  assert.match(boundary,/both (?:score.grid )?axes[\s\S]{0,60}same scale per entry/i);
  assert.match(boundary,/tile[\s\S]{0,140}(?:not|neither)[\s\S]{0,80}(?:score entr|token|window)/i,
    'the equal-area comparison tiles must not be mistaken for scores, tokens, or attention windows');
  assert.match(boundary,/(?:fixed|held|unchanged)[\s\S]{0,25}(?:width|\\?d)|(?:width|\\?d)[\s\S]{0,25}(?:fixed|held|unchanged)/i);
  assert.match(boundary,/projection/i); assert.match(boundary,/feedforward|feed-forward/i);
  assert.match(boundary,/(?:not|exclude|except)[\s\S]{0,50}(?:patch.embedding|image.to.patch projection)|patch.embedding[\s\S]{0,60}(?:exclude|not)/i,
    'the fixed-width tokenwise ratio does not apply to image-patch embedding');
  assert.match(boundary,/wall.clock|runtime|timing|latency/i);
  assert.doesNotMatch(f.root.textContent,/(?:whole Transformer|whole block|runtime) (?:is |becomes )?(?:16|sixteen) times/i);
  const formula=f.$('[data-formula]').textContent.replace(/\\featurepart\{([^{}]+)\}/g,'$1');
  assert.match(formula,/N\^2\s*d/); assert.match(formula,/N\s*d\^2/);
  f.load(); f.open(); f.seek(30);
  assert.match(drawing(f).textContent,/block projections\s*\/\s*(?:FFN|feedforward)/i);
  assert.match(drawing(f).textContent,/mixing/i);
  assert.equal(Number(f.root.dataset.linearRatio),4);
  const linear=f.$('[data-linear-bar]'),ghost=f.$('[data-linear-ghost]');
  assert(visible(linear)&&visible(ghost));
  close(attr(linear,'width')/attr(ghost,'width'),4);
  close(attr(linear,'height'),attr(ghost,'height'));
  close(attr(linear,'x'),attr(ghost,'x'));
  close(attr(linear,'width'),Number(f.root.dataset.linearWidth));
  close(attr(ghost,'width'),Number(f.root.dataset.linearGhostWidth));
});

test('attention bill: the matrix snaps to fourfold side and sixteenfold area on one fixed ghost ruler', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width); f.seek(10);
    const square=f.$('[data-score-square]'),ghost=f.$('[data-score-ghost]');
    const ghostSide=attr(ghost,'width');
    assert(ghostSide>0); close(attr(ghost,'height'),ghostSide);
    close(attr(square,'width'),ghostSide); close(attr(square,'height'),ghostSide);
    const fixed=['x','y','width','height'].map(key=>attr(ghost,key));
    for(const time of [10,15,19.99,20,20.01,22.5,25,27.5,30,35,40]) {
      f.seek(time);
      assert.deepEqual(['x','y','width','height'].map(key=>attr(ghost,key)),fixed);
      const side=attr(square,'width'); close(attr(square,'height'),side);
      close(side,Number(f.root.dataset.scoreSide),0.001);
      close(ghostSide,Number(f.root.dataset.ghostSide),0.001);
      close(side,ghostSide*(time<20?1:4));
      close(attr(square,'x'),attr(ghost,'x')); close(attr(square,'y'),attr(ghost,'y'));
    }
    close(attr(square,'width')/ghostSide,4);
    close((attr(square,'width')*attr(square,'height'))/(ghostSide*ghostSide),16);
    for(const time of [20,22.5,25,27.5,30,35,40]) {
      f.seek(time); close(attr(square,'width'),ghostSide*4);
      close(Number(f.root.dataset.geometryFraction),1);
    }
    assert.equal(f.root.querySelectorAll('pattern, [data-grid-pattern]').length,0,
      'subpixel entry rasters create moire; dimensions come from the brackets');
    assert.doesNotMatch(square.getAttribute('fill')||'',/url\(/);
    assert(drawing(f).querySelectorAll('*').length<500,'matrix storage is a concept, not 38,416 DOM elements');
  }
});

test('attention bill: both dimension brackets and coarse area tiles use the square\'s actual ruler', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [10,15,19.99,20,22.5,25,28,30,40]) {
      f.seek(time);
      const square=f.$('[data-score-square]'),ghost=f.$('[data-score-ghost]');
      const unit=Number(f.root.dataset.pixelsPerEntry),side=attr(square,'width');
      assert(unit>0,'the count-to-side scale is retained without rendering individual entries');
      close(attr(ghost,'width')/unit,49); close(attr(ghost,'height')/unit,49);
      const rows=vertices(f.$('[data-row-bracket]')),columns=vertices(f.$('[data-column-bracket]'));
      close(Math.max(...rows.map(p=>p[1]))-Math.min(...rows.map(p=>p[1])),side);
      close(Math.max(...columns.map(p=>p[0]))-Math.min(...columns.map(p=>p[0])),side);
      const count=time<20?49:196;
      close(side/unit,count);
      assert.match(f.$('[data-row-label]').textContent,new RegExp(`^${count} query rows$`));
      assert.match(f.$('[data-column-label]').textContent,new RegExp(`^${count} key columns$`));
      const tiles=[...drawing(f).querySelectorAll('[data-area-tile]')];
      assert.equal(tiles.length,16);
      if(time<=22) assert(tiles.every(tile=>!visible(tile)));
      else {
        const x=attr(square,'x'),y=attr(square,'y'),block=attr(ghost,'width');
        const positions=new Set();
        for(const tile of tiles) {
          close(attr(tile,'width'),block); close(attr(tile,'height'),block);
          const column=(attr(tile,'x')-x)/block,row=(attr(tile,'y')-y)/block;
          close(column,Math.round(column)); close(row,Math.round(row));
          assert(column>=-1e-10 && column<=3+1e-10 && row>=-1e-10 && row<=3+1e-10);
          positions.add(`${Math.round(row)},${Math.round(column)}`);
        }
        assert.equal(positions.size,16,'the comparison tiles partition, rather than overlap on, the final score extent');
        close(side/block,4); close(side*side,16*block*block,1e-10);
        // One comparison block is the entire original 49-by-49 matrix, not a
        // single score entry or a local-attention window.
        close((block/unit)**2,2401,1e-10);
        if(time>=25) assert(tiles.every(visible));
      }
    }
  }
});

test('attention bill: area stamps are deterministic comparison blocks, not intermediate matrix states', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  let previous=0;
  for(let index=0;index<=128;index++) {
    const time=20+index/16; f.seek(time);
    const tiles=[...drawing(f).querySelectorAll('[data-area-tile]')];
    const shown=tiles.filter(visible).length;
    assert.equal(shown,Number(f.root.dataset.stampedTiles));
    assert(shown>=previous && shown<=16); previous=shown;
    assert.equal(Number(f.root.dataset.currentTokens),196);
    assert.equal(Number(f.root.dataset.currentEntries),38416);
    // The new square is a reveal: it holds two seconds before anything is stamped on it.
    if(time<=22) assert.equal(shown,0);
    // The stamping leads into beat 5 and is finished there; nothing moves afterwards.
    if(time>=25) assert.equal(shown,16);
    for(const tile of tiles.filter(visible)) {
      const ink=tile.hasAttribute('opacity')?attr(tile,'opacity'):1;
      assert(ink>0&&ink<=1);
      if(time>=25) assert(!tile.hasAttribute('opacity'),'a finished stamp is fully inked');
    }
  }
  assert.equal(previous,16);
  const labels=[f.$('[data-tile-label]').textContent,f.$('[data-tile-entries]').textContent].join(' ');
  assert.match(labels,/start|original|old/i);
  assert.match(labels,/2,?401/);
  assert.doesNotMatch(labels,/window|token block|local attention/i);
  const r=fixture(t,NAME,{reduced:true}); r.load(); r.open(); r.seek(25);
  assert.equal(Number(r.root.dataset.stampedTiles),16,'reduced motion presents the completed comparison at its beat');
  assert.equal([...drawing(r).querySelectorAll('[data-area-tile]')].filter(visible).length,16);
});

test('attention bill: hollow locators make the one-pixel query row and key column findable at every width', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const css=read('attention-bill/player.css');
  assert.match(css,/\.ab-locator\s*\{[^}]*fill:\s*none[^}]*stroke:\s*var\(--ab-input\)/,
    'a locator is a hollow outline in input blue: it finds the strip and supplies no magnitude');
  assert.match(css,/\.ab-link\s*\{[^}]*stroke:\s*var\(--ab-input\)/);
  for(const width of widths) {
    f.resize(width);
    const rowLocator=f.$('[data-row-locator]'),columnLocator=f.$('[data-column-locator]');
    for(const time of [0,5,9.99,15,20,25,30,40]) {
      f.seek(time);
      for(const node of [rowLocator,columnLocator,f.$('[data-row-name]'),f.$('[data-column-name]'),
        ...f.root.querySelectorAll('[data-link-head],[data-link-source]')]) assert(!visible(node),`trace mark shown at ${time}s`);
    }
    for(const time of [10,12.5,14.99]) {
      f.seek(time);
      const square=rectBox(f.$('[data-score-square]')),unit=Number(f.root.dataset.pixelsPerEntry);
      const row=rectBox(f.$('[data-score-row]')),column=rectBox(f.$('[data-score-column]'));
      // True scale is kept: the strips are as thin as one entry really is on this ruler.
      assert(unit<2,'the fixed side scale leaves about a pixel per entry');
      close(row.bottom-row.top,unit); close(column.right-column.left,unit);
      for(const [locator,strip,thin,long] of [[rowLocator,row,['top','bottom'],['left','right']],
        [columnLocator,column,['left','right'],['top','bottom']]]) {
        assert(visible(locator));
        const box=rectBox(locator),thickness=box[thin[1]]-box[thin[0]];
        assert(thickness>=8,`locator only ${thickness}px thick at ${width}px`);
        assert(attr(locator,'stroke-width')>=1.5);
        // Centred on the strip with clear air either side, and exactly as long as the square.
        close((box[thin[0]]+box[thin[1]])/2,(strip[thin[0]]+strip[thin[1]])/2,1e-10);
        assert(strip[thin[0]]-box[thin[0]]>=2.5&&box[thin[1]]-strip[thin[1]]>=2.5);
        close(box[long[0]],square[long[0]]); close(box[long[1]],square[long[1]]);
        // Interior: neither locator straddles the square's border.
        assert(box[thin[0]]>square[thin[0]]+1&&box[thin[1]]<square[thin[1]]-1);
      }
      for(const link of f.root.querySelectorAll('[data-patch-link]')) assert(attr(link,'stroke-width')>=1.5);
      // Each link ends in an arrowhead on its own target, and both start at one dot in the patch.
      const source=f.$('[data-link-source]');
      for(const role of ['row','column']) {
        const link=f.$(`[data-patch-link="${role}"]`),head=f.$(`[data-link-head="${role}"]`).getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
        close(head[0],attr(link,'data-target-x'),1e-10); close(head[1],attr(link,'data-target-y'),1e-10);
        close(attr(source,'cx'),attr(link,'data-source-x'),1e-10); close(attr(source,'cy'),attr(link,'data-source-y'),1e-10);
      }
      assert.match(f.$('[data-row-name]').textContent,/^query row$/);
      assert.match(f.$('[data-column-name]').textContent,/^key column$/);
    }
  }
});

test('attention bill: no link, locator, or bracket crosses a label, and no two labels collide', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,12.5,15,17.5,20,22.5,25,27.5,30,35,40]) {
      f.seek(time);
      const texts=visibleTexts(f).map(node=>({node,box:textBox(node)}));
      for(const [i,a] of texts.entries()) for(const b of texts.slice(i+1))
        assert(!overlap(a.box,b.box),`"${a.node.textContent}" collides with "${b.node.textContent}" at ${width}px, ${time}s`);
      const lines=[...drawing(f).querySelectorAll('[data-patch-link],[data-row-bracket],[data-column-bracket]')].filter(visible);
      if(time>=10&&time<15) assert.equal(lines.filter(node=>node.hasAttribute('data-patch-link')).length,2);
      for(const line of lines) for(const segment of segments(line)) for(const {node,box} of texts)
        assert(!overlap(segment,box,2),
          `${line.getAttribute('class')} crosses "${node.textContent}" at ${width}px, ${time}s`);
      for(const locator of [...drawing(f).querySelectorAll('[data-row-locator],[data-column-locator]')].filter(visible))
        for(const {node,box} of texts) assert(!overlap(rectBox(locator),box,2),`a locator covers "${node.textContent}"`);
    }
  }
  // The regression itself: at beat 2 the column link enters the square from above, and the
  // counted column label that used to sit in its way now waits for beat 3.
  f.resize(713); f.seek(12);
  assert(!visible(f.$('[data-column-label]'))&&!visible(f.$('[data-row-label]')));
  assert(!visible(f.$('[data-column-bracket]'))&&!visible(f.$('[data-row-bracket]')));
  f.seek(15);
  for(const name of ['column-label','row-label','column-bracket','row-bracket']) assert(visible(f.$(`[data-${name}]`)));
});

test('attention bill: an arrow-key seek to beat 5 parks on the finished, countable tiling', t => {
  for(const reduced of [false,true]) {
    const f=fixture(t,NAME,{reduced}); f.load(); f.open();
    f.seek(20); f.key('ArrowRight'); close(f.time,25);
    const tiles=[...drawing(f).querySelectorAll('[data-area-tile]')];
    assert.equal(tiles.filter(visible).length,16,'the caption says count the tiles: all sixteen are there to count');
    assert(tiles.every(tile=>!tile.hasAttribute('opacity')));
    assert.match(f.$('[data-caption]').textContent,/^Count the equal-area tiles\./);
    assert(visible(f.$('[data-tile-label]'))&&visible(f.$('[data-tile-entries]')));
    // One coherent still per beat: beat 4 is the bare new square, beat 5 the full tiling.
    f.key('ArrowLeft'); close(f.time,20);
    assert.equal(tiles.filter(visible).length,0);
    if(reduced) for(const time of [22.5,24,24.99]) { f.seek(time); assert.equal(tiles.filter(visible).length,0); }
  }
});

test('attention bill: every class the formula line is given has a rule to give it a purpose', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const css=read('attention-bill/player.css'),seen=new Set();
  for(let time=0;time<=40;time+=0.5) { f.seek(time); for(const cls of f.$('[data-formula]').classList) seen.add(cls); }
  assert(seen.size>1);
  for(const cls of seen) assert(css.includes(`.${cls}`),`player.css has no rule for .${cls}`);
  assert(!seen.has('ab-boundary'));
  assert.doesNotMatch(read('attention-bill/player.js'),/ab-boundary/);
});

test('attention bill: the final frame speaks two factors, each on its own mark, and mutes the rest', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [30,35,40]) {
      f.seek(time);
      const area=mark(f,'ratio'),length=mark(f,'linear-ratio');
      assert.equal(area.textContent,'×16'); assert.equal(length.textContent,'×4');
      for(const name of ['font-size','font-weight','text-anchor'])
        assert.equal(area.getAttribute(name),length.getAttribute(name),`the two factors share one ${name}`);
      assert(attr(area,'font-size')>=24);
      // ×16 sits on the area it measures; ×4 sits on the length it measures.
      const square=rectBox(f.$('[data-score-square]')),bar=rectBox(f.$('[data-linear-bar]'));
      const inside=(node,box)=>attr(node,'x')>box.left&&attr(node,'x')<box.right&&attr(node,'y')>box.top&&attr(node,'y')<=box.bottom;
      assert(inside(area,square)); assert(inside(length,bar));
      close((square.left+square.right)/2,attr(area,'x')); close((bar.left+bar.right)/2,attr(length,'x'));
      // The bar is the square's own side, drawn directly beneath it: length against area.
      close(bar.left,square.left); close(bar.right,square.right); assert(bar.top>square.bottom);
      const ticks=vertices(f.$('[data-linear-ticks]')).filter((_,i)=>i%2===0).map(point=>point[0]);
      assert.equal(ticks.length,3); ticks.forEach((x,i)=>close(x,bar.left+(i+1)*(bar.right-bar.left)/4,1e-10));
      // Everything else steps back: muted or small, and the beat-5 tile note is withdrawn.
      for(const node of visibleTexts(f)) {
        if(node===area||node===length) continue;
        const quiet=/\bab-muted\b/.test(node.getAttribute('class')||'')||attr(node,'font-size')<=12;
        assert(quiet,`"${node.textContent}" competes with the two factors at ${width}px`);
        assert(attr(node,'font-size')<=14);
      }
      assert(!visible(f.$('[data-tile-label]'))&&!visible(f.$('[data-tile-entries]')));
    }
  }
});

test('attention bill: few numbers are live at once and each is announced in one place', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const range=f.$('[data-controls] input[type="range"]');
  for(const width of [296,713]) {
    f.resize(width);
    for(let time=0;time<=40;time+=2.5) {
      f.seek(time);
      const live=visibleTexts(f).filter(node=>/\d/.test(node.textContent)&&!/\bab-muted\b/.test(node.getAttribute('class')||''));
      assert(live.length<=8,`${live.length} emphasised numbers at ${time}s`);
      // The scrubber names the beat; the counts live in the picture's own description.
      assert.doesNotMatch(range.getAttribute('aria-valuetext').replace(/^\d+:\d\d of \d+:\d\d\. /,''),/\d/);
    }
  }
  f.seek(40);
  const label=f.$('[data-figure] svg').getAttribute('aria-label');
  for(const value of ['38,416','2,401']) assert.equal(label.split(value).length,2,`${value} is described once`);
});

test('attention bill: playback history and resizing cannot change a frame', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  const snapshot=()=>JSON.stringify({picture:canonicalMarkup(f.$('[data-figure]').innerHTML),
    formula:canonicalMarkup(f.$('[data-formula]').outerHTML),caption:f.$('[data-caption]').innerHTML,
    state:Object.fromEntries(Object.entries(f.root.dataset).filter(([key])=>!['playing','time','typeset'].includes(key)))});
  const times=[0,5,10,15,20,21.25,23.7,25,30,35,40];
  const forward=times.map(time=>{f.seek(time);return snapshot();});
  f.play(); f.tick(1200); f.resize(296); f.seek(20); f.resize(713);
  assert.deepEqual(times.toReversed().map(time=>{f.seek(time);return snapshot();}),forward.toReversed());
});

test('attention bill: mobile reflow keeps square geometry and labels within the picture', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  for(const width of widths) {
    f.resize(width);
    for(const time of [0,5,10,20,22.5,25,30,35,40]) {
      f.seek(time); const svg=f.$('[data-figure] svg'),box=numbers(svg.getAttribute('viewBox'));
      assert.equal(box[2],width); assert.equal(svg.getAttribute('preserveAspectRatio'),'xMinYMin meet');
      assert.equal(f.root.dataset.layout,width<600?'narrow':'wide');
      for(const node of [...drawing(f).querySelectorAll('text')].filter(visible)) {
        assert(attr(node,'font-size')>=12,`label too small at ${width}px: ${node.textContent}`);
        assert(attr(node,'x')>=0 && attr(node,'x')<=width);
        assert(attr(node,'y')>=0 && attr(node,'y')<=box[3]);
      }
      for(const node of [...drawing(f).querySelectorAll('rect')].filter(visible)) {
        assert(attr(node,'x')>=0 && attr(node,'x')+attr(node,'width')<=width+1e-10);
        assert(attr(node,'y')>=0 && attr(node,'y')+attr(node,'height')<=box[3]+1e-10);
      }
      for(const node of [...drawing(f).querySelectorAll('line')].filter(visible))
        for(const [coordinate,limit] of [['x1',width],['x2',width],['y1',box[3]],['y2',box[3]]])
          assert(attr(node,coordinate)>=0 && attr(node,coordinate)<=limit);
    }
  }
});

test('attention bill: both complete script-free prints match the final rendering', async t => {
  const generated=await staticFrame(NAME);
  assert.equal(generated.before,generated.after,'regenerate with render_static_frames.cjs attention-bill');
  const f=fixture(t,NAME),narrow=f.$('[data-static-frame="narrow"]');
  assert(narrow); assert.equal(narrow.dataset.width,'296');
  const height=Number(narrow.dataset.height),ids=[...f.root.querySelectorAll('[id]')].map(node=>node.id);
  assert.equal(ids.length,new Set(ids).size,'static prints have no duplicated local IDs');
  assert.equal(f.root.querySelectorAll('pattern, [data-grid-pattern]').length,0,
    'neither script-free print restores the removed subpixel raster');
  for(const print of [drawing(f),narrow]) {
    const text=print.textContent.replace(/[,\s]/g,'');
    assert(text.includes('196') && text.includes('38416') && text.includes('16'));
  }
  f.load(); f.open(); f.seek(40); f.resize(296);
  assert.equal(f.root.querySelectorAll('[data-static-frame="narrow"]').length,0);
  assert.equal(numbers(f.$('[data-figure] svg').getAttribute('viewBox'))[3],height);
  const css=read('attention-bill/player.css');
  assert.match(css,/@container\s*\(max-width:\s*599px\)/);
  assert.match(css,new RegExp(`aspect-ratio:\\s*296\\s*/\\s*${height}`));
});

test('attention bill: the animation remains local, HTML-only, and has no extra parameter controls', t => {
  const f=fixture(t,NAME); f.load(); f.open();
  assert.equal(f.root.querySelectorAll('input[type="range"]').length,1,'the transport scrubber is the only range');
  assert.equal(f.root.querySelectorAll('[data-action]').length,2,'only play and fullscreen');
  const filter=fs.readFileSync(path.join(ROOT,scene.filter),'utf8');
  assert.match(filter,/^(?:--[^\n]*\n)+if not FORMAT:match\("\^html"\) then return \{\} end/);
  const source=read('attention-bill/player.js'),html=read('attention-bill/panel.html');
  assert.doesNotMatch(source,/Math\.random|fetch\(|import\(|setInterval\(/);
  assert.doesNotMatch(read('attention-bill/player.css'),/repeating-(?:linear|radial)-gradient|ab-raster/,
    'a CSS raster must not reintroduce the moire removed from SVG');
  assert.doesNotMatch(html,/@eq-/);
  assert.doesNotMatch(f.root.textContent,/1024|4,096|437/,'the higher-resolution extension is not part of this excerpt');
});
