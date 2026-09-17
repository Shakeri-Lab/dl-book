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
  // Stage 4 asks for a prediction, so it is a still: no part of the shift is drawn,
  // counted or described there. The shift then arrives as two equal glides. Each opens
  // with two still seconds under its own caption and finishes exactly at the beat it
  // leads into, so an arrow-key seek parks on a finished picture.
  const glides=[beats[6],beats[7]].map(end=>[end-3,end]);
  function buildState(time,reducedMotion=false,source=fixture){
    validate(source);
    const clamped=clamp(Number.isFinite(time)?time:0,0,duration),stage=stageAt(clamped),held=reducedMotion?beats[stage]:clamped;
    const shiftProgress=glides.reduce((sum,[start,end])=>sum+ease((held-start)/(end-start)),0)/glides.length,commonShift=source.shift*shiftProgress;
    const moving=glides.some(([start,end])=>held>start&&held<end);
    const baseScores=source.scores.slice(),currentScores=baseScores.map(value=>value+commonShift),pair=source.pair.slice();
    const baseGap=baseScores[pair[0]]-baseScores[pair[1]],gap=currentScores[pair[0]]-currentScores[pair[1]];
    const cameraTravel=.6*Math.max(1,Math.abs(baseGap)/2);
    // The camera follows after a short visible translation. Its movement changes
    // the ruler's origin, never its metric or the separation of the score marks.
    const cameraOffset=commonShift-clamp(commonShift,-cameraTravel,cameraTravel);
    const cameraCenter=(baseScores[pair[0]]+baseScores[pair[1]])/2+cameraOffset;
    const rulerExtent=Math.abs(baseGap)/2+cameraTravel+1;
    return{stage,time:clamped,held,shiftProgress,commonShift,moving,baseScores,currentScores,pair,baseGap,gap,
      probability:sigmoid(gap),baseProbability:sigmoid(baseGap),cameraOffset,cameraCenter,cameraTravel,rulerExtent,
      scoresVisible:stage>=1,gapVisible:stage>=2,probabilityVisible:stage>=3,ringVisible:stage>=4,shiftVisible:stage>=5,invarianceVisible:stage>=7};
  }
  window.BookPreferenceRuler=Object.freeze({buildState});
  const captions=[
    'If both scores rise together, does the modeled preference probability change?',
    'These are two scores for the same prompt. Read their relative positions.',
    'The bracket reads a difference. Its width, not either score alone, will determine the probability.',
    'The sigmoid turns this score difference into a modeled preference probability.',
    'Predict before the shift: both scores will receive the same addition. The ring marks the probability now.',
    'Now add one amount to both scores. Follow the gap bracket and the probability mark.',
    'Both scores rose together; the view followed. Same gap, same probability. The shift continues.',
    'Larger scores, same gap, same probability. The additions cancel: reward has no identifiable zero.'
  ];
  const names=['Predict','Read the scores','Read their difference','Map the gap','Predict again','Shift both scores','Continue the shift','No identifiable zero'];
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
  const label=(value,cls='',attributes={},parent=drawing)=>make('text',{'text-anchor':'middle',class:cls,...attributes},value,parent);
  const heading=label('reward scores','',{'data-context':''});
  const shiftValue=label('','',{'data-shift-value':'','data-value':'shift'});
  const ruler=make('line',{class:'pr-ruler','data-ruler':''});
  // The tick pool lives in its own group, under the score marks, and is sized by layout().
  const tickGroup=make('g',{'data-ruler-ticks':''}),ticks=[];
  const markers=[0,1].map(index=>{
    const node=make('g',{'data-score-marker':index,'data-score-index':fixture.pair[index]});
    if(index===0)make('circle',{r:5.5,class:'pr-score','data-marker-shape':'circle'},'',node);
    else make('polygon',{points:'0,-6.5 6.5,0 0,6.5 -6.5,0',class:'pr-score','data-marker-shape':'diamond'},'',node);
    return node;
  });
  const markerNames=fixture.pair.map(index=>String.fromCharCode(65+index));
  const scoreNames=markerNames.map((name,index)=>label(name,'pr-output',{'data-score-name':index,y:66}));
  const scoreValues=[0,1].map(index=>label('','pr-output',{'data-score-value':index,'data-value':`score-${index}`,y:88}));
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
  // Printed numbers: U+2212 for minus and an explicit sign on the shift. While a glide
  // is under way the moving readouts keep one decimal, so three digits do not flicker.
  const MINUS='−';
  const number=value=>Number(value.toFixed(3)).toString().replace('-',MINUS);
  const live=(value,moving)=>moving?value.toFixed(1).replace(/^-(?=0\.0$)/,'').replace('-',MINUS):number(value);
  const signed=(value,moving)=>{const text=live(value,moving);return text.startsWith(MINUS)?text:`+${text}`;};
  // Last-bit libm differences must not change static SVG bytes. Quantize only
  // drawn coordinates (0.0001 px); model state stays raw.
  const pixel=value=>Number(value.toFixed(4));
  const rulerY=104,rulerInset=24,tickInset=8,probabilityInset=32,probabilityY=291;
  let width=713,geometry=null,drawn='',lastTime=0,reduced=false;
  // Everything that depends only on the fixture and the figure width is settled here.
  function layout(){
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));root.dataset.layout=width<520?'narrow':'wide';
    const base=buildState(0),centerX=pixel(width/2),rulerMinX=rulerInset,rulerMaxX=width-rulerInset;
    const unit=Math.min(52,(rulerMaxX-rulerMinX)/(2*base.rulerExtent));
    const tickStep=Math.max(1,Math.pow(10,Math.floor(Math.log10(base.rulerExtent/2))));
    // As many ticks as the visible span can hold, plus one spare for a tick on each end.
    const tickCount=Math.floor((rulerMaxX-rulerMinX-2*tickInset)/(unit*tickStep))+2;
    while(ticks.length<tickCount)ticks.push({line:make('line',{class:'pr-tick','data-ruler-tick':'',y1:rulerY-4,y2:rulerY+4},'',tickGroup),label:label('','pr-muted',{'data-ruler-tick-label':'',y:rulerY+22},tickGroup)});
    while(ticks.length>tickCount){const tick=ticks.pop();tick.line.remove();tick.label.remove();}
    const probabilityMinX=probabilityInset,probabilityMaxX=width-probabilityInset;
    geometry={centerX,rulerMinX,rulerMaxX,unit,tickStep,probabilityMinX,probabilityMaxX};
    Object.assign(root.dataset,{
      baseScores:JSON.stringify(base.baseScores),baseGap:String(base.baseGap),baseProbability:String(base.baseProbability),cameraTravel:String(base.cameraTravel),rulerExtent:String(base.rulerExtent),
      pixelsPerUnit:String(unit),rulerCenterX:String(centerX),rulerY:String(rulerY),rulerMinX:String(rulerMinX),rulerMaxX:String(rulerMaxX),
      probabilityMinX:String(probabilityMinX),probabilityMaxX:String(probabilityMaxX),probabilityY:String(probabilityY)
    });
    svg.setAttribute('viewBox',`0 0 ${width} 340`);
    attrs(heading,{x:centerX,y:28});attrs(shiftValue,{x:centerX,y:28});
    attrs(ruler,{x1:rulerMinX,y1:rulerY,x2:rulerMaxX,y2:rulerY});
    attrs(sigmoidLabel,{x:centerX,y:228});attrs(probabilityLabel,{x:centerX,y:254});
    attrs(probabilityAxis,{x1:probabilityMinX,y1:probabilityY,x2:probabilityMaxX,y2:probabilityY});
    attrs(probabilityGhost,{cx:pixel(probabilityMinX+(probabilityMaxX-probabilityMinX)*base.baseProbability),cy:probabilityY});
    probabilityTicks.forEach((tick,index)=>attrs(tick,{x:index?probabilityMaxX:probabilityMinX,y:312}));
    attrs(cameraNote,{x:centerX,y:333});
    drawn='';
  }
  function draw(state){
    const{stage,moving}=state,{centerX,rulerMinX,rulerMaxX,unit,tickStep,probabilityMinX,probabilityMaxX}=geometry;
    const screen=score=>pixel(centerX+unit*(score-state.cameraCenter));
    const pairPositions=state.pair.map(index=>screen(state.currentScores[index]));
    const gapMid=pixel((pairPositions[0]+pairPositions[1])/2);
    const probabilityX=pixel(probabilityMinX+(probabilityMaxX-probabilityMinX)*state.probability);
    Object.assign(root.dataset,{
      stage:String(stage),shiftProgress:String(state.shiftProgress),commonShift:String(state.commonShift),currentScores:JSON.stringify(state.currentScores),
      gap:String(state.gap),probability:String(state.probability),cameraOffset:String(state.cameraOffset),cameraCenter:String(state.cameraCenter)
    });
    // The picture is the one place its live values are described; the scrubber names only the stage.
    svg.setAttribute('aria-label',`${names[stage]}.${state.scoresVisible?` Scores ${state.pair.map(index=>live(state.currentScores[index],moving)).join(' and ')}.`:''}${state.gapVisible?` Difference ${number(state.gap)}.`:''}${state.probabilityVisible?` Modeled preference probability ${state.probability.toFixed(3)}.`:''}${state.shiftVisible?` Common shift ${signed(state.commonShift,moving)}.`:''}`);
    show(heading,!state.shiftVisible);
    shiftValue.textContent=`common shift ${signed(state.commonShift,moving)}`;show(shiftValue,state.shiftVisible);
    const tickMinX=rulerMinX+tickInset,tickMaxX=rulerMaxX-tickInset;
    const firstTick=Math.ceil((state.cameraCenter+(tickMinX-centerX)/unit)/tickStep);
    ticks.forEach((tick,index)=>{
      const score=(firstTick+index)*tickStep,x=screen(score),visible=x>=tickMinX&&x<=tickMaxX;
      attrs(tick.line,{x1:x,x2:x,'data-score':score});
      attrs(tick.label,{x,'data-score':score});tick.label.textContent=number(score);
      show(tick.line,visible);show(tick.label,visible&&state.scoresVisible);
    });
    markers.forEach((marker,index)=>{
      const x=pairPositions[index];attrs(marker,{transform:`translate(${x} ${rulerY})`,'data-position':JSON.stringify([x,rulerY])});
      scoreNames[index].setAttribute('x',String(x));scoreValues[index].setAttribute('x',String(x));
      scoreValues[index].textContent=live(state.currentScores[state.pair[index]],moving);
      show(scoreValues[index],state.scoresVisible);
    });
    attrs(gapBracket,{d:`M ${pairPositions[1]} 140 L ${pairPositions[1]} 149 L ${pairPositions[0]} 149 L ${pairPositions[0]} 140`});
    attrs(gapValue,{x:gapMid,y:174});gapValue.textContent=`gap ${number(state.gap)}`;
    // Once the shift is in play the two readouts that do not change carry the weight.
    gapValue.classList.toggle('pr-invariant',state.shiftVisible);probabilityValue.classList.toggle('pr-invariant',state.shiftVisible);
    show(gapBracket,state.gapVisible);show(gapValue,state.gapVisible);
    attrs(connector,{d:`M ${gapMid} 184 Q ${gapMid} 202 ${centerX} 202 L ${centerX} 208 M ${centerX} 233 L ${centerX} 239`});
    attrs(probabilityFill,{x1:probabilityMinX,y1:probabilityY,x2:probabilityX,y2:probabilityY});
    attrs(probabilityMarker,{cx:probabilityX,cy:probabilityY});
    attrs(probabilityValue,{x:clamp(probabilityX,44,width-44),y:278});probabilityValue.textContent=state.probability.toFixed(3);
    [connector,sigmoidLabel,probabilityLabel,probabilityAxis,probabilityFill,probabilityMarker,probabilityValue,...probabilityTicks].forEach(node=>show(node,state.probabilityVisible));
    show(probabilityGhost,state.ringVisible);
    show(cameraNote,Math.abs(state.cameraOffset)>1e-12);
    formula.classList.toggle('pr-base-shown',stage>=3);
    formula.classList.toggle('pr-shift-shown',stage>=4);
    formula.classList.toggle('pr-gap-lit',stage>=3&&stage<7);
    formula.classList.toggle('pr-cancelled',stage>=7);
  }
  function render(time,reducedMotion){
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage}=state;
    // The picture is a function of the stage and the shift alone; a held frame is not redrawn.
    const key=`${stage}/${state.commonShift}/${state.moving}`;
    if(key!==drawn){drawn=key;draw(state);}
    if(caption.textContent!==captions[stage])caption.textContent=captions[stage];
    return`${names[stage]}.`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  layout();window.BookPlayback(root,render,()=>{layout();render(lastTime,reduced);});typeset();
})();
