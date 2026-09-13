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
    const collapseProgress=ease((held-12)/3),localProgress=ease((held-22)/3);
    return{stage,time:clamped,held,qmax,globalScale,rowScale,globalHalfBin,rowHalfBin,
      quietRange:[-source.quietMax,source.quietMax],allGlobalZero:source.quietMax<globalHalfBin,
      magnitudeEndpoint:source.quietMax,globalCode:global.code,globalReconstruction:global.reconstructed,
      rowCode:local.code,rowReconstruction:local.reconstructed,rowErrorBound:rowHalfBin,
      payloadBytes:source.rows*source.cols*source.bits/8,globalMetadataBytes:source.scaleBytes,rowMetadataBytes:source.rows*source.scaleBytes,
      scaleRatio:globalScale/rowScale,collapseProgress,localProgress,
      currentIntervalHalfWidth:source.quietMax*(1-collapseProgress),currentEndpoint:local.reconstructed*localProgress,
      localGrid:stage>=4,scaleVisible:stage>=1,binVisible:stage>=2,collapseVisible:stage>=3,
      endpointVisible:stage>=4,errorVisible:stage>=5,metadataVisible:stage>=6};
  }
  window.BookScaleGranularity=Object.freeze({buildState,quantize});
  const captions=[
    'A loud row sets the shared scale. What happens to a much quieter row?',
    'The largest magnitude sets one grid spacing for every row.',
    'The entire quiet-row interval fits inside the shared grid\'s zero bin.',
    'Every quiet weight rounds to zero. More weights do not create more resolution.',
    'Keep eight bits. Give this row its own scale instead.',
    'The magnitude endpoint survives. Other weights still have bounded rounding error.',
    'Local resolution costs more scales, not more bits per weight.',
    'Per-row scaling protects this quiet range. It does not guarantee exact weights, accuracy, or faster inference.'
  ];
  const names=['Predict','One shared spacing','Inside the zero bin','The row disappears','A local scale','A smaller error bound','Pay for the scales','Keep the boundary'];
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'),formula=$('[data-formula]'),caption=$('[data-caption]');
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  // Only pixel geometry is serialized to nine decimal places. Full-precision
  // scales, bounds, codes, and state remain untouched for independent tests.
  const pixel=value=>Number(value.toFixed(9));
  const serialize=value=>typeof value==='number'?String(pixel(value)):String(value);
  const attrs=(node,values)=>{for(const[key,value]of Object.entries(values))node.setAttribute(key,serialize(value));};
  const make=(tag,attributes,text='',parent=drawing)=>{const node=document.createElementNS(NS,tag);attrs(node,attributes);node.textContent=text;parent.appendChild(node);return node;};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(text,cls='',attributes={})=>make('text',{'text-anchor':'middle',class:cls,...attributes},text);
  const identity=label('','sg-muted',{'data-context':''});
  const sourceLabel=label('','',{'data-scale-source':''});
  const scaleRay=make('path',{class:'sg-ray','data-scale-ray':''});
  const scaleLabel=label('','',{'data-scale-value':'','data-value':'scale'});
  const quietLabel=label('','sg-weight',{'data-quiet-label':''});
  const quietRange=make('path',{class:'sg-original','data-quiet-range':''});
  const zeroBin=make('rect',{class:'sg-zero-bin','data-zero-bin':''});
  const ruler=make('line',{class:'sg-ruler','data-ruler':''});
  const axisTicks=Array.from({length:5},()=>({line:make('line',{class:'sg-tick','data-axis-tick':''}),label:label('','sg-muted',{'data-axis-label':''})}));
  const interval=make('line',{class:'sg-weight-interval','data-active-interval':''});
  const collapseRays=[-1,1].map(sign=>make('line',{class:'sg-mapping-ray','data-collapse-ray':sign}));
  const zeroPoint=make('circle',{r:4.5,class:'sg-weight-point','data-zero-point':''});
  const rowTicks=Array.from({length:11},()=>make('line',{class:'sg-row-tick','data-row-tick':''}));
  const endpoint=make('polygon',{points:'0,-6 6,0 0,6 -6,0',class:'sg-weight-point','data-endpoint':''});
  const endpointRay=make('line',{class:'sg-mapping-ray','data-endpoint-ray':''});
  const binLabel=label('','',{'data-bin-label':''});
  const resolutionLabel=label('','sg-muted',{'data-resolution-label':''});
  const witnessLabel=label('','sg-weight',{'data-witness-label':'','data-value':'witness'});
  const errorLabel=label('','sg-error',{'data-error-label':'','data-value':'error-bound'});
  const metadataLine=label('','',{'data-metadata-label':'','data-value':'metadata'});
  const payloadLine=label('','sg-muted',{'data-payload-label':'','data-value':'payload'});
  let width=713,lastTime=0,reduced=false;
  function measure(){width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));root.dataset.layout=width<520?'narrow':'wide';}
  const format=value=>Number(value.toPrecision(5)).toString();
  function render(time,reducedMotion){
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage}=state;
    const centerX=width/2,minX=24,maxX=width-24,rulerY=190,rangeY=146;
    const viewHalfRange=state.globalHalfBin*1.15,unit=(maxX-minX)/(2*viewHalfRange);
    const screen=value=>pixel(centerX+value*unit);
    const binHalf=state.localGrid?state.rowHalfBin:state.globalHalfBin;
    const stride=Math.max(1,2**Math.ceil(Math.log2(state.qmax/4)));
    const sampledCodes=[-state.qmax,...Array.from({length:9},(_,i)=>(i-4)*stride).filter(code=>Math.abs(code)<state.qmax),state.qmax];
    Object.assign(root.dataset,{
      stage:String(stage),held:String(state.held),qmax:String(state.qmax),globalScale:String(state.globalScale),rowScale:String(state.rowScale),
      globalHalfBin:String(state.globalHalfBin),rowHalfBin:String(state.rowHalfBin),quietRange:JSON.stringify(state.quietRange),allGlobalZero:String(state.allGlobalZero),
      globalCode:String(state.globalCode),globalReconstruction:String(state.globalReconstruction),rowCode:String(state.rowCode),rowReconstruction:String(state.rowReconstruction),
      rowErrorBound:String(state.rowErrorBound),scaleRatio:String(state.scaleRatio),payloadBytes:String(state.payloadBytes),globalMetadataBytes:String(state.globalMetadataBytes),rowMetadataBytes:String(state.rowMetadataBytes),
      collapseProgress:String(state.collapseProgress),localProgress:String(state.localProgress),currentIntervalHalfWidth:String(state.currentIntervalHalfWidth),currentEndpoint:String(state.currentEndpoint),
      localGrid:String(state.localGrid),scaleVisible:String(state.scaleVisible),binVisible:String(state.binVisible),collapseVisible:String(state.collapseVisible),
      endpointVisible:String(state.endpointVisible),errorVisible:String(state.errorVisible),metadataVisible:String(state.metadataVisible),
      originX:String(centerX),pixelsPerUnit:String(unit),viewHalfRange:String(viewHalfRange),rulerY:String(rulerY),rangeY:String(rangeY),minX:String(minX),maxX:String(maxX),
      sampledCodes:JSON.stringify(sampledCodes),tickStride:String(stride),currentBinHalf:String(binHalf)
    });
    svg.setAttribute('viewBox',`0 0 ${width} 375`);
    svg.setAttribute('aria-label',`${names[stage]}. Quiet-row magnitudes are at most ${format(fixture.quietMax)}.${state.scaleVisible?` ${state.localGrid?'Row':'Shared'} scale ${format(state.localGrid?state.rowScale:state.globalScale)}.`:''}${state.collapseVisible?' The shared grid maps the entire quiet row to zero.':''}${state.errorVisible?` Per-row rounding error is bounded by ${format(state.rowErrorBound)}.`:''}${state.metadataVisible?` Scale metadata rises from ${state.globalMetadataBytes} to ${state.rowMetadataBytes} bytes; code payload stays ${state.payloadBytes} bytes.`:''}`);
    attrs(identity,{x:centerX,y:23});identity.textContent=`${fixture.bits}-bit · Q = ${state.qmax} · ${fixture.rows} × ${fixture.cols}`;
    attrs(sourceLabel,{x:centerX,y:49});sourceLabel.textContent=state.localGrid?`this row: max |w| = ${format(fixture.quietMax)}`:`loud row: max |w| = ${format(fixture.loudMax)}`;
    attrs(scaleRay,{d:`M ${pixel(centerX)} 57 L ${pixel(centerX)} 70 M ${pixel(centerX-3)} 66 L ${pixel(centerX)} 70 L ${pixel(centerX+3)} 66`});
    attrs(scaleLabel,{x:centerX,y:89});scaleLabel.textContent=`${state.localGrid?'row':'shared'} spacing = ${format(state.localGrid?state.rowScale:state.globalScale)}`;
    [sourceLabel,scaleRay,scaleLabel].forEach(node=>show(node,state.scaleVisible));
    attrs(quietLabel,{x:centerX,y:123});quietLabel.textContent=`quiet range: −${format(fixture.quietMax)} to ${format(fixture.quietMax)}`;
    attrs(quietRange,{d:`M ${screen(-fixture.quietMax)} ${rangeY-5} L ${screen(-fixture.quietMax)} ${rangeY+5} M ${screen(-fixture.quietMax)} ${rangeY} L ${screen(fixture.quietMax)} ${rangeY} M ${screen(fixture.quietMax)} ${rangeY-5} L ${screen(fixture.quietMax)} ${rangeY+5}`});
    attrs(zeroBin,{x:screen(-binHalf),y:164,width:pixel(2*binHalf*unit),height:48});show(zeroBin,state.binVisible);
    attrs(ruler,{x1:minX,y1:rulerY,x2:maxX,y2:rulerY});
    // The fixed zoom's major labels describe weight coordinates, not grid codes.
    const axisStep=state.globalHalfBin/2;
    axisTicks.forEach((tick,index)=>{
      const value=(index-2)*axisStep,x=screen(value);
      attrs(tick.line,{x1:x,y1:rulerY-4,x2:x,y2:rulerY+4,'data-weight':String(value)});
      attrs(tick.label,{x,y:229,'data-weight':String(value)});tick.label.textContent=Number(value.toPrecision(2)).toString();
    });
    attrs(interval,{x1:screen(-state.currentIntervalHalfWidth),y1:rulerY,x2:screen(state.currentIntervalHalfWidth),y2:rulerY});
    show(interval,!state.localGrid);
    collapseRays.forEach((ray,index)=>{
      const sign=index?1:-1;
      attrs(ray,{x1:screen(sign*fixture.quietMax),y1:rangeY+7,x2:screen(sign*state.currentIntervalHalfWidth),y2:rulerY-5});
      show(ray,state.binVisible&&!state.localGrid);
    });
    attrs(zeroPoint,{cx:centerX,cy:rulerY});show(zeroPoint,state.collapseVisible&&!state.localGrid);
    rowTicks.forEach((tick,index)=>{
      const code=sampledCodes[index];
      if(code===undefined){show(tick,false);return;}
      const value=code*state.rowScale,x=screen(value);
      attrs(tick,{x1:x,y1:rulerY-7,x2:x,y2:rulerY+7,'data-code':code,'data-weight':String(value)});show(tick,state.localGrid);
    });
    attrs(endpoint,{transform:`translate(${screen(state.currentEndpoint)} ${rulerY})`,'data-position':JSON.stringify([screen(state.currentEndpoint),rulerY])});show(endpoint,state.endpointVisible);
    attrs(endpointRay,{x1:screen(fixture.quietMax),y1:rangeY+7,x2:screen(state.currentEndpoint),y2:rulerY-7});show(endpointRay,state.endpointVisible);
    attrs(binLabel,{x:centerX,y:270});binLabel.textContent=state.localGrid?'local zero bin: much narrower':'shared zero bin';show(binLabel,state.binVisible);
    attrs(resolutionLabel,{x:centerX,y:249});resolutionLabel.textContent=state.localGrid?`ticks: ${stride}-code stride + endpoints`:'fixed zoom on the quiet row';show(resolutionLabel,state.binVisible);
    attrs(witnessLabel,{x:centerX,y:291});witnessLabel.textContent=`magnitude endpoint: ${format(state.currentEndpoint)}`;show(witnessLabel,state.errorVisible);
    attrs(errorLabel,{x:centerX,y:312});errorLabel.textContent=`error bound ≈ ${format(state.rowErrorBound)}`;show(errorLabel,state.errorVisible);
    attrs(metadataLine,{x:centerX,y:338});metadataLine.textContent=`FP32 scales: ${state.globalMetadataBytes} B → ${state.rowMetadataBytes} B`;show(metadataLine,state.metadataVisible);
    attrs(payloadLine,{x:centerX,y:360});payloadLine.textContent=`codes unchanged: ${state.payloadBytes.toLocaleString('en-US')} B`;show(payloadLine,state.metadataVisible);
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
  measure();window.BookPlayback(root,render,()=>{measure();render(lastTime,reduced);});typeset();
})();
