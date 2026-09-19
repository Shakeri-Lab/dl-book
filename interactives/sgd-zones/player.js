(() => {
  const root=document.getElementById('sgd-zones-excerpt');
  if (!root||root.dataset.ready) return;
  const $=selector=>root.querySelector(selector);
  const declared=name=>root.dataset[name].trim().split(/\s+/).map(Number);
  // The fixture lives in exactly one place in this repository: the panel's data-*
  // attributes. The mechanism is the chapter's (chapters/part1/04-training-loss-sgd.qmd:
  // 100-219): the minibatch gradient is the full gradient plus mean-zero noise, and the
  // two zones follow from which of the two terms dominates. The twenty-point dataset,
  // its batching and the walk are this panel's declared schematic stand-in, because the
  // chapter's eighty points come from torch.manual_seed(6050) and are never printed.
  const xs=declared('xs'), flat=declared('residuals');
  const batchSize=Number(root.dataset.batch);
  const [lineW,lineB]=declared('line'), [startW,startB]=declared('start');
  const eta=Number(root.dataset.rate), stepCount=Number(root.dataset.steps);
  const order=declared('order');
  const [wLo,wHi,bLo,bHi]=declared('window');
  const kappa=Number(root.dataset.arrow), span=Number(root.dataset.span);
  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number), duration=Number(pane.dataset.duration);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ramp=(time,from,to)=>clamp((time-from)/(to-from));

  // --- The scene's arithmetic, all of it derived from the declared fixture ------------
  // Every batch holds one residual at each declared x level, so |B| is the declared
  // batch size and the twenty points are five replicates of the same four x values.
  if (xs.length!==batchSize) throw Error('sgd-zones: each batch holds one point per declared x level');
  const batchCount=flat.length/batchSize;
  const residuals=Array.from({length:batchCount},(_,k)=>flat.slice(k*batchSize,(k+1)*batchSize));
  const ys=residuals.map(row=>row.map((r,j)=>lineW*xs[j]+lineB+r));
  const mean=values=>values.reduce((total,value)=>total+value,0)/values.length;
  const allX=[],allY=[];
  ys.forEach(row=>row.forEach((y,j)=>{allX.push(xs[j]); allY.push(y);}));
  // The mean-squared-error gradient the chapter differentiates: 2*mean(err*x), 2*mean(err).
  const gradient=(w,b,px,py)=>{
    const err=px.map((x,i)=>w*x+b-py[i]);
    return [2*mean(err.map((e,i)=>e*px[i])),2*mean(err)];
  };
  const fullGradient=(w,b)=>gradient(w,b,allX,allY);
  const batchGradient=(w,b,k)=>gradient(w,b,xs,ys[k]);
  // The empirical optimum of the declared points, solved in the browser.
  const m1=mean(allX), m2=mean(allX.map(x=>x*x));
  const my=mean(allY), mxy=mean(allX.map((x,i)=>x*allY[i]));
  const optW=(mxy-m1*my)/(m2-m1*m1), optB=my-m1*optW;
  // The noise term of the chapter's decomposition, measured rather than assumed: every
  // batch carries the same four x values, so xi is the same vector at every (w, b).
  const noiseAt=(w,b)=>{
    const g=fullGradient(w,b);
    return residuals.map((_,k)=>{const gb=batchGradient(w,b,k); return [gb[0]-g[0],gb[1]-g[1]];});
  };
  const xi=noiseAt(optW,optB);
  const noiseFloor=Math.sqrt(mean(xi.map(v=>v[0]*v[0]+v[1]*v[1])));
  // Drawn in one fixed order round the mean tip, so the five tips read as one rigid shape.
  const ring=xi.map((v,k)=>k).sort((a,b)=>Math.atan2(-xi[a][1],-xi[a][0])-Math.atan2(-xi[b][1],-xi[b][0]));
  // The chapter's own loop, run on the declared points: one batch per step, every batch
  // once per epoch, in the order the panel declares. Nothing here is tuned or measured.
  const path=[[startW,startB]], walk=[];
  for (let t=0;t<stepCount;t++) {
    const [w,b]=path[t], k=order[t], gb=batchGradient(w,b,k);
    walk.push({batch:k,signal:Math.hypot(...fullGradient(w,b))});
    path.push([w-eta*gb[0],b-eta*gb[1]]);
  }
  const startSignal=Math.hypot(...fullGradient(startW,startB));
  // The region of confusion is where the signal falls under that floor. Mean squared
  // error is exactly quadratic, so the boundary is an exact ellipse about the optimum:
  // ||grad L|| = ||2 M (theta - theta*)|| with the constant M = [[m2, m1], [m1, 1]].
  const hw=noiseFloor/(2*Math.sqrt(m2*m2+m1*m1)), hb=noiseFloor/(2*Math.sqrt(m1*m1+1));
  const RING=72;
  const confusionPoints=Array.from({length:RING},(_,i)=>{
    const angle=2*Math.PI*i/RING, c=Math.cos(angle), s=Math.sin(angle);
    // Solve ||2 M d|| = noiseFloor along the direction (c, s).
    const md=[m2*c+m1*s,m1*c+s], scale=noiseFloor/(2*Math.hypot(...md));
    return [optW+scale*c,optB+scale*s];
  });

  // --- Timeline -----------------------------------------------------------------------
  // Reduced motion holds one still per beat: the state that beat's caption describes,
  // which for a moving beat is the state it ends in.
  // Beat 4 rests before the ellipse's glide begins, so a reduced-motion still never
  // catches it part way in.
  const REST=[3,8.5,13.5,20,24.3,30,35,38];
  const walkAt=time=>clamp((time-beats[3])/(beats[7]-beats[3]))*stepCount;
  const stageNames=['The full gradient','Five batches of four','Gradient plus noise',
    'Stepping in','Under the floor','Region of confusion','Milling','Two zones, one rule'];
  // Each sentence is true of its reduced-motion still and of the motion it introduces.
  // None of them names the answer to the prediction beat 3 poses.
  const captions=[
    'Far from the optimum. This wine arrow is the full gradient over all twenty examples.',
    'Five batches of four, five directions. They spread — and every one still heads down the bowl.',
    'Each batch is that same gradient plus its own fixed noise. The five noise vectors cancel.',
    'Now step toward the optimum. Will the five still agree once the iterate arrives?',
    'The signal has dropped under the noise floor. The spread is opening past a right angle.',
    'The region of confusion: batches disagree because the signal went, not because the noise grew.',
    'Inside it the iterate mills around and never settles. Same rule, same noise throughout.',
    'The floor never moved; the signal collapsed. That is why the step must eventually shrink.'
  ];
  const descriptions=[
    'One iterate sits on the weight and bias plane, far from the empirical optimum, with a wine arrow for the full descent direction.',
    ' Five thinner arrows leave the same point, one per minibatch, and a dashed outline joins their tips.',
    ' A ruler under the plane compares the size of the full gradient with the size of a typical batch noise vector.',
    ' The iterate walks toward the optimum and the full arrow shortens while the outline joining the batch tips keeps its size.',
    ' A shaded ellipse round the optimum marks where the full gradient is smaller than that noise.'
  ];

  // --- Number formatting ---------------------------------------------------------------
  // U+2212 for minus, four decimals while four decimals carry the value, and a mantissa
  // with a Unicode power of ten below that. No hyphen-minus and no e-notation anywhere a
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
  const pair=([w,b])=>`(${signed(Number(w.toFixed(4)))}, ${signed(Number(b.toFixed(4)))})`;

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

  const frame=make('rect',{class:'sz-frame'});
  const wTicks=[-2,-1.5,-1].map(value=>({value,mark:make('line',{class:'sz-tick'}),
    text:label(tick(value),'sz-axis-label',{'text-anchor':'middle'})}));
  const bTicks=[0.5,1,1.5].map(value=>({value,mark:make('line',{class:'sz-tick'}),
    text:label(tick(value),'sz-axis-label',{'text-anchor':'end'})}));
  const wName=label('w','sz-name',{'text-anchor':'middle','font-size':14});
  const bName=label('b','sz-name',{'text-anchor':'middle','font-size':14});
  const confusion=make('g',{'data-confusion':''});
  const confusionArea=make('path',{class:'sz-confusion-area'},confusion);
  const confusionEdge=make('path',{class:'sz-confusion-edge'},confusion);
  const confusionText=label('region of confusion','sz-error',{'text-anchor':'middle','data-confusion-label':''},confusion);
  const optimum=make('g',{'data-optimum':''});
  const optimumMark=make('path',{class:'sz-optimum'},optimum);
  const optimumText=label('empirical optimum','sz-ink',{'text-anchor':'middle','data-optimum-label':''},optimum);
  const trail=make('path',{class:'sz-trail','data-trail':''});
  const outline=make('path',{class:'sz-outline','data-outline':''});
  const fan=make('g',{'data-fan':''});
  const fanArrows=xi.map((_,k)=>make('path',{class:'sz-batch-arrow','data-batch-arrow':k},fan));
  const fanTips=xi.map((_,k)=>make('circle',{class:'sz-tip','data-tip':k,r:2.6},fan));
  const noiseGroup=make('g',{'data-noise':''});
  const noiseLegs=xi.map((_,k)=>make('line',{class:'sz-noise-leg','data-noise-leg':k},noiseGroup));
  const noiseText=label('ξ','sz-ink',{'font-size':14,'text-anchor':'middle','data-noise-label':''},noiseGroup);
  const meanArrow=make('path',{class:'sz-mean-arrow','data-mean-arrow':''});
  const centre=make('circle',{class:'sz-centre','data-centre':'',r:3.4});
  const meanText=label('−∇L','sz-error',{'font-size':13,'data-mean-label':''});
  const batchText=label('−∇L','sz-batch-label',{'font-size':13,'data-batch-label':''});
  make('tspan',{dy:4,'font-size':9},batchText,'B');
  const iterate=make('path',{class:'sz-iterate','data-iterate':''});

  const rulerLine=make('line',{class:'sz-ruler'});
  const rulerBand=make('rect',{class:'sz-band','data-band':''});
  const rulerZero=label('0','sz-axis-label',{'text-anchor':'end','data-ruler-zero':''});
  const noiseMark=make('line',{class:'sz-noise-mark','data-noise-mark':''});
  const noiseValue=label('·','sz-ink',{'data-value':'noise','text-anchor':'middle'});
  const signalMark=make('path',{class:'sz-signal-mark','data-signal-mark':''});
  const signalValue=label('·','sz-error',{'data-value':'signal','text-anchor':'middle'});
  const ghost=make('g',{'data-ghost':''});
  const ghostMark=make('path',{class:'sz-ghost-mark'},ghost);
  const ghostText=label('at the start','sz-axis-label',{'font-size':11,'text-anchor':'middle','data-ghost-label':''},ghost);
  const bracket=make('path',{class:'sz-bracket'},ghost);
  const ratioValue=label('·','sz-error',{'data-value':'ratio','font-size':15,'text-anchor':'middle'},ghost);

  let width=713,lastTime=0,reduced=false,g,toX,toY,described;
  const measure=()=>{
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    root.dataset.layout=width<560?'narrow':'wide';
  };

  // Everything that depends only on the fixture and the pane width is placed here, once
  // per width: the plane, its ticks, the confusion ellipse and the ruler. render() moves
  // only the iterate, the arrows, the outline and the two marks on the ruler.
  function layout() {
    const narrow=width<560;
    g=narrow
      ? {narrow,width:296,height:380,left:34,top:18,size:240,tickY:274,nameY:292,
         ruler:{x0:34,x1:274,y:348,badgeY:314,bracketY:326,signalY:336,noiseY:366}}
      : {narrow,width:713,height:545,left:158,top:20,size:396,tickY:434,nameY:454,
         ruler:{x0:150,x1:620,y:516,badgeY:482,bracketY:492,signalY:504,noiseY:534}};
    g.unit=g.size/(wHi-wLo);
    g.right=g.left+g.size; g.bottom=g.top+g.size;
    g.ruler.scale=(g.ruler.x1-g.ruler.x0)/span;
    toX=w=>g.left+(w-wLo)*g.unit;
    toY=b=>g.bottom-(b-bLo)*g.unit;
    svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
    Object.assign(root.dataset,{plotLeft:String(g.left),plotTop:String(g.top),
      plotRight:String(g.right),plotBottom:String(g.bottom),unit:String(g.unit),
      rulerZero:String(g.ruler.x0),rulerScale:String(g.ruler.scale)});
    attrs(frame,{x:g.left,y:g.top,width:g.size,height:g.size});
    wTicks.forEach(item=>{
      attrs(item.mark,{x1:toX(item.value),x2:toX(item.value),y1:g.bottom,y2:g.bottom+4});
      attrs(item.text,{x:toX(item.value),y:g.tickY});
    });
    bTicks.forEach(item=>{
      attrs(item.mark,{y1:toY(item.value),y2:toY(item.value),x1:g.left-4,x2:g.left});
      attrs(item.text,{x:g.left-8,y:toY(item.value)+4});
    });
    attrs(wName,{x:(g.left+g.right)/2,y:g.nameY});
    attrs(bName,{x:g.left,y:g.top-7});
    const edge=confusionPoints.map((p,i)=>`${i?'L':'M'} ${px(toX(p[0]))} ${px(toY(p[1]))}`).join(' ')+' Z';
    attrs(confusionArea,{d:edge}); attrs(confusionEdge,{d:edge});
    const ox=toX(optW), oy=toY(optB), rb=hb*g.unit;
    attrs(optimumMark,{d:`M ${px(ox-7)} ${px(oy)} H ${px(ox+7)} M ${px(ox)} ${px(oy-7)} V ${px(oy+7)}`});
    attrs(optimumText,{x:ox,y:oy-rb-11});
    attrs(confusionText,{x:ox,y:oy+rb+18});
    const r=g.ruler;
    attrs(rulerLine,{x1:r.x0,x2:r.x1,y1:r.y,y2:r.y});
    attrs(rulerBand,{x:r.x0,y:r.y-9,width:noiseFloor*r.scale,height:18});
    attrs(rulerZero,{x:r.x0-8,y:r.y+4});
    const nx=r.x0+noiseFloor*r.scale;
    attrs(noiseMark,{x1:nx,x2:nx,y1:r.y-11,y2:r.y+11});
    attrs(noiseValue,{x:place(nx,`noise ‖ξ‖ ${magnitude(noiseFloor)}`,12),y:r.noiseY});
    const gx=r.x0+startSignal*r.scale;
    attrs(ghostMark,{d:diamond(gx,r.y,5.4)});
    attrs(ghostText,{x:place(gx,'at the start',11),y:r.noiseY});
  }
  const diamond=(cx,cy,r)=>`M ${px(cx)} ${px(cy-r)} L ${px(cx+r)} ${px(cy)} L ${px(cx)} ${px(cy+r)} L ${px(cx-r)} ${px(cy)} Z`;
  // A centred label pushed back inside the picture when the mark it names is near an edge.
  const place=(x,text,size)=>{
    const half=text.length*size*0.56/2+4;
    return Math.max(half,Math.min(g.width-half,x));
  };

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
  const inside=(x,y)=>({x:Math.max(g.left+6,Math.min(g.right-6,x)),y:Math.max(g.top+12,Math.min(g.bottom-6,y))});

  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), held=reducedMotion?REST[stage]:time;
    const u=walkAt(held);
    const index=Math.min(stepCount-1,Math.floor(u+1e-9)), frac=u-index;
    const here=path[index], next=path[index+1];
    const at=[here[0]+(next[0]-here[0])*frac,here[1]+(next[1]-here[1])*frac];
    const grow=ramp(held,0,2.5);
    const fanGrow=stage>=1?ramp(held,beats[1],beats[1]+2):0;
    const legsShown=stage===2;
    const noiseShown=stage>=2;
    // The one glide that spans a boundary: it finishes AT beat 5, so an arrow-key seek
    // parks on the finished picture its caption describes.
    const confusionFade=ramp(held,beats[5]-0.6,beats[5]);
    const revealed=stage>=4;

    const g0=fullGradient(at[0],at[1]);
    const signal=Math.hypot(...g0);
    const gb=xi.map((_,k)=>batchGradient(at[0],at[1],k));
    Object.assign(root.dataset,{stage:String(stage),walk:String(u),stepIndex:String(index),
      signal:String(signal),noiseFloor:String(noiseFloor),snr:String(signal/noiseFloor),
      confusion:String(confusionFade),revealed:String(revealed)});

    const description=descriptions[0]+(stage>=1?descriptions[1]:'')+(stage>=2?descriptions[2]:'')
      +(stage>=3?descriptions[3]:'')+(stage>=5?descriptions[4]:'');
    if (description!==described) {described=description; svg.setAttribute('aria-label',description);}

    // The picture: one point, one wine arrow, and five thinner arrows whose tips are that
    // arrow's tip shifted by the five fixed noise vectors. The outline through the tips is
    // therefore a rigid shape that only ever translates.
    const ix=toX(at[0]), iy=toY(at[1]);
    const meanTip=[ix+(toX(at[0]-kappa*g0[0])-ix)*grow,iy+(toY(at[1]-kappa*g0[1])-iy)*grow];
    const tips=gb.map(v=>[ix+(toX(at[0]-kappa*v[0])-ix)*fanGrow,iy+(toY(at[1]-kappa*v[1])-iy)*fanGrow]);
    attrs(iterate,{d:diamond(ix,iy,5)});
    attrs(meanArrow,{d:arrowPath(ix,iy,meanTip[0],meanTip[1])});
    fanArrows.forEach((node,k)=>{attrs(node,{d:arrowPath(ix,iy,tips[k][0],tips[k][1])}); show(node,stage>=1&&fanGrow>0);});
    fanTips.forEach((node,k)=>{attrs(node,{cx:tips[k][0],cy:tips[k][1]}); show(node,stage>=1&&fanGrow>=1);});
    attrs(outline,{d:ring.map((k,i)=>`${i?'L':'M'} ${px(tips[k][0])} ${px(tips[k][1])}`).join(' ')+' Z'});
    show(outline,stage>=2);
    attrs(centre,{cx:meanTip[0],cy:meanTip[1]});
    show(centre,stage>=2);
    noiseLegs.forEach((node,k)=>attrs(node,{x1:meanTip[0],y1:meanTip[1],x2:tips[k][0],y2:tips[k][1]}));
    show(noiseGroup,legsShown);
    const legged=ring[0];
    const legX=tips[legged][0]-meanTip[0], legY=tips[legged][1]-meanTip[1];
    const leg=Math.hypot(legX,legY)||1;
    const spot=inside(tips[legged][0]+legX/leg*13,tips[legged][1]+legY/leg*13+5);
    attrs(noiseText,{x:spot.x,y:spot.y});

    // Both arrow labels hang off the shared ray, on opposite sides, so neither crosses a
    // shaft; they retire once the walk begins and the caption has named both.
    const rayX=meanTip[0]-ix, rayY=meanTip[1]-iy, ray=Math.hypot(rayX,rayY)||1;
    const nx=-rayY/ray, ny=rayX/ray;
    const meanSpot=inside(ix+rayX*0.55+nx*17,iy+rayY*0.55+ny*17-4);
    attrs(meanText,{x:meanSpot.x,y:meanSpot.y,'text-anchor':nx>=0?'start':'end'});
    show(meanText,grow>=1&&stage<=4&&ray>=34);
    const wide=ring[Math.floor(ring.length/2)];
    const bx=tips[wide][0]-ix, by=tips[wide][1]-iy;
    const batchSpot=inside(ix+bx*0.78-nx*17,iy+by*0.78-ny*17+4);
    attrs(batchText,{x:batchSpot.x,y:batchSpot.y,'text-anchor':nx>=0?'end':'start'});
    show(batchText,stage>=1&&stage<=3&&fanGrow>=1&&Math.hypot(bx,by)>=34);

    const walked=path.slice(0,index+1).concat(frac>0?[at]:[]);
    attrs(trail,{d:walked.map((p,i)=>`${i?'L':'M'} ${px(toX(p[0]))} ${px(toY(p[1]))}`).join(' ')});
    show(trail,walked.length>1);
    confusion.setAttribute('opacity',px(confusionFade));
    show(confusion,confusionFade>0);

    // The ruler: one wine mark that slides, one ink mark that never does.
    const r=g.ruler, sx=r.x0+signal*r.scale;
    attrs(signalMark,{d:diamond(sx,r.y,5.4)});
    signalValue.textContent=`signal ‖∇L‖ ${magnitude(signal)}`;
    attrs(signalValue,{x:place(sx,signalValue.textContent,12),y:r.signalY});
    noiseValue.textContent=noiseShown?`noise ‖ξ‖ ${magnitude(noiseFloor)}`:'·';
    show(noiseValue,noiseShown); show(noiseMark,noiseShown); show(rulerBand,noiseShown);
    const gx=r.x0+startSignal*r.scale, mid=(gx+sx)/2;
    attrs(bracket,{d:`M ${px(gx)} ${px(r.bracketY-4)} V ${px(r.bracketY)} H ${px(sx)} V ${px(r.bracketY-4)}`});
    ratioValue.textContent=stage>=7?`÷ ${Math.round(startSignal/signal)}`:'·';
    attrs(ratioValue,{x:place(mid,ratioValue.textContent,15),y:r.badgeY});
    show(ghost,stage>=7);

    formula.classList.toggle('sz-shown',stage>=1);
    formula.classList.toggle('sz-noise-lit',stage===2||stage>=5);
    formula.classList.toggle('sz-signal-lit',stage===0||stage===3||stage===4);

    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${stageNames[stage]}. Iterate at ${pair(at)}. Signal ${magnitude(signal)}.`
      +(noiseShown?` Noise floor ${magnitude(noiseFloor)}.`:'')
      +(stage>=7?` Signal divided by ${Math.round(startSignal/signal)} since the start.`:'');
  }

  const typeset=()=>{
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    if (window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  root.dataset.optimum=JSON.stringify([optW,optB].map(v=>Number(v.toFixed(10))));
  root.dataset.xi=JSON.stringify(xi.map(v=>v.map(c=>Number(c.toFixed(10)))));
  root.dataset.path=JSON.stringify(path.map(p=>p.map(v=>Number(v.toFixed(10)))));
  root.dataset.batchOrder=JSON.stringify(walk.map(s=>s.batch));
  measure(); layout();
  window.BookPlayback(root,render,()=>{measure(); layout(); render(lastTime,reduced);});
  typeset();
})();
