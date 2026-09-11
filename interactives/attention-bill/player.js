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
  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const number=n=>n.toLocaleString('en-US');
  const captions=[
    'Halve the patch width. How much does one head\'s score grid grow?',
    'Count the image patches. Every patch supplies one token.',
    'One patch token supplies a query row and a key column. Every token does both.',
    'Multiply query rows by key columns. Keep this original score-grid area as the counting unit.',
    'Halve the patch width. The new patch grid and both score-grid axes change together.',
    `Stamp equal-area tiles. Each covers ${number(start.entries)} score positions, not copied score values.`,
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
  const image=label('','ab-input',{'data-value':'image','font-size':14});
  const patch=label('','ab-muted',{'data-value':'patch'});
  const imageOutline=make('rect',{class:'ab-image-outline','data-image-outline':''});
  const patchCells=Array.from({length:Math.max(start.tokens,end.tokens)},(_,index)=>
    make('rect',{class:'ab-patch-cell','data-patch-cell':index,'data-index':index}));
  const patchHighlight=make('rect',{class:'ab-patch-highlight','data-patch-highlight':''});
  const tokens=label('','ab-input',{'data-value':'tokens','font-size':14});
  const rowLink=make('path',{class:'ab-link','data-patch-link':'row'});
  const columnLink=make('path',{class:'ab-link','data-patch-link':'column'});
  const square=make('rect',{class:'ab-square','data-score-square':''});
  // These are equal old-area counting tiles, not score entries or attention windows.
  const areaTiles=Array.from({length:Number.isInteger(entryRatio)&&entryRatio<=1024?entryRatio:0},(_,index)=>
    make('rect',{class:'ab-area-tile','data-area-tile':index}));
  const ghost=make('rect',{class:'ab-ghost','data-score-ghost':''});
  const ghostLabel=label('old grid','',{'data-ghost-label':'','font-size':12});
  const queryRow=make('rect',{class:'ab-token-axis','data-score-row':'','data-token-index':0});
  const keyColumn=make('rect',{class:'ab-token-axis','data-score-column':'','data-token-index':0});
  const rowBracket=make('path',{class:'ab-bracket','data-row-bracket':''});
  const columnBracket=make('path',{class:'ab-bracket','data-column-bracket':''});
  const rowLabel=label('','ab-input',{'data-row-label':''});
  const columnLabel=label('','ab-input',{'data-column-label':''});
  const entries=label('','',{'data-value':'entries','font-size':17});
  const tileLabel=label('1 tile = old grid area','ab-muted',{'data-tile-label':'','font-size':12});
  const tileEntries=label('','ab-muted',{'data-tile-entries':'','font-size':12});
  const ratio=label('','',{'data-value':'ratio','font-size':18});
  const linearGroup=make('g',{'data-linear-comparison':''});
  const linearLabel=make('text',{'font-size':13,class:'ab-input','data-linear-label':''},linearGroup,'block projections / FFN');
  const linearBar=make('rect',{class:'ab-linear-bar','data-linear-bar':''},linearGroup);
  const linearGhost=make('rect',{class:'ab-linear-ghost','data-linear-ghost':''},linearGroup);
  const linearOld=make('text',{'font-size':12,'text-anchor':'middle',class:'ab-input','data-linear-old-label':''},linearGroup,'old');
  const linearValue=make('text',{'font-size':18,class:'ab-input','data-value':'linear-ratio'},linearGroup);
  const linearScope=make('text',{'font-size':12,class:'ab-muted','data-linear-scope':''},linearGroup,'fixed model width');
  let width=713,lastTime=0,reduced=false;
  function measure() {
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    root.dataset.layout=width<600?'narrow':'wide';
  }
  function geometry() {
    const narrow=width<600, imageMax=narrow?112:156;
    const imageW=imageMax*widthPixels/Math.max(widthPixels,heightPixels);
    const imageH=imageMax*heightPixels/Math.max(widthPixels,heightPixels);
    const matrixMax=Math.min(narrow?224:260,narrow?width-76:width-310);
    const matrixX=narrow?(width-matrixMax)/2+10:width-matrixMax-40;
    const matrixY=narrow?234:96, bottom=matrixY+matrixMax;
    return {narrow,imageW,imageH,imageX:narrow?(width-imageW)/2:20,imageY:narrow?42:64,
      matrixMax,matrixX,matrixY,bottom,barX:20,barY:narrow?bottom+130:318,
      barMax:narrow?width-90:176,height:narrow?bottom+176:bottom+102};
  }
  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), state=stage>=4?end:start, trace=stage===2;
    const g=geometry(), {narrow,imageW,imageH,imageX,imageY,matrixMax,matrixX:x,matrixY:y,bottom}=g;
    const unit=matrixMax/Math.max(start.tokens,end.tokens);
    const side=state.tokens*unit, ghostSide=start.tokens*unit;
    const patchW=imageW/state.columns, patchH=imageH/state.rows;
    const tileCount=stage<5?0:stage>5||reducedMotion?areaTiles.length:
      Math.min(areaTiles.length,1+Math.floor(Math.max(0,time-beats[5])*areaTiles.length/3));
    const barWidth=g.barMax*state.tokens/end.tokens, barGhostWidth=g.barMax*start.tokens/end.tokens;
    Object.assign(root.dataset,{
      stage:String(stage),startTokens:String(start.tokens),endTokens:String(end.tokens),
      startEntries:String(start.entries),endEntries:String(end.entries),
      tokenRatio:String(tokenRatio),entryRatio:String(entryRatio),
      currentTokens:String(state.tokens),currentEntries:String(state.entries),currentPatch:String(state.patch),
      patchRows:String(state.rows),patchColumns:String(state.columns),visiblePatchCount:String(state.tokens),patchIndex:'0',
      transitioning:'false',geometryFraction:stage>=4?'1':'0',
      scoreSide:String(side),ghostSide:String(ghostSide),pixelsPerEntry:String(unit),
      stampedTiles:String(tileCount),linearRatio:String(tokenRatio),linearWidth:String(barWidth),linearGhostWidth:String(barGhostWidth),
      excludesCls:'true',costScope:'attention-mixing-and-token-wise-block-projections-not-whole-transformer'
    });
    svg.setAttribute('viewBox',`0 0 ${width} ${g.height}`);
    const description=[`Schematic ${widthPixels} by ${heightPixels} image; CLS excluded. ${state.patch}-pixel patches.`];
    if (stage>=1) description.push(`${state.rows} by ${state.columns} patches: ${state.tokens} tokens.`);
    if (trace) description.push('The first patch supplies the highlighted query row and key column.');
    if (stage>=3) description.push(`${number(state.entries)} score entries per head.`);
    if (stage>=5) description.push(`${tileCount} of ${entryRatio} equal old-area tiles; each counts ${number(start.entries)} positions, not copied scores.`);
    if (stage>=6) description.push(`At fixed model width, token-wise block work grows ${tokenRatio} times; attention mixing grows ${entryRatio} times. This is not measured runtime.`);
    svg.setAttribute('aria-label',description.join(' '));
    attrs(image,{x:imageX+imageW/2,y:narrow?18:20}); image.textContent=`${widthPixels} × ${heightPixels} · schematic`;
    attrs(patch,{x:imageX+imageW/2,y:narrow?176:42}); patch.textContent=`P = ${state.patch} pixels`;
    attrs(imageOutline,{x:imageX,y:imageY,width:imageW,height:imageH});
    patchCells.forEach((cell,index)=>{
      const row=Math.floor(index/state.columns), column=index%state.columns;
      attrs(cell,{x:imageX+column*patchW,y:imageY+row*patchH,width:patchW,height:patchH,'data-row':row,'data-column':column});
      show(cell,index<state.tokens);
    });
    attrs(patchHighlight,{x:imageX,y:imageY,width:patchW,height:patchH,'data-index':0});
    show(patchHighlight,trace);
    attrs(tokens,{x:imageX+imageW/2,y:narrow?197:imageY+imageH+24});
    tokens.textContent=`${state.rows} × ${state.columns} = ${state.tokens} tokens`; show(tokens,stage>=1);
    attrs(square,{x,y,width:side,height:side}); show(square,stage>=2);
    attrs(ghost,{x,y,width:ghostSide,height:ghostSide});
    attrs(ghostLabel,{x:x+ghostSide/2,y:y+ghostSide/2+4});
    show(ghost,stage>=3); show(ghostLabel,stage>=3);
    // Link a patch center to row 0's left midpoint and column 0's top midpoint.
    const sourceX=imageX+patchW/2, sourceY=imageY+patchH/2;
    const trunkX=narrow?x-23:x-64, trunkY=narrow?215:52;
    const stem=narrow?`M ${sourceX} ${sourceY} H ${imageX-14} V ${trunkY} H ${trunkX}`:
      `M ${sourceX} ${sourceY} V ${trunkY} H ${trunkX}`;
    attrs(rowLink,{d:`${stem} V ${y+unit/2} L ${x} ${y+unit/2}`,'data-source-x':sourceX,'data-source-y':sourceY,'data-target-x':x,'data-target-y':y+unit/2});
    attrs(columnLink,{d:`${stem} H ${x+unit/2} L ${x+unit/2} ${y}`,'data-source-x':sourceX,'data-source-y':sourceY,'data-target-x':x+unit/2,'data-target-y':y});
    attrs(queryRow,{x,y,width:side,height:unit}); attrs(keyColumn,{x,y,width:unit,height:side});
    [rowLink,columnLink,queryRow,keyColumn].forEach(node=>show(node,trace));
    areaTiles.forEach((tile,index)=>{
      const row=Math.floor(index/tokenRatio), column=index%tokenRatio;
      attrs(tile,{x:x+column*ghostSide,y:y+row*ghostSide,width:ghostSide,height:ghostSide,
        'data-row':row,'data-column':column,'data-entry-count':start.entries});
      show(tile,index<tileCount);
    });
    attrs(columnBracket,{d:`M ${x} ${y-8} V ${y-13} H ${x+side} V ${y-8}`});
    attrs(rowBracket,{d:`M ${x-8} ${y} H ${x-13} V ${y+side} H ${x-8}`});
    attrs(columnLabel,{x:x+side/2,y:y-23});
    attrs(rowLabel,trace?{x:x+side/2,y:y+side+24,transform:''}:
      {x:x-28,y:y+side/2,transform:`rotate(-90 ${x-28} ${y+side/2})`});
    columnLabel.textContent=`${state.tokens} key columns`; rowLabel.textContent=`${state.tokens} query rows`;
    [columnBracket,rowBracket,columnLabel,rowLabel].forEach(node=>show(node,stage>=2));
    attrs(entries,{x:x+matrixMax/2,y:bottom+24}); entries.textContent=`${number(state.entries)} entries / head`; show(entries,stage>=3);
    attrs(tileLabel,{x:x+matrixMax/2,y:bottom+46}); show(tileLabel,stage>=5);
    attrs(tileEntries,{x:x+matrixMax/2,y:bottom+63}); tileEntries.textContent=`${number(start.entries)} entries`; show(tileEntries,stage>=5);
    attrs(ratio,{x:x+matrixMax/2,y:bottom+88}); ratio.textContent=`×${number(entryRatio)} attention mixing`; show(ratio,stage>=6);
    attrs(linearLabel,{x:g.barX,y:g.barY-14});
    attrs(linearBar,{x:g.barX,y:g.barY,width:barWidth,height:14});
    attrs(linearGhost,{x:g.barX,y:g.barY,width:barGhostWidth,height:14});
    attrs(linearOld,{x:g.barX+barGhostWidth/2,y:g.barY+11});
    attrs(linearValue,{x:g.barX+barWidth+10,y:g.barY+13}); linearValue.textContent=`×${number(tokenRatio)}`;
    attrs(linearScope,{x:g.barX,y:g.barY+34}); show(linearGroup,stage>=6);
    formula.classList.toggle('ab-tokens-shown',stage>=1);
    formula.classList.toggle('ab-entries-shown',stage>=2);
    formula.classList.toggle('ab-scope-shown',stage>=6);
    formula.classList.toggle('ab-tokens-lit',stage===1||stage===4);
    formula.classList.toggle('ab-entries-lit',stage===2||stage===3||stage===5);
    formula.classList.toggle('ab-scope-lit',stage===6);
    formula.classList.toggle('ab-boundary',stage===7);
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${names[stage]}.${stage>=3?` ${number(state.entries)} scores per head.`:''}`;
  }
  function typeset() {
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if (mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done,done);
    } else done();
  }
  measure();
  window.BookPlayback(root,render,()=>{measure();render(lastTime,reduced);});
  typeset();
})();
