(() => {
  const root=document.getElementById('attention-bill-excerpt');
  if (!root||root.dataset.ready) return;
  const $=selector=>root.querySelector(selector);
  // Chapter 16's count is per head, with CLS deliberately excluded.
  const widthPixels=Number(root.dataset.imageWidth), heightPixels=Number(root.dataset.imageHeight);
  const patches=[Number(root.dataset.patchStart),Number(root.dataset.patchEnd)];
  if (![widthPixels,heightPixels,...patches].every(n=>Number.isInteger(n)&&n>0)
      ||patches.some(p=>widthPixels%p||heightPixels%p)) throw Error('attention-bill: patches must divide both image axes');
  const states=patches.map(patch=>{
    const columns=widthPixels/patch, rows=heightPixels/patch, tokens=columns*rows;
    return {patch,columns,rows,tokens,entries:tokens*tokens};
  });
  const [start,end]=states, tokenRatio=end.tokens/start.tokens, entryRatio=end.entries/start.entries;
  // Which token is traced is a presentation choice, not manuscript data. An interior index
  // keeps its true-scale row and column off the square's border, where a 1 px strip vanishes.
  const trackedRow=Math.min(2,start.rows-1), trackedColumn=0, trackedIndex=trackedRow*start.columns+trackedColumn;
  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const number=n=>n.toLocaleString('en-US');
  // The tiles stamp in the seconds before beat 5, after the new square has held for two:
  // the glide finishes at the beat it leads into, so that beat's still is the counted picture.
  const stampSeconds=Math.max(0,Math.min(3,beats[5]-beats[4]-2)), stampStart=beats[5]-stampSeconds;
  const captions=[
    'Halve the patch width. How much does one head\'s score grid grow?',
    'Count the image patches. Every patch supplies one token.',
    'One patch token supplies a query row and a key column. Every token does both.',
    'Multiply query rows by key columns. Keep this original score-grid area as the counting unit.',
    'Halve the patch width. The new patch grid and both score-grid axes change together.',
    `Count the equal-area tiles. Each covers ${number(start.entries)} score positions, not copied score values.`,
    'At fixed width, token-wise block work grows with length; attention mixing grows with the square.',
    'Count the declared terms, not a whole-model speedup. These shapes are not a runtime measurement.'
  ];
  const names=['Predict','Count patches','Link one token','Count old score entries','Change patch width','Count old-area tiles','Compare length and area','Bound the claim'];
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  const make=(tag,attributes,parent=drawing,text='')=>{
    const node=document.createElementNS(NS,tag);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    node.textContent=text; parent.appendChild(node); return node;
  };
  const attrs=(node,values)=>{for (const [key,value] of Object.entries(values)) node.setAttribute(key,String(value));};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(text,cls='',extra={})=>make('text',{'font-size':13,'text-anchor':'middle',class:cls,...extra},drawing,text);
  // The two growth factors are the punchline: one size, one weight, each on its own mark.
  const FACTOR={'font-size':26,'font-weight':700};
  const image=label('','ab-input',{'data-value':'image','font-size':14});
  const patch=label('','ab-muted',{'data-value':'patch'});
  const imageOutline=make('rect',{class:'ab-image-outline','data-image-outline':''});
  const patchCells=Array.from({length:Math.max(start.tokens,end.tokens)},(_,index)=>
    make('rect',{class:'ab-patch-cell','data-patch-cell':index,'data-index':index}));
  const patchHighlight=make('rect',{class:'ab-patch-highlight','data-patch-highlight':'','data-index':trackedIndex});
  const tokens=label('','ab-input',{'data-value':'tokens','font-size':14});
  const square=make('rect',{class:'ab-square','data-score-square':''});
  // These are equal old-area counting tiles, not score entries or attention windows.
  const areaTiles=Array.from({length:Number.isInteger(entryRatio)&&entryRatio<=1024?entryRatio:0},(_,index)=>
    make('rect',{class:'ab-area-tile','data-area-tile':index}));
  const ghost=make('rect',{class:'ab-ghost','data-score-ghost':''});
  const ghostLabel=label('old grid','',{'data-ghost-label':'','font-size':12});
  // The strips keep the square's true scale, about a pixel per entry. The hollow locators
  // only find them for the eye; a locator never supplies magnitude.
  const queryRow=make('rect',{class:'ab-token-axis','data-score-row':'','data-token-index':trackedIndex});
  const keyColumn=make('rect',{class:'ab-token-axis','data-score-column':'','data-token-index':trackedIndex});
  const rowLocator=make('rect',{class:'ab-locator','data-row-locator':'','stroke-width':1.6,rx:3});
  const columnLocator=make('rect',{class:'ab-locator','data-column-locator':'','stroke-width':1.6,rx:3});
  const rowLink=make('path',{class:'ab-link','data-patch-link':'row','stroke-width':1.8});
  const columnLink=make('path',{class:'ab-link','data-patch-link':'column','stroke-width':1.8});
  const rowHead=make('path',{class:'ab-link-end','data-link-head':'row'});
  const columnHead=make('path',{class:'ab-link-end','data-link-head':'column'});
  const linkSource=make('circle',{class:'ab-link-end','data-link-source':'',r:2.6});
  const rowName=label('query row','ab-input',{'data-row-name':'','text-anchor':'start'});
  const columnName=label('key column','ab-input',{'data-column-name':''});
  const traceNodes=[patchHighlight,queryRow,keyColumn,rowLocator,columnLocator,rowLink,columnLink,rowHead,columnHead,linkSource,rowName,columnName];
  const rowBracket=make('path',{class:'ab-bracket','data-row-bracket':''});
  const columnBracket=make('path',{class:'ab-bracket','data-column-bracket':''});
  const rowLabel=label('','ab-input',{'data-row-label':''});
  const columnLabel=label('','ab-input',{'data-column-label':''});
  const entries=label('','',{'data-value':'entries'});
  const tileLabel=label('1 tile = old grid area','ab-muted',{'data-tile-label':''});
  const tileEntries=label(`${number(start.entries)} entries`,'ab-muted',{'data-tile-entries':''});
  // A white plate keeps the tile grid from running through the factor and its caption.
  const factorPlate=make('rect',{class:'ab-factor-plate',rx:6,width:124,height:50,'data-factor-plate':''});
  const ratio=label(`×${number(entryRatio)}`,'ab-factor',{'data-value':'ratio',...FACTOR});
  const mixingLabel=label('attention mixing','ab-muted',{'data-mixing-label':''});
  const linearGroup=make('g',{'data-linear-comparison':''});
  const linearBar=make('rect',{class:'ab-linear-bar','data-linear-bar':''},linearGroup);
  const linearTicks=make('path',{class:'ab-linear-ticks','data-linear-ticks':''},linearGroup);
  const linearGhost=make('rect',{class:'ab-linear-ghost','data-linear-ghost':''},linearGroup);
  const linearOld=make('text',{'font-size':12,'text-anchor':'middle',class:'ab-input','data-linear-old-label':''},linearGroup,'old');
  const linearValue=make('text',{'text-anchor':'middle',class:'ab-factor ab-input','data-value':'linear-ratio',...FACTOR},linearGroup,`×${number(tokenRatio)}`);
  const linearLabel=make('text',{'font-size':13,'text-anchor':'middle',class:'ab-muted','data-linear-label':''},linearGroup,'block projections / FFN');
  Object.assign(root.dataset,{
    startTokens:String(start.tokens),endTokens:String(end.tokens),
    startEntries:String(start.entries),endEntries:String(end.entries),
    tokenRatio:String(tokenRatio),entryRatio:String(entryRatio),linearRatio:String(tokenRatio),
    patchIndex:String(trackedIndex),transitioning:'false',
    excludesCls:'true',costScope:'attention-mixing-and-token-wise-block-projections-not-whole-transformer'
  });
  const BAR=24;
  let width=0,g=null,lastTime=0,reduced=false,drawnCells='',drawnFrame='';
  // Everything that depends only on the fixture and the figure's width is placed here,
  // once per measure, not once per frame.
  function layout() {
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    const narrow=width<600, imageMax=narrow?112:156, longest=Math.max(widthPixels,heightPixels);
    const imageW=imageMax*widthPixels/longest, imageH=imageMax*heightPixels/longest;
    const imageX=narrow?(width-imageW)/2:20, imageY=narrow?42:64;
    const matrixMax=Math.min(narrow?224:260,narrow?width-76:width-310);
    const x=narrow?(width-matrixMax)/2+10:width-matrixMax-40, y=narrow?244:96, bottom=y+matrixMax;
    const unit=matrixMax/Math.max(start.tokens,end.tokens), ghostSide=start.tokens*unit;
    g={narrow,imageW,imageH,imageX,imageY,matrixMax,x,y,bottom,unit,ghostSide,height:bottom+36+BAR+34};
    drawnCells=drawnFrame='';
    Object.assign(root.dataset,{layout:narrow?'narrow':'wide',ghostSide:String(ghostSide),
      pixelsPerEntry:String(unit),linearGhostWidth:String(ghostSide)});
    svg.setAttribute('viewBox',`0 0 ${width} ${g.height}`);
    attrs(image,{x:imageX+imageW/2,y:narrow?18:20}); image.textContent=`${widthPixels} × ${heightPixels} · schematic`;
    // Both captions sit under the image, so the link can leave the image without underlining one.
    attrs(patch,{x:imageX+imageW/2,y:narrow?174:imageY+imageH+22});
    attrs(tokens,{x:imageX+imageW/2,y:narrow?194:imageY+imageH+44});
    attrs(imageOutline,{x:imageX,y:imageY,width:imageW,height:imageH});
    attrs(ghost,{x,y,width:ghostSide,height:ghostSide});
    attrs(ghostLabel,{x:x+ghostSide/2,y:y+ghostSide/2+4});
    areaTiles.forEach((tile,index)=>{
      const row=Math.floor(index/tokenRatio), column=index%tokenRatio;
      attrs(tile,{x:x+column*ghostSide,y:y+row*ghostSide,width:ghostSide,height:ghostSide,
        'data-row':row,'data-column':column,'data-entry-count':start.entries});
    });
    // One patch centre to row i's left midpoint and column i's top midpoint, on the old grid.
    const patchW=imageW/start.columns, patchH=imageH/start.rows;
    const sourceX=imageX+(trackedColumn+.5)*patchW, sourceY=imageY+(trackedRow+.5)*patchH;
    const offset=trackedIndex*unit, rowY=y+offset+unit/2, columnX=x+offset+unit/2;
    const thickness=Math.max(10,unit+8);
    attrs(patchHighlight,{x:imageX+trackedColumn*patchW,y:imageY+trackedRow*patchH,width:patchW,height:patchH});
    attrs(queryRow,{x,y:y+offset,width:ghostSide,height:unit});
    attrs(keyColumn,{x:x+offset,y,width:unit,height:ghostSide});
    attrs(rowLocator,{x,y:rowY-thickness/2,width:ghostSide,height:thickness});
    attrs(columnLocator,{x:columnX-thickness/2,y,width:thickness,height:ghostSide});
    // Wide: leave through the image's top and run above it. Narrow: leave through its left
    // side and run down the gutter. The column branch tees off above the square.
    const stem=narrow?`M ${sourceX} ${sourceY} H ${x-14}`:`M ${sourceX} ${sourceY} V ${imageY-18}`;
    const ends={'data-source-x':sourceX,'data-source-y':sourceY};
    attrs(rowLink,{d:narrow?`${stem} V ${rowY} H ${x}`:`${stem} H ${x-24} V ${rowY} H ${x}`,
      ...ends,'data-target-x':x,'data-target-y':rowY});
    attrs(columnLink,{d:narrow?`${stem} V ${y-16} H ${columnX} V ${y}`:`${stem} H ${columnX} V ${y}`,
      ...ends,'data-target-x':columnX,'data-target-y':y});
    attrs(rowHead,{d:`M ${x} ${rowY} L ${x-7} ${rowY-4} L ${x-7} ${rowY+4} Z`});
    attrs(columnHead,{d:`M ${columnX} ${y} L ${columnX-4} ${y-7} L ${columnX+4} ${y-7} Z`});
    attrs(linkSource,{cx:sourceX,cy:sourceY});
    attrs(rowName,{x:x+ghostSide+10,y:rowY+4});
    attrs(columnName,{x:columnX,y:y+ghostSide+19});
    attrs(tileLabel,{x:x+matrixMax/2,y:bottom+44}); attrs(tileEntries,{x:x+matrixMax/2,y:bottom+62});
    attrs(factorPlate,{x:x+matrixMax/2-62,y:y+matrixMax/2-22});
    attrs(ratio,{x:x+matrixMax/2,y:y+matrixMax/2+1}); attrs(mixingLabel,{x:x+matrixMax/2,y:y+matrixMax/2+21});
    // The bar is the square's own side: length grows by the token ratio, area by its square.
    // Ruler ticks overshoot the bar, so the factor printed on it cannot hide a division.
    const barY=bottom+36;
    attrs(linearGhost,{x,y:barY,width:ghostSide,height:BAR});
    attrs(linearTicks,{d:Number.isInteger(tokenRatio)&&tokenRatio<=64?
      Array.from({length:tokenRatio-1},(_,index)=>`M ${x+(index+1)*ghostSide} ${barY-4} V ${barY+BAR+4}`).join(' '):''});
    attrs(linearOld,{x:x+ghostSide/2,y:barY+BAR/2+4});
    attrs(linearValue,{x:x+matrixMax/2,y:barY+BAR-3});
    attrs(linearLabel,{x:x+matrixMax/2,y:barY+BAR+21});
  }
  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), held=reducedMotion?beats[stage]:time;
    const stamped=stage>=5?areaTiles.length:stage<4||!stampSeconds?0:
      Math.max(0,Math.min(areaTiles.length,(held-stampStart)*areaTiles.length/stampSeconds));
    const frame=`${stage}|${stamped}`;
    if (frame===drawnFrame) return `${names[stage]}.`;
    drawnFrame=frame;
    const state=stage>=4?end:start, trace=stage===2, final=stage>=6;
    const {x,y,unit,ghostSide}=g, side=state.tokens*unit, tileCount=Math.ceil(stamped);
    Object.assign(root.dataset,{
      stage:String(stage),currentTokens:String(state.tokens),currentEntries:String(state.entries),
      currentPatch:String(state.patch),patchRows:String(state.rows),patchColumns:String(state.columns),
      visiblePatchCount:String(state.tokens),geometryFraction:stage>=4?'1':'0',
      scoreSide:String(side),stampedTiles:String(tileCount),linearWidth:String(side)
    });
    const description=[`Schematic ${widthPixels} by ${heightPixels} image; CLS excluded. ${state.patch}-pixel patches.`];
    if (stage>=1) description.push(`${state.rows} by ${state.columns} patches: ${state.tokens} tokens.`);
    if (trace) description.push('One patch is linked to its outlined query row and key column.');
    if (stage>=3) description.push(`${number(state.entries)} score entries per head.`);
    if (stage>=5) description.push(`${entryRatio} equal old-area tiles fill the square.`);
    if (final) description.push(`Each tile counts ${number(start.entries)} positions, not copied scores. At fixed model width, token-wise block work grows ${tokenRatio} times, the square's side; attention mixing grows ${entryRatio} times, its area. This is not measured runtime.`);
    svg.setAttribute('aria-label',description.join(' '));
    if (drawnCells!==String(state.patch)) {
      drawnCells=String(state.patch);
      const patchW=g.imageW/state.columns, patchH=g.imageH/state.rows;
      patchCells.forEach((cell,index)=>{
        const row=Math.floor(index/state.columns), column=index%state.columns;
        attrs(cell,{x:g.imageX+column*patchW,y:g.imageY+row*patchH,width:patchW,height:patchH,'data-row':row,'data-column':column});
        show(cell,index<state.tokens);
      });
      patch.textContent=`P = ${state.patch} pixels`;
      tokens.textContent=`${state.rows} × ${state.columns} = ${state.tokens} tokens`;
      columnLabel.textContent=`${state.tokens} key columns`; rowLabel.textContent=`${state.tokens} query rows`;
      entries.textContent=`${number(state.entries)} entries / head`;
    }
    show(tokens,stage>=1);
    attrs(square,{x,y,width:side,height:side}); show(square,stage>=2);
    show(ghost,stage>=3); show(ghostLabel,stage>=3);
    traceNodes.forEach(node=>show(node,trace));
    areaTiles.forEach((tile,index)=>{
      const ink=Math.min(1,stamped-index);
      show(tile,ink>0);
      if (ink>0&&ink<1) tile.setAttribute('opacity',ink.toFixed(3)); else tile.removeAttribute('opacity');
    });
    // The counted brackets wait for beat 3: during the trace the link owns the top and left.
    attrs(columnBracket,{d:`M ${x} ${y-8} V ${y-13} H ${x+side} V ${y-8}`});
    attrs(rowBracket,{d:`M ${x-8} ${y} H ${x-13} V ${y+side} H ${x-8}`});
    // The count labels are wider than the small square. Flush left there, the column label
    // clears the rotated row label at the corner; over the large square it is centred.
    attrs(columnLabel,stage>=4?{x:x+side/2,y:y-23,'text-anchor':'middle'}:{x,y:y-23,'text-anchor':'start'});
    attrs(rowLabel,{x:x-28,y:y+side/2,transform:`rotate(-90 ${x-28} ${y+side/2})`});
    [columnBracket,rowBracket,columnLabel,rowLabel].forEach(node=>show(node,stage>=3));
    // A count sits under the square it counts.
    attrs(entries,stage>=4?{x:x+side/2,y:y+side+22,'text-anchor':'middle'}:{x,y:y+side+24,'text-anchor':'start'});
    show(entries,stage>=3);
    show(tileLabel,stage===5); show(tileEntries,stage===5);
    show(ratio,final); show(mixingLabel,final); show(factorPlate,final);
    attrs(linearBar,{x,y:g.bottom+36,width:side,height:BAR}); show(linearGroup,final);
    // At the end only the two factors speak; every other number steps back.
    attrs(entries,{'font-size':final?13:17,class:final?'ab-muted':''});
    for (const node of [image,tokens,columnLabel,rowLabel]) node.setAttribute('class',final?'ab-muted':'ab-input');
    formula.classList.toggle('ab-tokens-shown',stage>=1);
    formula.classList.toggle('ab-entries-shown',stage>=2);
    formula.classList.toggle('ab-scope-shown',stage>=6);
    formula.classList.toggle('ab-tokens-lit',stage===1||stage===4);
    formula.classList.toggle('ab-entries-lit',stage===2||stage===3||stage===5);
    formula.classList.toggle('ab-scope-lit',stage===6);
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${names[stage]}.`;
  }
  function typeset() {
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if (mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done,done);
    } else done();
  }
  layout();
  window.BookPlayback(root,render,()=>{layout();render(lastTime,reduced);});
  typeset();
})();
