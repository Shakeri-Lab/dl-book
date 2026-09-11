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
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number);
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
  const captions=[
    'At the midpoint, will the two local pulls reinforce each other or cancel?',
    'Follow one probe across the fixed mixture. The two curves share its coordinate, not their vertical units.',
    'Each responsibility scales one signed pull. Place the second arrow at the first tip; their sum is the score.',
    'Near the midpoint, either component could have produced this coordinate. Their relative weights change.',
    'Equal weights give opposite pulls. They cancel in the density valley, not at a peak.',
    'Continue right. The same fixed calculation now gives the right component more influence.',
    'At plus one, the right component dominates. The local score points right.',
    'Cross the right mean; farther right, both pulls point left. The derivative is not a probability.',
    'The probe inspects a fixed field. Its prescribed sweep is not a sampling trajectory.'
  ];
  const names=['Predict','Inspect','Left witness','Approach midpoint','Cancellation','Continue right','Right witness','Beyond the means','Boundary'];
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  const make=(tag,attributes,parent=drawing,content='')=>{
    const node=document.createElementNS(NS,tag);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    node.textContent=content; parent.appendChild(node); return node;
  };
  const attrs=(node,values)=>{for (const [key,value] of Object.entries(values)) node.setAttribute(key,String(value));};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(content,cls='sf-label',extra={},parent=drawing)=>make('text',{class:cls,'font-size':12,...extra},parent,content);
  const densityName=label('density','sf-ink',{'font-size':13});
  const densityValue=label('','sf-label',{'data-value':'density','text-anchor':'end'});
  const densityAxis=make('path',{class:'sf-axis'});
  const densityCurve=make('path',{class:'sf-density','data-density-curve':''});
  const densityTicks=[0,.3].map(value=>({value,mark:label(String(value),'sf-label',{'text-anchor':'end'})}));
  const meanMarks=means.map((mean,i)=>({mean,line:make('line',{class:'sf-mean','data-mean':i}),
    label:label(`mean ${mean}`,'sf-label',{'text-anchor':'middle'})}));
  const scoreName=label('score','sf-score',{'font-size':13});
  const xValue=label('','sf-input',{'data-value':'x','font-size':13,'text-anchor':'end'});
  const scoreTicks=[-6,0,6].map(value=>({value,line:make('line',{class:value?'sf-grid':'sf-axis'}),
    label:label(String(value),'sf-label',{'text-anchor':'end'})}));
  const scoreAxis=make('line',{class:'sf-axis'});
  const scoreCurve=make('path',{class:'sf-curve','data-score-curve':''});
  const xTicks=[-5,-2,0,2,5].map(value=>({value,label:label(String(value),'sf-label',{'text-anchor':'middle'})}));
  const guide=make('line',{class:'sf-probe','data-probe-guide':''});
  const densityDot=make('circle',{class:'sf-dot',r:4.7,'data-probe-dot':'density'});
  const scoreDot=make('circle',{class:'sf-dot',r:4.7,'data-probe-dot':'score'});
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
    value:label('','sf-score',{'data-pull-value':i,'text-anchor':'end','font-size':13},sumGroup)
  }));
  const join=make('line',{class:'sf-join','data-pull-join':''},sumGroup);
  const result=make('path',{class:'sf-arrow sf-sum','data-score-arrow':''},sumGroup);
  const resultName=label('sum','sf-score',{},sumGroup);
  const resultValue=label('','sf-score',{'data-value':'score','text-anchor':'end','font-size':14},sumGroup);
  const zeroRing=make('circle',{class:'sf-zero-ring',r:4.5,'data-zero-result':''},sumGroup);
  const endpoint=make('line',{class:'sf-join','data-sum-join':''},sumGroup);
  let width=713,lastTime=0,reduced=false;
  const measure=()=>{
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    root.dataset.layout=width<520?'narrow':'wide';
  };
  function geometry() {
    const narrow=width<520;
    return {width,narrow,height:narrow?500:470,left:34,right:width-14,
      densityBaseline:98,densityScale:210,scoreZero:223,scoreScale:13,
      weightsY:narrow?357:342,titleY:narrow?382:369,
      rows:narrow?[405,435,474]:[391,419,451],
      pullOrigin:(46+width-76)/2,pullScale:(width-122)/12};
  }
  const arrowPath=(a,b,y)=>{
    if (Math.abs(b-a)<.01) return `M ${a} ${y} L ${b} ${y}`;
    const sign=Math.sign(b-a),head=Math.min(5,Math.abs(b-a)*.45);
    return `M ${a} ${y} L ${b} ${y} M ${b-sign*head} ${y-head*.6} L ${b} ${y} L ${b-sign*head} ${y+head*.6}`;
  };
  // A tiny nonzero derivative at a component mean is not a critical point.
  const signed=value=>value===0?'0.0000':`${value>0?'+':''}${Math.abs(value)<.0001?value.toExponential(1):value.toFixed(4)}`;
  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), held=reducedMotion?beats[stage]:time;
    const state=at(probeAt(held)), g=geometry(), visible=stage>=2;
    const xToPx=x=>g.left+(x-domain[0])/(domain[1]-domain[0])*(g.right-g.left);
    const scoreToY=value=>g.scoreZero-value*g.scoreScale;
    const densityToY=value=>g.densityBaseline-value*g.densityScale;
    Object.assign(root.dataset,{stage:String(stage),probe:String(state.x),
      responsibilities:JSON.stringify(state.responsibilities),pulls:JSON.stringify(state.pulls),
      score:String(state.score),density:String(state.density),revealed:String(visible),
      scoreMin:'-6',scoreMax:'6',plotLeft:String(g.left),plotRight:String(g.right),
      scoreZero:String(g.scoreZero),scoreScale:String(g.scoreScale),
      densityBaseline:String(g.densityBaseline),densityScale:String(g.densityScale),
      pullOrigin:String(g.pullOrigin),pullScale:String(g.pullScale)});
    svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
    svg.setAttribute('aria-label',visible
      ? `Fixed mixture at x ${state.x.toFixed(2)}. Density ${state.density.toFixed(4)}. Responsibilities ${state.responsibilities.map(w=>w.toFixed(4)).join(' and ')}. Weighted pulls ${state.pulls.map(signed).join(' and ')}; local score ${signed(state.score)}.${stage>=4?' Zero score at the midpoint is a density valley, not a mode.':''}`
      :'A fixed two-component density and its local score share the horizontal coordinate. Predict how the two local pulls combine at the midpoint.');
    attrs(densityName,{x:g.left,y:18}); attrs(densityValue,{x:g.right,y:18});
    densityValue.textContent=state.density.toFixed(4);
    attrs(densityAxis,{d:`M ${g.left} ${densityToY(.3)} V ${g.densityBaseline} H ${g.right}`});
    const densityPath=samples.map((p,i)=>`${i?'L':'M'} ${xToPx(p.x).toFixed(3)} ${densityToY(p.density).toFixed(3)}`).join(' ');
    attrs(densityCurve,{d:`M ${g.left} ${g.densityBaseline} L ${densityPath.slice(2)} L ${g.right} ${g.densityBaseline} Z`});
    densityTicks.forEach(tick=>attrs(tick.mark,{x:g.left-7,y:densityToY(tick.value)+4}));
    meanMarks.forEach(mark=>{
      const x=xToPx(mark.mean);
      attrs(mark.line,{x1:x,x2:x,y1:34,y2:g.densityBaseline});
      attrs(mark.label,{x,y:g.densityBaseline+17});
    });
    attrs(scoreName,{x:g.left,y:139}); attrs(xValue,{x:g.right,y:139});
    xValue.textContent=`x = ${state.x.toFixed(2)}`;
    scoreTicks.forEach(tick=>{
      const y=scoreToY(tick.value);
      attrs(tick.line,{x1:g.left,x2:g.right,y1:y,y2:y}); attrs(tick.label,{x:g.left-7,y:y+4});
    });
    attrs(scoreAxis,{x1:g.left,x2:g.left,y1:scoreToY(6),y2:scoreToY(-6)});
    attrs(scoreCurve,{d:samples.map((p,i)=>`${i?'L':'M'} ${xToPx(p.x).toFixed(3)} ${scoreToY(p.score).toFixed(3)}`).join(' ')});
    xTicks.forEach(tick=>attrs(tick.label,{x:xToPx(tick.value),y:323}));
    const probeX=xToPx(state.x);
    attrs(guide,{x1:probeX,x2:probeX,y1:31,y2:scoreToY(-6)});
    attrs(densityDot,{cx:probeX,cy:densityToY(state.density)});
    attrs(scoreDot,{cx:probeX,cy:scoreToY(state.score)});
    attrs(valleyRing,{cx:xToPx(0),cy:densityToY(at(0).density)});
    attrs(valleyLabel,{x:xToPx(0),y:119}); show(valley,stage>=4);
    attrs(weights[0],{x:g.left,y:g.weightsY});
    attrs(weights[1],{x:g.right,y:g.weightsY,'text-anchor':'end'});
    weights.forEach((mark,i)=>{mark.textContent=`weight ${i+1}: ${state.responsibilities[i].toFixed(4)}`;});
    attrs(adderTitle,{x:g.left,y:g.titleY});
    attrs(origin,{x1:g.pullOrigin,x2:g.pullOrigin,y1:g.rows[0]-8,y2:g.rows[2]+8});
    const firstEnd=g.pullOrigin+state.pulls[0]*g.pullScale;
    const finalEnd=firstEnd+state.pulls[1]*g.pullScale;
    pullMarks.forEach((mark,i)=>{
      const start=i?firstEnd:g.pullOrigin,end=i?finalEnd:firstEnd;
      attrs(mark.arrow,{d:arrowPath(start,end,g.rows[i]),'data-start':start,'data-end':end,'data-magnitude':state.pulls[i]});
      attrs(mark.name,{x:12,y:g.rows[i]+4});
      attrs(mark.value,{x:g.width-8,y:g.rows[i]+4}); mark.value.textContent=signed(state.pulls[i]);
    });
    attrs(join,{x1:firstEnd,x2:firstEnd,y1:g.rows[0],y2:g.rows[1]});
    attrs(result,{d:arrowPath(g.pullOrigin,finalEnd,g.rows[2]),'data-start':g.pullOrigin,'data-end':finalEnd,'data-magnitude':state.score});
    attrs(endpoint,{x1:finalEnd,x2:finalEnd,y1:g.rows[1],y2:g.rows[2]});
    attrs(resultName,{x:8,y:g.rows[2]+4});
    attrs(resultValue,{x:g.width-8,y:g.rows[2]+5}); resultValue.textContent=signed(state.score);
    attrs(zeroRing,{cx:g.pullOrigin,cy:g.rows[2]}); show(zeroRing,Math.abs(state.score)<1e-10);
    show(sumGroup,visible);
    formula.classList.toggle('sf-shown',visible);
    formula.classList.toggle('sf-weights-lit',visible&&(stage===2||stage===3||stage===5));
    formula.classList.toggle('sf-pulls-lit',visible&&(stage===4||stage===6||stage===7||stage===8));
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${names[stage]}. Probe x ${state.x.toFixed(2)}.${visible?` Local score ${signed(state.score)}.`:''}`;
  }
  const typeset=()=>{
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    if (window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  measure();
  window.BookPlayback(root,render,()=>{measure(); render(lastTime,reduced);});
  typeset();
})();
