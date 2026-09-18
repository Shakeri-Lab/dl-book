(() => {
  const root=document.getElementById('layernorm-axis-excerpt');
  if(!root||root.dataset.ready)return;
  const $=selector=>root.querySelector(selector),fixture=JSON.parse(root.dataset.fixture);
  // The perturbation test is a declared computed variant of the audit tensor, not new
  // data: one neighbouring token scaled by one factor, and one pooled feature column.
  const variant=JSON.parse(root.dataset.variant);
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
  // change === null means "no perturbation test" (a tensor with a single token has no neighbour).
  function validateChange(source,change){
    if(change===null)return;
    const tokens=source.input[0].length,features=source.normalizedShape[0];
    if(!change||!Array.isArray(change.neighbor)||change.neighbor.length!==2||!change.neighbor.every(Number.isInteger)
      ||change.neighbor[0]<0||change.neighbor[0]>=source.input.length||change.neighbor[1]<0||change.neighbor[1]>=tokens
      ||(change.neighbor[0]===source.selected[0]&&change.neighbor[1]===source.selected[1])
      ||!Number.isFinite(change.factor)||!Number.isInteger(change.feature)||change.feature<0||change.feature>=features)
      throw Error('layernorm-axis: the perturbed neighbor must be another existing token, its factor finite, and the pooled feature a column of the tensor');
  }
  validate(fixture);validateChange(fixture,variant);
  const pane=$('[data-pane]'),figure=$('[data-figure]'),svg=figure.querySelector('svg');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number),duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
  const ease=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
  const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
  const variance=values=>{const center=mean(values);return mean(values.map(value=>(value-center)**2));};
  // Every glide finishes AT the beat it leads into, so a beat seek parks on a finished picture.
  const TURN_SPAN=2.5,CENTER_SPAN=3,SCALE_SPAN=3,PERTURB_SPAN=2;
  const normalizeRows=(input,eps)=>input.flatMap((batch,batchIndex)=>batch.map((values,token)=>{
    const raw=values.slice(),rowMean=mean(raw),centered=raw.map(value=>value-rowMean),rowVariance=mean(centered.map(value=>value*value));
    const denominator=Math.sqrt(rowVariance+eps),normalized=centered.map(value=>value/denominator);
    if(!Number.isFinite(denominator)||!normalized.every(Number.isFinite))throw Error('layernorm-axis: arithmetic overflow in the supplied row');
    return{batch:batchIndex,token,raw,mean:rowMean,variance:rowVariance,centered,denominator,normalized,
      outputMean:mean(normalized),outputVariance:variance(normalized),theoreticalVariance:rowVariance/(rowVariance+eps)};
  }));
  function buildState(time,reducedMotion=false,source=fixture,change=source===fixture?variant:null){
    validate(source);validateChange(source,change);
    const clamped=clamp(Number.isFinite(time)?time:0,0,duration),stage=stageAt(clamped),held=reducedMotion?beats[stage]:clamped;
    const featureCount=source.normalizedShape[0],tokensPerExample=source.input[0].length;
    const rows=normalizeRows(source.input,source.eps);
    const selectedIndex=source.selected[0]*tokensPerExample+source.selected[1];
    const glide=(end,span)=>ease((held-(end-span))/span);
    // The axis change is one turn of one rectangle, finishing exactly at the beat it leads into.
    const turnProgress=glide(beats[2],TURN_SPAN);
    const centerProgress=glide(beats[3],CENTER_SPAN),scaleProgress=glide(beats[5],SCALE_SPAN);
    const perturbProgress=change?glide(beats[7],PERTURB_SPAN):0,perturbing=Boolean(change)&&stage===6&&held>=beats[7]-PERTURB_SPAN;
    const neighborIndex=change?change.neighbor[0]*tokensPerExample+change.neighbor[1]:-1;
    const perturbFactor=change?1+(change.factor-1)*perturbProgress:1;
    // The test re-runs the SAME LayerNorm on the perturbed tensor. The tracked profile
    // is read from that result, so its stillness is computed, never assumed.
    const liveInput=source.input.map((batch,b)=>batch.map((values,t)=>
      b*tokensPerExample+t===neighborIndex?values.map(value=>value*perturbFactor):values.slice()));
    const liveRows=normalizeRows(liveInput,source.eps),selectedRow=liveRows[selectedIndex];
    const currentDivisor=1+(selectedRow.denominator-1)*scaleProgress;
    const currentValues=selectedRow.raw.map(value=>(value-selectedRow.mean*centerProgress)/currentDivisor);
    const bnFeature=change?change.feature:0;
    // Only BatchNorm's pooled STATISTIC is ever computed: no BatchNorm output is invented.
    const columnMeanBefore=mean(rows.map(row=>row.raw[bnFeature])),columnMean=mean(liveRows.map(row=>row.raw[bnFeature]));
    return{stage,time:clamped,held,rows,liveRows,selectedIndex,selectedRow,featureCount,tokensPerExample,exampleCount:source.input.length,
      centerProgress,scaleProgress,currentDivisor,currentValues,currentMean:mean(currentValues),currentVariance:variance(currentValues),
      turnProgress,turning:turnProgress>0&&turnProgress<1,
      profileVisible:turnProgress>0,meanVisible:stage>=2,centeredVisible:stage>=3,divisorVisible:stage>=4,normalizedVisible:stage>=5,
      testVisible:Boolean(change)&&stage>=6,answerVisible:Boolean(change)&&stage>=7,perturbing,perturbProgress,perturbFactor,neighborIndex,
      // The BatchNorm column is never off the picture: live before the turn, a muted ghost
      // through LayerNorm's own beats, live again for the perturbation test.
      bnVisible:turnProgress<1||(Boolean(change)&&stage>=6),bnGhostVisible:turnProgress>0&&!(Boolean(change)&&stage>=6),
      bnFeature,columnMeanBefore,columnMean,
      bnGroups:Array.from({length:featureCount},()=>rows.map((_,index)=>index)),
      lnGroups:rows.map(()=>Array.from({length:featureCount},(_,index)=>index))};
  }
  window.BookLayerNormAxis=Object.freeze({buildState});
  const captions=[
    'BatchNorm pools one feature across examples and positions. Which axis will LayerNorm use?',
    'One highlight turns: BatchNorm\'s column becomes this token\'s row. Other rows supply no statistics.',
    'This token has its own mean. Every feature will lose that same offset.',
    'Subtracting one mean translates the whole profile. Its average is now zero.',
    'One shared divisor rescales these four centered features together.',
    'The normalized profile has zero mean and approximately unit variance, before any learned scale and shift.',
    'Predict: the neighbor token is about to double. What moves: this token\'s profile, or BatchNorm\'s pooled mean?',
    'A token\'s LayerNorm result does not depend on batchmates or sequence length; BatchNorm\'s statistics do. Before learned scale and shift.'
  ];
  const perturbingCaption='The neighbor doubles. One changed cell lies inside BatchNorm\'s column; none lies inside LayerNorm\'s row.';
  const names=['Compare normalization axes','Turn the highlight to the feature axis','Read its mean','Center the profile','Read its divisor','Scale the profile','Perturb a neighbor token','Different axes, different dependencies'];
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'),formula=$('[data-formula]'),caption=$('[data-caption]');
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg',pixel=value=>Number(value.toFixed(4));
  const attrs=(node,values)=>{for(const[key,value]of Object.entries(values))node.setAttribute(key,typeof value==='number'?String(pixel(value)):String(value));};
  const make=(tag,attributes,text='',parent=drawing)=>{const node=document.createElementNS(NS,tag);attrs(node,attributes);node.textContent=text;parent.appendChild(node);return node;};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(text,cls='',attributes={},parent=drawing)=>make('text',{'text-anchor':'middle',class:cls,...attributes},text,parent);
  const initial=buildState(0),rowName=row=>`ex${row.batch+1} · t${row.token+1}`;
  // Bands sit under the numerals they group. Where the neighbor band crosses BatchNorm's
  // column is the one changed cell that column pools; it never crosses LayerNorm's row.
  const neighborBand=make('rect',{class:'la-neighbor-band','data-neighbor-row':''});
  const bnGhostColumn=make('rect',{class:'la-bn-ghost','data-bn-column-ghost':'','data-feature':initial.bnFeature});
  const bnColumn=make('rect',{class:'la-bn-selection','data-bn-column':'','data-feature':initial.bnFeature});
  const shapeLabel=label('','la-muted',{'data-tensor-shape':''});
  const featureLabels=Array.from({length:initial.featureCount},(_,index)=>label(`f${index+1}`,'la-muted',{'data-feature-heading':index}));
  const tableRows=initial.rows.map((row,index)=>({
    name:label(rowName(row),'la-input',{'text-anchor':'start','data-row-name':index}),
    cells:row.raw.map((value,feature)=>label('','la-input',{'data-input-cell':`${index}:${feature}`,'data-row':index,'data-feature':feature}))
  }));
  const selection=make('rect',{class:'la-selection','data-selected-row':''});
  const bnBracket=make('path',{class:'la-bn-bracket','data-bn-column-bracket':''});
  const groupLabel=label('','',{'data-group-label':''});
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
  const xTicks=Array.from({length:initial.featureCount},(_,index)=>label(`f${index+1}`,'la-muted',{'data-x-label':index}));
  const zeroLine=make('line',{class:'la-zero','data-zero-line':''});
  // Lines are drawn before the value labels, whose white halo then keeps them legible.
  const meanLine=make('line',{class:'la-mean','data-mean-line':''});
  const rawGhost=make('path',{class:'la-raw-ghost','data-raw-ghost':''});
  const currentPath=make('path',{class:'la-current','data-current-profile':''});
  const currentMarkers=initial.selectedRow.raw.map((_,feature)=>make('circle',{r:4,class:'la-current-mark','data-current-marker':feature}));
  const currentLabels=initial.selectedRow.raw.map((_,feature)=>label('','la-input la-halo',{'data-current-value':feature,'data-value':`feature-${feature}`}));
  const meanLabel=label('','la-halo',{'text-anchor':'end','data-mean-label':'','data-value':'mean'});
  const divisorLabel=label('','',{'data-divisor-label':'','data-value':'divisor'});
  const resultLabel=label('','la-output',{'data-result-label':'','data-value':'variance'});
  // One number line, two pointers: the token's own mean above it, the pooled column
  // mean below it. The test is which of the two the neighbor can push.
  const strip=make('g',{'data-stat-strip':''});
  const stripLine=make('line',{class:'la-strip','data-stat-line':''},'',strip);
  const stripTicks=make('path',{class:'la-strip','data-stat-ticks':''},'',strip);
  const stripLow=label('','la-muted',{'text-anchor':'end','data-stat-end':'low'},strip);
  const stripHigh=label('','la-muted',{'text-anchor':'start','data-stat-end':'high'},strip);
  const bnTie=make('line',{class:'la-tie','data-bn-tie':''},'',strip);
  const bnGhost=make('path',{class:'la-pointer-ghost','data-bn-ghost':'',d:'M 0 3 L 8 16 L -8 16 Z'},'',strip);
  const bnPointer=make('path',{class:'la-pointer','data-bn-pointer':'',d:'M 0 3 L 8 16 L -8 16 Z'},'',strip);
  const lnPointer=make('path',{class:'la-pointer','data-ln-pointer':'',d:'M 0 -3 L 8 -16 L -8 -16 Z'},'',strip);
  const lnLabel=label('','la-halo',{'data-ln-label':'','data-value':'row-mean'},strip);
  const bnLabel=label('','la-halo',{'data-bn-label':'','data-value':'column-mean'},strip);
  let width=713,lastTime=0,reduced=false,G=null;
  const number=(value,digits=3)=>Number(value.toFixed(digits)).toString().replace('-','−');
  // A pointer's label rides with it, kept inside the picture by a generous glyph-width estimate.
  const ride=(x,text)=>{const half=text.length*7.4/2+4;return clamp(x,half,width-half);};
  // Width-only work: the fixture, both rulers and every fixed mark are placed here, once
  // per layout. render() below moves only what time moves.
  function layout(){
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    const narrow=width<560,state=initial,tracked=state.rows[state.selectedIndex],neighbor=state.rows[state.neighborIndex];
    root.dataset.layout=narrow?'narrow':'wide';
    const tableWidth=narrow?width:254,tableTop=65,rowPitch=29,cellLeft=98,cellRight=tableWidth-17;
    const cellXs=Array.from({length:state.featureCount},(_,i)=>cellLeft+(cellRight-cellLeft)*i/(state.featureCount-1));
    const rowYs=state.rows.map((_,i)=>tableTop+i*rowPitch),tableBottom=rowYs.at(-1)+16;
    const plotLeft=narrow?0:286,plotTop=narrow?tableBottom+82:61,plotBottom=plotTop+221;
    const plotMinX=plotLeft+36,plotMaxX=width-22,plotCenter=(plotMinX+plotMaxX)/2;
    const featureXs=Array.from({length:state.featureCount},(_,i)=>plotMinX+30+(plotMaxX-plotMinX-60)*i/(state.featureCount-1));
    // This one ruler contains the tracked token's raw, centered and normalized
    // states. No other token's values are ever drawn on it.
    const minimum=Math.min(-2,...tracked.raw,...tracked.centered,...tracked.normalized);
    const maximum=Math.max(2,...tracked.raw,...tracked.centered,...tracked.normalized);
    const tickStep=Math.max(1,2**Math.ceil(Math.log2((maximum-minimum)/7)));
    const yMin=Math.floor(minimum/tickStep)*tickStep-tickStep/2,yMax=Math.ceil(maximum/tickStep)*tickStep+tickStep/2;
    const unit=(plotBottom-plotTop)/(yMax-yMin),screenY=value=>pixel(plotBottom-(value-yMin)*unit);
    const selectedY=rowYs[state.selectedIndex],height=plotBottom+111;
    // The statistics line spans the token's mean and the pooled mean before and after
    // the declared perturbation, on one fixed scale that the perturbation cannot move.
    // It runs one step past the largest value, so its printed end is never the answer.
    const pooledEnd=state.columnMeanBefore+neighbor.raw[state.bnFeature]*(variant.factor-1)/state.rows.length;
    const statValues=[0,tracked.mean,state.columnMeanBefore,pooledEnd],statSpan=Math.max(...statValues)-Math.min(...statValues)||1;
    const statStep=10**Math.floor(Math.log10(statSpan))/2;
    const statMin=Math.floor(Math.min(...statValues)/statStep)*statStep,statMax=(Math.floor(Math.max(...statValues)/statStep)+1)*statStep;
    const statLeft=featureXs[0],statRight=featureXs.at(-1),statY=plotBottom+68;
    const statX=value=>pixel(statLeft+(value-statMin)/(statMax-statMin)*(statRight-statLeft));
    const bandLeft=cellXs[0]-10,bandRight=cellXs.at(-1)+14,bnX=cellXs[state.bnFeature];
    // The two ends of the turn. They share one cell — the tracked token's own feature 1 —
    // and every interpolated rectangle still contains it, so the turn pivots there.
    const columnRect={x:bnX-14,y:rowYs[0]-15,width:28,height:rowYs.at(-1)+15-(rowYs[0]-15)};
    const rowRect={x:bandLeft,y:selectedY-12,width:bandRight-bandLeft,height:25};
    const columnBracket=[bnX-18,columnRect.y,bnX-22,columnRect.y,bnX-22,columnRect.y+columnRect.height,bnX-18,columnRect.y+columnRect.height];
    G={narrow,featureXs,screenY,plotMinX,plotMaxX,statX,statY,columnRect,rowRect,columnBracket,
      trackedName:`ex${tracked.batch+1} · token ${tracked.token+1}`,neighborName:rowName(neighbor)};
    Object.assign(root.dataset,{
      rows:JSON.stringify(state.rows),selectedIndex:String(state.selectedIndex),neighborIndex:String(state.neighborIndex),featureCount:String(state.featureCount),
      bnFeature:String(state.bnFeature),bnGroups:JSON.stringify(state.bnGroups),lnGroups:JSON.stringify(state.lnGroups),
      featureXs:JSON.stringify(featureXs),plotMinX:String(plotMinX),plotMaxX:String(plotMaxX),plotTop:String(plotTop),plotBottom:String(plotBottom),
      yMin:String(yMin),yMax:String(yMax),pixelsPerUnit:String(unit),tickStep:String(tickStep),tableWidth:String(tableWidth),cellXs:JSON.stringify(cellXs),rowYs:JSON.stringify(rowYs),selectedY:String(selectedY),
      statMin:String(statMin),statMax:String(statMax)
    });
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    attrs(shapeLabel,{x:tableWidth/2,y:19});shapeLabel.textContent=`${state.exampleCount} examples × ${state.tokensPerExample} tokens`;
    featureLabels.forEach((node,i)=>attrs(node,{x:cellXs[i],y:43}));
    tableRows.forEach((row,index)=>{attrs(row.name,{x:6,y:rowYs[index]+4});row.cells.forEach((node,feature)=>attrs(node,{x:cellXs[feature],y:rowYs[index]+4}));});
    attrs(neighborBand,{x:bandLeft,y:rowYs[state.neighborIndex]-12,width:bandRight-bandLeft,height:25,rx:3});
    for(const node of [bnColumn,bnGhostColumn])attrs(node,{...columnRect,rx:3});
    attrs(bnBracket,{d:`M ${pixel(columnBracket[0])} ${columnBracket[1]} L ${pixel(columnBracket[2])} ${columnBracket[3]} L ${pixel(columnBracket[4])} ${columnBracket[5]} L ${pixel(columnBracket[6])} ${columnBracket[7]}`});
    // The axis key is the legend of the turn, so it stands under the table throughout.
    attrs(groupLabel,{x:tableWidth/2,y:tableBottom+18});attrs(axisKey,{x:tableWidth/2,y:tableBottom+42});
    if(narrow)attrs(groupRay,{d:`M ${pixel((cellXs[0]+cellXs.at(-1))/2)} ${tableBottom+25} L ${pixel((cellXs[0]+cellXs.at(-1))/2)} ${plotTop-30}`});
    else attrs(groupRay,{d:`M ${pixel(tableWidth)} ${selectedY} L ${pixel(plotLeft-11)} ${selectedY} L ${pixel(plotLeft-11)} ${plotTop-15} L ${pixel(plotMinX)} ${plotTop-15}`});
    const mapSide=Math.min(84,(plotMaxX-plotMinX-30)/2),mapGap=30,mapY=plotTop+55;
    const mapXs=[plotCenter-mapGap/2-mapSide,plotCenter+mapGap/2],poolY=mapY+mapSide+20;
    attrs(cnnTitle,{x:plotCenter,y:plotTop-10});attrs(cnnChannel,{x:plotCenter,y:plotTop+13});
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
    attrs(cnnPool,{d:`M ${pixel(mapXs[0]+mapSide/2)} ${pixel(mapY+mapSide)} L ${pixel(mapXs[0]+mapSide/2)} ${pixel(poolY)} L ${pixel(mapXs[1]+mapSide/2)} ${pixel(poolY)} L ${pixel(mapXs[1]+mapSide/2)} ${pixel(mapY+mapSide)} M ${pixel(plotCenter)} ${pixel(poolY)} L ${pixel(plotCenter)} ${pixel(poolY+11)}`});
    attrs(cnnStats,{x:plotCenter,y:poolY+29});attrs(cnnAxes,{x:plotCenter,y:poolY+50});attrs(cnnAxisNames,{x:plotCenter,y:poolY+71});
    attrs(plotTitle,{x:plotCenter,y:plotTop-17});
    attrs(plotFrame,{d:`M ${pixel(plotMinX)} ${plotTop} L ${pixel(plotMinX)} ${plotBottom} L ${pixel(plotMaxX)} ${plotBottom}`});
    const firstTick=Math.ceil(yMin/tickStep)*tickStep;
    yTicks.forEach((tick,index)=>{
      const value=firstTick+index*tickStep,y=screenY(value);
      attrs(tick.line,{x1:plotMinX,y1:y,x2:plotMaxX,y2:y,'data-coordinate':String(value)});attrs(tick.label,{x:plotMinX-7,y:y+4,'data-coordinate':String(value)});tick.label.textContent=number(value);
      // Every guide is drawn; every other one is numbered, so the ruler stays quiet.
      tick.line.dataset.onRuler=String(value<=yMax);tick.label.dataset.onRuler=String(value<=yMax&&value%(2*tickStep)===0);
    });
    xTicks.forEach((node,i)=>attrs(node,{x:featureXs[i],y:plotBottom+19}));
    attrs(zeroLine,{x1:plotMinX,y1:screenY(0),x2:plotMaxX,y2:screenY(0)});
    attrs(rawGhost,{d:tracked.raw.map((value,i)=>`${i?'L':'M'} ${pixel(featureXs[i])} ${screenY(value)}`).join(' ')});
    attrs(divisorLabel,{x:plotCenter,y:plotBottom+46});divisorLabel.textContent=`divide by ${number(tracked.denominator)}`;
    attrs(resultLabel,{x:plotCenter,y:plotBottom+67});resultLabel.textContent=`variance ≈ ${tracked.outputVariance.toFixed(6)}`;
    const ticks=[];
    for(let value=statMin;value<=statMax+statStep/2;value+=statStep)ticks.push(`M ${statX(value)} ${statY-5} L ${statX(value)} ${statY+5}`);
    attrs(stripLine,{x1:statLeft,y1:statY,x2:statRight,y2:statY});attrs(stripTicks,{d:ticks.join(' ')});
    attrs(stripLow,{x:statLeft-9,y:statY+4});stripLow.textContent=number(statMin);attrs(stripHigh,{x:statRight+9,y:statY+4});stripHigh.textContent=number(statMax);
    attrs(bnGhost,{transform:`translate(${statX(state.columnMeanBefore)} ${statY})`,'data-value-source':String(state.columnMeanBefore)});
  }
  function render(time,reducedMotion){
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage}=state,{featureXs,screenY,plotMinX,plotMaxX,statX,statY,columnRect,rowRect,columnBracket,trackedName,neighborName}=G;
    const tracked=state.rows[state.selectedIndex],neighbor=state.rows[state.neighborIndex];
    const profilePoints=state.currentValues.map((value,i)=>[pixel(featureXs[i]),screenY(value)]);
    Object.assign(root.dataset,{
      stage:String(stage),held:String(state.held),liveRows:JSON.stringify(state.liveRows),
      centerProgress:String(state.centerProgress),scaleProgress:String(state.scaleProgress),currentDivisor:String(state.currentDivisor),currentValues:JSON.stringify(state.currentValues),currentMean:String(state.currentMean),currentVariance:String(state.currentVariance),
      profileVisible:String(state.profileVisible),meanVisible:String(state.meanVisible),centeredVisible:String(state.centeredVisible),divisorVisible:String(state.divisorVisible),normalizedVisible:String(state.normalizedVisible),
      testVisible:String(state.testVisible),answerVisible:String(state.answerVisible),perturbing:String(state.perturbing),perturbProgress:String(state.perturbProgress),perturbFactor:String(state.perturbFactor),columnMean:String(state.columnMean),
      turnProgress:String(state.turnProgress),bnVisible:String(state.bnVisible),bnGhostVisible:String(state.bnGhostVisible),profilePoints:JSON.stringify(profilePoints)
    });
    svg.setAttribute('aria-label',`${names[stage]}. ${state.exampleCount} examples, ${state.tokensPerExample} tokens per example, ${state.featureCount} features per token.`
      +`${state.bnVisible&&!state.testVisible?' Temporal BatchNorm training groups one feature down all example and token rows.':''}`
      +`${stage===0?' A separate, nonnumeric CNN schematic groups one channel across images and spatial positions.':''}`
      +`${state.turning?' One highlight is turning from that column to this token\'s row, about the cell they share.':''}`
      +`${state.bnGhostVisible?' The BatchNorm column stays behind as a muted outline.':''}`
      +`${state.profileVisible?` LayerNorm groups features within one token. Selected values ${state.currentValues.map(value=>number(value)).join(', ')}.`:''}`
      +`${state.meanVisible?` Mean ${number(state.currentMean)}.`:''}${state.normalizedVisible?' Approximately unit variance before learned scale and shift.':''}`
      +`${state.testVisible?` Both groups are outlined on the same tensor: BatchNorm's feature ${state.bnFeature+1} column, pooled mean ${number(state.columnMeanBefore)}, and LayerNorm's token row, mean ${number(tracked.mean)}.`:''}`
      +`${state.testVisible&&!state.answerVisible?` Neighbor token ${neighborName} is set to double.`:''}`
      +`${state.answerVisible?` Neighbor token ${neighborName} doubled to ${state.liveRows[state.neighborIndex].raw.map(value=>number(value)).join(', ')}. The pooled mean moved from ${number(state.columnMeanBefore)} to ${number(state.columnMean)}. This token's mean, variance and normalized profile did not move.`:''}`);
    const inColumn=feature=>state.bnVisible&&feature===state.bnFeature;// the muted ghost never re-emphasises its numerals
    const inRow=index=>(state.profileVisible&&index===state.selectedIndex)||(state.testVisible&&index===state.neighborIndex);
    // Heavy numerals are the ones a visible group pools; the neighbor's other cells move, in plain blue; the rest are gray.
    const pooled=(index,feature)=>inColumn(feature)||(state.profileVisible&&index===state.selectedIndex);
    featureLabels.forEach((node,i)=>node.setAttribute('class',inColumn(i)?'':'la-muted'));
    tableRows.forEach((row,index)=>{
      const values=state.liveRows[index].raw,moving=index===state.neighborIndex&&state.perturbProgress>0&&state.perturbProgress<1;
      row.name.setAttribute('class',stage===0||inRow(index)?'la-input':'la-idle');
      row.cells.forEach((node,feature)=>{
        node.setAttribute('data-value-source',String(values[feature]));node.setAttribute('class',pooled(index,feature)?'la-input la-active':inRow(index)?'la-input':'la-idle');
        // Mid-glide the neighbor's numerals are rounded for reading; the pooled-mean
        // pointer is placed from the unrounded values (data-value-source).
        node.textContent=number(values[feature],moving?0:3);
      });
    });
    // ONE rectangle sweeps from BatchNorm's vertical column to LayerNorm's horizontal row,
    // about the cell they share: the same tensor, a different axis. Its two ends are exact.
    const turn=state.turnProgress,mix=(a,b)=>turn===0?a:turn===1?b:a+(b-a)*turn;
    attrs(selection,{x:mix(columnRect.x,rowRect.x),y:mix(columnRect.y,rowRect.y),
      width:mix(columnRect.width,rowRect.width),height:mix(columnRect.height,rowRect.height),rx:3});
    show(selection,state.profileVisible);show(neighborBand,state.testVisible);
    // The band it leaves behind stays on the picture as a muted ghost, so the axis being
    // contrasted is never off screen; the bracket cross-fades as the rectangle turns away.
    // Opacity is written before visibility, so a node's attribute order cannot depend on
    // playback history and a seek reconstructs byte-identical markup.
    const fade=pixel(state.testVisible?1:1-turn);
    bnColumn.setAttribute('opacity',String(fade));bnBracket.setAttribute('opacity',String(fade));
    bnGhostColumn.setAttribute('opacity',String(pixel(state.testVisible?0:turn)));
    show(bnColumn,state.bnVisible);show(bnGhostColumn,state.bnGhostVisible);show(bnBracket,state.bnVisible);
    groupLabel.textContent=state.answerVisible?`${neighborName} × ${number(variant.factor)} (was ${neighbor.raw.map(value=>number(value)).join(', ')})`
      :state.testVisible?`neighbor ${neighborName}: × ${number(variant.factor)}`
      :stage===0?'temporal BN: training':turn<1?'BN column turning to LN row':'LN: across this token\'s features';
    show(groupRay,state.profileVisible&&!G.narrow);show(cnn,state.turnProgress===0&&stage<=1);
    plotTitle.textContent=state.answerVisible?`${trackedName}: profile did not move`:trackedName;show(plotTitle,state.profileVisible);
    show(plotFrame,state.profileVisible);
    yTicks.forEach(tick=>{show(tick.line,state.profileVisible&&tick.line.dataset.onRuler==='true');show(tick.label,state.profileVisible&&tick.label.dataset.onRuler==='true');});
    xTicks.forEach(node=>show(node,state.profileVisible));show(zeroLine,state.profileVisible);show(rawGhost,state.centerProgress>0);
    attrs(currentPath,{d:state.currentValues.map((value,i)=>`${i?'L':'M'} ${profilePoints[i][0]} ${profilePoints[i][1]}`).join(' ')});
    currentPath.classList.toggle('la-output-stroke',state.scaleProgress>0);show(currentPath,state.profileVisible);
    currentMarkers.forEach((node,index)=>{
      const point=profilePoints[index],below=state.selectedRow.centered[index]<0;
      attrs(node,{cx:point[0],cy:point[1]});node.classList.toggle('la-output-fill',state.scaleProgress>0);show(node,state.profileVisible);
      // A value under its token's mean is labelled below its mark, far enough to clear
      // the zero line from the raw value 1, so no label rides the mean or zero line
      // at any rest state and none changes side while the profile moves.
      attrs(currentLabels[index],{x:point[0],y:point[1]+(below?28:-13)});currentLabels[index].textContent=number(state.currentValues[index]);currentLabels[index].classList.toggle('la-output',state.scaleProgress>0);show(currentLabels[index],state.profileVisible);
    });
    const meanY=screenY(state.currentMean);
    attrs(meanLine,{x1:plotMinX,y1:meanY,x2:plotMaxX,y2:meanY});attrs(meanLabel,{x:plotMaxX-2,y:meanY+15});meanLabel.textContent=`mean ${number(state.currentMean)}`;
    show(meanLine,state.meanVisible);show(meanLabel,state.meanVisible);
    show(divisorLabel,state.divisorVisible&&!state.testVisible);show(resultLabel,state.normalizedVisible&&!state.testVisible);
    // Both pointers are placed from the statistics of the tensor as it is NOW: the row
    // mean from the re-run LayerNorm, the pooled mean from the live feature column.
    const lnX=statX(state.selectedRow.mean),bnBeforeX=statX(state.columnMeanBefore),bnLiveX=statX(state.columnMean),apart=Math.abs(bnLiveX-bnBeforeX)>=2;
    attrs(lnPointer,{transform:`translate(${lnX} ${statY})`,'data-value-source':String(state.selectedRow.mean)});
    attrs(bnPointer,{transform:`translate(${bnLiveX} ${statY})`,'data-value-source':String(state.columnMean)});
    // A tie mark needs two visibly separate ends: hollow where the pooled mean was, filled where it is.
    show(bnGhost,apart);attrs(bnTie,{x1:bnBeforeX,y1:statY+9,x2:bnLiveX,y2:statY+9});show(bnTie,apart);
    lnLabel.textContent=`LN row mean ${number(state.selectedRow.mean)}${state.answerVisible?': did not move':''}`;
    bnLabel.textContent=`BN f${state.bnFeature+1} column mean ${state.answerVisible?`${number(state.columnMeanBefore)} → ${number(state.columnMean)}`:number(state.columnMean,1)}`;
    attrs(lnLabel,{x:ride(lnX,lnLabel.textContent),y:statY-23});attrs(bnLabel,{x:ride(bnLiveX,bnLabel.textContent),y:statY+33});
    show(strip,state.testVisible);
    formula.classList.toggle('la-mean-shown',state.meanVisible);formula.classList.toggle('la-norm-shown',state.meanVisible);formula.classList.toggle('la-variance-shown',state.normalizedVisible);
    formula.classList.toggle('la-centering',stage>=2&&stage<4);formula.classList.toggle('la-scaling',stage>=4&&stage<6);formula.classList.toggle('la-testing',state.testVisible);
    const sentence=state.perturbing?perturbingCaption:captions[stage];
    if(caption.textContent!==sentence)caption.textContent=sentence;
    return`${names[stage]}.${state.meanVisible&&!state.testVisible?` Current profile mean ${number(state.currentMean)}.`:''}${state.normalizedVisible?' Normalization is before learned scale and shift.':''}${state.answerVisible?` Pooled mean ${number(state.columnMeanBefore)} to ${number(state.columnMean)}; token profile unchanged.`:''}`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  layout();window.BookPlayback(root,render,()=>{layout();render(lastTime,reduced);});typeset();
})();
