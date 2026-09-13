(() => {
  const root=document.getElementById('same-subspace-excerpt');
  if (!root||root.dataset.ready) return;
  const $=selector=>root.querySelector(selector);
  // These are drawing coordinates for the manuscript's general identity, not data
  // from a fitted model. Work in the original orthonormal chart of the fixed plane.
  const fixture={basis:JSON.parse(root.dataset.basis),input:JSON.parse(root.dataset.input),turnDegrees:Number(root.dataset.turnDegrees)};
  const dot=(a,b)=>a.reduce((sum,value,index)=>sum+value*b[index],0);
  const transpose=a=>a[0].map((_,column)=>a.map(row=>row[column]));
  const multiply=(a,b)=>a.map(row=>transpose(b).map(column=>dot(row,column)));
  const apply=(a,x)=>a.map(row=>dot(row,x));
  const add=(a,b)=>a.map((value,index)=>value+b[index]);
  function validate(source) {
    const {basis,input,turnDegrees}=source;
    if (!Array.isArray(basis)||basis.length<2||!basis.every(row=>Array.isArray(row)&&row.length===2&&row.every(Number.isFinite))
        ||!Array.isArray(input)||input.length!==basis.length||!input.every(Number.isFinite)||!Number.isFinite(turnDegrees))
      throw Error('same-subspace: a finite d-by-2 basis and matching input are required');
    const gram=multiply(transpose(basis),basis);
    if (gram.some((row,i)=>row.some((value,j)=>Math.abs(value-(i===j?1:0))>1e-10)))
      throw Error('same-subspace: the drawing basis must have orthonormal columns');
  }
  validate(fixture);
  const pane=$('[data-pane]'),figure=$('[data-figure]'),svg=figure.querySelector('svg');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration=Number(pane.dataset.duration),stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const ease=value=>{const u=Math.max(0,Math.min(1,value));return u*u*(3-2*u);};
  function buildState(time,reducedMotion=false,source=fixture) {
    validate(source);
    const clamped=Math.max(0,Math.min(duration,Number.isFinite(time)?time:0)),stage=stageAt(clamped);
    const held=reducedMotion?beats[stage]:clamped;
    // Each turn lands before the following caption's hold. Reduced motion reads
    // the same finished geometry at each beat, with no intra-beat changes.
    const turn=.5*ease((held-12)/3)+.5*ease((held-17)/3);
    const angle=turn*source.turnDegrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
    const Q=[[c,-s],[s,c]],basis=source.basis,z=apply(transpose(basis),source.input);
    const rotatedBasis=multiply(basis,Q),coordinates=apply(transpose(Q),z);
    const components=transpose(rotatedBasis).map((column,index)=>column.map(value=>value*coordinates[index]));
    const reconstruction=add(components[0],components[1]);
    const projector=multiply(rotatedBasis,transpose(rotatedBasis));
    const referenceProjector=multiply(basis,transpose(basis));
    const chartBasis=multiply(transpose(basis),rotatedBasis);
    const chartComponents=components.map(component=>apply(transpose(basis),component));
    const chartPoint=apply(transpose(basis),reconstruction);
    return {stage,time:clamped,held,angle,Q,basis,z,rotatedBasis,coordinates,components,reconstruction,
      projector,referenceProjector,chartBasis,chartComponents,chartPoint,
      basisVisible:stage>=1,projectionsVisible:stage>=2,ghostVisible:Math.abs(angle)>1e-12,decodeVisible:stage>=5};
  }
  // Pure arithmetic entry point for independent geometry/identity tests. Nothing
  // outside this player needs the API to load or operate the scene.
  window.BookSameSubspace=Object.freeze({buildState});
  const captions=[
    'If the coordinate axes turn, must the reconstructed point move?',
    'These axes name directions inside one fixed reconstruction plane.',
    'Read the coordinates by projecting onto the axes. Then turn the basis.',
    'The basis changes. The encoder must report coordinates in that new basis.',
    'Different coordinate projections still describe the same reconstructed point.',
    'Add the new coordinate-weighted basis vectors. They meet at the same reconstruction.',
    'The two basis changes cancel. The projector is unchanged.',
    'Compare reconstruction projectors, not the individual coordinates or basis columns.'
  ];
  const names=['Predict','Choose a basis','Read coordinates','Turn the basis','Read new coordinates','Decode','Cancel the basis change','Compare projectors'];
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'),formula=$('[data-formula]'),caption=$('[data-caption]');
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  const make=(tag,attributes,text='')=>{
    const node=document.createElementNS(NS,tag);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    node.textContent=text;drawing.appendChild(node);return node;
  };
  const attrs=(node,values)=>{for(const [key,value]of Object.entries(values))node.setAttribute(key,String(value));};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(value,cls='',extra={})=>make('text',{'font-size':13,'text-anchor':'middle',class:cls,...extra},value);
  const plane=make('circle',{class:'ss-plane','data-plane':''});
  const heading=label(`${fixture.basis[0].length} axes · same subspace · schematic`,'ss-muted',{'data-context':'','data-value':'dimension','font-size':12});
  const ghosts=[0,1].map(index=>make('line',{class:'ss-ghost','data-ghost-axis':index}));
  const axes=[0,1].map(index=>make('path',{class:'ss-axis','data-axis':index}));
  const axisLabels=[0,1].map(index=>label('', '',{'data-axis-label':index}));
  const drops=[0,1].map(index=>make('line',{class:'ss-projection','data-projection':index}));
  const feet=[0,1].map(index=>make('circle',{class:'ss-foot',r:3.5,'data-foot':index}));
  const coordinates=[0,1].map(index=>label('', 'ss-input',{'data-coordinate-label':index}));
  const components=[0,1].map(index=>make('path',{class:'ss-component','data-component':index}));
  const decodePath=make('path',{class:'ss-link','data-decode-path':''});
  const origin=make('circle',{class:'ss-origin',r:2.6,'data-origin':''});
  const point=make('circle',{class:'ss-point',r:6.5,'data-point':''});
  const pointLabel=label('reconstruction','ss-prediction',{'data-point-label':'','font-size':13,'text-anchor':'start'});
  const mapLabel=label('', '',{'data-map-label':'','font-size':14});
  const routeLabel=label('', 'ss-input',{'data-route-label':'','font-size':12});
  const ghostLabel=label('dashed: original axes','ss-muted',{'data-ghost-label':'','font-size':12});
  let width=713,lastTime=0,reduced=false;
  function measure() {width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));root.dataset.layout=width<520?'narrow':'wide';}
  const arrow=(from,to,size=5)=>{
    const dx=to[0]-from[0],dy=to[1]-from[1],length=Math.hypot(dx,dy);
    if(length<1e-10)return `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`;
    const ux=dx/length,uy=dy/length,back=[to[0]-size*ux,to[1]-size*uy];
    return `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]} M ${back[0]-size*.55*uy} ${back[1]+size*.55*ux} L ${to[0]} ${to[1]} L ${back[0]+size*.55*uy} ${back[1]-size*.55*ux}`;
  };
  function render(time,reducedMotion) {
    lastTime=time;reduced=reducedMotion;
    const state=buildState(time,reducedMotion),{stage}=state,narrow=width<520;
    const center=[narrow?width/2:width*.38,179],radius=narrow?Math.min(112,width/2-23):146;
    const unit=radius*1.12,axisExtent=radius*.86;
    const screen=p=>[center[0]+unit*p[0],center[1]-unit*p[1]];
    const pxPoint=screen(state.chartPoint),chartAxes=transpose(state.chartBasis),turned=Math.abs(state.angle)>1e-12;
    const footPoints=state.chartComponents.map(screen),decodeCorner=footPoints[0];
    Object.assign(root.dataset,{
      stage:String(stage),angle:String(state.angle),rotation:JSON.stringify(state.Q),coordinates:JSON.stringify(state.coordinates),
      originalCoordinates:JSON.stringify(state.z),rotatedBasis:JSON.stringify(state.rotatedBasis),
      components:JSON.stringify(state.components),reconstruction:JSON.stringify(state.reconstruction),
      projector:JSON.stringify(state.projector),referenceProjector:JSON.stringify(state.referenceProjector),
      chartBasis:JSON.stringify(state.chartBasis),chartPoint:JSON.stringify(state.chartPoint),chartComponents:JSON.stringify(state.chartComponents),
      origin:JSON.stringify(center),pixelsPerUnit:String(unit),axisExtent:String(axisExtent),
      projectionsVisible:String(state.projectionsVisible),decodeVisible:String(state.decodeVisible)
    });
    svg.setAttribute('viewBox',`0 0 ${width} 366`);
    svg.setAttribute('aria-label',`Schematic view inside a fixed two-dimensional subspace. ${names[stage]}. ${stage>=4?'The new coordinates and basis reconstruct the same point.':'A fixed point is described using orthonormal coordinate axes.'}`);
    attrs(plane,{cx:center[0],cy:center[1],r:radius});attrs(heading,{x:width/2,y:20});
    attrs(origin,{cx:center[0],cy:center[1]});attrs(point,{cx:pxPoint[0],cy:pxPoint[1]});
    attrs(pointLabel,{x:pxPoint[0]+9,y:pxPoint[1]-11,'text-anchor':narrow?'end':'start'});
    pointLabel.textContent=stage>=4?'same reconstruction':'reconstruction';
    chartAxes.forEach((axis,index)=>{
      const negative=[center[0]-axisExtent*axis[0],center[1]+axisExtent*axis[1]];
      const positive=[center[0]+axisExtent*axis[0],center[1]-axisExtent*axis[1]];
      attrs(axes[index],{d:arrow(negative,positive),'data-start':JSON.stringify(negative),'data-end':JSON.stringify(positive)});
      show(axes[index],state.basisVisible);
      const original=index===0?[1,0]:[0,1];
      attrs(ghosts[index],{x1:center[0]-axisExtent*original[0],y1:center[1]+axisExtent*original[1],x2:center[0]+axisExtent*original[0],y2:center[1]-axisExtent*original[1]});
      show(ghosts[index],state.ghostVisible);
      attrs(axisLabels[index],{x:positive[0]+axis[0]*12,y:positive[1]-axis[1]*12+4});
      axisLabels[index].textContent=turned?`v′${index===0?'₁':'₂'}`:`v${index===0?'₁':'₂'}`;
      show(axisLabels[index],state.basisVisible);
      const foot=footPoints[index];
      attrs(drops[index],{x1:pxPoint[0],y1:pxPoint[1],x2:foot[0],y2:foot[1]});
      attrs(feet[index],{cx:foot[0],cy:foot[1]});
      const midpoint=[(center[0]+foot[0])/2,(center[1]+foot[1])/2],offset=index===0?14:-14;
      attrs(coordinates[index],{x:midpoint[0]+axis[1]*offset,y:midpoint[1]+axis[0]*offset+4});
      coordinates[index].textContent=turned?`z′${index===0?'₁':'₂'}`:`z${index===0?'₁':'₂'}`;
      [drops[index],feet[index],coordinates[index]].forEach(node=>show(node,state.projectionsVisible));
      const start=index===0?center:decodeCorner,end=index===0?decodeCorner:pxPoint;
      attrs(components[index],{d:arrow(start,end,5),'data-start':JSON.stringify(start),'data-end':JSON.stringify(end)});
      show(components[index],state.decodeVisible);
    });
    const noteX=narrow?width/2:width*.80,noteY=narrow?318:144;
    attrs(mapLabel,{x:noteX,y:noteY});mapLabel.textContent=stage>=7?'same projector':stage>=6?'basis changes cancel':stage>=5?'decode':stage>=3?'basis VQ':stage>=1?'basis V':'';
    attrs(routeLabel,{x:noteX,y:noteY+23});routeLabel.textContent=stage>=5?'add the two components':stage>=3?'new coordinates':stage>=2?'read both projections':'';
    const routeStart=narrow?[noteX,294]:[noteX-55,noteY+6],routeEnd=narrow?[decodeCorner[0],278]:[pxPoint[0]+17,pxPoint[1]+15];
    attrs(decodePath,{d:arrow(routeStart,routeEnd,4)});show(decodePath,state.decodeVisible&&!narrow);
    attrs(ghostLabel,{x:narrow?width/2:noteX,y:narrow?362:noteY+51});show(ghostLabel,state.ghostVisible);
    formula.classList.toggle('ss-encoder-shown',stage>=3);
    formula.classList.toggle('ss-decoder-shown',stage>=5);
    formula.classList.toggle('ss-projector-shown',stage>=6);
    formula.classList.toggle('ss-encoder-lit',stage===3||stage===4);
    formula.classList.toggle('ss-decoder-lit',stage===5);
    formula.classList.toggle('ss-projector-lit',stage>=6);
    if(caption.textContent!==captions[stage])caption.textContent=captions[stage];
    return `${names[stage]}. Schematic basis change.${stage>=4?' Reconstruction unchanged.':''}`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  measure();window.BookPlayback(root,render,()=>{measure();render(lastTime,reduced);});typeset();
})();
