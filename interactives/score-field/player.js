(() => {
  const root=document.getElementById('score-field-excerpt');
  if (!root||root.dataset.ready) return;
  const $=selector=>root.querySelector(selector);
  const declared=name=>root.dataset[name].trim().split(/\s+/).map(Number);
  const means=declared('means'), priors=declared('priors'), domain=declared('domain');
  const sigma=Number(root.dataset.scale), variance=sigma*sigma;
  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number), duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=x=>Math.max(0,Math.min(1,x));
  const glide=(time,start,end,a,b)=>a+(b-a)*(1-Math.cos(Math.PI*clamp((time-start)/(end-start))))/2;
  // Prescribed inspection coordinates, not numerical integration or sample paths.
  // Every glide reaches its witness before that beat's reading hold begins.
  const probeAt=time=>time<beats[1]?domain[0]
    :time<beats[2]?glide(time,beats[1],beats[2],domain[0],-1)
    :time<beats[3]?-1
    :time<beats[4]?glide(time,beats[3],beats[4],-1,0)
    :time<beats[5]?0
    :time<beats[6]?glide(time,beats[5],beats[6],0,1)
    :time<beats[7]?1
    :time<beats[8]?glide(time,beats[7],beats[8],1,domain[1]):domain[1];
  // Reduced motion draws one still per beat. A hold rests on its witness. A sweep rests
  // midway between its two ends, the coordinate its caption describes; a still at the
  // sweep's start would sit under a sentence about somewhere the probe has not been.
  const restAt=stage=>(probeAt(beats[stage])+probeAt(stage+1<beats.length?beats[stage+1]:duration))/2;
  function at(x) {
    const logs=means.map((mean,i)=>Math.log(priors[i])-.5*(x-mean)**2/variance);
    const maximum=Math.max(...logs), affinities=logs.map(value=>Math.exp(value-maximum));
    const total=affinities.reduce((sum,value)=>sum+value,0);
    const responsibilities=affinities.map(value=>value/total);
    const pulls=responsibilities.map((weight,i)=>weight*(means[i]-x)/variance);
    return {x,responsibilities,pulls,score:pulls.reduce((sum,value)=>sum+value,0),
      density:Math.exp(maximum)*total/(sigma*Math.sqrt(2*Math.PI))};
  }
  const samples=Array.from({length:241},(_,i)=>at(domain[0]+(domain[1]-domain[0])*i/240));
  const valleyDensity=at(0).density;
  // Each sentence is true of its reduced-motion still and of the motion it introduces.
  const captions=[
    'At the midpoint, will the two local pulls reinforce each other or cancel?',
    'One probe inspects the fixed mixture. Both curves share its coordinate, not their vertical units.',
    'Each responsibility scales one signed pull. Place the second arrow at the first tip; their sum is the score.',
    'Toward the midpoint either component could have produced this coordinate: the right gains weight, the left still dominates.',
    'Equal weights give opposite pulls. They cancel in the density valley, not at a peak.',
    'Right of the midpoint the same fixed calculation gives the right component more weight.',
    'At plus one, the right component dominates. The local score points right.',
    'Before the right mean pull 2 points right; past it both pulls point left, and so does the score.',
    'The probe inspects a fixed field. Its prescribed sweep is not a sampling trajectory.'
  ];
  const names=['Predict','Inspect','Left witness','Approach midpoint','Cancellation','Continue right','Right witness','Beyond the means','Boundary'];
  // What a sweep is about: the numbers outside it stay on the picture, in grey.
  const WEIGHT_SWEEPS=[3,5], PULL_SWEEPS=[7];
  const descriptions=[
    'A fixed two-component density and its local score share the horizontal coordinate. Predict how the two local pulls combine at the midpoint.',
    'A fixed two-component density and its local score share one probe coordinate. Below them, two responsibility-weighted pulls add tip to tail into the local score.',
    ' Zero score at the midpoint is a density valley, not a mode.'
  ];

  // --- One formatter, everywhere a reader or a screen reader meets a number -----------
  // U+2212 for minus. Four decimals while four decimals can carry the value; below that a
  // mantissa and a power of ten with Unicode superscripts, so a tiny nonzero pull at a
  // component mean is never printed as a false zero. Only an exact zero prints 0.
  const SUPERSCRIPT='⁰¹²³⁴⁵⁶⁷⁸⁹';
  const power=exponent=>`10${exponent<0?'⁻':''}${[...String(Math.abs(exponent))].map(digit=>SUPERSCRIPT[digit]).join('')}`;
  function magnitude(value) {
    if (value===0) return '0';
    if (value>=.0001) return value.toFixed(4);
    let exponent=Math.floor(Math.log10(value)), mantissa=value/10**exponent;
    if (Number(mantissa.toFixed(1))>=10) {mantissa/=10; exponent+=1;}
    return `${mantissa.toFixed(1)} × ${power(exponent)}`;
  }
  const signed=value=>value===0?'0':`${value>0?'+':'−'}${magnitude(Math.abs(value))}`;
  const coordinate=value=>{const text=Math.abs(value).toFixed(2); return `${value<0&&Number(text)?'−':''}${text}`;};
  const tick=value=>String(value).replace('-','−');

  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px, so a last-bit difference between math
  // libraries cannot change the byte-compared static print. The state itself stays unrounded.
  const px=value=>typeof value==='number'?String(Number(value.toFixed(4))):String(value);
  const attrs=(node,values)=>{for (const [key,value] of Object.entries(values)) node.setAttribute(key,px(value));};
  const make=(tag,attributes,parent=drawing,content='')=>{
    const node=document.createElementNS(NS,tag);
    attrs(node,attributes); node.textContent=content; parent.appendChild(node); return node;
  };
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(content,cls='sf-label',extra={},parent=drawing)=>make('text',{class:cls,'font-size':12,...extra},parent,content);
  const densityName=label('density','sf-ink',{'font-size':13});
  const densityAxis=make('path',{class:'sf-axis'});
  const densityCurve=make('path',{class:'sf-density','data-density-curve':''});
  const densityTicks=[0,.3].map(value=>({value,mark:label(tick(value),'sf-label',{'text-anchor':'end'})}));
  const meanMarks=means.map((mean,i)=>({mean,line:make('line',{class:'sf-mean','data-mean':i}),
    label:label(`mean ${tick(mean)}`,'sf-label',{'text-anchor':'middle','data-mean-label':i})}));
  const scoreName=label('score','sf-score',{'font-size':13,'data-score-title':''});
  const scoreTicks=[-6,0,6].map(value=>({value,line:make('line',{class:value?'sf-grid':'sf-axis'}),
    label:label(tick(value),'sf-label',{'text-anchor':'end'})}));
  const scoreAxis=make('line',{class:'sf-axis'});
  const scoreCurve=make('path',{class:'sf-curve','data-score-curve':''});
  const xTicks=[-5,-2,0,2,5].map(value=>({value,label:label(tick(value),'sf-label',{'text-anchor':'middle'})}));
  // The guide is broken across the label row between the two plots, so it never crosses
  // a mean label, the valley label, or the probe's own coordinate, which rides in that gap.
  const guides=['density','score'].map(part=>make('line',{class:'sf-probe','data-probe-guide':part}));
  const densityDot=make('circle',{class:'sf-dot',r:4.7,'data-probe-dot':'density'});
  const scoreDot=make('circle',{class:'sf-dot',r:4.7,'data-probe-dot':'score'});
  const xValue=label('','sf-input',{'data-value':'x','font-size':13,'text-anchor':'middle'});
  const valley=make('g',{'data-valley':''});
  const valleyRing=make('circle',{class:'sf-zero-ring',r:5},valley);
  const valleyLabel=label('valley','sf-label',{'text-anchor':'middle'},valley);
  const sumGroup=make('g',{'data-sum-geometry':''});
  const weights=means.map((_,i)=>label('','sf-output',{'data-responsibility':i,'font-size':13},sumGroup));
  const adderTitle=label('weighted pulls','sf-ink',{'font-size':13},sumGroup);
  const origin=make('line',{class:'sf-grid','data-pull-origin':''},sumGroup);
  const pullMarks=means.map((_,i)=>({
    arrow:make('path',{class:`sf-arrow${i?' sf-pull-second':''}`,'data-pull':i},sumGroup),
    name:label(String(i+1),'sf-label',{},sumGroup),
    value:label('','sf-score',{'data-pull-value':i,'font-size':13},sumGroup)
  }));
  const join=make('line',{class:'sf-join','data-pull-join':''},sumGroup);
  const result=make('path',{class:'sf-arrow sf-sum','data-score-arrow':''},sumGroup);
  const resultName=label('sum','sf-score',{},sumGroup);
  const resultValue=label('','sf-score',{'data-value':'score','font-size':14},sumGroup);
  const zeroRing=make('circle',{class:'sf-zero-ring',r:4.5,'data-zero-result':''},sumGroup);
  const endpoint=make('line',{class:'sf-join','data-sum-join':''},sumGroup);
  let width=713,lastTime=0,reduced=false,g,xToPx,scoreToY,densityToY,described;
  const measure=()=>{
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    root.dataset.layout=width<520?'narrow':'wide';
  };
  // Everything that depends only on the fixture and the pane width is drawn here, once per
  // width: both 241-point curves, the axes, ticks, fixed labels, the valley mark and the
  // adder's ruler. render() moves only the probe, its numbers and the three arrows.
  function layout() {
    const narrow=width<520;
    g={width,narrow,height:narrow?518:492,left:34,right:width-14,
      densityTop:31,densityBaseline:98,densityScale:210,gapLabelY:115,probeLabelY:136,
      scoreZero:241,scoreScale:13,tickY:341,
      weightsY:narrow?375:364,titleY:narrow?400:391,
      rows:narrow?[423,453,492]:[413,441,473],
      pullOrigin:(46+width-76)/2,pullScale:(width-122)/12};
    xToPx=x=>g.left+(x-domain[0])/(domain[1]-domain[0])*(g.right-g.left);
    scoreToY=value=>g.scoreZero-value*g.scoreScale;
    densityToY=value=>g.densityBaseline-value*g.densityScale;
    Object.assign(root.dataset,{scoreMin:'-6',scoreMax:'6',plotLeft:String(g.left),plotRight:String(g.right),
      scoreZero:String(g.scoreZero),scoreScale:String(g.scoreScale),
      densityBaseline:String(g.densityBaseline),densityScale:String(g.densityScale),
      pullOrigin:String(g.pullOrigin),pullScale:String(g.pullScale)});
    svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
    attrs(densityName,{x:g.left,y:18});
    attrs(densityAxis,{d:`M ${g.left} ${px(densityToY(.3))} V ${g.densityBaseline} H ${g.right}`});
    const densityPath=samples.map(p=>`L ${xToPx(p.x).toFixed(3)} ${densityToY(p.density).toFixed(3)}`).join(' ');
    attrs(densityCurve,{d:`M ${g.left} ${g.densityBaseline} ${densityPath} L ${g.right} ${g.densityBaseline} Z`});
    densityTicks.forEach(mark=>attrs(mark.mark,{x:g.left-7,y:densityToY(mark.value)+4}));
    meanMarks.forEach(mark=>{
      const x=xToPx(mark.mean);
      attrs(mark.line,{x1:x,x2:x,y1:34,y2:g.densityBaseline});
      attrs(mark.label,{x,y:g.gapLabelY});
    });
    attrs(scoreName,{x:g.left,y:scoreToY(6)-6});
    scoreTicks.forEach(mark=>{
      const y=scoreToY(mark.value);
      attrs(mark.line,{x1:g.left,x2:g.right,y1:y,y2:y}); attrs(mark.label,{x:g.left-7,y:y+4});
    });
    attrs(scoreAxis,{x1:g.left,x2:g.left,y1:scoreToY(6),y2:scoreToY(-6)});
    attrs(scoreCurve,{d:samples.map((p,i)=>`${i?'L':'M'} ${xToPx(p.x).toFixed(3)} ${scoreToY(p.score).toFixed(3)}`).join(' ')});
    xTicks.forEach(mark=>attrs(mark.label,{x:xToPx(mark.value),y:g.tickY}));
    attrs(guides[0],{y1:g.densityTop,y2:g.densityBaseline});
    attrs(guides[1],{y1:scoreToY(6),y2:scoreToY(-6)});
    attrs(xValue,{y:g.probeLabelY});
    attrs(valleyRing,{cx:xToPx(0),cy:densityToY(valleyDensity)});
    attrs(valleyLabel,{x:xToPx(0),y:g.gapLabelY});
    // Each weight sits under its own component: below that mean's tick where the pane is
    // wide enough for both, at the matching edge where it is not.
    weights.forEach((mark,i)=>attrs(mark,narrow
      ?{x:i?g.width-8:8,y:g.weightsY,'text-anchor':i?'end':'start'}
      :{x:xToPx(means[i]),y:g.weightsY,'text-anchor':'middle'}));
    attrs(adderTitle,{x:g.left,y:g.titleY});
    attrs(origin,{x1:g.pullOrigin,x2:g.pullOrigin,y1:g.rows[0]-8,y2:g.rows[2]+8});
    pullMarks.forEach((mark,i)=>{attrs(mark.name,{x:12,y:g.rows[i]+4}); attrs(mark.value,{y:g.rows[i]+4});});
    attrs(resultName,{x:8,y:g.rows[2]+4}); attrs(resultValue,{y:g.rows[2]+5});
    attrs(zeroRing,{cx:g.pullOrigin,cy:g.rows[2]});
  }
  const arrowPath=(a,b,y)=>{
    if (Math.abs(b-a)<.01) return `M ${px(a)} ${y} L ${px(b)} ${y}`;
    const sign=Math.sign(b-a),head=Math.min(5,Math.abs(b-a)*.45);
    return `M ${px(a)} ${y} L ${px(b)} ${y} M ${px(b-sign*head)} ${px(y-head*.6)} L ${px(b)} ${y} L ${px(b-sign*head)} ${px(y+head*.6)}`;
  };
  // A value is printed just right of its arrow, never left of the shared origin, so the
  // three numbers read as a column sum and none is crossed by the origin or a join line.
  const beside=(...ends)=>Math.max(g.pullOrigin,...ends)+10;
  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), state=at(reducedMotion?restAt(stage):probeAt(time)), visible=stage>=2;
    Object.assign(root.dataset,{stage:String(stage),probe:String(state.x),
      responsibilities:JSON.stringify(state.responsibilities),pulls:JSON.stringify(state.pulls),
      score:String(state.score),density:String(state.density),revealed:String(visible)});
    // The picture's name says what is drawn. The live numbers are announced in one place:
    // the scrubber's value text, built from the string this function returns.
    const description=visible?descriptions[1]+(stage>=4?descriptions[2]:''):descriptions[0];
    if (description!==described) {described=description; svg.setAttribute('aria-label',description);}
    const probeX=xToPx(state.x);
    guides.forEach(line=>attrs(line,{x1:probeX,x2:probeX}));
    attrs(densityDot,{cx:probeX,cy:densityToY(state.density)});
    attrs(scoreDot,{cx:probeX,cy:scoreToY(state.score)});
    attrs(xValue,{x:Math.max(33,Math.min(g.width-33,probeX))});
    xValue.textContent=`x = ${coordinate(state.x)}`;
    show(valley,stage>=4);
    weights.forEach((mark,i)=>{
      mark.textContent=`weight ${i+1}: ${magnitude(state.responsibilities[i])}`;
      mark.classList.toggle('sf-muted',PULL_SWEEPS.includes(stage));
    });
    const firstEnd=g.pullOrigin+state.pulls[0]*g.pullScale;
    const finalEnd=firstEnd+state.pulls[1]*g.pullScale;
    pullMarks.forEach((mark,i)=>{
      const start=i?firstEnd:g.pullOrigin,end=i?finalEnd:firstEnd;
      attrs(mark.arrow,{d:arrowPath(start,end,g.rows[i]),'data-start':start,'data-end':end});
      attrs(mark.value,{x:beside(start,end)}); mark.value.textContent=signed(state.pulls[i]);
      mark.value.classList.toggle('sf-muted',WEIGHT_SWEEPS.includes(stage));
    });
    attrs(join,{x1:firstEnd,x2:firstEnd,y1:g.rows[0],y2:g.rows[1]});
    attrs(result,{d:arrowPath(g.pullOrigin,finalEnd,g.rows[2]),'data-start':g.pullOrigin,'data-end':finalEnd});
    attrs(endpoint,{x1:finalEnd,x2:finalEnd,y1:g.rows[1],y2:g.rows[2]});
    attrs(resultValue,{x:beside(finalEnd)}); resultValue.textContent=signed(state.score);
    resultValue.classList.toggle('sf-muted',WEIGHT_SWEEPS.includes(stage));
    show(zeroRing,Math.abs(state.score)<1e-10);
    show(sumGroup,visible);
    formula.classList.toggle('sf-shown',visible);
    formula.classList.toggle('sf-weights-lit',visible&&(stage===2||stage===3||stage===5));
    formula.classList.toggle('sf-pulls-lit',visible&&(stage===4||stage===6||stage===7||stage===8));
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${names[stage]}. Probe x ${coordinate(state.x)}.${visible
      ?` Weights ${state.responsibilities.map(magnitude).join(' and ')}. Pulls ${state.pulls.map(signed).join(' and ')}; local score ${signed(state.score)}.`:''}`;
  }
  const typeset=()=>{
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    if (window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  measure(); layout();
  window.BookPlayback(root,render,()=>{measure(); layout(); render(lastTime,reduced);});
  typeset();
})();
