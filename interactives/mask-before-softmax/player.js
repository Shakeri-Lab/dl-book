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
  if (!valid.some(Boolean)) throw Error('every example needs at least one valid key');
  const scores=keys.map(key=>key.reduce((sum,value,index)=>sum+value*query[index],0)/Math.sqrt(query.length));
  const evaluate=mode=>{
    const shown=scores.map((score,index)=>valid[index]||mode==='raw'?score:mode==='zeroed'?0:-Infinity);
    const contributions=shown.map(score=>Math.exp(score));
    const sum=contributions.reduce((total,value)=>total+value,0);
    // Max-subtracted softmax keeps the probabilities separate from raw exp geometry.
    const maximum=Math.max(...shown), shifted=shown.map(score=>Math.exp(score-maximum));
    const denominator=shifted.reduce((total,value)=>total+value,0);
    const weights=shifted.map(value=>value/denominator);
    const paddedMass=weights.reduce((total,value,index)=>total+(valid[index]?0:value),0);
    return {shown,contributions,sum,weights,paddedMass};
  };
  const rows={raw:evaluate('raw'),zeroed:evaluate('zeroed'),masked:evaluate('masked')};
  const expMaximum=Math.max(...rows.raw.contributions,...rows.zeroed.contributions,...rows.masked.contributions);
  const pane=$('[data-pane]'), figure=$('[data-figure]'), svg=figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node=>node.remove());
  const drawing=svg.querySelector('[data-drawing]'), formula=$('[data-formula]'), caption=$('[data-caption]');
  const beats=pane.dataset.beats.trim().split(/\s+/).map(Number);
  const stageAt=time=>beats.reduce((stage,beat,index)=>time>=beat?index:stage,0);
  const captions=[
    'Does giving padding a score of zero exclude it?',
    'Try zero for both padded scores. The real-key scores stay unchanged.',
    'Exponentiate the scores. Each padded zero becomes a contribution of one.',
    'Divide by one shared sum. Padding still receives weight.',
    'Replace padded scores with negative infinity before normalization.',
    'Now the padded contributions are zero. They add nothing to the denominator.',
    'Normalize the real contributions. Padded keys receive exactly zero weight.',
    'Keep at least one real key. An all-masked row has no distribution to normalize.'
  ];
  const names=['Predict','Try zero scores','Exponentiate zeros','Wrong normalization','Exclude padded scores','Remove padded contributions','Correct normalization','Guard the domain'];
  drawing.replaceChildren();
  const NS='http://www.w3.org/2000/svg';
  const make=(tag,attributes,text='',parent=drawing)=>{
    const node=document.createElementNS(NS,tag);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    node.textContent=text; parent.appendChild(node); return node;
  };
  const attrs=(node,values)=>{for (const [key,value] of Object.entries(values)) node.setAttribute(key,String(value));};
  const show=(node,visible)=>visible?node.removeAttribute('hidden'):node.setAttribute('hidden','');
  const text=(value,cls='',extra={})=>make('text',{'font-size':13,'text-anchor':'middle',class:cls,...extra},value);
  const context=text('', 'mbs-muted',{'data-context':''});
  const modeLabel=text('', 'mbs-muted',{'data-mode-label':'','font-size':12});
  const columns=keys.map((key,index)=>({
    key:text(valid[index]?`key ${index+1}`:'PAD',valid[index]?'mbs-input':'mbs-muted',{'data-key':index,'data-valid':String(valid[index])}),
    score:text('', '',{'data-score':index}),
    expLink:make('path',{class:'mbs-link','data-exp-link':index}),
    expLabel:text('exp','mbs-muted',{'data-exp-label':index,'font-size':12,'text-anchor':'start'}),
    expBar:make('rect',{class:'mbs-exp-bar','data-exp-bar':index}),
    expBase:make('line',{class:'mbs-rule','data-exp-baseline':index}),
    expValue:text('', '',{'data-exp-value':index,'data-value':`exp-${index}`}),
    weightBar:make('rect',{class:'mbs-weight-bar','data-weight-bar':index}),
    weightBase:make('line',{class:'mbs-rule','data-weight-baseline':index}),
    weightValue:text('', 'mbs-probability',{'data-weight-value':index,'data-value':`weight-${index}`})
  }));
  const sumBracket=make('path',{class:'mbs-link','data-sum-bracket':''});
  const sumValue=text('', '',{'data-sum-value':'','font-size':15});
  const divide=text('divide each by the same sum','mbs-muted',{'data-divide-label':'','font-size':12});
  const weightLabel=text('weights','mbs-probability',{'data-weight-label':'','font-size':12});
  const massBracket=make('path',{class:'mbs-mass-bracket','data-mass-bracket':''});
  const massValue=text('', 'mbs-error',{'data-padded-mass':'','font-size':14});
  const guard=text('Guard: at least 1 real key','mbs-muted',{'data-guard':'','font-size':12});
  let width=713,lastTime=0,reduced=false;
  function measure() {
    width=Math.max(240,Math.round(figure.getBoundingClientRect().width||713));
    root.dataset.layout=width<520?'narrow':'wide';
  }
  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), mode=stage===0?'raw':stage<4?'zeroed':'masked', row=rows[mode];
    const expShown=(stage>=2&&stage<4)||stage>=5, weightsShown=stage===3||stage>=6;
    const barWidth=width<520?28:44, margin=width<520?7:58;
    const pitch=(width-2*margin)/keys.length, center=index=>margin+pitch*(index+.5);
    const expUnit=60/expMaximum, weightUnit=105/.65;
    Object.assign(root.dataset,{
      stage:String(stage),mode,rawScores:JSON.stringify(scores),
      shownScores:JSON.stringify(row.shown.map(value=>Number.isFinite(value)?value:'-Infinity')),
      expContributions:JSON.stringify(row.contributions),normalizationSum:String(row.sum),
      weights:JSON.stringify(row.weights),paddedMass:String(row.paddedMass),validCount:String(valid.filter(Boolean).length),
      expPixelsPerUnit:String(expUnit),weightPixelsPerUnit:String(weightUnit),barWidth:String(barWidth),
      expsVisible:String(expShown),weightsVisible:String(weightsShown),maskRole:'source-padding'
    });
    svg.setAttribute('viewBox',`0 0 ${width} 504`);
    const description=[`Example ${Number(root.dataset.batchIndex)+1}, query ${Number(root.dataset.queryIndex)+1}. ${keys.length} source slots; ${valid.filter(Boolean).length} real keys.`];
    if (stage===1) description.push('Padded scores have been set to zero.');
    if (stage===2) description.push('Each padded score contributes exp of zero, which is one.');
    if (stage===3) description.push(`Incorrect padded weight ${row.paddedMass.toFixed(4)}.`);
    if (stage>=4) description.push('Padded scores are excluded before softmax.');
    if (stage>=6) description.push(`Weights ${row.weights.map(value=>value===0?'0':value.toFixed(4)).join(', ')}; the row sums to one.`);
    if (stage>=7) description.push('An all-masked row is rejected; at least one valid key is required.');
    svg.setAttribute('aria-label',description.join(' '));
    attrs(context,{x:width/2,y:20}); context.textContent=`Example ${Number(root.dataset.batchIndex)+1} · query ${Number(root.dataset.queryIndex)+1}`;
    attrs(modeLabel,{x:width/2,y:65});
    modeLabel.textContent=stage===0?'scaled scores':stage<4?'zero PAD scores':'exclude PAD before softmax';
    columns.forEach((column,index)=>{
      const x=center(index), value=row.shown[index], contribution=row.contributions[index], weight=row.weights[index];
      attrs(column.key,{x,y:44,'font-size':width<520?13:14});
      attrs(column.score,{x,y:87,'font-size':width<520?13:15});
      column.score.textContent=Number.isFinite(value)?(value===0?'0':value.toFixed(3)):'−∞';
      attrs(column.expLink,{d:`M ${x} 98 V 127 M ${x-3} 123 L ${x} 127 L ${x+3} 123`});
      attrs(column.expLabel,{x:x+7,y:115});
      const expHeight=contribution*expUnit;
      attrs(column.expBar,{x:x-barWidth/2,y:195-expHeight,width:barWidth,height:expHeight,'data-magnitude':contribution});
      attrs(column.expBase,{x1:x-barWidth/2-3,x2:x+barWidth/2+3,y1:195,y2:195});
      attrs(column.expValue,{x,y:214,'font-size':width<520?12:14});
      column.expValue.textContent=contribution===0?'0':contribution===1?'1':contribution.toFixed(4);
      [column.expLink,column.expLabel,column.expBar,column.expBase,column.expValue].forEach(node=>show(node,expShown));
      const weightHeight=weight*weightUnit;
      attrs(column.weightBar,{x:x-barWidth/2,y:400-weightHeight,width:barWidth,height:weightHeight,'data-magnitude':weight});
      attrs(column.weightBase,{x1:x-barWidth/2-3,x2:x+barWidth/2+3,y1:400,y2:400});
      attrs(column.weightValue,{x,y:419,'font-size':width<520?12:14});
      column.weightValue.textContent=weight===0?'0':weight.toFixed(4);
      [column.weightBar,column.weightBase,column.weightValue].forEach(node=>show(node,weightsShown));
    });
    const first=center(0), last=center(keys.length-1);
    attrs(sumBracket,{d:`M ${first} 226 V 232 H ${last} V 226 M ${width/2} 232 V 239`});
    attrs(sumValue,{x:width/2,y:258}); sumValue.textContent=`sum = ${row.sum.toFixed(4)}`;
    show(sumBracket,expShown); show(sumValue,expShown);
    attrs(divide,{x:width/2,y:281}); attrs(weightLabel,{x:width/2,y:306});
    show(divide,weightsShown); show(weightLabel,weightsShown);
    const padded=valid.flatMap((isValid,index)=>isValid?[]:[index]);
    if (padded.length) {
      const left=center(padded[0])-barWidth/2, right=center(padded.at(-1))+barWidth/2;
      attrs(massBracket,{d:`M ${left} 430 V 437 H ${right} V 430`});
      attrs(massValue,{x:(left+right)/2,y:460}); massValue.textContent=`PAD share ${row.paddedMass.toFixed(4)}`;
    }
    show(massBracket,weightsShown&&padded.length>0); show(massValue,weightsShown&&padded.length>0);
    attrs(guard,{x:width/2,y:491}); show(guard,stage>=7);
    formula.classList.toggle('mbs-normalize-shown',stage>=3);
    formula.classList.toggle('mbs-zero-shown',stage>=2);
    formula.classList.toggle('mbs-exclude-shown',stage>=5);
    formula.classList.toggle('mbs-exp-lit',stage===2||stage===5);
    formula.classList.toggle('mbs-sum-lit',stage===3||stage===5);
    formula.classList.toggle('mbs-zero-lit',stage===2||stage===3);
    formula.classList.toggle('mbs-exclude-lit',stage===5);
    formula.classList.toggle('mbs-probability-lit',stage===6);
    if (caption.textContent!==captions[stage]) caption.textContent=captions[stage];
    return `${names[stage]}.${weightsShown?` Padded weight ${row.paddedMass.toFixed(4)}.`:''}`;
  }
  function typeset() {
    const done=()=>{root.dataset.typeset=root.querySelector('mjx-container')?'mathjax':'none';};
    const mathjax=window.MathJax;
    if (mathjax&&typeof mathjax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      mathjax.typesetPromise([root]).then(done,done);
    } else done();
  }
  measure();
  window.BookPlayback(root,render,()=>{measure();render(lastTime,reduced);});
  typeset();
})();
