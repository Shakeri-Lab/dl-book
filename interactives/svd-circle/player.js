(() => {
  const root=document.getElementById('svd-circle-excerpt');
  if(!root||root.dataset.ready)return;
  const $=selector=>root.querySelector(selector);
  // Appendix A constructs these factors before calling torch.linalg.svd. Using
  // that valid factorization avoids tying the diagram to an SVD backend's signs.
  const fixture={leftAngleDegrees:Number(root.dataset.leftAngleDegrees),rightAngleDegrees:Number(root.dataset.rightAngleDegrees),
    singularValues:JSON.parse(root.dataset.singularValues),sampleCount:Number(root.dataset.sampleCount)};
  const dot=(a,b)=>a.reduce((sum,value,index)=>sum+value*b[index],0);
  const transpose=a=>a[0].map((_,column)=>a.map(row=>row[column]));
  const multiply=(a,b)=>a.map(row=>transpose(b).map(column=>dot(row,column)));
  const apply=(a,x)=>a.map(row=>dot(row,x));
  const rotation=angle=>[[Math.cos(angle),-Math.sin(angle)],[Math.sin(angle),Math.cos(angle)]];
  const diagonal=values=>[[values[0],0],[0,values[1]]];
  const ease=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
  function validate(source){
    if(!Number.isFinite(source.leftAngleDegrees)||!Number.isFinite(source.rightAngleDegrees)
      ||!Array.isArray(source.singularValues)||source.singularValues.length!==2||!source.singularValues.every(Number.isFinite)
      ||source.singularValues[0]<=0||source.singularValues[1]<0||source.singularValues[1]>source.singularValues[0]
      ||!Number.isInteger(source.sampleCount)||source.sampleCount<4)
      throw Error('svd-circle: finite angles, ordered nonnegative scales with a positive first scale, and at least four circle samples are required');
  }
  validate(fixture);
  const pane=$('[data-pane]'),figure=$('[data-figure]'),svg=figure.querySelector('svg');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number),duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  function buildState(time,reducedMotion=false,source=fixture){
    validate(source);
    const clamped=Math.max(0,Math.min(duration,Number.isFinite(time)?time:0)),stage=stageAt(clamped);
    const held=reducedMotion?beats[stage]:clamped;
    const rotationProgress=ease((held-7)/3),stretchProgress=ease((held-12)/3),outputProgress=ease((held-17)/3),truncationProgress=ease((held-27)/3);
    const leftAngle=source.leftAngleDegrees*Math.PI/180,rightAngle=source.rightAngleDegrees*Math.PI/180;
    const U=rotation(leftAngle),V=rotation(rightAngle),Sigma=diagonal(source.singularValues);
    const fullMap=multiply(multiply(U,Sigma),transpose(V));
    const rankOneMap=multiply(multiply(U,diagonal([source.singularValues[0],0])),transpose(V));
    const currentScales=[1+(source.singularValues[0]-1)*stretchProgress,(1+(source.singularValues[1]-1)*stretchProgress)*(1-truncationProgress)];
    const currentMap=multiply(multiply(rotation(leftAngle*outputProgress),diagonal(currentScales)),rotation(-rightAngle*rotationProgress));
    const inputPoints=Array.from({length:source.sampleCount},(_,index)=>{
      const angle=2*Math.PI*index/(source.sampleCount-1);return[Math.cos(angle),Math.sin(angle)];
    });
    const imagePoints=inputPoints.map(point=>apply(currentMap,point)),fullImagePoints=inputPoints.map(point=>apply(fullMap,point));
    const markerInputs=transpose(V),markerOutputs=markerInputs.map(point=>apply(currentMap,point)),fullMarkerOutputs=markerInputs.map(point=>apply(fullMap,point));
    return{stage,time:clamped,held,U,V,Sigma,fullMap,rankOneMap,currentMap,inputPoints,imagePoints,fullImagePoints,
      markerInputs,markerOutputs,fullMarkerOutputs,rotationProgress,stretchProgress,outputProgress,truncationProgress,currentScales,
      rank:currentScales.filter(value=>value>0).length,
      // These are the final A-A1 errors, withheld visually until truncation is done.
      operatorError:source.singularValues[1],frobeniusError:source.singularValues[1],discardedScale:source.singularValues[1]*truncationProgress,
      markersVisible:stage>=1,stretchesVisible:stage>=3,ghostVisible:stage>=5,errorVisible:stage>=7};
  }
  window.BookSVDCircle=Object.freeze({buildState});
  const captions=[
    'Which input direction stretches most? What disappears when we keep only that direction?',
    'Track the two marked directions. First, turn them onto the coordinate axes.',
    'The circle is still round. Now scale its two coordinates separately.',
    'The unequal stretches form an ellipse. Turn its axes into the output space.',
    'The complete map preserves two directions, with different amounts of stretch.',
    'Keep the full ellipse as a reference. Remove the shorter direction\'s contribution.',
    'The second marked direction reaches zero. Other inputs retain their component along the first direction.',
    'One omitted singular value sets both matrix-norm errors. Small does not mean unimportant.'
  ];
  const names=['Predict','Input directions','Input coordinates','Separate stretches','Full map','Remove one term','Rank-one image','Matrix error'];
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'),formula=$('[data-formula]'),caption=$('[data-caption]');
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  // Serialize display coordinates to nine decimal places (at most 0.5e-9 CSS
  // pixel rounding). libm last bits differ across platforms; they must not turn
  // an identical picture into different SVG bytes. Model state stays unrounded.
  const pixel=value=>Number(value.toFixed(9));
  const make=(tag,attributes,text='',parent=drawing)=>{
    const node=document.createElementNS(NS,tag);
    for(const[key,value]of Object.entries(attributes))node.setAttribute(key,String(typeof value==='number'?pixel(value):value));
    node.textContent=text;parent.appendChild(node);return node;
  };
  const attrs=(node,values)=>{for(const[key,value]of Object.entries(values))node.setAttribute(key,String(typeof value==='number'?pixel(value):value));};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(value,cls='',attributes={})=>make('text',{'text-anchor':'middle','font-size':13,class:cls,...attributes},value);
  const heading=label('', 'svd-muted',{'data-context':'','font-size':13});
  const axes=[0,1].map(index=>make('line',{class:'svd-axis','data-axis':index}));
  const ticks=[-3,-1,1,3].map(value=>({line:make('line',{class:'svd-axis','data-tick':value}),label:label(String(value),'svd-muted',{'font-size':12})}));
  const origin=make('circle',{class:'svd-origin',r:2.5,'data-origin':''});
  const fullGhost=make('path',{class:'svd-ghost','data-full-ghost':''});
  const outline=make('path',{class:'svd-outline','data-outline':''});
  const rays=[0,1].map(index=>make('line',{class:'svd-ray','data-ray':index}));
  const markers=[0,1].map(index=>{
    const node=make('g',{'data-marker':index});
    if(index===0)make('circle',{r:5.5,class:'svd-marker','data-marker-shape':'circle'},'',node);
    else make('polygon',{points:'0,-6.5 6.5,0 0,6.5 -6.5,0',class:'svd-marker','data-marker-shape':'diamond'},'',node);
    return node;
  });
  const markerLabels=[0,1].map(index=>label('', 'svd-input',{'data-marker-label':index}));
  const stretches=[0,1].map(index=>label('', '',{'data-stretch-label':index,'data-value':`stretch-${index}`,'font-size':14}));
  const errorRay=make('line',{class:'svd-error-ray','data-error-ray':''});
  const omittedMarker=make('polygon',{points:'0,-5 5,0 0,5 -5,0',class:'svd-omitted-marker','data-omitted-marker':''});
  const errorLabel=label('', 'svd-error-label',{'data-error-label':'','data-value':'error','font-size':14});
  const footer=label('', 'svd-muted',{'data-footer':'','font-size':12});
  const rulerLabel=label('equal units · fixed ruler','svd-muted',{'data-ruler-label':'','font-size':12});
  let width=713,lastTime=0,reduced=false;
  function measure(){width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));root.dataset.layout=width<520?'narrow':'wide';}
  const number=value=>Number(value.toFixed(6)).toString();
  function render(time,reducedMotion){
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage}=state;
    const rulerExtent=Math.max(1,fixture.singularValues[0])+.4;
    const unit=Math.min(46,(width-40)/(2*rulerExtent)),center=[width/2,184],extent=rulerExtent*unit;
    const screen=point=>[pixel(center[0]+unit*point[0]),pixel(center[1]-unit*point[1])];
    const path=points=>points.map((point,index)=>{const p=screen(point);return`${index?'L':'M'} ${p[0]} ${p[1]}`;}).join(' ')+' Z';
    const complete=state.outputProgress===1;
    Object.assign(root.dataset,{
      stage:String(stage),currentMap:JSON.stringify(state.currentMap),fullMap:JSON.stringify(state.fullMap),rankOneMap:JSON.stringify(state.rankOneMap),
      markerInputs:JSON.stringify(state.markerInputs),markerOutputs:JSON.stringify(state.markerOutputs),fullMarkerOutputs:JSON.stringify(state.fullMarkerOutputs),
      currentScales:JSON.stringify(state.currentScales),rank:String(state.rank),operatorError:String(state.operatorError),frobeniusError:String(state.frobeniusError),
      discardedScale:String(state.discardedScale),origin:JSON.stringify(center),pixelsPerUnit:String(unit),rulerExtent:String(rulerExtent),
      rotationProgress:String(state.rotationProgress),stretchProgress:String(state.stretchProgress),outputProgress:String(state.outputProgress),truncationProgress:String(state.truncationProgress),
      markersVisible:String(state.markersVisible),stretchesVisible:String(state.stretchesVisible),ghostVisible:String(state.ghostVisible),errorVisible:String(state.errorVisible)
    });
    root.classList.toggle('svd-complete-map',complete);
    svg.setAttribute('viewBox',`0 0 ${width} 394`);
    svg.setAttribute('aria-label',`${names[stage]}. A circle and diamond track the two input singular directions.${stage>=4?` Full-map semiaxis lengths ${fixture.singularValues.map(number).join(' and ')}.`:''}${stage>=6?' The second marked direction maps to zero.':''}${stage>=7?` The omitted length, operator error, and Frobenius error are each ${number(state.operatorError)}.`:''}`);
    attrs(heading,{x:center[0],y:20});heading.textContent=stage===0?'unit circle':stage===1?'input directions':stage===2?'after input alignment':stage===3?'after separate stretches':stage<=5?'full map':'one retained direction';
    attrs(axes[0],{x1:center[0]-extent,y1:center[1],x2:center[0]+extent,y2:center[1]});
    attrs(axes[1],{x1:center[0],y1:center[1]-extent,x2:center[0],y2:center[1]+extent});
    attrs(origin,{cx:center[0],cy:center[1]});
    ticks.forEach(tick=>{
      const value=Number(tick.line.dataset.tick),x=center[0]+unit*value;
      attrs(tick.line,{x1:x,y1:center[1]-3,x2:x,y2:center[1]+3});attrs(tick.label,{x,y:center[1]+18});
      show(tick.line,Math.abs(value)<rulerExtent);show(tick.label,Math.abs(value)<rulerExtent);
    });
    attrs(outline,{d:path(state.imagePoints)});attrs(fullGhost,{d:path(state.fullImagePoints)});show(fullGhost,state.ghostVisible);
    state.markerOutputs.forEach((point,index)=>{
      const p=screen(point),length=Math.hypot(...point),normal=length>1e-10?[point[0]/length,point[1]/length]:[0,-1];
      attrs(rays[index],{x1:center[0],y1:center[1],x2:p[0],y2:p[1]});
      attrs(markers[index],{transform:`translate(${p[0]} ${p[1]})`,'data-position':JSON.stringify(p)});
      show(rays[index],state.markersVisible);show(markers[index],state.markersVisible);
      // Labels retain the source direction's identity. A stretched tip is not a
      // unit singular vector, and intermediate reveals are not the final Ax yet.
      markerLabels[index].textContent=stage>=6&&index===1?'v₂ → 0':`${state.rotationProgress>0?'from ':''}v${index===0?'₁':'₂'}`;
      let lx=p[0]+14*normal[0],ly=p[1]-14*normal[1]+4,anchor='middle';
      // Use a conservative glyph-width allowance without measuring on every
      // frame. At an edge, put the label above the tip, anchored into the pane.
      const halfLabel=Array.from(markerLabels[index].textContent).length*7.5/2;
      if(lx+halfLabel>width-10){lx=Math.min(width-10,p[0]+12);ly=p[1]-12;anchor='end';}
      else if(lx-halfLabel<10){lx=Math.max(10,p[0]-12);ly=p[1]-12;anchor='start';}
      attrs(markerLabels[index],{x:lx,y:ly,'text-anchor':anchor,class:complete?'svd-output':'svd-input'});
      show(markerLabels[index],state.markersVisible);
      const mid=[(center[0]+p[0])/2,(center[1]+p[1])/2],side=index===0?-1:1;
      attrs(stretches[index],{x:mid[0]+side*12*normal[1],y:mid[1]+side*12*normal[0]+4});
      stretches[index].textContent=number(state.currentScales[index]);
      show(stretches[index],state.stretchesVisible&&!(stage>=6&&index===1));
    });
    const omitted=screen(state.fullMarkerOutputs[1]);
    attrs(errorRay,{x1:omitted[0],y1:omitted[1],x2:center[0],y2:center[1]});
    attrs(omittedMarker,{transform:`translate(${omitted[0]} ${omitted[1]})`});
    const normal=transpose(state.U)[1];
    attrs(errorLabel,{x:(omitted[0]+center[0])/2-20*normal[1],y:(omitted[1]+center[1])/2-20*normal[0]-5});
    errorLabel.textContent=`error ${number(state.operatorError)}`;
    [errorRay,omittedMarker,errorLabel].forEach(node=>show(node,state.errorVisible));
    attrs(footer,{x:center[0],y:365});footer.textContent=stage>=6?'diamond: second direction → zero':stage>=5?'dashed: full ellipse':'circle: direction 1 · diamond: direction 2';
    attrs(rulerLabel,{x:center[0],y:385});
    formula.classList.toggle('svd-factors-shown',stage>=1);
    formula.classList.toggle('svd-rank-shown',stage>=5);
    formula.classList.toggle('svd-error-shown',stage>=7);
    formula.classList.toggle('svd-input-lit',stage===1||stage===2);
    formula.classList.toggle('svd-stretch-lit',stage===2||stage===3);
    formula.classList.toggle('svd-output-lit',stage===3||stage===4);
    formula.classList.toggle('svd-truncate-lit',stage===5||stage===6);
    formula.classList.toggle('svd-error-lit',stage>=7);
    if(caption.textContent!==captions[stage])caption.textContent=captions[stage];
    return`${names[stage]}.${stage>=4?` Semiaxes ${fixture.singularValues.map(number).join(' and ')}.`:''}${stage>=7?` Omitted length ${number(state.operatorError)}.`:''}`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  measure();window.BookPlayback(root,render,()=>{measure();render(lastTime,reduced);});typeset();
})();
