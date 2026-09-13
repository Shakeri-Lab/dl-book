(() => {
  const root=document.getElementById('preference-ruler-excerpt');
  if(!root||root.dataset.ready)return;
  const $=selector=>root.querySelector(selector);
  // The full source score vector lives only in the panel. A/C is already a
  // printed edge in fig-preference-consistency; the audit adds 37 to all scores.
  const fixture={scores:JSON.parse(root.dataset.scores),pair:JSON.parse(root.dataset.pair),shift:Number(root.dataset.shift)};
  function validate(source){
    if(!Array.isArray(source.scores)||source.scores.length<2||!source.scores.every(Number.isFinite)
      ||!Array.isArray(source.pair)||source.pair.length!==2||!source.pair.every(index=>Number.isInteger(index)&&index>=0&&index<source.scores.length)
      ||source.pair[0]===source.pair[1]||!Number.isFinite(source.shift))
      throw Error('preference-ruler: finite scores, two distinct in-range pair indices, and a finite common shift are required');
  }
  validate(fixture);
  const pane=$('[data-pane]'),figure=$('[data-figure]'),svg=figure.querySelector('svg');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number),duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
  const ease=value=>{const t=clamp(value,0,1);return t*t*(3-2*t);};
  const sigmoid=value=>value>=0?1/(1+Math.exp(-value)):Math.exp(value)/(1+Math.exp(value));
  function buildState(time,reducedMotion=false,source=fixture){
    validate(source);
    const clamped=clamp(Number.isFinite(time)?time:0,0,duration),stage=stageAt(clamped),held=reducedMotion?beats[stage]:clamped;
    // Each glide finishes at its named beat; the new endpoint then holds.
    const shiftProgress=.5*ease((held-22)/3)+.5*ease((held-27)/3),commonShift=source.shift*shiftProgress;
    const baseScores=source.scores.slice(),currentScores=baseScores.map(value=>value+commonShift),pair=source.pair.slice();
    const baseGap=baseScores[pair[0]]-baseScores[pair[1]],gap=currentScores[pair[0]]-currentScores[pair[1]];
    const cameraTravel=.6*Math.max(1,Math.abs(baseGap)/2);
    // The camera follows after a short visible translation. Its movement changes
    // the ruler's origin, never its metric or the separation of the score marks.
    const cameraOffset=commonShift-clamp(commonShift,-cameraTravel,cameraTravel);
    const cameraCenter=(baseScores[pair[0]]+baseScores[pair[1]])/2+cameraOffset;
    const rulerExtent=Math.abs(baseGap)/2+cameraTravel+1;
    return{stage,time:clamped,held,shiftProgress,commonShift,baseScores,currentScores,pair,baseGap,gap,
      probability:sigmoid(gap),baseProbability:sigmoid(baseGap),cameraOffset,cameraCenter,cameraTravel,rulerExtent,
      scoresVisible:stage>=1,gapVisible:stage>=2,probabilityVisible:stage>=3,shiftVisible:stage>=4,invarianceVisible:stage>=7};
  }
  window.BookPreferenceRuler=Object.freeze({buildState});
  const captions=[
    'If both scores rise together, does the modeled preference probability change?',
    'These are two scores for the same prompt. Read their relative positions.',
    'The bracket reads a difference. Its width, not either score alone, will determine the probability.',
    'The sigmoid turns this score difference into a modeled preference probability.',
    'Predict before the shift: both scores will receive the same addition.',
    'Both scores move together. The view follows them; their separation and preference probability stay fixed.',
    'Larger raw scores, the same gap, and the same probability. The ring marks the original probability.',
    'The common additions cancel. Comparisons identify a difference, not an absolute zero for reward.'
  ];
  const names=['Predict','Read the scores','Read their difference','Map the gap','Predict the common shift','Translate both scores','Compare endpoints','No identifiable zero'];
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'),formula=$('[data-formula]'),caption=$('[data-caption]');
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  const make=(tag,attributes,text='',parent=drawing)=>{
    const node=document.createElementNS(NS,tag);
    for(const[key,value]of Object.entries(attributes))node.setAttribute(key,String(value));
    node.textContent=text;parent.appendChild(node);return node;
  };
  const attrs=(node,values)=>{for(const[key,value]of Object.entries(values))node.setAttribute(key,String(value));};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(value,cls='',attributes={})=>make('text',{'text-anchor':'middle',class:cls,...attributes},value);
  const heading=label('reward scores','',{'data-context':''});
  const shiftValue=label('','',{'data-shift-value':'','data-value':'shift'});
  const ruler=make('line',{class:'pr-ruler','data-ruler':''});
  const ticks=Array.from({length:17},()=>({line:make('line',{class:'pr-tick','data-ruler-tick':''}),label:label('','pr-muted',{'data-ruler-tick-label':''})}));
  const markers=[0,1].map(index=>{
    const node=make('g',{'data-score-marker':index,'data-score-index':fixture.pair[index]});
    if(index===0)make('circle',{r:5.5,class:'pr-score','data-marker-shape':'circle'},'',node);
    else make('polygon',{points:'0,-6.5 6.5,0 0,6.5 -6.5,0',class:'pr-score','data-marker-shape':'diamond'},'',node);
    return node;
  });
  const markerNames=fixture.pair.map(index=>String.fromCharCode(65+index));
  const scoreNames=markerNames.map((name,index)=>label(name,'pr-output',{'data-score-name':index}));
  const scoreValues=[0,1].map(index=>label('','pr-output',{'data-score-value':index,'data-value':`score-${index}`}));
  const gapBracket=make('path',{class:'pr-bracket','data-gap-bracket':''});
  const gapValue=label('','pr-output',{'data-gap-value':'','data-value':'gap'});
  const connector=make('path',{class:'pr-connector','data-calculation-ray':''});
  const sigmoidLabel=label('sigmoid','',{'data-sigmoid-label':''});
  const probabilityLabel=label(`P(${markerNames[0]} preferred to ${markerNames[1]})`,'pr-output',{'data-probability-label':''});
  const probabilityAxis=make('line',{class:'pr-ruler','data-probability-ruler':''});
  const probabilityFill=make('line',{class:'pr-probability-fill','data-probability-fill':''});
  const probabilityGhost=make('circle',{r:9,class:'pr-probability-ghost','data-probability-ghost':''});
  const probabilityMarker=make('circle',{r:5,class:'pr-probability-marker','data-probability-marker':''});
  const probabilityValue=label('','pr-output',{'data-probability-value':'','data-value':'probability'});
  const probabilityTicks=[0,1].map(value=>label(String(value),'pr-muted',{'data-probability-tick':value}));
  const cameraNote=label('view tracks scores; tick spacing fixed','pr-muted',{'data-camera-note':''});
  let width=713,lastTime=0,reduced=false;
  function measure(){width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));root.dataset.layout=width<520?'narrow':'wide';}
  const number=value=>Number(value.toFixed(3)).toString();
  // Match the SVD drawing convention: last-bit libm differences must not change
  // static SVG bytes. Quantize only drawn coordinates; model state stays raw.
  const pixel=value=>Number(value.toFixed(9));
  function render(time,reducedMotion){
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage}=state;
    const centerX=width/2,rulerY=104,rulerMinX=24,rulerMaxX=width-24;
    const unit=Math.min(52,(rulerMaxX-rulerMinX)/(2*state.rulerExtent));
    const screen=score=>centerX+unit*(score-state.cameraCenter);
    const pairPositions=state.pair.map(index=>screen(state.currentScores[index]));
    const gapMid=(pairPositions[0]+pairPositions[1])/2;
    const probabilityMinX=32,probabilityMaxX=width-32,probabilityY=291;
    const probabilityX=pixel(probabilityMinX+(probabilityMaxX-probabilityMinX)*state.probability);
    Object.assign(root.dataset,{
      stage:String(stage),shiftProgress:String(state.shiftProgress),commonShift:String(state.commonShift),
      baseScores:JSON.stringify(state.baseScores),currentScores:JSON.stringify(state.currentScores),baseGap:String(state.baseGap),gap:String(state.gap),
      probability:String(state.probability),baseProbability:String(state.baseProbability),cameraOffset:String(state.cameraOffset),cameraCenter:String(state.cameraCenter),cameraTravel:String(state.cameraTravel),
      rulerExtent:String(state.rulerExtent),pixelsPerUnit:String(unit),rulerCenterX:String(centerX),rulerY:String(rulerY),rulerMinX:String(rulerMinX),rulerMaxX:String(rulerMaxX),
      probabilityMinX:String(probabilityMinX),probabilityMaxX:String(probabilityMaxX),probabilityY:String(probabilityY),
      scoresVisible:String(state.scoresVisible),gapVisible:String(state.gapVisible),probabilityVisible:String(state.probabilityVisible),shiftVisible:String(state.shiftVisible),invarianceVisible:String(state.invarianceVisible)
    });
    svg.setAttribute('viewBox',`0 0 ${width} 340`);
    svg.setAttribute('aria-label',`${names[stage]}.${state.scoresVisible?` Scores ${state.pair.map(index=>number(state.currentScores[index])).join(' and ')}.`:''}${state.gapVisible?` Difference ${number(state.gap)}.`:''}${state.probabilityVisible?` Modeled preference probability ${state.probability.toFixed(3)}.`:''}${state.shiftVisible?` Common shift ${number(state.commonShift)}.`:''}`);
    attrs(heading,{x:centerX,y:28});show(heading,!state.shiftVisible);
    attrs(shiftValue,{x:centerX,y:28});shiftValue.textContent=`common shift ${state.commonShift>=0?'+':''}${number(state.commonShift)}`;show(shiftValue,state.shiftVisible);
    attrs(ruler,{x1:rulerMinX,y1:rulerY,x2:rulerMaxX,y2:rulerY});
    const tickStep=Math.max(1,Math.pow(10,Math.floor(Math.log10(state.rulerExtent/2))));
    const centerTick=Math.floor(state.cameraCenter/tickStep);
    ticks.forEach((tick,index)=>{
      const score=(centerTick+index-8)*tickStep,x=screen(score),visible=x>=rulerMinX+8&&x<=rulerMaxX-8;
      attrs(tick.line,{x1:x,y1:rulerY-4,x2:x,y2:rulerY+4,'data-score':score});
      attrs(tick.label,{x,y:rulerY+22,'data-score':score});tick.label.textContent=number(score);
      show(tick.line,visible);show(tick.label,visible&&state.scoresVisible);
    });
    markers.forEach((marker,index)=>{
      const x=pairPositions[index];attrs(marker,{transform:`translate(${x} ${rulerY})`,'data-position':JSON.stringify([x,rulerY])});
      attrs(scoreNames[index],{x,y:66});attrs(scoreValues[index],{x,y:88});
      scoreValues[index].textContent=number(state.currentScores[state.pair[index]]);
      show(scoreValues[index],state.scoresVisible);
    });
    attrs(gapBracket,{d:`M ${pairPositions[1]} 140 L ${pairPositions[1]} 149 L ${pairPositions[0]} 149 L ${pairPositions[0]} 140`});
    attrs(gapValue,{x:gapMid,y:174});gapValue.textContent=`gap ${number(state.gap)}`;
    show(gapBracket,state.gapVisible);show(gapValue,state.gapVisible);
    attrs(connector,{d:`M ${gapMid} 184 Q ${gapMid} 202 ${centerX} 202 L ${centerX} 208 M ${centerX} 233 L ${centerX} 239`});
    attrs(sigmoidLabel,{x:centerX,y:228});attrs(probabilityLabel,{x:centerX,y:254});
    attrs(probabilityAxis,{x1:probabilityMinX,y1:probabilityY,x2:probabilityMaxX,y2:probabilityY});
    attrs(probabilityFill,{x1:probabilityMinX,y1:probabilityY,x2:probabilityX,y2:probabilityY});
    attrs(probabilityMarker,{cx:probabilityX,cy:probabilityY});
    attrs(probabilityGhost,{cx:pixel(probabilityMinX+(probabilityMaxX-probabilityMinX)*state.baseProbability),cy:probabilityY});
    attrs(probabilityValue,{x:clamp(probabilityX,44,width-44),y:278});probabilityValue.textContent=state.probability.toFixed(3);
    probabilityTicks.forEach((tick,index)=>attrs(tick,{x:index?probabilityMaxX:probabilityMinX,y:312}));
    [connector,sigmoidLabel,probabilityLabel,probabilityAxis,probabilityFill,probabilityMarker,probabilityValue,...probabilityTicks].forEach(node=>show(node,state.probabilityVisible));
    show(probabilityGhost,state.shiftVisible);
    attrs(cameraNote,{x:centerX,y:333});show(cameraNote,Math.abs(state.cameraOffset)>1e-12);
    formula.classList.toggle('pr-base-shown',stage>=3);
    formula.classList.toggle('pr-shift-shown',stage>=4);
    formula.classList.toggle('pr-gap-lit',stage>=3&&stage<7);
    formula.classList.toggle('pr-cancelled',stage>=7);
    if(caption.textContent!==captions[stage])caption.textContent=captions[stage];
    return`${names[stage]}.${state.probabilityVisible?` Modeled preference ${state.probability.toFixed(3)}.`:''}${state.shiftVisible?` Common addition ${number(state.commonShift)}.`:''}`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  measure();window.BookPlayback(root,render,()=>{measure();render(lastTime,reduced);});typeset();
})();
