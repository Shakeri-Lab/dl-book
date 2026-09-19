(() => {
  const root=document.getElementById('momentum-memory-excerpt');
  if (!root||root.dataset.ready) return;
  const $=selector=>root.querySelector(selector);
  const declared=name=>root.dataset[name].trim().split(/\s+/).map(Number);
  // The fixture lives in exactly one place in this repository: the panel's data-*
  // attributes. The mechanism is the chapter's (chapters/part1/04-training-loss-sgd.qmd:
  // 330-345): the velocity is a running sum of gradients, so components that keep their
  // sign build while components that flip sign cancel. The valley, the start, the step
  // length and the particular beta are this panel's declared computed variant; beta sits
  // at the low end of the chapter's printed range.
  const [curveAcross,curveAlong]=declared('curvature');
  const [startAcross,startAlong]=declared('start');
  const alpha=Number(root.dataset.rate), beta=Number(root.dataset.beta);
  const steps=Number(root.dataset.steps);
  const levels=declared('levels');
  const [sLo,sHi,aLo,aHi]=declared('window');
  const [railLo,railHi]=declared('rail');
  const leg=Number(root.dataset.leg);
  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number), duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=value=>Math.max(0,Math.min(1,value));

  // --- The scene's arithmetic, all of it derived from the declared fixture -------------
  // A separable quadratic valley: L(w) = (curveAcross*across^2 + curveAlong*along^2)/2,
  // so the gradient is (curveAcross*across, curveAlong*along) and the two directions never
  // mix. That is what lets one velocity component be watched against the other.
  const gradient=w=>[curveAcross*w[0],curveAlong*w[1]];
  const lossOf=w=>(curveAcross*w[0]*w[0]+curveAlong*w[1]*w[1])/2;
  // One loop, run twice: plain SGD is the same recursion with no memory kept at all.
  function walk(memory) {
    let w=[startAcross,startAlong], v=[0,0];
    const path=[[...w]], grads=[], velocities=[];
    for (let t=0;t<steps;t++) {
      const g=gradient(w);
      v=[memory*v[0]+g[0],memory*v[1]+g[1]];
      grads.push(g); velocities.push([...v]);
      w=[w[0]-alpha*v[0],w[1]-alpha*v[1]];
      path.push([...w]);
    }
    return {path,grads,velocities};
  }
  const plain=walk(0), heavy=walk(beta);
  const firstGradient=gradient([startAcross,startAlong]);
  // The running sum written out: v(t) = sum_j memory^(t-j) g(j). The chain on each rail
  // draws exactly those terms, head to tail, so its tip is the velocity by construction.
  // With no memory the sum has one term, which is why plain SGD's rail carries one link.
  const linksAfter=(run,memory,count,axis)=>memory===0
    ? (count?[run.grads[count-1][axis]]:[])
    : run.grads.slice(0,count).map((g,j)=>memory**(count-1-j)*g[axis]);
  const outerLevel=lossOf([startAcross,startAlong]);

  // One act of the scene: the declared loop played out in the recursion's own order.
  // Inside each step the running sum first shrinks by the memory, then this step's
  // gradient is added to its tip, and only then does the iterate move by minus alpha v.
  // Plain SGD is this same function with memory 0: the one term collapses to nothing
  // before the next arrives, which is what "no memory" looks like.
  function play(run,memory,from,perStep,held) {
    const raw=clamp((held-from)/(perStep*steps))*steps;
    const finished=raw>=steps;
    const done=finished?steps:Math.floor(raw+1e-9);
    const phase=finished?1:raw-done;
    const shrink=finished?1:1-(1-memory)*clamp(phase/0.36);
    const append=finished?0:clamp((phase-0.36)/0.4);
    const moved=finished?0:clamp((phase-0.76)/0.18);
    const at=lerp(run.path[done],run.path[Math.min(steps,done+1)],moved);
    // Where this step's gradient was measured. It stays behind while the iterate slides
    // off it, and is re-taken the moment the iterate lands, so a resting frame always
    // shows the gradient belonging to the point the iterate is standing on.
    const measured=run.path[moved>=1?Math.min(steps,done+1):done];
    const links=axis=>{
      const kept=shrink>0?linksAfter(run,memory,done,axis).map(value=>value*shrink):[];
      // A term that has not started to arrive is absent, never a zero-length stub.
      return finished||append<=0?kept:kept.concat([run.grads[Math.min(steps-1,done)][axis]*append]);
    };
    return {raw,finished,done,phase,moved,measured,at,links,
      seen:run.path.slice(0,done+1).concat(moved>0?[at]:[])};
  }

  // --- Timeline -----------------------------------------------------------------------
  const SGD_FROM=beats[1], SGD_TO=beats[1]+4.6;
  // The scene answers its own question the instant the second step's term finishes
  // arriving: one sum has collapsed, the other has nearly doubled, and both are on screen.
  const REVEAL_AT=1+0.76;
  const MOM_FROM=beats[3], STEP_SECONDS=(beats[7]-beats[3])/steps;
  // Reduced motion holds one still per beat: the state that beat's caption describes,
  // which for a moving beat is the state it ends in.
  const REST=[3,9.8,13,19.9,24.9,29.9,34.9,38];
  const stageNames=['The valley','Plain SGD','Predict','Shrink, then add',
    'Across cancels','Along stacks','Eight steps','Two paths'];
  // Each sentence is true of its reduced-motion still and of the motion it introduces.
  // None of them answers the question beat 2 asks before beat 3's picture answers it.
  const captions=[
    'A narrow valley: steep across, shallow along. Both gradient components start at exactly ten.',
    'Plain SGD zigzags across the steep direction and inches along the shallow one.',
    'Same start, same step length, now with momentum. Does it speed up both directions?',
    'Each step: shrink the running sum by β, then add this step’s gradient.',
    'Two agreeing steps build the across sum; the next reversal wipes it out.',
    'The along sum peaks above three contributions, then eases as its gradient dies.',
    'Eight steps. The across sum never outgrew one contribution; the along sum tripled it.',
    'Same rule, same step length: one direction cancelled itself, the other stacked up.'
  ];
  // The picture's accessible description grows as the picture does. Its fourth sentence
  // waits for the scene's own reveal, so a screen reader is not told the answer while the
  // caption is still asking for a prediction.
  const descriptions=[
    'A long narrow valley drawn as nested level curves, with one iterate near its far end and the two components of the gradient there drawn as equal legs.',
    ' A zigzag path crosses the steep direction again and again while creeping along the shallow one.',
    ' Two rails below the valley hold the two components of the velocity on one shared scale, with a band marking one contribution.',
    ' Each step lays one more term onto each rail, head to tail, after the terms already there have shrunk.',
    ' On the across rail the terms alternate direction and fold the running sum back onto zero; on the along rail they all point the same way and stack out past the band.',
    ' Both paths are drawn together with their step counts and the distance each has left to the bottom.'
  ];

  // --- Number formatting ---------------------------------------------------------------
  // U+2212 for minus, four decimals while four decimals carry the value, a mantissa and a
  // Unicode power of ten below that. No hyphen-minus and no e-notation anywhere a reader
  // or a screen reader meets one of these numbers.
  const SUPERSCRIPT='⁰¹²³⁴⁵⁶⁷⁸⁹';
  const power=exponent=>`10${exponent<0?'⁻':''}${[...String(Math.abs(exponent))].map(digit=>SUPERSCRIPT[digit]).join('')}`;
  function magnitude(value) {
    if (value===0) return '0';
    if (value>=1e-4) return value.toFixed(4);
    let exponent=Math.floor(Math.log10(value)), mantissa=value/10**exponent;
    if (Number(mantissa.toFixed(1))>=10) {mantissa/=10; exponent+=1;}
    return `${mantissa.toFixed(1)} × ${power(exponent)}`;
  }
  const signed=value=>value===0?'0':`${value<0?'−':''}${magnitude(Math.abs(value))}`;
  const tick=value=>String(value).replace('-','−');
  const whole=value=>String(Math.round(value)).replace('-','−');

  // --- The picture, built once ----------------------------------------------------------
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px so a last-bit difference between math
  // libraries cannot change the byte-compared static print; the state stays exact.
  const px=value=>typeof value==='number'?String(Number(value.toFixed(4))):String(value);
  const attrs=(node,values)=>{for (const [key,value] of Object.entries(values)) node.setAttribute(key,px(value));};
  const make=(tag,values,parent=drawing,content='')=>{
    const node=document.createElementNS(NS,tag);
    attrs(node,values); if (content) node.textContent=content; parent.appendChild(node); return node;
  };
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(content,cls,extra={},parent=drawing)=>make('text',{class:cls,'font-size':12,...extra},parent,content);

  const clip=make('clipPath',{id:'mm-plot-clip'});
  const clipRect=make('rect',{},clip);
  const frame=make('rect',{class:'mm-frame'});
  const rings=levels.map(()=>make('path',{class:'mm-ring','clip-path':'url(#mm-plot-clip)'}));
  const floor=make('line',{class:'mm-floor'});
  const bottomMark=make('path',{class:'mm-bottom'});
  const bottomText=label('bottom','mm-scenery',{'text-anchor':'middle','data-bottom-label':''});
  const acrossTicks=[1,0,-1].map(value=>({value,mark:make('line',{class:'mm-tick'}),
    text:label(tick(value),'mm-axis-label',{'text-anchor':'end'})}));
  const alongTicks=[10,8,6,4,2,0].map(value=>({value,mark:make('line',{class:'mm-tick'}),
    text:label(tick(value),'mm-axis-label',{'text-anchor':'middle'})}));
  const acrossName=label('across (steep)','mm-axis-name',{'text-anchor':'start'});
  const alongName=label('along (shallow) → the bottom','mm-axis-name',{'text-anchor':'middle'});
  const counter=label('·','mm-scenery',{'text-anchor':'end','data-counter':''});
  const sgdPath=make('path',{class:'mm-sgd-path','data-path':'sgd'});
  const momPath=make('path',{class:'mm-mom-path','data-path':'momentum'});
  const legAcross=make('path',{class:'mm-leg','data-leg':'across'});
  const legAlong=make('path',{class:'mm-leg','data-leg':'along'});
  const legAcrossText=label('·','mm-error',{'text-anchor':'middle','font-size':11,'data-leg-label':'across'});
  const legAlongText=label('·','mm-error',{'text-anchor':'middle','font-size':11,'data-leg-label':'along'});
  const iterate=make('path',{class:'mm-iterate','data-iterate':''});
  const sgdName=label('plain SGD','mm-parameter',{'text-anchor':'middle','font-size':11,'data-end-label':'sgd'});
  const momName=label('momentum','mm-parameter',{'text-anchor':'middle','font-size':11,'data-end-label':'momentum'});
  const sgdLeft=label('·','mm-parameter',{'text-anchor':'middle','font-size':11,'data-value':'sgd'});
  const momLeft=label('·','mm-parameter',{'text-anchor':'middle','font-size':11,'data-value':'momentum'});

  // The two rails: the same quantity, one per direction, on one shared scale. Everything
  // above a rail is the running sum written out term by term; the bar on the rail is its
  // tip, which is the velocity component.
  const RAILS=['across','along'];
  const rail=RAILS.map(axis=>{
    const group=make('g',{'data-rail':axis});
    return {axis,group,
      band:make('rect',{class:'mm-band'},group),
      line:make('line',{class:'mm-rail'},group),
      ticks:[-10,0,10,20,30].map(value=>({value,
        mark:make('line',{class:'mm-tick'},group),
        text:label(tick(value),'mm-axis-label',{'text-anchor':'middle','font-size':11},group)})),
      name:label(axis,'mm-axis-name',{'text-anchor':'start','font-size':11},group),
      note:label(axis==='across'?'(steep)':'(shallow)','mm-axis-label',{'text-anchor':'start','font-size':11},group),
      links:Array.from({length:steps},(_,k)=>make('path',{class:'mm-link','data-link':`${axis}-${k}`},group)),
      drop:make('line',{class:'mm-drop'},group),
      bar:make('path',{class:'mm-bar','data-bar':axis},group),
      value:label('·','mm-ink',{'text-anchor':'middle','font-size':12,'data-value':axis},group)};
  });

  let width=713,lastTime=0,reduced=false,g,toX,toY,described;
  const measure=()=>{
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    root.dataset.layout=width<560?'narrow':'wide';
  };

  // Everything that depends only on the fixture and the pane width is placed here, once
  // per width: the valley, its rings and ticks, and the two rails. render() moves only the
  // iterate, the two paths, the gradient legs, the chains and the two bars.
  function layout() {
    const narrow=width<560;
    g=narrow
      ? {narrow,width:296,height:390,plot:{x:44,y:22,w:240,h:130},font:11,
         tickY:166,axisY:181,nameY:14,
         railScale:4.8,railX:48,rails:[258,356],row:7,row0:13,tickDy:25,valueDy:12,nameX:4}
      : {narrow,width:713,height:486,plot:{x:66,y:24,w:620,h:170},font:12,
         tickY:208,axisY:224,nameY:16,
         railScale:8,railX:82,rails:[321,447],row:9,row0:18,tickDy:27,valueDy:14,nameX:6};
    const p=g.plot;
    g.right=p.x+p.w; g.bottom=p.y+p.h;
    g.unitAlong=p.w/(sHi-sLo); g.unitAcross=p.h/(aHi-aLo);
    // The along axis runs the way the iterate travels: the bottom of the valley is at the
    // right, so progress, and every rail's growth, read left to right.
    toX=s=>p.x+(sHi-s)*g.unitAlong;
    toY=a=>g.bottom-(a-aLo)*g.unitAcross;
    g.railZero=g.railX+(0-railLo)*g.railScale;
    svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
    Object.assign(root.dataset,{plotLeft:String(p.x),plotTop:String(p.y),plotRight:String(g.right),
      plotBottom:String(g.bottom),unitAlong:String(g.unitAlong),unitAcross:String(g.unitAcross),
      railZero:String(g.railZero),railScale:String(g.railScale)});
    attrs(clipRect,{x:p.x,y:p.y,width:p.w,height:p.h});
    attrs(frame,{x:p.x,y:p.y,width:p.w,height:p.h});
    // The valley: level curves of the declared quadratic, the outermost one through the
    // declared start. Nested lenses about the bottom, not a contour map of a bowl.
    const RING=96;
    rings.forEach((node,index)=>{
      const level=levels[index];
      const ra=Math.sqrt(2*level/curveAcross), rs=Math.sqrt(2*level/curveAlong);
      const d=Array.from({length:RING},(_,i)=>{
        const angle=2*Math.PI*i/RING;
        return `${i?'L':'M'} ${px(toX(rs*Math.cos(angle)))} ${px(toY(ra*Math.sin(angle)))}`;
      }).join(' ')+' Z';
      attrs(node,{d});
    });
    attrs(floor,{x1:p.x,x2:g.right,y1:toY(0),y2:toY(0)});
    const bx=toX(0), by=toY(0);
    attrs(bottomMark,{d:`M ${px(bx-6)} ${px(by)} H ${px(bx+6)} M ${px(bx)} ${px(by-6)} V ${px(by+6)}`});
    attrs(bottomText,{x:bx,y:by+(g.narrow?32:41),'font-size':g.font});
    acrossTicks.forEach(item=>{
      attrs(item.mark,{x1:p.x-4,x2:p.x,y1:toY(item.value),y2:toY(item.value)});
      attrs(item.text,{x:p.x-8,y:toY(item.value)+4,'font-size':g.font});
    });
    alongTicks.forEach(item=>{
      attrs(item.mark,{x1:toX(item.value),x2:toX(item.value),y1:g.bottom,y2:g.bottom+4});
      attrs(item.text,{x:toX(item.value),y:g.tickY,'font-size':g.font});
    });
    attrs(acrossName,{x:p.x,y:g.nameY,'font-size':g.font});
    attrs(alongName,{x:p.x+p.w/2,y:g.axisY,'font-size':g.font});
    attrs(counter,{x:g.right,y:g.nameY,'font-size':g.font});
    rail.forEach((r,index)=>{
      const y=g.rails[index], railToX=v=>g.railZero+v*g.railScale;
      r.y=y; r.toX=railToX;
      attrs(r.line,{x1:g.railX,x2:g.railX+(railHi-railLo)*g.railScale,y1:y,y2:y});
      attrs(r.band,{x:railToX(-10),y:y-8,width:20*g.railScale,height:16});
      r.ticks.forEach(item=>{
        attrs(item.mark,{x1:railToX(item.value),x2:railToX(item.value),y1:y-4,y2:y+4});
        attrs(item.text,{x:railToX(item.value),y:y+g.tickDy,'font-size':g.font-1});
      });
      attrs(r.name,{x:g.nameX,y:y-17,'font-size':g.font-1});
      attrs(r.note,{x:g.nameX,y:y-3,'font-size':g.font-1});
    });
  }
  const diamond=(cx,cy,r)=>`M ${px(cx)} ${px(cy-r)} L ${px(cx+r)} ${px(cy)} L ${px(cx)} ${px(cy+r)} L ${px(cx-r)} ${px(cy)} Z`;
  // A centred label pushed back inside the picture when the mark it names is near an edge.
  const place=(x,text,size)=>{
    const half=text.length*size*0.56/2+4;
    return Math.max(half,Math.min(g.width-half,x));
  };
  // An arrow drawn at its true length; a head only where there is room for one, so a short
  // arrow stays short rather than being inflated to stay visible.
  function arrowHead(x1,y1,x2,y2,cap=8) {
    const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy);
    if (len<6) return '';
    const head=Math.min(cap,len*0.34), ux=dx/len, uy=dy/len, nx=-uy, ny=ux;
    return ` M ${px(x2-ux*head+nx*head*0.45)} ${px(y2-uy*head+ny*head*0.45)}`
      +` L ${px(x2)} ${px(y2)} L ${px(x2-ux*head-nx*head*0.45)} ${px(y2-uy*head-ny*head*0.45)}`;
  }
  const arrowPath=(x1,y1,x2,y2,cap=8)=>
    `M ${px(x1)} ${px(y1)} L ${px(x2)} ${px(y2)}`+arrowHead(x1,y1,x2,y2,cap);
  const trace=points=>points.map((p,i)=>`${i?'L':'M'} ${px(toX(p[1]))} ${px(toY(p[0]))}`).join(' ');
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];

  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), held=reducedMotion?REST[stage]:time;

    // The two acts: plain SGD across beat 1, momentum from beat 3 on. One function plays
    // both, so the only difference a reader can attribute the outcome to is the memory.
    const sgd=play(plain,0,SGD_FROM,(SGD_TO-SGD_FROM)/steps,held);
    const mom=play(heavy,beta,MOM_FROM,STEP_SECONDS,held);
    const running=stage>=3;
    const act=stage===1?sgd:running?mom:null;

    const where=act?act.at:[startAcross,startAlong];
    // The gradient legs are pinned where the gradient was taken, so the iterate slides
    // off them during the move rather than dragging a value it never measured there.
    const taken=act?act.measured:[startAcross,startAlong];
    const gradientHere=gradient(taken);
    const chains=act?[act.links(0),act.links(1)]:[[],[]];
    const tips=chains.map(links=>links.reduce((total,value)=>total+value,0));

    root.dataset.stage=String(stage);
    Object.assign(root.dataset,{sgdWalk:String(sgd.raw),momentumStep:String(mom.raw),
      vAcross:String(tips[0]),vAlong:String(tips[1]),
      revealed:String(mom.raw>=REVEAL_AT-1e-9),phaseName:!act?'rest'
        :act.finished?'rest':act.phase<0.36?'shrink':act.phase<0.76?'add':'move'});

    const description=descriptions[0]+(stage>=1?descriptions[1]:'')+(stage>=2?descriptions[2]:'')
      +(stage>=3?descriptions[3]:'')+(mom.raw>=REVEAL_AT-1e-9?descriptions[4]:'')
      +(stage>=7?descriptions[5]:'');
    if (description!==described) {described=description; svg.setAttribute('aria-label',description);}

    // The valley: two paths, one iterate, and the gradient at it split into its two
    // components. The legs are drawn at the declared magnification, the same for both, so
    // two equal gradient components are two equal legs.
    attrs(sgdPath,{d:trace(stage===1?sgd.seen:plain.path)});
    show(sgdPath,stage===1?sgd.seen.length>1:stage>=2);
    sgdPath.setAttribute('class',stage===1?'mm-sgd-path mm-live':'mm-sgd-path');
    attrs(momPath,{d:trace(mom.seen)});
    show(momPath,running&&mom.seen.length>1);

    const ix=toX(where[1]), iy=toY(where[0]);
    const gx=toX(taken[1]), gy=toY(taken[0]);
    attrs(iterate,{d:diamond(ix,iy,5)});
    attrs(legAcross,{d:arrowPath(gx,gy,gx,gy-gradientHere[0]*leg,6)});
    attrs(legAlong,{d:arrowPath(gx,gy,gx-gradientHere[1]*leg,gy,6)});
    show(legAcross,stage<=6); show(legAlong,stage<=6);
    legAcrossText.textContent=whole(gradientHere[0]);
    legAlongText.textContent=whole(gradientHere[1]);
    attrs(legAcrossText,{x:gx+14,y:gy-gradientHere[0]*leg/2+4});
    attrs(legAlongText,{x:gx-gradientHere[1]*leg/2,y:gy-8});
    show(legAcrossText,stage===0); show(legAlongText,stage===0);

    const ends=stage>=7;
    const sgdEnd=plain.path[steps], momEnd=heavy.path[steps];
    attrs(sgdName,{x:place(toX(sgdEnd[1]),'plain SGD',g.font-1),y:toY(Math.abs(sgdEnd[0]))-26});
    attrs(momName,{x:place(toX(momEnd[1]),'momentum',g.font-1),y:toY(Math.abs(momEnd[0]))-26});
    // The distance each run still has to the bottom after the same eight steps, said in
    // the two words that make the number mean something where it is drawn.
    sgdLeft.textContent=ends?`${magnitude(Math.abs(sgdEnd[1]))} to go`:'·';
    momLeft.textContent=ends?`${magnitude(Math.abs(momEnd[1]))} past`:'·';
    attrs(sgdLeft,{x:place(toX(sgdEnd[1]),sgdLeft.textContent,g.font-1),y:toY(Math.abs(sgdEnd[0]))-13});
    attrs(momLeft,{x:place(toX(momEnd[1]),momLeft.textContent,g.font-1),y:toY(Math.abs(momEnd[0]))-13});
    [sgdName,momName,sgdLeft,momLeft].forEach(node=>show(node,ends));
    counter.textContent=act?`step ${act.finished?steps:act.done+1} of ${steps}`:'·';
    show(counter,Boolean(act));

    // The two chains. Each link is one term of the running sum, laid head to tail on its
    // own row, so the whole history is visible at once: the across terms fold back over
    // each other, the along terms march out. The bar under them is the tip, which is the
    // velocity component; the same scale carries both rails.
    rail.forEach((r,axis)=>{
      const links=chains[axis];
      let x=g.railZero, y=r.y;
      r.links.forEach((node,k)=>{
        // A term the sum does not hold leaves no geometry behind, so the drawn markup at a
        // time is the same however the reader arrived at it.
        if (k>=links.length) {node.setAttribute('d',''); show(node,false); return;}
        const rowY=r.y-g.row0-k*g.row, next=x+links[k]*g.railScale;
        attrs(node,{d:`M ${px(x)} ${px(y)} V ${px(rowY)} H ${px(next)}${arrowHead(x,rowY,next,rowY,7)}`});
        show(node,true);
        x=next; y=rowY;
      });
      const tipX=g.railZero+tips[axis]*g.railScale;
      attrs(r.drop,{x1:x,x2:x,y1:y,y2:r.y});
      show(r.drop,links.length>0);
      attrs(r.bar,{d:arrowPath(g.railZero,r.y,tipX,r.y,9)});
      show(r.bar,links.length>0&&Math.abs(tips[axis])>1e-9);
      r.value.textContent=links.length?signed(Number(tips[axis].toFixed(4))):'·';
      attrs(r.value,{x:place(tipX,r.value.textContent,g.font),y:r.y+g.valueDy,'font-size':g.font});
      show(r.value,links.length>0);
    });

    // The formula: the two halves of the recursion light in the order the picture performs
    // them. The TeX never changes.
    // The formula is momentum's, so it arrives with the prediction and lights only while
    // the momentum run is performing the half it names.
    formula.classList.toggle('mm-shown',stage>=2);
    formula.classList.toggle('mm-decay-lit',running&&root.dataset.phaseName==='shrink');
    formula.classList.toggle('mm-add-lit',running&&root.dataset.phaseName==='add');

    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${stageNames[stage]}. `
      +(act?`${running?'Momentum':'Plain SGD'} step ${act.finished?steps:act.done+1} of ${steps}. `:'')
      +(chains[0].length?`Across ${signed(Number(tips[0].toFixed(4)))}, along ${signed(Number(tips[1].toFixed(4)))}.`
        :`Both components of the gradient are ${whole(firstGradient[0])}.`);
  }

  const typeset=()=>{
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    if (window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  const round=values=>values.map(v=>Number(v.toFixed(10)));
  root.dataset.sgdPath=JSON.stringify(plain.path.map(round));
  root.dataset.momentumPath=JSON.stringify(heavy.path.map(round));
  root.dataset.velocities=JSON.stringify(heavy.velocities.map(round));
  root.dataset.gradients=JSON.stringify(heavy.grads.map(round));
  root.dataset.outerLevel=String(Number(outerLevel.toFixed(10)));
  measure(); layout();
  window.BookPlayback(root,render,()=>{measure(); layout(); render(lastTime,reduced);});
  typeset();
})();
