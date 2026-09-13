(() => {
  const root=document.getElementById('layernorm-axis-excerpt');
  if(!root||root.dataset.ready)return;
  const $=selector=>root.querySelector(selector),fixture=JSON.parse(root.dataset.fixture);
  function validate(source){
    if(!Array.isArray(source.input)||!source.input.length||!Array.isArray(source.input[0])||!source.input[0].length
      ||!Array.isArray(source.normalizedShape)||source.normalizedShape.length!==1
      ||!Number.isInteger(source.normalizedShape[0])||source.normalizedShape[0]<2
      ||!Array.isArray(source.selected)||source.selected.length!==2
      ||!Number.isFinite(source.eps)||source.eps<=0)
      throw Error('layernorm-axis: a rectangular example/token/feature tensor, one feature shape, selection, and positive epsilon are required');
    const tokens=source.input[0].length,features=source.normalizedShape[0];
    if(!source.input.every(batch=>Array.isArray(batch)&&batch.length===tokens
      &&batch.every(row=>Array.isArray(row)&&row.length===features&&row.every(Number.isFinite)))
      ||!source.selected.every(Number.isInteger)||source.selected[0]<0||source.selected[0]>=source.input.length
      ||source.selected[1]<0||source.selected[1]>=tokens)
      throw Error('layernorm-axis: the last axis must match normalizedShape and the selected token must exist');
  }
  validate(fixture);
  const pane=$('[data-pane]'),figure=$('[data-figure]'),svg=figure.querySelector('svg');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number),duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
  const ease=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
  const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
  const variance=values=>{const center=mean(values);return mean(values.map(value=>(value-center)**2));};
  function buildState(time,reducedMotion=false,source=fixture){
    validate(source);
    const clamped=clamp(Number.isFinite(time)?time:0,0,duration),stage=stageAt(clamped),held=reducedMotion?beats[stage]:clamped;
    const featureCount=source.normalizedShape[0],tokensPerExample=source.input[0].length;
    const rows=source.input.flatMap((batch,batchIndex)=>batch.map((values,token)=>{
      const raw=values.slice(),rowMean=mean(raw),centered=raw.map(value=>value-rowMean),rowVariance=mean(centered.map(value=>value*value));
      const denominator=Math.sqrt(rowVariance+source.eps),normalized=centered.map(value=>value/denominator);
      if(!Number.isFinite(denominator)||!normalized.every(Number.isFinite))throw Error('layernorm-axis: arithmetic overflow in the supplied row');
      return{batch:batchIndex,token,raw,mean:rowMean,variance:rowVariance,centered,denominator,normalized,
        outputMean:mean(normalized),outputVariance:variance(normalized),theoreticalVariance:rowVariance/(rowVariance+source.eps)};
    }));
    const selectedIndex=source.selected[0]*tokensPerExample+source.selected[1],selectedRow=rows[selectedIndex];
    const centerProgress=ease((held-12)/3),scaleProgress=ease((held-22)/3);
    const currentDivisor=1+(selectedRow.denominator-1)*scaleProgress;
    const currentValues=selectedRow.raw.map(value=>(value-selectedRow.mean*centerProgress)/currentDivisor);
    return{stage,time:clamped,held,rows,selectedIndex,selectedRow,featureCount,tokensPerExample,exampleCount:source.input.length,
      centerProgress,scaleProgress,currentDivisor,currentValues,currentMean:mean(currentValues),currentVariance:variance(currentValues),
      profileVisible:stage>=1,meanVisible:stage>=2,centeredVisible:stage>=3,divisorVisible:stage>=4,
      normalizedVisible:stage>=5,comparisonsVisible:stage>=6,boundaryVisible:stage>=7,
      bnVisible:stage===0,bnFeature:0,
      bnGroups:Array.from({length:featureCount},()=>rows.map((_,index)=>index)),
      lnGroups:rows.map(()=>Array.from({length:featureCount},(_,index)=>index))};
  }
  window.BookLayerNormAxis=Object.freeze({buildState});
  const captions=[
    'BatchNorm pools one feature across examples and positions. Which axis will LayerNorm use?',
    'LayerNorm turns across this token\'s features. The other rows supply none of its statistics.',
    'This token has its own mean. Every feature will lose that same offset.',
    'Subtracting one mean translates the whole profile. Its average is now zero.',
    'One shared divisor rescales these four centered features together.',
    'The normalized profile has zero mean and approximately unit variance, before any learned scale and shift.',
    'Normalize each remaining row separately. These profiles nearly coincide despite their different offsets and scales.',
    'BatchNorm shares across positions; LayerNorm stays within this token. Everything shown is before learned scale and shift.'
  ];
  const names=['Compare normalization axes','One token, four features','Read its mean','Center the profile','Read its divisor','Scale the profile','Compare independent rows','Different axes, different dependencies'];
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'),formula=$('[data-formula]'),caption=$('[data-caption]');
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg',pixel=value=>Number(value.toFixed(9));
  const attrs=(node,values)=>{for(const[key,value]of Object.entries(values))node.setAttribute(key,typeof value==='number'?String(pixel(value)):String(value));};
  const make=(tag,attributes,text='',parent=drawing)=>{const node=document.createElementNS(NS,tag);attrs(node,attributes);node.textContent=text;parent.appendChild(node);return node;};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(text,cls='',attributes={})=>make('text',{'text-anchor':'middle',class:cls,...attributes},text);
  const shape=(kind,attributes,parent=drawing)=>kind===0?make('circle',{r:4,...attributes},'',parent)
    :kind===1?make('rect',{x:-6,y:-6,width:12,height:12,...attributes},'',parent)
    :kind===2?make('polygon',{points:'0,-8 8,0 0,8 -8,0',...attributes},'',parent)
    :make('polygon',{points:'0,-9 8,6 -8,6',...attributes},'',parent);
  const initial=buildState(0),shapeLabel=label('','la-muted',{'data-tensor-shape':''});
  const featureLabels=Array.from({length:initial.featureCount},(_,index)=>label(`f${index+1}`,'la-muted',{'data-feature-heading':index}));
  const tableRows=initial.rows.map((row,index)=>({
    name:label(`ex${row.batch+1} · t${row.token+1}`,'la-input',{'text-anchor':'start','data-row-name':index}),
    cells:row.raw.map((value,feature)=>label('','la-input',{'data-input-cell':`${index}:${feature}`,'data-row':index,'data-feature':feature})),
    identity:make('g',{'data-row-identity':index}),
    bracket:make('path',{class:'la-row-bracket','data-row-bracket':index})
  }));
  tableRows.forEach((row,index)=>shape(index%4,{class:'la-identity'},row.identity));
  const selection=make('rect',{class:'la-selection','data-selected-row':''});
  const bnColumn=make('rect',{class:'la-bn-selection','data-bn-column':'','data-feature':0});
  const bnBracket=make('path',{class:'la-bn-bracket','data-bn-column-bracket':''});
  const groupLabel=label('across features','',{'data-group-label':''});
  const axisKey=label('BN ↓ B,T · LN → features','la-muted',{'data-axis-key':'','data-bn-mode':'training'});
  const groupRay=make('path',{class:'la-group-ray','data-group-ray':''});
  const cnn=make('g',{'data-cnn-bn-schematic':'','data-held-axis':'channel','data-pooled-axes':'N,H,W','data-mode':'training','aria-label':'Schematic: BatchNorm pools positions in one channel across two images; no activation values are shown.'});
  const cnnLabel=(text,attributes={})=>make('text',{'text-anchor':'middle',...attributes},text,cnn);
  const cnnTitle=cnnLabel('CNN BatchNorm (training)',{'data-cnn-title':''});
  const cnnChannel=cnnLabel('one channel · schematic',{'class':'la-muted','data-cnn-channel':''});
  const cnnMaps=[0,1].map(index=>({
    label:cnnLabel(`image ${index+1}`,{class:'la-input','data-image-label':index}),
    outline:make('rect',{class:'la-feature-map','data-feature-map':index},'',cnn),
    positions:make('path',{class:'la-map-positions','data-spatial-positions':index},'',cnn)
  }));
  const cnnPool=make('path',{class:'la-pool-bracket','data-cnn-pool':''},'',cnn);
  const cnnStats=cnnLabel('shared mean and variance',{'data-shared-statistics':''});
  const cnnAxes=cnnLabel('across images + positions',{'class':'la-muted','data-cnn-axes':''});
  const cnnAxisNames=cnnLabel('pooled axes: N, H, W',{'class':'la-muted','data-cnn-axis-names':''});
  const plotTitle=label('','',{'data-profile-title':''});
  const plotFrame=make('path',{class:'la-axis','data-plot-frame':''});
  const yTicks=Array.from({length:9},()=>({line:make('line',{class:'la-guide','data-y-tick':''}),label:label('','la-muted',{'text-anchor':'end','data-y-label':''})}));
  const xTicks=Array.from({length:initial.featureCount},(_,index)=>label(String(index+1),'la-muted',{'data-x-label':index}));
  const xAxisLabel=label('feature','la-muted',{'data-x-axis-label':''});
  const zeroLine=make('line',{class:'la-zero','data-zero-line':''});
  const rawGhost=make('path',{class:'la-raw-ghost','data-raw-ghost':''});
  const comparisonPaths=initial.rows.map((row,index)=>make('path',{class:`la-comparison la-series-${index%4}`,'data-comparison-profile':index}));
  const comparisonMarkers=initial.rows.map((row,index)=>row.raw.map((_,feature)=>{
    const group=make('g',{'data-comparison-marker':`${index}:${feature}`});shape(index%4,{class:'la-comparison-mark'},group);return group;
  }));
  const currentPath=make('path',{class:'la-current','data-current-profile':''});
  const currentMarkers=initial.selectedRow.raw.map((_,feature)=>make('circle',{r:4,class:'la-current-mark','data-current-marker':feature}));
  const currentLabels=initial.selectedRow.raw.map((_,feature)=>label('','la-input la-halo',{'data-current-value':feature,'data-value':`feature-${feature}`}));
  const meanLine=make('line',{class:'la-mean','data-mean-line':''});
  const meanLabel=label('','la-halo',{'text-anchor':'end','data-mean-label':'','data-value':'mean'});
  const divisorLabel=label('','',{'data-divisor-label':'','data-value':'divisor'});
  const resultLabel=label('','la-output',{'data-result-label':'','data-value':'variance'});
  const scopeLabel=label('','la-muted',{'data-scope-label':''});
  const scopeReturn=label('LN: within this token','la-muted',{'data-scope-return':''});
  let width=713,lastTime=0,reduced=false;
  function measure(){width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));root.dataset.layout=width<560?'narrow':'wide';}
  const number=value=>Number(value.toFixed(3)).toString();
  function render(time,reducedMotion){
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage}=state,narrow=width<560;
    const tableWidth=narrow?width:254,tableTop=65,rowPitch=29,cellLeft=98,cellRight=tableWidth-17;
    const cellXs=Array.from({length:state.featureCount},(_,i)=>cellLeft+(cellRight-cellLeft)*i/(state.featureCount-1));
    const rowYs=state.rows.map((_,i)=>tableTop+i*rowPitch),tableBottom=rowYs.at(-1)+16;
    const plotLeft=narrow?0:286,plotTop=narrow?tableBottom+82:61,plotBottom=plotTop+221;
    const plotMinX=plotLeft+36,plotMaxX=width-22;
    const featureXs=Array.from({length:state.featureCount},(_,i)=>plotMinX+30+(plotMaxX-plotMinX-60)*i/(state.featureCount-1));
    // This one ruler contains the tracked token's raw, centered and normalized
    // states. Other tokens enter only after their own separate normalization.
    const minimum=Math.min(-2,...state.selectedRow.raw,...state.selectedRow.centered,...state.rows.flatMap(row=>row.normalized));
    const maximum=Math.max(2,...state.selectedRow.raw,...state.selectedRow.centered,...state.rows.flatMap(row=>row.normalized));
    const tickStep=Math.max(1,2**Math.ceil(Math.log2((maximum-minimum)/7)));
    const yMin=Math.floor(minimum/tickStep)*tickStep-tickStep/2,yMax=Math.ceil(maximum/tickStep)*tickStep+tickStep/2;
    const unit=(plotBottom-plotTop)/(yMax-yMin),screenY=value=>pixel(plotBottom-(value-yMin)*unit);
    const path=values=>values.map((value,i)=>`${i?'L':'M'} ${pixel(featureXs[i])} ${screenY(value)}`).join(' ');
    const profilePoints=state.currentValues.map((value,i)=>[pixel(featureXs[i]),screenY(value)]);
    const selectedY=rowYs[state.selectedIndex];
    const height=plotBottom+111;
    Object.assign(root.dataset,{
      stage:String(stage),held:String(state.held),rows:JSON.stringify(state.rows),selectedIndex:String(state.selectedIndex),featureCount:String(state.featureCount),
      centerProgress:String(state.centerProgress),scaleProgress:String(state.scaleProgress),currentDivisor:String(state.currentDivisor),currentValues:JSON.stringify(state.currentValues),currentMean:String(state.currentMean),currentVariance:String(state.currentVariance),
      profileVisible:String(state.profileVisible),meanVisible:String(state.meanVisible),centeredVisible:String(state.centeredVisible),divisorVisible:String(state.divisorVisible),normalizedVisible:String(state.normalizedVisible),comparisonsVisible:String(state.comparisonsVisible),boundaryVisible:String(state.boundaryVisible),
      bnVisible:String(state.bnVisible),bnFeature:String(state.bnFeature),bnGroups:JSON.stringify(state.bnGroups),lnGroups:JSON.stringify(state.lnGroups),
      featureXs:JSON.stringify(featureXs),profilePoints:JSON.stringify(profilePoints),plotMinX:String(plotMinX),plotMaxX:String(plotMaxX),plotTop:String(plotTop),plotBottom:String(plotBottom),
      yMin:String(yMin),yMax:String(yMax),pixelsPerUnit:String(unit),tickStep:String(tickStep),tableWidth:String(tableWidth),cellXs:JSON.stringify(cellXs),rowYs:JSON.stringify(rowYs),selectedY:String(selectedY)
    });
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.setAttribute('aria-label',`${names[stage]}. ${state.exampleCount} examples, ${state.tokensPerExample} tokens per example, ${state.featureCount} features per token.${state.bnVisible?' Temporal BatchNorm training groups one feature down all example and token rows. A separate, nonnumeric CNN schematic groups one channel across images and spatial positions.':''}${state.profileVisible?` LayerNorm groups features within one token. Selected values ${state.currentValues.map(number).join(', ')}.`:''}${state.meanVisible?` Mean ${number(state.currentMean)}.`:''}${state.normalizedVisible?' Approximately unit variance before learned scale and shift.':''}${state.boundaryVisible?' BatchNorm training shares statistics across positions; LayerNorm stays within each token.':''}`);
    attrs(shapeLabel,{x:tableWidth/2,y:19});shapeLabel.textContent=`${state.exampleCount} examples × ${state.tokensPerExample} tokens`;
    featureLabels.forEach((node,i)=>attrs(node,{x:cellXs[i],y:43}));
    tableRows.forEach((row,index)=>{
      const values=state.rows[index].raw,y=rowYs[index],selected=index===state.selectedIndex;
      attrs(row.name,{x:6,y:y+4});attrs(row.identity,{transform:`translate(77 ${y})`});show(row.identity,state.comparisonsVisible);
      row.cells.forEach((node,feature)=>{attrs(node,{x:cellXs[feature],y:y+4,'data-value-source':String(values[feature])});node.textContent=number(values[feature]);});
      attrs(row.bracket,{d:`M ${pixel(cellXs[0]-10)} ${y+10} L ${pixel(cellXs[0]-10)} ${y+14} L ${pixel(cellXs.at(-1)+10)} ${y+14} L ${pixel(cellXs.at(-1)+10)} ${y+10}`});
      show(row.bracket,state.comparisonsVisible||(state.profileVisible&&selected));
    });
    attrs(selection,{x:cellXs[0]-14,y:selectedY-12,width:cellXs.at(-1)-cellXs[0]+28,height:25,rx:3});show(selection,state.profileVisible&&!state.comparisonsVisible);
    const bnX=cellXs[state.bnFeature],bnTop=rowYs[0]-12,bnBottom=rowYs.at(-1)+12;
    attrs(bnColumn,{x:bnX-13,y:bnTop,width:26,height:bnBottom-bnTop,rx:3});show(bnColumn,state.bnVisible);
    attrs(bnBracket,{d:`M ${pixel(bnX-16)} ${bnTop} L ${pixel(bnX-20)} ${bnTop} L ${pixel(bnX-20)} ${bnBottom} L ${pixel(bnX-16)} ${bnBottom}`});show(bnBracket,state.bnVisible);
    attrs(groupLabel,{x:tableWidth/2,y:tableBottom+18});groupLabel.textContent=state.bnVisible?'temporal BN: training':'LN: across this token\'s features';
    attrs(axisKey,{x:tableWidth/2,y:tableBottom+42});
    if(narrow)attrs(groupRay,{d:`M ${pixel((cellXs[0]+cellXs.at(-1))/2)} ${tableBottom+25} L ${pixel((cellXs[0]+cellXs.at(-1))/2)} ${plotTop-30}`});
    else attrs(groupRay,{d:`M ${pixel(tableWidth)} ${selectedY} L ${pixel(plotLeft-11)} ${selectedY} L ${pixel(plotLeft-11)} ${plotTop-15} L ${pixel(plotMinX)} ${plotTop-15}`});
    show(groupRay,state.profileVisible&&!state.comparisonsVisible&&!narrow);
    const cnnCenter=(plotMinX+plotMaxX)/2,mapSide=Math.min(84,(plotMaxX-plotMinX-30)/2),mapGap=30,mapY=plotTop+55;
    const mapXs=[cnnCenter-mapGap/2-mapSide,cnnCenter+mapGap/2],poolY=mapY+mapSide+20;
    attrs(cnnTitle,{x:cnnCenter,y:plotTop-10});attrs(cnnChannel,{x:cnnCenter,y:plotTop+13});
    cnnMaps.forEach((map,index)=>{
      const x=mapXs[index];attrs(map.label,{x:x+mapSide/2,y:mapY-10});attrs(map.outline,{x,y:mapY,width:mapSide,height:mapSide});
      const lines=[];
      for(let division=1;division<3;division++){
        const offset=mapSide*division/3;
        lines.push(`M ${pixel(x+offset)} ${pixel(mapY)} L ${pixel(x+offset)} ${pixel(mapY+mapSide)}`);
        lines.push(`M ${pixel(x)} ${pixel(mapY+offset)} L ${pixel(x+mapSide)} ${pixel(mapY+offset)}`);
      }
      attrs(map.positions,{d:lines.join(' ')});
    });
    attrs(cnnPool,{d:`M ${pixel(mapXs[0]+mapSide/2)} ${pixel(mapY+mapSide)} L ${pixel(mapXs[0]+mapSide/2)} ${pixel(poolY)} L ${pixel(mapXs[1]+mapSide/2)} ${pixel(poolY)} L ${pixel(mapXs[1]+mapSide/2)} ${pixel(mapY+mapSide)} M ${pixel(cnnCenter)} ${pixel(poolY)} L ${pixel(cnnCenter)} ${pixel(poolY+11)}`});
    attrs(cnnStats,{x:cnnCenter,y:poolY+29});attrs(cnnAxes,{x:cnnCenter,y:poolY+50});attrs(cnnAxisNames,{x:cnnCenter,y:poolY+71});show(cnn,state.bnVisible);
    attrs(plotTitle,{x:(plotMinX+plotMaxX)/2,y:plotTop-17});plotTitle.textContent=state.comparisonsVisible?'each token, normalized separately':`ex${state.selectedRow.batch+1} · token ${state.selectedRow.token+1}`;show(plotTitle,state.profileVisible);
    attrs(plotFrame,{d:`M ${pixel(plotMinX)} ${plotTop} L ${pixel(plotMinX)} ${plotBottom} L ${pixel(plotMaxX)} ${plotBottom}`});show(plotFrame,state.profileVisible);
    const firstTick=Math.ceil(yMin/tickStep)*tickStep;
    yTicks.forEach((tick,index)=>{
      const value=firstTick+index*tickStep,y=screenY(value),visible=state.profileVisible&&value<=yMax;
      attrs(tick.line,{x1:plotMinX,y1:y,x2:plotMaxX,y2:y,'data-coordinate':String(value)});attrs(tick.label,{x:plotMinX-7,y:y+4,'data-coordinate':String(value)});tick.label.textContent=number(value);
      show(tick.line,visible);show(tick.label,visible);
    });
    xTicks.forEach((node,i)=>{attrs(node,{x:featureXs[i],y:plotBottom+19});show(node,state.profileVisible);});
    attrs(xAxisLabel,{x:(plotMinX+plotMaxX)/2,y:plotBottom+38});show(xAxisLabel,state.profileVisible);
    attrs(zeroLine,{x1:plotMinX,y1:screenY(0),x2:plotMaxX,y2:screenY(0)});show(zeroLine,state.profileVisible);
    attrs(rawGhost,{d:path(state.selectedRow.raw)});show(rawGhost,state.centerProgress>0);
    comparisonPaths.forEach((node,index)=>{attrs(node,{d:path(state.rows[index].normalized)});show(node,state.comparisonsVisible&&index!==state.selectedIndex);});
    comparisonMarkers.forEach((row,index)=>row.forEach((node,feature)=>{
      const point=[pixel(featureXs[feature]),screenY(state.rows[index].normalized[feature])];attrs(node,{transform:`translate(${point[0]} ${point[1]})`,'data-position':JSON.stringify(point)});show(node,state.comparisonsVisible&&index!==state.selectedIndex);
    }));
    attrs(currentPath,{d:path(state.currentValues)});currentPath.classList.toggle('la-output-stroke',state.scaleProgress>0);show(currentPath,state.profileVisible);
    currentMarkers.forEach((node,index)=>{
      const point=profilePoints[index];attrs(node,{cx:point[0],cy:point[1]});node.classList.toggle('la-output-fill',state.scaleProgress>0);show(node,state.profileVisible);
      attrs(currentLabels[index],{x:point[0],y:point[1]-13});currentLabels[index].textContent=number(state.currentValues[index]);currentLabels[index].classList.toggle('la-output',state.scaleProgress>0);show(currentLabels[index],state.profileVisible);
    });
    const meanY=screenY(state.currentMean);
    attrs(meanLine,{x1:plotMinX,y1:meanY,x2:plotMaxX,y2:meanY});attrs(meanLabel,{x:plotMaxX-2,y:meanY-7});meanLabel.textContent=`mean ${number(state.currentMean)}`;
    show(meanLine,state.meanVisible);show(meanLabel,state.meanVisible);
    attrs(divisorLabel,{x:(plotMinX+plotMaxX)/2,y:plotBottom+61});divisorLabel.textContent=`divide by ${number(state.selectedRow.denominator)}`;show(divisorLabel,state.divisorVisible&&!state.comparisonsVisible);
    attrs(resultLabel,{x:(plotMinX+plotMaxX)/2,y:plotBottom+82});resultLabel.textContent=`variance ≈ ${state.selectedRow.outputVariance.toFixed(6)}`;show(resultLabel,state.normalizedVisible&&!state.comparisonsVisible);
    attrs(scopeLabel,{x:(plotMinX+plotMaxX)/2,y:plotBottom+61});scopeLabel.textContent=state.boundaryVisible?'BN: shares across positions':'nearly coincident; no shared statistics';show(scopeLabel,state.comparisonsVisible);
    attrs(scopeReturn,{x:(plotMinX+plotMaxX)/2,y:plotBottom+82});show(scopeReturn,state.boundaryVisible);
    formula.classList.toggle('la-mean-shown',state.meanVisible);formula.classList.toggle('la-norm-shown',state.meanVisible);formula.classList.toggle('la-boundary-shown',state.boundaryVisible);
    formula.classList.toggle('la-centering',stage>=2&&stage<4);formula.classList.toggle('la-scaling',stage>=4&&stage<6);
    if(caption.textContent!==captions[stage])caption.textContent=captions[stage];
    return`${names[stage]}.${state.meanVisible?` Current profile mean ${number(state.currentMean)}.`:''}${state.normalizedVisible?' Normalization is before learned scale and shift.':''}`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  measure();window.BookPlayback(root,render,()=>{measure();render(lastTime,reduced);});typeset();
})();
