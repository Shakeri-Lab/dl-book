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
  (({basis,input,turnDegrees})=>{
    if (!Array.isArray(basis)||basis.length<2||!basis.every(row=>Array.isArray(row)&&row.length===2&&row.every(Number.isFinite))
        ||!Array.isArray(input)||input.length!==basis.length||!input.every(Number.isFinite)||!Number.isFinite(turnDegrees))
      throw Error('same-subspace: a finite d-by-2 basis and matching input are required');
    if (multiply(transpose(basis),basis).some((row,i)=>row.some((value,j)=>Math.abs(value-(i===j?1:0))>1e-10)))
      throw Error('same-subspace: the drawing basis must have orthonormal columns');
  })(fixture);
  const pane=$('[data-pane]'),figure=$('[data-figure]'),svg=figure.querySelector('svg');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number);
  const duration=Number(pane.dataset.duration),stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const ease=value=>{const u=Math.max(0,Math.min(1,value));return u*u*(3-2*u);};
  // Fixture-only quantities are computed once. Everything that turns is a function
  // of the angle alone, so a held angle reuses the state it already has.
  const V=fixture.basis,Vt=transpose(V),z=apply(Vt,fixture.input),fullTurn=fixture.turnDegrees*Math.PI/180;
  let last=null;
  function stateAt(angle) {
    if (last&&last.angle===angle) return last;
    const c=Math.cos(angle),s=Math.sin(angle),Q=[[c,-s],[s,c]];
    // The manuscript's convention: the basis becomes VQ, the encoder gives Q^T z,
    // and the decoder adds the new coordinate-weighted columns of VQ.
    const rotatedBasis=multiply(V,Q),coordinates=apply(transpose(Q),z);
    const components=transpose(rotatedBasis).map((column,index)=>column.map(value=>value*coordinates[index]));
    const reconstruction=add(components[0],components[1]);
    return last={angle,turned:Math.abs(angle)>1e-12,rotatedBasis,coordinates,components,
      chartAxes:transpose(multiply(Vt,rotatedBasis)),chartComponents:components.map(component=>apply(Vt,component)),
      chartPoint:apply(Vt,reconstruction)};
  }
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
  // Drawing coordinates are serialised at 0.0001 px, so a last-bit difference between
  // math libraries cannot change the byte-compared static print. The state is never rounded.
  const px=value=>String(Number(value.toFixed(4)));
  const attrs=(node,values)=>{for(const [key,value] of Object.entries(values))node.setAttribute(key,typeof value==='number'?px(value):value);};
  const make=(tag,attributes,text='')=>{
    const node=document.createElementNS(NS,tag);
    attrs(node,attributes);node.textContent=text;drawing.appendChild(node);return node;
  };
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const write=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  const label=(value,cls='',extra={})=>make('text',{'font-size':13,'text-anchor':'middle',class:cls,...extra},value);
  const subscripts=['₁','₂'];
  const plane=make('circle',{class:'ss-plane','data-plane':''});
  const heading=label(`${V[0].length} axes · same subspace · schematic`,'ss-muted',{'data-context':'','data-value':'dimension','font-size':12});
  const ghosts=[0,1].map(index=>make('line',{class:'ss-ghost','data-ghost-axis':index}));
  // Drawn beneath the axes and their haloed labels, so a tip that sweeps past masks the leader.
  const leader=make('line',{class:'ss-leader','data-point-leader':''});
  const axes=[0,1].map(index=>make('path',{class:'ss-axis','data-axis':index}));
  const axisLabels=[0,1].map(index=>label('', '',{'data-axis-label':index}));
  const drops=[0,1].map(index=>make('line',{class:'ss-projection','data-projection':index}));
  const feet=[0,1].map(index=>make('circle',{class:'ss-foot',r:3.5,'data-foot':index}));
  const coordinates=[0,1].map(index=>label('', 'ss-input',{'data-coordinate-label':index}));
  const components=[0,1].map(index=>make('path',{class:'ss-component','data-component':index}));
  const decodePath=make('path',{class:'ss-link','data-decode-path':''});
  const origin=make('circle',{class:'ss-origin',r:2.6,'data-origin':''});
  const point=make('circle',{class:'ss-point',r:6.5,'data-point':''});
  const pointLabel=label('reconstruction','ss-prediction',{'data-point-label':''});
  const mapLabel=label('', '',{'data-map-label':'','font-size':14});
  const routeLabel=label('', 'ss-input',{'data-route-label':'','font-size':12});
  const ghostLabel=label('dashed: original axes','ss-muted',{'data-ghost-label':'','font-size':12});
  root.dataset.originalCoordinates=JSON.stringify(z);
  let width=713,narrow=false,center=[0,0],unit=0,axisExtent=0,note=[0,0],shown={},lastTime=0,reduced=false;
  // Everything here depends on the pane width alone: it is laid out once per resize.
  function layout() {
    const measured=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    if (measured===width&&unit) return;
    width=measured;narrow=width<520;
    const radius=narrow?Math.min(112,width/2-23):146;
    center=[narrow?width/2:width*.38,179];unit=radius*1.12;axisExtent=radius*.86;
    note=narrow?[width/2,318]:[width*.80,144];
    Object.assign(root.dataset,{layout:narrow?'narrow':'wide',origin:JSON.stringify(center),pixelsPerUnit:String(unit),axisExtent:String(axisExtent)});
    svg.setAttribute('viewBox',`0 0 ${width} 366`);
    attrs(plane,{cx:center[0],cy:center[1],r:radius});attrs(heading,{x:width/2,y:20});
    attrs(origin,{cx:center[0],cy:center[1]});
    ghosts.forEach((ghost,index)=>{
      const reach=index===0?[axisExtent,0]:[0,axisExtent];
      attrs(ghost,{x1:center[0]-reach[0],y1:center[1]+reach[1],x2:center[0]+reach[0],y2:center[1]-reach[1]});
    });
    attrs(mapLabel,{x:note[0],y:note[1]});attrs(routeLabel,{x:note[0],y:note[1]+23});
    attrs(ghostLabel,{x:note[0],y:narrow?362:note[1]+51});
    shown={};
  }
  const arrow=(from,to,size=5)=>{
    const dx=to[0]-from[0],dy=to[1]-from[1],length=Math.hypot(dx,dy);
    const shaft=`M ${px(from[0])} ${px(from[1])} L ${px(to[0])} ${px(to[1])}`;
    if(length<1e-10)return shaft;
    const ux=dx/length,uy=dy/length,back=[to[0]-size*ux,to[1]-size*uy];
    return `${shaft} M ${px(back[0]-size*.55*uy)} ${px(back[1]+size*.55*ux)} L ${px(to[0])} ${px(to[1])} L ${px(back[0]+size*.55*uy)} ${px(back[1]-size*.55*ux)}`;
  };
  // The point `gap` pixels from `from`, on the way to `to`.
  const toward=(from,to,gap)=>{
    const length=Math.hypot(to[0]-from[0],to[1]-from[1])||1;
    return [from[0]+gap*(to[0]-from[0])/length,from[1]+gap*(to[1]-from[1])/length];
  };
  // Geometry: redrawn only when the angle or the layout changes.
  function draw(state) {
    const screen=p=>[center[0]+unit*p[0],center[1]-unit*p[1]];
    const at=screen(state.chartPoint),footPoints=state.chartComponents.map(screen),corner=footPoints[0];
    Object.assign(root.dataset,{angle:String(state.angle),coordinates:JSON.stringify(state.coordinates),
      rotatedBasis:JSON.stringify(state.rotatedBasis),components:JSON.stringify(state.components)});
    attrs(point,{cx:at[0],cy:at[1]});
    // The axis tips sweep the ring just outside the point, so its label sits above the
    // plane on a short leader: clear of every axis position at both widths.
    const top=[at[0]+20,53],start=toward(at,top,9);
    attrs(leader,{x1:start[0],y1:start[1],x2:top[0],y2:top[1]});
    attrs(pointLabel,narrow?{x:Math.min(width-6,at[0]+62),y:46,'text-anchor':'end'}:{x:at[0]+8,y:46,'text-anchor':'start'});
    state.chartAxes.forEach((axis,index)=>{
      const negative=[center[0]-axisExtent*axis[0],center[1]+axisExtent*axis[1]];
      const positive=[center[0]+axisExtent*axis[0],center[1]-axisExtent*axis[1]];
      attrs(axes[index],{d:arrow(negative,positive)});
      attrs(axisLabels[index],{x:positive[0]+axis[0]*12,y:positive[1]-axis[1]*12+4});
      const foot=footPoints[index];
      attrs(drops[index],{x1:at[0],y1:at[1],x2:foot[0],y2:foot[1]});
      attrs(feet[index],{cx:foot[0],cy:foot[1]});
      const midpoint=[(center[0]+foot[0])/2,(center[1]+foot[1])/2],offset=index===0?14:-14;
      attrs(coordinates[index],{x:midpoint[0]+axis[1]*offset,y:midpoint[1]+axis[0]*offset+4});
      attrs(components[index],{d:index===0?arrow(center,corner):arrow(corner,at)});
    });
    if (narrow) decodePath.removeAttribute('d');
    else attrs(decodePath,{d:arrow([note[0]-78,note[1]+6],[at[0]+17,at[1]+15],4)});
  }
  // Words and visibility: rewritten only when the beat changes or the basis starts to turn.
  // The primes, the dashed reference and the side label all follow the same `turned` flag.
  function reveal(stage,turned) {
    root.dataset.stage=String(stage);
    svg.setAttribute('aria-label',`Schematic view inside a fixed two-dimensional subspace. ${names[stage]}. ${stage>=4?'The new coordinates and basis reconstruct the same point.':'A fixed point is described using orthonormal coordinate axes.'}`);
    write(pointLabel,stage>=4?'same reconstruction':'reconstruction');
    const prime=turned?'′':'';
    [0,1].forEach(index=>{
      write(axisLabels[index],`v${prime}${subscripts[index]}`);write(coordinates[index],`z${prime}${subscripts[index]}`);
      [axes[index],axisLabels[index]].forEach(node=>show(node,stage>=1));
      [drops[index],feet[index],coordinates[index]].forEach(node=>show(node,stage>=2));
      show(components[index],stage>=5);show(ghosts[index],turned);
    });
    show(ghostLabel,turned);show(decodePath,stage>=5&&!narrow);
    write(mapLabel,stage>=7?'same projector':stage>=6?'basis changes cancel':stage>=5?'decode':stage<1?'':turned?'turned basis':'original basis');
    write(routeLabel,stage>=5?'add the two components':stage<2?'':turned?'new coordinates':'read both projections');
    formula.classList.toggle('ss-encoder-shown',stage>=3);
    formula.classList.toggle('ss-decoder-shown',stage>=5);
    formula.classList.toggle('ss-projector-shown',stage>=6);
    formula.classList.toggle('ss-encoder-lit',stage===3||stage===4);
    formula.classList.toggle('ss-decoder-lit',stage===5);
    formula.classList.toggle('ss-projector-lit',stage>=6);
    write(caption,captions[stage]);
  }
  function render(time,reducedMotion) {
    lastTime=time;reduced=reducedMotion;
    const clamped=Math.max(0,Math.min(duration,Number.isFinite(time)?time:0)),stage=stageAt(clamped);
    // Each turn lands before the following caption's hold. Reduced motion reads
    // the same finished geometry at each beat, with no intra-beat changes.
    const clock=reducedMotion?beats[stage]:clamped;
    const state=stateAt((.5*ease((clock-12)/3)+.5*ease((clock-17)/3))*fullTurn);
    if (state!==shown.state) draw(state);
    if (stage!==shown.stage||state.turned!==shown.turned) reveal(stage,state.turned);
    shown={state,stage,turned:state.turned};
    return `${names[stage]}. Schematic basis change.${stage>=4?' Reconstruction unchanged.':''}`;
  }
  function typeset(){
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if(mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container'))mathjax.typesetPromise([root]).then(done,done);
    else done();
  }
  layout();window.BookPlayback(root,render,()=>{layout();render(lastTime,reduced);});typeset();
})();
