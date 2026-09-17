(() => {
  const root=document.getElementById('mask-before-softmax-excerpt');
  if (!root||root.dataset.ready) return;
  const $=selector=>root.querySelector(selector);
  // One existing seed-6050133 float32 row, expanded rather than newly sampled.
  const query=JSON.parse(root.dataset.query), keys=JSON.parse(root.dataset.keys), valid=JSON.parse(root.dataset.valid);
  if (!Array.isArray(query)||!query.length||!query.every(Number.isFinite)
      ||!Array.isArray(keys)||!keys.length||!keys.every(key=>Array.isArray(key)&&key.length===query.length&&key.every(Number.isFinite))
      ||!Array.isArray(valid)||valid.length!==keys.length||!valid.every(value=>typeof value==='boolean'))
    throw Error('mask-before-softmax: query, key, and validity shapes must agree');
  // The guard comes before any exponential: an all-masked row has nothing to normalize.
  if (!valid.some(Boolean)) throw Error('every example needs at least one valid key');
  const scores=keys.map(key=>key.reduce((sum,value,index)=>sum+value*query[index],0)/Math.sqrt(query.length));
  const real=valid.flatMap((isValid,index)=>isValid?[index]:[]), padded=valid.flatMap((isValid,index)=>isValid?[]:[index]);
  const row=(shown,contributions)=>{
    const sum=contributions.reduce((total,value)=>total+value,0);
    const weights=contributions.map(value=>value/sum);
    return {shown,contributions,sum,weights,paddedMass:padded.reduce((total,index)=>total+weights[index],0)};
  };
  // The opening beat shows the audit's own four scores, before any repair is tried.
  const rawRow=row(scores,scores.map(score=>Math.exp(score)));
  // From then on the whole picture is a function of ONE number: the contribution c that a
  // padded slot makes to the shared sum. Its score is s = ln c, so c = 1 is the wrong repair
  // (score 0) and c = 0 is the mask (score −∞). Every sum, weight, and bar is recomputed
  // from c; nothing interpolates between two tables of answers.
  const realExp=scores.map((score,index)=>valid[index]?Math.exp(score):0);
  const rowAt=c=>row(scores.map((score,index)=>valid[index]?score:Math.log(c)),realExp.map((value,index)=>valid[index]?value:c));
  const zeroed=rowAt(1), masked=rowAt(0);
  // Each ruler is set by the largest value this fixture can reach on it, so no bar can
  // leave its band whatever the declared query, keys, and validity are.
  const EXP_BAND=60, WEIGHT_BAND=105;
  const expUnit=EXP_BAND/Math.max(...zeroed.contributions), weightUnit=WEIGHT_BAND/Math.max(...zeroed.weights,...masked.weights);

  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const captions=[
    'Two real keys, two padded slots. Predict: does a score of zero exclude the padding?',
    'The tempting repair: overwrite both padded scores with zero.',
    'Exponentiate each score. A padded zero contributes one, not zero.',
    'One shared sum takes all four. Each padded slot adds a full one.',
    'Divide each by that sum. Over half the weight lands on padding.',
    'Push the padded scores toward negative infinity and watch the weight move.',
    'Masked: padding contributes exactly zero. The real weights alone sum to one.',
    'Keep at least one real key. An all-masked row has no distribution to normalize.'
  ];
  const names=['Predict','Zero the padded scores','Exponentiate','One shared sum','Divide by the sum',
    'Push padded scores toward negative infinity','Masked weights','Guard the domain'];

  // Choreography: seconds only. A reveal grows for GROW seconds from its beat and then
  // holds; the mask glide waits HOLD seconds on the announced edit and lands exactly on
  // the next beat, so an arrow-key seek to that beat parks on the finished picture.
  const GROW=3, HOLD=2;
  const smooth=u=>{const v=Math.max(0,Math.min(1,u));return v*v*(3-2*v);};
  const lerp=(a,b,u)=>a+(b-a)*u;
  function motion(time,reducedMotion) {
    const stage=stageAt(time);
    // Reduced motion: one still per beat, derived from the stage and never from the clock.
    if (reducedMotion) return {stage,exps:stage>=2?1:0,bracket:stage>=3?1:0,divide:stage>=4?1:0,pad:stage>=6?0:1};
    const glideStart=beats[5]+HOLD;
    return {stage,exps:smooth((time-beats[2])/GROW),bracket:smooth((time-beats[3])/GROW),divide:smooth((time-beats[4])/GROW),
      pad:stage>=6?0:1-smooth((time-glideStart)/(beats[6]-glideStart))};
  }

  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  const make=(tag,attributes,text='',parent=drawing)=>{
    const node=document.createElementNS(NS,tag);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    node.textContent=text; parent.appendChild(node); return node;
  };
  // Writes touch the DOM only when the value changes: a held beat costs no mutations.
  const put=(node,name,value)=>{const next=String(value);if (node.getAttribute(name)!==next) node.setAttribute(name,next);};
  const attrs=(node,values)=>{for (const [key,value] of Object.entries(values)) put(node,key,value);};
  const write=(node,value)=>{if (node.textContent!==value) node.textContent=value;};
  const show=(node,visible)=>{if (visible===node.hasAttribute('hidden')) node.toggleAttribute('hidden',!visible);};
  // A withheld number is blank as well as hidden, so no beat's markup carries a later answer.
  const print=(node,visible,value)=>{show(node,visible);write(node,visible?value:'');};
  const publish=(key,value)=>{if (root.dataset[key]!==value) root.dataset[key]=value;};
  // Geometry-only rounding (0.0001 px) keeps the byte-compared static print independent of
  // a platform's last floating-point bit. The mathematical state is never rounded.
  const px=value=>Number(value.toFixed(4));
  const number=(value,digits)=>value.toFixed(digits).replace('-','−');
  const exact=(value,digits)=>value===0?'0':value===1?'1':number(value,digits);
  const scoreText=value=>Number.isFinite(value)?exact(value,3):'−∞';

  const text=(value,cls='',extra={})=>make('text',{'font-size':13,'text-anchor':'middle',class:cls,...extra},value);
  const context=text(`Example ${Number(root.dataset.batchIndex)+1} · query ${Number(root.dataset.queryIndex)+1}`,'mbs-muted',{'data-context':''});
  const modeLabel=text('', 'mbs-muted',{'data-mode-label':'','font-size':12});
  const columns=keys.map((key,index)=>{
    const isValid=valid[index];
    return {
      key:text(isValid?`key ${index+1}`:'PAD',isValid?'mbs-input':'mbs-muted',{'data-key':index,'data-valid':String(isValid)}),
      score:text('', '',{'data-score':index}),
      cue:isValid?null:make('path',{class:'mbs-cue','data-push-cue':index}),
      expLink:make('path',{class:'mbs-link','data-exp-link':index}),
      expLabel:text('exp','mbs-muted',{'data-exp-label':index,'font-size':12,'text-anchor':'start'}),
      expBar:make('rect',{class:isValid?'mbs-exp-bar':'mbs-exp-bar mbs-leak','data-exp-bar':index}),
      expBase:make('line',{class:'mbs-rule','data-exp-baseline':index}),
      expValue:text('', '',{'data-exp-value':index,'data-value':`exp-${index}`}),
      weightBar:make('rect',{class:isValid?'mbs-weight-bar':'mbs-weight-bar mbs-leak','data-weight-bar':index}),
      weightBase:make('line',{class:'mbs-rule','data-weight-baseline':index}),
      // Padded weights are read together, as one share, never as separate numbers.
      weightValue:isValid?text('', 'mbs-probability',{'data-weight-value':index,'data-value':`weight-${index}`}):null
    };
  });
  // The shared sum's bracket has two parts: ink over the real keys, wine over the padding.
  const sumBracket=make('path',{class:'mbs-link','data-sum-bracket':''});
  const leakBracket=make('path',{class:'mbs-link mbs-leak-link','data-leak-bracket':''});
  const sumValue=text('', '',{'data-sum-value':'','font-size':15});
  const divide=text('divide each by the same sum: ','mbs-muted',{'data-divide-label':'','font-size':12});
  make('tspan',{class:'mbs-probability'},'weights',divide);
  const massBracket=make('path',{class:'mbs-mass-bracket','data-mass-bracket':''});
  const massValue=text('', 'mbs-error',{'data-padded-mass':'','data-value':'pad-share','font-size':14});
  const guard=text('Guard: at least 1 real key','mbs-muted',{'data-guard':'','font-size':12});

  // Rows of the one picture, top to bottom.
  const Y={context:20,key:44,mode:65,score:87,linkTop:98,linkTip:127,expBase:195,expValue:214,
    bracketTop:226,bracket:232,stem:239,sum:258,divide:281,weightBase:400,weightValue:419,
    massTop:430,mass:437,massValue:460,guard:491,height:504};
  let width=713,narrow=false,barWidth=44,xs=[],lastTime=0,reduced=false;
  // Everything that depends only on the fixture is published once, here.
  Object.assign(root.dataset,{rawScores:JSON.stringify(scores),validCount:String(real.length),maskRole:'source-padding',
    expPixelsPerUnit:String(expUnit),weightPixelsPerUnit:String(weightUnit)});
  svg.setAttribute('aria-label',`Example ${Number(root.dataset.batchIndex)+1}, query ${Number(root.dataset.queryIndex)+1}: `
    +`${keys.length} aligned key columns, ${real.length} real and ${padded.length} padded. In each column a score becomes an `
    +'exponential bar; the bars share one sum; each weight bar is its exponential divided by that sum.');

  // Everything that depends only on the measured width is placed once per layout.
  function layout() {
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    narrow=width<520; barWidth=narrow?28:44;
    const margin=narrow?7:58, pitch=(width-2*margin)/keys.length;
    xs=keys.map((_,index)=>px(margin+pitch*(index+.5)));
    root.dataset.layout=narrow?'narrow':'wide'; publish('barWidth',String(barWidth));
    put(svg,'viewBox',`0 0 ${width} ${Y.height}`);
    const middle=px(width/2);
    attrs(context,{x:middle,y:Y.context}); attrs(modeLabel,{x:middle,y:Y.mode});
    attrs(divide,{x:middle,y:Y.divide}); attrs(guard,{x:middle,y:Y.guard});
    columns.forEach((column,index)=>{
      const x=xs[index], left=px(x-barWidth/2), cue=px(x-(narrow?30:34));
      attrs(column.key,{x,y:Y.key,'font-size':narrow?13:14});
      attrs(column.score,{x,y:Y.score});
      if (column.cue) put(column.cue,'d',`M ${cue} ${Y.score-11} V ${Y.score+1} M ${cue-3} ${Y.score-2.5} L ${cue} ${Y.score+1} L ${cue+3} ${Y.score-2.5}`);
      put(column.expLink,'d',`M ${x} ${Y.linkTop} V ${Y.linkTip} M ${x-3} ${Y.linkTip-4} L ${x} ${Y.linkTip} L ${x+3} ${Y.linkTip-4}`);
      attrs(column.expLabel,{x:px(x+7),y:Y.linkTip-12});
      attrs(column.expBar,{x:left,width:barWidth});
      attrs(column.expBase,{x1:left-3,x2:left+barWidth+3,y1:Y.expBase,y2:Y.expBase});
      attrs(column.expValue,{x,y:Y.expValue});
      attrs(column.weightBar,{x:left,width:barWidth});
      attrs(column.weightBase,{x1:left-3,x2:left+barWidth+3,y1:Y.weightBase,y2:Y.weightBase});
      if (column.weightValue) attrs(column.weightValue,{x,y:Y.weightValue,'font-size':narrow?12:14});
    });
    if (padded.length) {
      const left=px(xs[padded[0]]-barWidth/2), right=px(xs[padded.at(-1)]+barWidth/2);
      put(massBracket,'d',`M ${left} ${Y.massTop} V ${Y.mass} H ${right} V ${Y.massTop}`);
      attrs(massValue,{x:px((left+right)/2),y:Y.massValue});
    }
  }

  let stateKey='';
  let state=rawRow;
  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const m=motion(time,reducedMotion), stage=m.stage, c=m.pad;
    // The published state is recomputed only when the stage or c changes.
    const key=`${stage===0}|${c}`;
    if (key!==stateKey) {
      stateKey=key; state=stage===0?rawRow:rowAt(c);
      publish('shownScores',JSON.stringify(state.shown.map(value=>Number.isFinite(value)?value:'-Infinity')));
      publish('expContributions',JSON.stringify(state.contributions)); publish('normalizationSum',String(state.sum));
      publish('weights',JSON.stringify(state.weights)); publish('paddedMass',String(state.paddedMass));
      publish('padContribution',String(stage===0?'':c));
    }
    const leaking=stage>=1&&c>0, excluded=stage>=1&&c===0;
    const expsShown=stage>=2, expValuesShown=m.exps===1, sumShown=m.bracket===1;
    const weightsShown=stage>=4, weightValuesShown=m.divide===1, massShown=weightValuesShown&&padded.length>0;
    publish('stage',String(stage)); publish('mode',stage===0?'raw':c===1?'zeroed':c===0?'masked':'pushing');
    publish('expsVisible',String(expsShown)); publish('weightsVisible',String(weightsShown));

    write(modeLabel,!padded.length||stage===0?'scaled scores':stage<5?'PAD scores set to 0':stage===5?'PAD scores pushed toward −∞':'PAD scores at −∞: masked');
    put(modeLabel,'class',!padded.length||stage===0||stage>=6?'mbs-muted':stage<5?'mbs-error':'');
    columns.forEach((column,index)=>{
      const isValid=valid[index], contribution=state.contributions[index], weight=state.weights[index];
      // A number that is no longer in play turns grey and steps down a size.
      const scoreMuted=isValid&&stage>=3, expMuted=isValid?stage>=4:!leaking;
      write(column.score,scoreText(state.shown[index]));
      attrs(column.score,{class:scoreMuted?'mbs-muted':!isValid&&leaking?'mbs-error':'','font-size':narrow||scoreMuted?13:15});
      if (column.cue) show(column.cue,stage===5);
      put(column.expLink,'class',!isValid&&excluded?'mbs-link mbs-excluded':'mbs-link');
      const expHeight=px(contribution*expUnit*m.exps);
      attrs(column.expBar,{y:px(Y.expBase-expHeight),height:expHeight,'data-magnitude':contribution});
      [column.expLink,column.expLabel,column.expBar].forEach(node=>show(node,expsShown));
      print(column.expValue,expValuesShown,exact(contribution,4));
      attrs(column.expValue,{class:expMuted?'mbs-muted':isValid?'':'mbs-error','font-size':narrow||expMuted?12:14});
      const weightHeight=px(weight*weightUnit*m.divide);
      attrs(column.weightBar,{y:px(Y.weightBase-weightHeight),height:weightHeight,'data-magnitude':weight});
      show(column.weightBar,weightsShown);
      if (column.weightValue) print(column.weightValue,weightValuesShown,exact(weight,4));
    });
    // One bracket is the shared sum's reach: it draws across in its own beat. Its wine part,
    // over the padding, treats every padded slot alike: the ticks shrink and the line fades
    // in step with c, until the bracket holds the real keys alone. The stem and the sum
    // travel with the bracket's centre.
    const from=xs[0], reach=from+(xs.at(-1)-from)*m.bracket, a=xs[real[0]], b=xs[real.at(-1)];
    const span=(start,end)=>reach>start&&end>start?` M ${start} ${Y.bracket} H ${px(Math.min(end,reach))}`:'';
    let ink=span(a,b), leak=span(from,a)+span(b,xs.at(-1));
    xs.forEach((x,index)=>{
      // A tick rises as the drawn line arrives at its column.
      const tick=6*Math.max(0,Math.min(1,(reach-x+8)/8))*(valid[index]?1:c);
      if (tick>0&&valid[index]) ink+=` M ${x} ${Y.bracket} V ${px(Y.bracket-tick)}`;
      else if (tick>0) leak+=` M ${x} ${Y.bracket} V ${px(Y.bracket-tick)}`;
    });
    const middle=px((lerp(a,from,c)+lerp(b,xs.at(-1),c))/2);
    if (sumShown) ink+=` M ${middle} ${Y.bracket} V ${Y.stem}`;
    put(sumBracket,'d',ink.trim()); show(sumBracket,stage>=3&&m.bracket>0);
    attrs(leakBracket,{d:leak.trim(),opacity:px(c)}); show(leakBracket,stage>=3&&m.bracket>0&&leaking&&leak!=='');
    attrs(sumValue,{x:middle,y:Y.sum}); print(sumValue,stage>=3&&sumShown,`sum = ${number(state.sum,4)}`);
    show(divide,weightsShown);
    // Wine names an error. A padded share of exactly zero is not one, so it turns neutral.
    print(massValue,massShown,`PAD share ${exact(state.paddedMass,4)}`);
    put(massValue,'class',leaking?'mbs-error':''); put(massBracket,'class',leaking?'mbs-mass-bracket':'mbs-mass-bracket mbs-neutral');
    show(massBracket,massShown); show(guard,stage>=7);

    formula.classList.toggle('mbs-normalize-shown',stage>=2);
    formula.classList.toggle('mbs-zero-shown',stage>=2);
    formula.classList.toggle('mbs-exclude-shown',stage>=5);
    formula.classList.toggle('mbs-exp-lit',stage===2);
    formula.classList.toggle('mbs-sum-lit',stage===3||stage===5);
    formula.classList.toggle('mbs-probability-lit',stage===4||stage>=6);
    formula.classList.toggle('mbs-zero-lit',stage>=2&&c===1);
    formula.classList.toggle('mbs-exclude-lit',stage>=5&&c===0);
    write(caption,captions[stage]);
    // The scrubber's value text is the one place a live value is spoken; the picture's own
    // label describes its structure and the caption says what is happening.
    const spoken=[`${names[stage]}.`];
    if (stage===3&&sumShown) spoken.push(`Shared sum ${number(state.sum,4)}.`);
    if (stage===4&&massShown) spoken.push(`Padded share of the weight ${exact(state.paddedMass,4)}.`);
    if (stage===5) spoken.push(`Padded score ${scoreText(Math.log(c))}; padded share of the weight ${exact(state.paddedMass,4)}.`);
    if (stage>=6) spoken.push(`Real-key weights ${real.map(index=>exact(state.weights[index],4)).join(', ')}; padded share ${exact(state.paddedMass,4)}.`);
    return spoken.join(' ');
  }
  function typeset() {
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if (mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done,done);
    } else done();
  }
  layout();
  window.BookPlayback(root,render,()=>{layout();render(lastTime,reduced);});
  typeset();
})();
