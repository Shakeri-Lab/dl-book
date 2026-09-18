(() => {
  const root=document.getElementById('downhill-bowl-excerpt');
  if (!root||root.dataset.ready) return;
  const $=selector=>root.querySelector(selector);
  const declared=name=>root.dataset[name].trim().split(/\s+/).map(Number);
  // The fixture lives in exactly one place in this repository: the panel's data-*
  // attributes. The structural constants are the chapter's own printed literals
  // (chapters/part1/01-linear-regression.qmd:258-331) — the start (-0.5, 2.0), the
  // learning rate 0.25, twenty steps, the grid extents, the generating parameters.
  // The eight-point dataset and its residuals are this panel's declared schematic
  // stand-in for the chapter's sixty seeded points, which are never printed.
  const xs=declared('xs'), residuals=declared('residuals');
  const [genW,genB]=declared('generating'), [startW,startB]=declared('start');
  const eta=Number(root.dataset.rate), stepCount=Number(root.dataset.steps);
  const [wLo,wHi,bLo,bHi]=declared('grid'), levelCount=Number(root.dataset.levels);
  const ys=xs.map((x,i)=>genW*x+genB+residuals[i]);
  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number), duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ramp=(time,from,to)=>clamp((time-from)/(to-from));

  // --- The scene's arithmetic, all of it derived from the declared fixture ----------
  const n=xs.length, mean=values=>values.reduce((total,value)=>total+value,0)/n;
  const loss=(w,b)=>mean(xs.map((x,i)=>(w*x+b-ys[i])**2));
  // The gradient the chapter prints: 2 * mean(err * x) in w, 2 * mean(err) in b.
  const gradient=(w,b)=>{
    const err=xs.map((x,i)=>w*x+b-ys[i]);
    return [2*mean(err.map((e,i)=>e*xs[i])),2*mean(err)];
  };
  // The chapter's own loop, run on the declared points: twenty steps from (-0.5, 2.0)
  // at eta = 0.25. Nothing here is fitted, tuned or measured; it is that loop.
  const path=[[startW,startB]], walk=[];
  for (let k=0;k<stepCount;k++) {
    const [w,b]=path[k], g=gradient(w,b), move=[-eta*g[0],-eta*g[1]];
    walk.push({gradient:g,move,gradNorm:Math.hypot(g[0],g[1]),
      length:Math.hypot(move[0],move[1]),loss:loss(w,b)});
    path.push([w+move[0],b+move[1]]);
  }
  const longest=walk[0].length, shortest=walk[stepCount-1].length;
  const ratio=longest/shortest;

  // Mean squared error is exactly quadratic in (w, b), so its level sets are exact
  // ellipses: L = Lmin + half (p - p*)' H (p - p*), with a constant Hessian. Drawing
  // them from the closed form avoids sampling a grid and keeps every ring exact.
  const m1=mean(xs), m2=mean(xs.map(x=>x*x));
  const my=mean(ys), mxy=mean(xs.map((x,i)=>x*ys[i]));
  const detM=m2-m1*m1;
  const optW=(mxy-m1*my)/detM, optB=my-m1*optW, lossMin=loss(optW,optB);
  const hA=2*m2, hB=2*m1, hC=2;
  const halfTrace=(hA+hC)/2, offset=Math.hypot((hA-hC)/2,hB);
  const lambda=[halfTrace+offset,halfTrace-offset];
  let ex=Math.abs(hB)>1e-12?lambda[0]-hC:1, ey=Math.abs(hB)>1e-12?hB:0;
  const enorm=Math.hypot(ex,ey); ex/=enorm; ey/=enorm;
  // Levels equally spaced in loss, as the figure's twenty-five contour levels are, so
  // crowded rings mean a steep surface and the open middle means a flat one.
  const lossMax=Math.max(...[[wLo,bLo],[wLo,bHi],[wHi,bLo],[wHi,bHi]].map(([w,b])=>loss(w,b)));
  const levelGap=(lossMax-lossMin)/levelCount;
  const levels=Array.from({length:levelCount-1},(_,k)=>lossMin+(k+1)*levelGap);
  const RING=96;
  const ringPoints=level=>{
    const rA=Math.sqrt(2*(level-lossMin)/lambda[0]), rB=Math.sqrt(2*(level-lossMin)/lambda[1]);
    return Array.from({length:RING},(_,i)=>{
      const angle=2*Math.PI*i/RING, c=Math.cos(angle)*rA, s=Math.sin(angle)*rB;
      return [optW+c*ex-s*ey,optB+c*ey+s*ex];
    });
  };

  // --- Timeline ---------------------------------------------------------------------
  // Reduced motion holds one still per beat: the state that beat's caption describes,
  // which for a moving beat is the state it ends in. Every continuous quantity below is
  // a function of `held`, so the still and the end of the motion are the same picture.
  const REST=[2.5,8,13,20,25,29,33,38];
  // Completed steps, fractional inside a step. The cadence is uniform in time, so the
  // walker's visible deceleration is the shrinking step, never a slowing clock.
  const walkAt=time=>time<=beats[3]?0
    :time<beats[4]?ramp(time,beats[3],beats[4])
    :time<beats[5]?1+9*ramp(time,beats[4],beats[5])
    :10+10*ramp(time,beats[5],beats[5]+4);
  const stageNames=['Blindfold','Local slope','Scaled by the learning rate','First step',
    'Steps two to ten','Steps eleven to twenty','Contours revealed','Same rule throughout'];
  // Each sentence is true of its reduced-motion still and of the motion it introduces.
  // None of them names the answer before the walk has played.
  const captions=[
    'Blindfolded on the loss surface: the walker knows where it stands and nothing else.',
    'All it can feel is the slope underfoot. This arrow points straight downhill.',
    'The step is that arrow scaled by the learning rate: one quarter of it, since it is 0.25.',
    'The walker slides along the arrow and stops at its tip. Will the next nineteen steps be this long?',
    'Nine more steps, one rule, one learning rate. Each bar records the step it took.',
    'Ten more. The arrows are now too short to see, and the bars say so.',
    'Now the contours the walker never saw: crowded and steep out there, open near the bottom.',
    'The step shrank because the slope did. Nothing was scheduled and nothing was seen.'
  ];
  const descriptions=[
    'A walker stands on a hidden loss surface over the weight and bias plane. One arrow gives the slope under its feet.',
    'A walker crosses the weight and bias plane along a twenty-step path, with one arrow at its head and a bar for each step it has taken.',
    ' Contours of the quadratic bowl are now drawn: crowded where the surface is steep, open near the bottom.'
  ];

  // --- Number formatting -------------------------------------------------------------
  // U+2212 for minus, four decimals while four decimals carry the value, and a mantissa
  // with a Unicode power of ten below that. No hyphen-minus, no e-notation, anywhere a
  // reader or a screen reader meets one of these numbers.
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
  const pair=([w,b])=>`(${signed(w)}, ${signed(b)})`;

  // --- The picture, built once --------------------------------------------------------
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  // Drawing coordinates are serialised at 0.0001 px so a last-bit difference between
  // math libraries cannot change the byte-compared static print; the state stays exact.
  const px=value=>typeof value==='number'?String(Number(value.toFixed(4))):String(value);
  const attrs=(node,values)=>{for (const [key,value] of Object.entries(values)) node.setAttribute(key,px(value));};
  const make=(tag,values,parent=drawing,content='')=>{
    const node=document.createElementNS(NS,tag);
    attrs(node,values); if (content) node.textContent=content; parent.appendChild(node); return node;
  };
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const label=(content,cls,extra={},parent=drawing)=>make('text',{class:cls,'font-size':12,...extra},parent,content);

  const clip=make('clipPath',{id:'db-plot-clip'});
  const clipRect=make('rect',{},clip);
  const field=make('rect',{class:'db-field'});
  const frame=make('rect',{class:'db-frame'});
  const contours=make('g',{class:'db-contours','data-contours':'','clip-path':'url(#db-plot-clip)'});
  const rings=levels.map(level=>({level,node:make('path',{class:'db-ring','data-ring':''},contours)}));
  const wTicks=[-1,0,1,2,3,4,5].map(value=>({value,mark:make('line',{class:'db-tick'})}));
  const bTicks=[-4,-3,-2,-1,0,1,2,3].map(value=>({value,mark:make('line',{class:'db-tick'})}));
  const wLabels=[-1,1,3,5].map(value=>({value,mark:label(tick(value),'db-axis-label',{'text-anchor':'middle'})}));
  const bLabels=[-4,-2,0,2].map(value=>({value,mark:label(tick(value),'db-axis-label',{'text-anchor':'end'})}));
  const wName=label('w','db-name db-parameter',{'text-anchor':'middle','font-size':14});
  const bName=label('b','db-name db-parameter',{'text-anchor':'middle','font-size':14});
  const star=make('g',{'data-star':''});
  const starMark=make('path',{class:'db-star'},star);
  const generatingText=root.dataset.generating.trim().split(/\s+/).map(text=>text.replace('-','−')).join(', ');
  const starLabel=label(`generating (${generatingText})`,'db-ink',{'text-anchor':'middle','data-star-label':''},star);
  const trail=make('path',{class:'db-trail','data-trail':''});
  const trailDots=path.map((_,k)=>make('circle',{class:'db-trail-dot','data-trail-dot':k,r:2.4}));
  const ghost=make('g',{'data-ghost':''});
  const ghostArrow=make('path',{class:'db-ghost-arrow','data-ghost-arrow':''},ghost);
  const quarters=[0.25,0.5,0.75].map(at=>make('line',{class:'db-quarter','data-quarter':at},ghost));
  const gradValue=label('·','db-error',{'data-value':'grad','font-size':13},ghost);
  const stepGroup=make('g',{'data-step-arrow-group':''});
  const stepArrow=make('path',{class:'db-step-arrow','data-step-arrow':''},stepGroup);
  const stepValue=label('·','db-error',{'data-value':'step','font-size':13},stepGroup);
  const walker=make('circle',{class:'db-walker','data-walker':'',r:5.2});
  const shelf=make('line',{class:'db-shelf','data-shelf':''});
  const ladderName=label('step length','db-error',{'font-size':13,'data-ladder-name':''});
  const ladderRule=label('= η × ‖∇L‖','db-error',{'font-size':12,'data-ladder-rule':''});
  const ladder=make('g',{'data-ladder':''});
  const bars=walk.map((_,k)=>make('rect',{class:'db-bar','data-bar':k},ladder));
  const firstValue=label('·','db-error',{'data-value':'first','font-size':12},ladder);
  const lastValue=label('·','db-error',{'data-value':'last','font-size':12},ladder);
  const badge=label('·','db-badge',{'data-value':'ratio','font-size':17},ladder);

  let width=713,lastTime=0,reduced=false,g,toX,toY,described;
  const measure=()=>{
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    root.dataset.layout=width<560?'narrow':'wide';
  };

  // Everything that depends only on the fixture and the pane width is drawn here, once
  // per width: the plane, its ticks, all twenty-four rings, the star and the ladder's
  // shelf. render() moves only the walker, the two arrows, their numbers and the bars.
  function layout() {
    const narrow=width<560;
    const plot=narrow?{left:34,top:24,size:248}:{left:44,top:24,size:420};
    const unit=plot.size/(wHi-wLo);
    g={narrow,width:narrow?296:713,height:narrow?524:490,unit,
      left:plot.left,top:plot.top,right:plot.left+plot.size,bottom:plot.top+plot.size,
      tickY:narrow?288:460,nameY:narrow?306:478,
      ladder:narrow
        ? {ox:40,oy:476,stepX:12.1,stepY:0,vertical:true,thick:7,span:140,
           nameX:34,nameY:496,ruleY:511,badgeX:282,badgeY:496,badgeAnchor:'end',
           shelf:[34,476,282,476]}
        : {ox:506,oy:84,stepX:0,stepY:16,vertical:false,thick:8,span:140,
           nameX:500,nameY:52,ruleY:68,badgeX:506,badgeY:424,badgeAnchor:'start',
           shelf:[506,76,506,396]}};
    g.scale=g.ladder.span/longest;
    toX=w=>g.left+(w-wLo)*unit;
    toY=b=>g.bottom-(b-bLo)*unit;
    svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
    Object.assign(root.dataset,{plotLeft:String(g.left),plotTop:String(g.top),
      plotRight:String(g.right),plotBottom:String(g.bottom),unit:String(unit),
      barScale:String(g.scale)});
    attrs(clipRect,{x:g.left,y:g.top,width:g.right-g.left,height:g.bottom-g.top});
    attrs(field,{x:g.left,y:g.top,width:g.right-g.left,height:g.bottom-g.top});
    attrs(frame,{x:g.left,y:g.top,width:g.right-g.left,height:g.bottom-g.top});
    for (const ring of rings) {
      attrs(ring.node,{d:ringPoints(ring.level).map((p,i)=>`${i?'L':'M'} ${px(toX(p[0]))} ${px(toY(p[1]))}`).join(' ')+' Z'});
    }
    wTicks.forEach(item=>attrs(item.mark,{x1:toX(item.value),x2:toX(item.value),y1:g.bottom,y2:g.bottom+4}));
    bTicks.forEach(item=>attrs(item.mark,{y1:toY(item.value),y2:toY(item.value),x1:g.left-4,x2:g.left}));
    wLabels.forEach(item=>attrs(item.mark,{x:toX(item.value),y:g.tickY}));
    bLabels.forEach(item=>attrs(item.mark,{x:g.left-8,y:toY(item.value)+4}));
    attrs(wName,{x:(g.left+g.right)/2,y:g.nameY});
    attrs(bName,{x:g.left-2,y:g.top-8});
    const sx=toX(genW), sy=toY(genB);
    attrs(starMark,{d:starPath(sx,sy,10)});
    attrs(starLabel,{x:sx,y:sy+34});
    path.forEach((point,k)=>attrs(trailDots[k],{cx:toX(point[0]),cy:toY(point[1])}));
    const bar=g.ladder;
    attrs(ladderName,{x:bar.nameX,y:bar.nameY});
    attrs(ladderRule,{x:bar.nameX,y:bar.ruleY});
    attrs(badge,{x:bar.badgeX,y:bar.badgeY,'text-anchor':bar.badgeAnchor});
    attrs(shelf,{x1:bar.shelf[0],y1:bar.shelf[1],x2:bar.shelf[2],y2:bar.shelf[3]});
  }
  const starPath=(cx,cy,r)=>Array.from({length:10},(_,i)=>{
    const angle=-Math.PI/2+i*Math.PI/5, radius=i%2?r*0.42:r;
    return `${i?'L':'M'} ${px(cx+radius*Math.cos(angle))} ${px(cy+radius*Math.sin(angle))}`;
  }).join(' ')+' Z';

  // An arrow drawn at its true length. A head is added only when there is room for one:
  // a short arrow stays short rather than being inflated to stay visible.
  function arrowPath(x1,y1,x2,y2) {
    const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy);
    const shaft=`M ${px(x1)} ${px(y1)} L ${px(x2)} ${px(y2)}`;
    if (len<7) return shaft;
    const head=Math.min(8,len*0.3), ux=dx/len, uy=dy/len, nx=-uy, ny=ux;
    return `${shaft} M ${px(x2-ux*head+nx*head*0.45)} ${px(y2-uy*head+ny*head*0.45)}`
      +` L ${px(x2)} ${px(y2)} L ${px(x2-ux*head-nx*head*0.45)} ${px(y2-uy*head-ny*head*0.45)}`;
  }
  // Both readouts hang off the same perpendicular, on opposite sides of the shared ray,
  // so they never cross the shaft, never cross each other, and never sit on the walker.
  function besideArrow(x,y,nx,ny,distance) {
    const at={x:x+nx*distance,y:y+ny*distance,anchor:nx*distance>=0?'start':'end'};
    at.x=Math.max(g.left+4,Math.min(g.right-4,at.x));
    at.y=Math.max(g.top+12,Math.min(g.bottom-6,at.y));
    return at;
  }
  const barAt=(k,fraction)=>{
    const bar=g.ladder, sx=bar.ox+k*bar.stepX, sy=bar.oy+k*bar.stepY;
    const len=Math.max(0,walk[k].length*g.scale*fraction);
    return bar.vertical?{x:sx-bar.thick/2,y:sy-len,width:bar.thick,height:len}
      :{x:sx,y:sy-bar.thick/2,width:len,height:bar.thick};
  };

  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), held=reducedMotion?REST[stage]:time;
    const u=walkAt(held);
    const index=Math.min(stepCount-1,Math.floor(u+1e-9));
    const active=stage<=3?0:stage<=5?index:stepCount-1;
    const fraction=u-Math.min(stepCount-1,Math.floor(u+1e-9));
    const here=path[index], next=path[index+1];
    const at=[here[0]+(next[0]-here[0])*fraction,here[1]+(next[1]-here[1])*fraction];
    const ghostGrow=stage>=1?ramp(held,beats[1],beats[1]+2.5):0;
    const stepGrow=stage>=2?ramp(held,beats[2],beats[2]+2):0;
    const contourFade=ramp(held,beats[6]-0.6,beats[6]);
    const ghostShown=stage===1||stage===2||stage>=6;
    const stepShown=stage>=2;
    const step=walk[active];

    Object.assign(root.dataset,{stage:String(stage),walk:String(u),stepIndex:String(active),
      gradNorm:String(step.gradNorm),stepLength:String(step.length),
      contourOpacity:String(contourFade),revealed:String(stage>=4)});

    const description=(stage>=4?descriptions[1]:descriptions[0])+(stage>=6?descriptions[2]:'');
    if (description!==described) {described=description; svg.setAttribute('aria-label',description);}

    // Both arrows leave the same point along the same ray: the step is literally the
    // first quarter of the gradient arrow, because eta is one quarter.
    const originX=toX(path[active][0]), originY=toY(path[active][1]);
    const fullX=toX(path[active][0]-step.gradient[0]), fullY=toY(path[active][1]-step.gradient[1]);
    const rayX=fullX-originX, rayY=fullY-originY, ray=Math.hypot(rayX,rayY)||1;
    const nx=-rayY/ray, ny=rayX/ray;
    const ghostTipX=originX+rayX*ghostGrow, ghostTipY=originY+rayY*ghostGrow;
    const stepTipX=originX+rayX*eta*stepGrow, stepTipY=originY+rayY*eta*stepGrow;
    attrs(ghostArrow,{d:arrowPath(originX,originY,ghostTipX,ghostTipY)});
    quarters.forEach((mark,i)=>{
      const at=0.25*(i+1), qx=originX+rayX*at, qy=originY+rayY*at;
      attrs(mark,{x1:qx+nx*5,y1:qy+ny*5,x2:qx-nx*5,y2:qy-ny*5});
      show(mark,stage===2&&ghostGrow>=1);
    });
    const gradSpot=besideArrow(originX+rayX*ghostGrow,originY+rayY*ghostGrow,nx,ny,16);
    attrs(gradValue,{x:gradSpot.x,y:gradSpot.y,'text-anchor':gradSpot.anchor});
    gradValue.textContent=stage>=1?`‖∇L‖ ${magnitude(step.gradNorm)}`:'·';
    // A number is printed only once the arrow it measures is drawn at its true length.
    show(gradValue,ghostGrow>=1);
    show(ghost,ghostShown);
    attrs(stepArrow,{d:arrowPath(originX,originY,stepTipX,stepTipY)});
    const stepSpot=besideArrow(stepTipX,stepTipY,nx,ny,-16);
    attrs(stepValue,{x:stepSpot.x,y:stepSpot.y,'text-anchor':stepSpot.anchor});
    stepValue.textContent=stage>=2?`η‖∇L‖ ${magnitude(step.length)}`:'·';
    show(stepValue,stepGrow>=1);
    show(stepGroup,stepShown);

    const walked=path.slice(0,index+1).concat(fraction>0?[at]:[]);
    attrs(trail,{d:walked.map((p,i)=>`${i?'L':'M'} ${px(toX(p[0]))} ${px(toY(p[1]))}`).join(' ')});
    show(trail,walked.length>1);
    trailDots.forEach((dot,k)=>show(dot,k<=index&&u>0));
    attrs(walker,{cx:toX(at[0]),cy:toY(at[1])});

    contours.setAttribute('opacity',px(contourFade));
    show(contours,contourFade>0);
    show(star,stage>=6);
    bars.forEach((node,k)=>{
      attrs(node,barAt(k,clamp(u-k)));
      show(node,stage>=4&&u>k);
    });
    const firstBar=barAt(0,1), lastBar=barAt(stepCount-1,1);
    attrs(firstValue,g.ladder.vertical
      ?{x:firstBar.x,y:firstBar.y-6,'text-anchor':'start'}
      :{x:firstBar.x+firstBar.width+6,y:firstBar.y+7,'text-anchor':'start'});
    attrs(lastValue,g.ladder.vertical
      ?{x:lastBar.x+g.ladder.thick,y:lastBar.y-8,'text-anchor':'end'}
      :{x:lastBar.x+lastBar.width+6,y:lastBar.y+7,'text-anchor':'start'});
    firstValue.textContent=u>=1?magnitude(longest):'·';
    lastValue.textContent=u>=stepCount?magnitude(shortest):'·';
    badge.textContent=stage>=7?`× ${Math.round(ratio)}`:'·';
    show(firstValue,stage>=4&&u>=1);
    show(lastValue,stage>=5&&u>=stepCount);
    show(badge,stage>=7);
    show(ladder,stage>=4);
    show(ladderRule,stage>=2);

    formula.classList.toggle('db-shown',stage>=1);
    formula.classList.toggle('db-grad-lit',stage===1||stage===6);
    formula.classList.toggle('db-eta-lit',stage===2||stage===3||stage===7);

    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${stageNames[stage]}. Walker at ${pair(at)}.`
      +(stage>=1?` Slope ${magnitude(step.gradNorm)}.`:'')
      +(stage>=2?` Step ${magnitude(step.length)}.`:'')
      +(stage>=7?` Longest step ${magnitude(longest)}, shortest ${magnitude(shortest)}.`:'');
  }

  const typeset=()=>{
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    if (window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  root.dataset.path=JSON.stringify(path.map(p=>p.map(v=>Number(v.toFixed(10)))));
  root.dataset.stepLengths=JSON.stringify(walk.map(s=>Number(s.length.toFixed(10))));
  measure(); layout();
  window.BookPlayback(root,render,()=>{measure(); layout(); render(lastTime,reduced);});
  typeset();
})();
