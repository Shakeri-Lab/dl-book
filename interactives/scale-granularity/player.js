(() => {
  const root=document.getElementById('scale-granularity-excerpt');
  if(!root||root.dataset.ready)return;
  const $=selector=>root.querySelector(selector);
  // The existing audit declares row ranges from 0.01 to 10. This is a range
  // argument, not a reconstruction of the film's five invented sample weights.
  const fixture=JSON.parse(root.dataset.fixture);
  function validate(source){
    if(!Number.isInteger(source.bits)||source.bits<2||source.bits>16
      ||![source.rows,source.cols,source.scaleBytes].every(value=>Number.isInteger(value)&&value>0)
      ||!Number.isFinite(source.quietMax)||!Number.isFinite(source.loudMax)
      ||source.quietMax<=0||source.loudMax<=0
      ||source.quietMax>=source.loudMax/(2*(2**(source.bits-1)-1)))
      throw Error('scale-granularity: positive dimensions and ranges inside the shared zero bin are required');
  }
  validate(fixture);
  const pane=$('[data-pane]'),figure=$('[data-figure]'),svg=figure.querySelector('svg');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number),duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
  const ease=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
  // Every glide ends on the beat it leads into. A beat seek, and each reduced-motion
  // still (which holds the beat's own time), therefore parks on a finished picture.
  const glideInto=(time,stage,seconds=3)=>ease((time-(beats[stage]-seconds))/seconds);
  // Match torch.round's ties-to-even convention. No sampled weights are drawn.
  const nearestEven=value=>{const low=Math.floor(value),part=value-low;return part===.5?(low%2===0?low:low+1):Math.round(value);};
  function quantize(value,scale,qmax){
    if(!Number.isFinite(value)||!Number.isFinite(scale)||scale<=0||!Number.isInteger(qmax)||qmax<1)
      throw Error('scale-granularity: finite value, positive scale, and positive integer qmax are required');
    const code=clamp(nearestEven(value/scale),-qmax,qmax);
    return{code,reconstructed:code*scale,error:Math.abs(value-code*scale)};
  }
  function buildState(time,reducedMotion=false,source=fixture){
    validate(source);
    const clamped=clamp(Number.isFinite(time)?time:0,0,duration),stage=stageAt(clamped),held=reducedMotion?beats[stage]:clamped;
    const qmax=2**(source.bits-1)-1,globalScale=source.loudMax/qmax,rowScale=source.quietMax/qmax;
    const globalHalfBin=globalScale/2,rowHalfBin=rowScale/2;
    const global=quantize(source.quietMax,globalScale,qmax),local=quantize(source.quietMax,rowScale,qmax);
    const collapseProgress=glideInto(held,3),refineProgress=glideInto(held,4),dropProgress=glideInto(held,5),billProgress=glideInto(held,6,1);
    // Between the two declared scales the spacing is drawn geometrically, so ticks flow
    // in at a steady rate. It is explanatory motion: only the two end scales are quoted.
    const currentScale=refineProgress<=0?globalScale:refineProgress>=1?rowScale:globalScale*(rowScale/globalScale)**refineProgress;
    // The image of the row can leave zero only once the zero bin's edge is inside it.
    const crossing=Math.log(globalScale/(2*source.quietMax))/Math.log(globalScale/rowScale);
    const restoreProgress=ease((refineProgress-crossing)/(1-crossing));
    return{stage,time:clamped,held,qmax,globalScale,rowScale,globalHalfBin,rowHalfBin,
      quietRange:[-source.quietMax,source.quietMax],allGlobalZero:source.quietMax<globalHalfBin,
      magnitudeEndpoint:source.quietMax,globalCode:global.code,globalReconstruction:global.reconstructed,
      rowCode:local.code,rowReconstruction:local.reconstructed,rowErrorBound:rowHalfBin,
      payloadBytes:source.rows*source.cols*source.bits/8,globalMetadataBytes:source.scaleBytes,rowMetadataBytes:source.rows*source.scaleBytes,
      scaleRatio:globalScale/rowScale,collapseProgress,refineProgress,restoreProgress,dropProgress,billProgress,
      currentScale,currentBinHalf:currentScale/2,imageHalfWidth:source.quietMax*(1-collapseProgress+restoreProgress),
      drawnScaleBytes:source.scaleBytes*(1+(source.rows-1)*billProgress),
      localGrid:stage>=4,scaleVisible:stage>=1,binVisible:stage>=2,collapseVisible:stage>=3,
      endpointVisible:dropProgress>0,errorVisible:stage>=5,metadataVisible:stage>=6,
      // The bill arrives two seconds after the error bound, stands, then grows into its beat.
      billOpacity:clamp((held-(beats[6]-3))/.6,0,1)};
  }
  window.BookScaleGranularity=Object.freeze({buildState,quantize});
  const captions=[
    'A loud row sets the shared scale. What happens to a much quieter row?',
    'The largest magnitude sets one spacing for every row. At this zoom only code 0 is in view.',
    'The entire quiet-row interval fits inside the shared grid\'s zero bin.',
    'Every quiet weight rounds to zero. More weights do not create more resolution.',
    'Same eight bits, but this row\'s own maximum sets the spacing. The grid now spans the quiet range.',
    'The maximum-magnitude endpoint lands exactly on code 127. Other weights round by at most half a spacing.',
    'Local resolution costs more scales, not more bits per weight.',
    'Per-row scaling protects this quiet range. It does not guarantee exact weights, accuracy, or faster inference.'
  ];
  const names=['Predict','One shared spacing','Inside the zero bin','The row disappears','A local scale','A smaller error bound','Pay for the scales','Keep the boundary'];
  // One formatter for every number a reader or a screen reader meets: four significant
  // figures, U+2212 for minus, and a Unicode power of ten instead of e-notation.
  const SUPERSCRIPT=['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹'];
  function format(value,digits=4){
    if(value===0)return'0';
    const sign=value<0?'−':'',size=Math.abs(value);
    let exponent=Math.floor(Math.log10(size));
    if(exponent>=-4)return sign+Number(size.toPrecision(digits)).toString();
    let mantissa=size/10**exponent;
    if(Number(mantissa.toFixed(digits-1))>=10){mantissa/=10;exponent+=1;}
    return`${sign}${mantissa.toFixed(digits-1)} × 10⁻${[...String(-exponent)].map(digit=>SUPERSCRIPT[Number(digit)]).join('')}`;
  }
  const bytes=value=>`${value.toLocaleString('en-US')} B`;
  const ordinal=value=>`${value}${value%100>=11&&value%100<=13?'th':['th','st','nd','rd'][value%10]||'th'}`;
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'),formula=$('[data-formula]'),caption=$('[data-caption]');
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  // Only pixel geometry is serialized, to 0.0001 px, so a last-bit libm difference cannot
  // change the byte-compared static print. Scales, bounds, codes and state stay unrounded.
  const pixel=value=>Number(value.toFixed(4));
  const serialize=value=>typeof value==='number'?String(pixel(value)):String(value);
  const attrs=(node,values)=>{for(const[key,value]of Object.entries(values))node.setAttribute(key,serialize(value));};
  const make=(tag,attributes,text='',parent=drawing)=>{const node=document.createElementNS(NS,tag);attrs(node,attributes);node.textContent=text;parent.appendChild(node);return node;};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  // Opacity is written before hidden, so attribute order never depends on playback history.
  const fade=(node,opacity)=>{node.setAttribute('opacity',String(Number(opacity.toFixed(3))));show(node,opacity>0);};
  const write=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
  const label=(text,cls='',attributes={})=>make('text',{'text-anchor':'middle',class:cls,...attributes},text);
  // Fixture-only quantities: computed once, never per frame.
  const fixed=buildState(duration),{qmax,globalScale,rowScale}=fixed;
  const viewHalfRange=fixed.globalHalfBin*1.15;
  // Sampled local ticks: every `finalStride`-th code plus the two end codes. During the
  // refinement the stride doubles whenever ticks would fall closer than the final spacing.
  const finalStride=Math.max(1,2**Math.ceil(Math.log2(qmax/4))),tickSpacing=finalStride*rowScale;
  // Axis ticks sit at the round weights they are labelled with.
  const axisStep=(()=>{const raw=viewHalfRange/2,power=10**Math.floor(Math.log10(raw)),lead=raw/power;return(lead>=5?5:lead>=2?2:1)*power;})();
  const axisValues=[-1,0,1].map(index=>Number((index*axisStep).toPrecision(12)));
  const RULER_Y=136,RANGE_Y=92,HEIGHT=316,MARGIN=24,BAR_Y=264,BAR_HEIGHT=16;

  const sourceLabel=label('','',{'data-scale-source':'',y:20});
  const scaleLabel=label('','',{'data-scale-value':'','data-value':'scale',y:41});
  const quietLabel=label(`quiet row: ${format(-fixture.quietMax)} ≤ w ≤ ${format(fixture.quietMax)}`,'sg-weight',{'data-quiet-label':'',y:RANGE_Y-20});
  const quietRange=make('path',{class:'sg-original','data-quiet-range':''});
  const zeroBin=make('rect',{class:'sg-zero-bin','data-zero-bin':'',y:RULER_Y-26,height:52});
  const ruler=make('line',{class:'sg-ruler','data-ruler':'',y1:RULER_Y,y2:RULER_Y});
  const axisTicks=axisValues.map(value=>({value,
    line:make('line',{class:'sg-tick','data-axis-tick':'','data-weight':String(value),y1:RULER_Y-4,y2:RULER_Y+4}),
    label:label(format(value),'sg-muted',{'data-axis-label':'','data-weight':String(value),y:RULER_Y+40})}));
  const edgeLabels=[-1,1].map(sign=>label(sign<0?'−s/2':'s/2','sg-muted',{'data-bin-edge-label':sign,y:RULER_Y+40}));
  const interval=make('line',{class:'sg-weight-interval','data-active-interval':'',y1:RULER_Y,y2:RULER_Y});
  const gridFading=make('path',{class:'sg-grid-tick','data-grid-fading':''});
  const gridTicks=make('path',{class:'sg-grid-tick','data-grid-ticks':''});
  const collapseRays=[-1,1].map(sign=>make('line',{class:'sg-mapping-ray','data-collapse-ray':sign,y1:RANGE_Y+7,y2:RULER_Y-5}));
  const zeroPoint=make('circle',{class:'sg-weight-dot','data-zero-point':'',cy:RULER_Y});
  const collapseLabel=label(`all ${fixture.cols} weights → code ${fixed.globalCode}`,'sg-weight',{'data-collapse-label':'',y:RULER_Y+22});
  const offscreen=[-1,1].map(sign=>label(sign<0?'← code −1':'code 1 →','sg-muted',{'data-offscreen-code':sign,'text-anchor':sign<0?'start':'end',y:RULER_Y-32}));
  const samplingLines=Array.from({length:3},()=>label('','sg-muted',{'data-resolution-line':'','text-anchor':'end'}));
  const endpoint=make('polygon',{points:'0,-6 6,0 0,6 -6,0',class:'sg-weight-point','data-endpoint':''});
  const witnessCode=label(`code ${fixed.rowCode}`,'sg-weight',{'data-witness-code':'','text-anchor':'start',y:RULER_Y-26});
  const witnessLabel=label(`= ${format(fixed.rowReconstruction)} exactly`,'sg-weight',{'data-witness-label':'','data-value':'witness','text-anchor':'start',y:RULER_Y-11});
  const binLeader=make('line',{class:'sg-leader','data-bin-leader':'',y1:RULER_Y+19.5,y2:RULER_Y+52});
  const binLocator=make('circle',{class:'sg-locator','data-bin-locator':'',r:3.5,cy:RULER_Y+17});
  const binLabel=label('','',{'data-bin-label':'',y:RULER_Y+66});
  const errorLabel=label(`rounding error ≤ s/2 = ${format(fixed.rowErrorBound)}`,'sg-error',{'data-error-label':'','data-value':'error-bound',y:RULER_Y+86});
  // One storage bar on one byte scale: the code payload, then the scale metadata.
  const bill=make('g',{'data-bill':''});
  const codesBar=make('rect',{class:'sg-codes','data-codes-bar':'',y:BAR_Y,height:BAR_HEIGHT},'',bill);
  const scalesBar=make('rect',{class:'sg-scales','data-scales-bar':'',y:BAR_Y,height:BAR_HEIGHT},'',bill);
  const scalesLocator=make('circle',{class:'sg-locator','data-scales-locator':'',r:3.5,cy:BAR_Y+BAR_HEIGHT+5},'',bill);
  const payloadLine=make('text',{'text-anchor':'start','data-payload-label':'','data-value':'payload',y:BAR_Y-8},'',bill);
  const metadataLine=make('text',{'text-anchor':'end','data-metadata-label':'','data-value':'metadata',y:BAR_Y+BAR_HEIGHT+22},'',bill);

  Object.assign(root.dataset,{qmax:String(qmax),globalScale:String(globalScale),rowScale:String(rowScale),
    globalHalfBin:String(fixed.globalHalfBin),rowHalfBin:String(fixed.rowHalfBin),rowErrorBound:String(fixed.rowErrorBound),
    scaleRatio:String(fixed.scaleRatio),rowCode:String(fixed.rowCode),rowReconstruction:String(fixed.rowReconstruction),
    payloadBytes:String(fixed.payloadBytes),globalMetadataBytes:String(fixed.globalMetadataBytes),rowMetadataBytes:String(fixed.rowMetadataBytes),
    viewHalfRange:String(viewHalfRange),tickStride:String(finalStride),rulerY:String(RULER_Y),rangeY:String(RANGE_Y)});

  let width=713,centerX=356.5,minX=MARGIN,maxX=713-MARGIN,unit=1,bytePixels=1,lastTime=0,reduced=false,drawnGrid=null,describedStage=-1;
  const screen=value=>pixel(centerX+value*unit);
  function layout(){
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    centerX=width/2;maxX=width-MARGIN;unit=(maxX-minX)/(2*viewHalfRange);
    bytePixels=(maxX-minX)/(fixed.payloadBytes+fixed.rowMetadataBytes);drawnGrid=null;
    Object.assign(root.dataset,{layout:width<520?'narrow':'wide',originX:String(centerX),pixelsPerUnit:String(unit),minX:String(minX),maxX:String(maxX),bytePixels:String(bytePixels)});
    svg.setAttribute('viewBox',`0 0 ${width} ${HEIGHT}`);
    for(const node of[sourceLabel,scaleLabel,quietLabel,collapseLabel,binLabel,errorLabel])attrs(node,{x:centerX});
    const low=screen(-fixture.quietMax),high=screen(fixture.quietMax);
    attrs(quietRange,{d:`M ${low} ${RANGE_Y-5} L ${low} ${RANGE_Y+5} M ${low} ${RANGE_Y} L ${high} ${RANGE_Y} M ${high} ${RANGE_Y-5} L ${high} ${RANGE_Y+5}`});
    attrs(ruler,{x1:minX,x2:maxX});
    axisTicks.forEach(tick=>{const x=screen(tick.value);attrs(tick.line,{x1:x,x2:x});attrs(tick.label,{x});});
    edgeLabels.forEach((node,index)=>attrs(node,{x:screen((index?1:-1)*fixed.globalHalfBin)}));
    collapseRays.forEach((ray,index)=>attrs(ray,{x1:index?high:low}));
    attrs(zeroPoint,{cx:centerX});attrs(offscreen[0],{x:minX});attrs(offscreen[1],{x:maxX});
    // The sampling note sits left of the first tick: one line where it fits, else three.
    const noteX=low-12,room=noteX-4,every=`every ${ordinal(finalStride)} code`;
    const note=room>=260?['','',`ticks drawn: ${every} + endpoints`]:room>=100?['ticks drawn:',every,'+ endpoints']:['ticks: every',`${ordinal(finalStride)} code`,'+ endpoints'];
    samplingLines.forEach((node,index)=>{attrs(node,{x:noteX,y:RULER_Y-40+14*index});write(node,note[index]);});
    attrs(witnessCode,{x:high+12});attrs(witnessLabel,{x:high+12});
    attrs(binLocator,{cx:centerX});attrs(binLeader,{x1:centerX+2.5,x2:centerX+30});
    attrs(codesBar,{x:minX,width:fixed.payloadBytes*bytePixels});attrs(scalesBar,{x:minX+fixed.payloadBytes*bytePixels});
    attrs(payloadLine,{x:minX});attrs(metadataLine,{x:maxX});
  }
  // Grid codes in view at the current spacing. Codes that a doubled stride drops fade
  // out over the octave instead of vanishing, so nothing pops while the grid refines.
  function gridCodes(scale){
    const octave=Math.log2(tickSpacing/scale)-1e-9,level=Math.max(0,Math.ceil(octave)),stride=2**level;
    const limit=Math.min(qmax,Math.floor(viewHalfRange/scale+1e-9)),top=Math.floor(limit/stride)*stride,full=[],fading=[];
    for(let code=-top;code<=top;code+=stride)full.push(code);
    if(limit===qmax&&top!==qmax){full.unshift(-qmax);full.push(qmax);}
    const opacity=level>0?level-octave:0;
    if(opacity>.002)for(let code=stride/2;code<=limit&&code!==qmax;code+=stride){fading.push(code);fading.unshift(-code);}
    return{full,fading,opacity:Math.min(1,opacity)};
  }
  const tickPath=(codes,scale)=>codes.map(code=>{const x=screen(code*scale);return`M ${x} ${RULER_Y-8} L ${x} ${RULER_Y+8}`;}).join(' ');
  function render(time,reducedMotion){
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage,currentScale}=state,binWidth=currentScale*unit;
    Object.assign(root.dataset,{stage:String(stage),held:String(state.held),currentScale:String(currentScale),currentBinHalf:String(state.currentBinHalf),
      imageHalfWidth:String(state.imageHalfWidth),drawnScaleBytes:String(state.drawnScaleBytes)});
    // The picture's numbers are announced here and nowhere else, once per beat.
    if(stage!==describedStage){
      describedStage=stage;
      svg.setAttribute('aria-label',`${names[stage]}. Quiet-row magnitudes are at most ${format(fixture.quietMax)}.${state.scaleVisible?` ${state.localGrid?'Row':'Shared'} spacing ${format(state.localGrid?rowScale:globalScale)}.`:''}${state.collapseVisible?' The shared grid maps the entire quiet row to zero.':''}${state.errorVisible?` Per-row rounding error is bounded by ${format(state.rowErrorBound)}.`:''}${state.metadataVisible?` Scale metadata rises from ${state.globalMetadataBytes} to ${state.rowMetadataBytes} bytes; code payload stays ${state.payloadBytes.toLocaleString('en-US')} bytes.`:''}`);
    }
    // Header: which row sets the spacing, and the spacing. In ink only while it is the news.
    write(sourceLabel,state.localGrid?`this row: max |w| = ${format(fixture.quietMax)}`:`loud row: max |w| = ${format(fixture.loudMax)}`);
    write(scaleLabel,state.localGrid?`spacing s = ${format(fixture.quietMax)}/${qmax} = ${format(rowScale)}`:`spacing s = ${format(fixture.loudMax)}/${qmax} = ${format(globalScale)}`);
    // Shared-scale wording bows out as the refinement starts; text never shows a moving number.
    const shared=state.localGrid?0:1-clamp(state.refineProgress*5,0,1);
    [sourceLabel,scaleLabel].forEach(node=>{fade(node,state.localGrid?1:state.scaleVisible?shared:0);node.setAttribute('class',stage===1||stage===4?'':'sg-muted');});
    // The zero bin keeps its true width at every scale; only its ink deepens as it thins.
    attrs(zeroBin,{x:screen(-state.currentBinHalf),width:binWidth,'fill-opacity':.16+.74*state.refineProgress});show(zeroBin,state.binVisible);
    edgeLabels.forEach(node=>fade(node,state.binVisible?shared:0));
    attrs(interval,{x1:screen(-state.imageHalfWidth),x2:screen(state.imageHalfWidth)});
    const collapsed=1-state.imageHalfWidth/fixture.quietMax;
    attrs(zeroPoint,{r:2+2.5*collapsed});show(zeroPoint,collapsed>.001);
    fade(collapseLabel,state.collapseVisible?shared:0);
    collapseRays.forEach((ray,index)=>{attrs(ray,{x2:screen((index?1:-1)*state.imageHalfWidth)});show(ray,state.binVisible);});
    const gridKey=state.scaleVisible?String(currentScale):'';
    if(gridKey!==drawnGrid){
      drawnGrid=gridKey;
      const grid=state.scaleVisible?gridCodes(currentScale):{full:[],fading:[],opacity:0};
      attrs(gridTicks,{d:tickPath(grid.full,currentScale),'data-codes':JSON.stringify(grid.full)});show(gridTicks,grid.full.length>0);
      attrs(gridFading,{d:tickPath(grid.fading,currentScale),'data-codes':JSON.stringify(grid.fading)});fade(gridFading,grid.fading.length?grid.opacity:0);
    }
    offscreen.forEach(node=>show(node,state.scaleVisible&&currentScale>viewHalfRange));
    samplingLines.forEach(node=>show(node,state.localGrid&&node.textContent!==''));
    // The maximum-magnitude endpoint drops from the row onto the grid level it lands on.
    const endpointX=screen(state.rowReconstruction),endpointY=RANGE_Y+(RULER_Y-RANGE_Y)*state.dropProgress;
    attrs(endpoint,{transform:`translate(${endpointX} ${pixel(endpointY)})`});show(endpoint,state.endpointVisible);
    [witnessCode,witnessLabel].forEach(node=>show(node,state.errorVisible));
    // A sub-pixel bin gets a hollow locator and a leader. The locator supplies no width.
    const locate=state.binVisible?clamp((8-binWidth)/6,0,1):0;
    fade(binLocator,locate);fade(binLeader,state.localGrid?locate:0);
    write(binLabel,state.localGrid?`zero bin: ${format(state.scaleRatio)}× narrower`:`shared zero bin: ±s/2 = ±${format(state.globalHalfBin)}`);
    binLabel.setAttribute('class',stage>=5?'sg-muted':'');fade(binLabel,state.localGrid?1:state.binVisible?shared:0);
    show(errorLabel,state.errorVisible);
    // Storage: bytes drawn to one scale. Four bytes are sub-pixel, so they get a locator.
    const scalesWidth=state.drawnScaleBytes*bytePixels;
    fade(bill,state.billOpacity);
    attrs(scalesBar,{width:scalesWidth,'data-bytes':String(state.drawnScaleBytes)});
    attrs(scalesLocator,{cx:minX+state.payloadBytes*bytePixels+scalesWidth/2});fade(scalesLocator,1-clamp((scalesWidth-1)/1.5,0,1));
    write(payloadLine,`8-bit codes: ${bytes(state.payloadBytes)}${state.metadataVisible?', unchanged':''}`);
    write(metadataLine,`FP32 scales: ${bytes(state.globalMetadataBytes)} →${state.metadataVisible?` ${bytes(state.rowMetadataBytes)}`:''}`);
    formula.classList.toggle('sg-global-shown',state.scaleVisible);
    formula.classList.toggle('sg-row-shown',state.localGrid);
    formula.classList.toggle('sg-error-shown',state.errorVisible);
    if(caption.textContent!==captions[stage])caption.textContent=captions[stage];
    return`${names[stage]}.${state.collapseVisible?' Shared quantization erases the quiet row.':''}${state.localGrid?' The local scale reduces the rounding bound.':''}`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  layout();window.BookPlayback(root,render,()=>{layout();render(lastTime,reduced);});typeset();
})();
