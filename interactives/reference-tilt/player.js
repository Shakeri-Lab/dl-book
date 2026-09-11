(() => {
  const root = document.getElementById('reference-tilt-excerpt');
  if (!root || root.dataset.ready) return;
  const $ = selector => root.querySelector(selector);
  // The panel mirrors the fixture in 18-alignment.qmd:585-590. The film supplies
  // the four moving bars and reveal order, never an extra numerical dataset.
  const declared = name => root.dataset[name].trim().split(/\s+/).map(Number);
  const reference = declared('reference'), rewards = declared('rewards');
  const witnesses = declared('witnessBetas');
  const pane = $('[data-pane]'), figure = $('[data-figure]'), svg = figure.querySelector('svg');
  svg.querySelectorAll('[data-static-frame]').forEach(node => node.remove());
  const drawing = svg.querySelector('[data-drawing]');
  const formula = $('[data-formula]'), caption = $('[data-caption]');
  const slider = $('[data-beta-slider]'), readout = $('[data-beta-readout]');
  const beats = pane.dataset.beats.trim().split(/\s+/).map(Number);
  const stageAt = time => beats.reduce((stage, beat, index) => time >= beat ? index : stage, 0);
  const names = ['Predict', 'Beta four', 'More pressure', 'Beta one', 'More pressure again', 'Beta one half', 'Price'];
  const captions = [
    'The reference favors A; the proxy favors D. What changes when the stay-near penalty weakens?',
    'The green policy is already tilted. Gray outlines keep its reference visible.',
    'Lower the stay-near penalty: the same four probabilities redistribute, rather than adding new responses.',
    'At beta one, read the policy, its expected proxy reward, and its KL from the reference.',
    'Press harder. A middle response can lose mass as D gains it.',
    'At beta one half, expected proxy reward is higher, and so is KL drift.',
    'More proxy reward comes with more measured drift. Pressure does not repair the proxy.'
  ];
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => (1 - Math.cos(Math.PI * clamp(x))) / 2;
  const glide = (time, start, end, a, b) => {
    const u = ease((time-start)/(end-start));
    if (u === 0) return a;
    if (u === 1) return b;
    return Math.exp(Math.log(a) + u*(Math.log(b)-Math.log(a)));
  };
  // Both glides arrive exactly AT the named witness beat; time inside a hold
  // cannot move any numerical mark. Reduced motion evaluates the beat itself.
  const betaAt = time => time < beats[2] ? witnesses[0]
    : time < beats[3] ? glide(time, beats[2], beats[3], witnesses[0], witnesses[1])
    : time < beats[4] ? witnesses[1]
    : time < beats[5] ? glide(time, beats[4], beats[5], witnesses[1], witnesses[2])
    : witnesses[2];
  function gibbs(beta) {
    const logits = reference.map((p,i) => Math.log(p) + rewards[i]/beta);
    const maximum = Math.max(...logits);
    const weights = logits.map(value => Math.exp(value-maximum));
    const normalizer = weights.reduce((total,value) => total+value,0);
    const policy = weights.map(value => value/normalizer);
    return {
      policy,
      reward:policy.reduce((total,p,i) => total+p*rewards[i],0),
      kl:policy.reduce((total,p,i) => total+p*Math.log(p/reference[i]),0)
    };
  }

  // Build once, then change attributes only. A generated final-frame fallback
  // is discarded after mounting so it cannot accumulate duplicate marks.
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attributes, parent=drawing, text='') => {
    const node = document.createElementNS(NS,tag);
    for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
    node.textContent = text;
    parent.appendChild(node);
    return node;
  };
  const attrs = (node, values) => {
    for (const [key,value] of Object.entries(values)) node.setAttribute(key,String(value));
  };
  const show = (node,visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden','');
  const text = (content,cls='rt-label',size=12,parent=drawing,extra={}) =>
    make('text',{class:cls,'font-size':size,...extra},parent,content);
  const probabilityTitle = text('Probability','rt-ink',13);
  const betaLabel = text('','rt-ink',13,drawing,{'data-beta-label':'','text-anchor':'end'});
  const referenceKey = make('line',{class:'rt-reference'});
  const referenceName = text('reference');
  const policyKey = make('rect',{class:'rt-output',width:15,height:8});
  const policyName = text('exact policy','rt-output');
  const axis = make('line',{class:'rt-axis'});
  const ticks = [0,.5,1].map(value => ({value,
    line:make('line',{class:value ? 'rt-grid' : 'rt-axis'}),
    text:text(String(value),'rt-label',12,drawing,{'text-anchor':'end'})}));
  const bars = reference.map((p,i) => {
    const group = make('g',{'data-response':i});
    return {
      group,
      reference:make('rect',{'data-reference-bar':i,class:'rt-reference'},group),
      live:make('rect',{'data-bar':i,class:'rt-output'},group),
      value:text('','rt-output',14,group,{'data-probability':i,'text-anchor':'middle'}),
      label:text('ABCD'[i],'rt-ink',15,group,{'text-anchor':'middle'}),
      reward:text(`r = ${rewards[i]}`,'rt-ink',12,group,{'data-fixed-reward':i,'text-anchor':'middle'})
    };
  });
  const metric = (label,name,cls) => ({
    label:text(label,'rt-label',12,drawing,{'text-anchor':'middle'}),
    value:text('',cls,17,drawing,{'data-value':name,'text-anchor':'middle'}),
    underline:make('line',{class:'rt-price-line','data-price-line':name})
  });
  const rewardMark = metric('Expected proxy reward','reward','rt-output');
  const klMark = metric('KL to reference','kl','rt-ink');
  let width=713,lastTime=0,reduced=false,override=null;
  const measure = () => {
    width = Math.max(180,Math.round(figure.getBoundingClientRect().width || 713));
    root.dataset.layout = width < 520 ? 'narrow' : 'wide';
  };
  const geometry = () => {
    const narrow=width<520;
    return {width,narrow,height:narrow ? 360 : 330,
      left:34,right:width-12,top:76,baseline:246,
      rewardX:narrow ? width*.29 : width*.32,klX:narrow ? width*.76 : width*.70};
  };

  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), held=reducedMotion ? beats[stage] : time;
    const dragged=override!==null, beta=dragged ? override : betaAt(held);
    const current=gibbs(beta), visible=dragged||stage>=1;
    const g=geometry(), chartHeight=g.baseline-g.top, step=(g.right-g.left)/reference.length;
    root.dataset.stage=String(stage);
    root.dataset.beta=String(beta);
    root.dataset.policy=JSON.stringify(current.policy);
    root.dataset.reward=String(current.reward);
    root.dataset.kl=String(current.kl);
    root.dataset.override=dragged ? 'slider' : '';
    root.dataset.baseline=String(g.baseline);
    root.dataset.chartHeight=String(chartHeight);
    root.dataset.revealed=String(visible);
    svg.setAttribute('viewBox',`0 0 ${g.width} ${g.height}`);
    svg.setAttribute('aria-label',visible
      ? `Beta ${beta.toFixed(2)}. Exact policy ${current.policy.map(p=>p.toFixed(3)).join(', ')}. Expected proxy reward ${current.reward.toFixed(6)}; KL to reference ${current.kl.toFixed(6)}. Gray reference outlines stay fixed.`
      : 'Four fixed reference probabilities and proxy scores. Predict how lowering the stay-near penalty changes the exact policy.');
    attrs(probabilityTitle,{x:g.left,y:20});
    attrs(betaLabel,{x:g.right,y:g.narrow ? 20 : 47});
    betaLabel.textContent=`Beta = ${beta.toFixed(2)}`;
    const legendX=g.narrow ? Math.min(g.left,g.width-240) : g.right-236, legendY=g.narrow ? 43 : 20;
    attrs(referenceKey,{x1:legendX,x2:legendX+18,y1:legendY-4,y2:legendY-4});
    attrs(referenceName,{x:legendX+24,y:legendY});
    attrs(policyKey,{x:legendX+120,y:legendY-10});
    attrs(policyName,{x:legendX+141,y:legendY});
    show(policyKey,visible); show(policyName,visible);
    attrs(axis,{x1:g.left,x2:g.left,y1:g.top,y2:g.baseline});
    for (const tick of ticks) {
      const y=g.baseline-chartHeight*tick.value;
      attrs(tick.line,{x1:g.left,x2:g.right,y1:y,y2:y});
      attrs(tick.text,{x:g.left-8,y:y+4});
    }
    bars.forEach((bar,i) => {
      const x=g.left+step*(i+.5), ghostWidth=Math.min(52,step*.72), liveWidth=Math.min(32,step*.46);
      const p=current.policy[i], h=chartHeight*p, refH=chartHeight*reference[i];
      attrs(bar.reference,{x:x-ghostWidth/2,y:g.baseline-refH,width:ghostWidth,height:refH});
      attrs(bar.live,{x:x-liveWidth/2,y:g.baseline-h,width:liveWidth,height:h});
      attrs(bar.value,{x,y:g.baseline-h-7}); bar.value.textContent=p.toFixed(3);
      attrs(bar.label,{x,y:g.baseline+21});
      attrs(bar.reward,{x,y:g.baseline+40});
      show(bar.live,visible); show(bar.value,visible);
    });
    const metricsY=g.narrow ? 319 : 300;
    for (const [mark,x,value] of [[rewardMark,g.rewardX,current.reward],[klMark,g.klX,current.kl]]) {
      attrs(mark.label,{x,y:metricsY});
      attrs(mark.value,{x,y:metricsY+22}); mark.value.textContent=value.toFixed(6);
      attrs(mark.underline,{x1:x-39,x2:x+39,y1:metricsY+27,y2:metricsY+27});
      show(mark.label,visible); show(mark.value,visible); show(mark.underline,stage===6&&!dragged);
    }
    // The phone caption is shorter, not smaller. All substantive SVG text is
    // at least twelve CSS pixels because viewBox width equals measured width.
    rewardMark.label.textContent=g.narrow ? 'Proxy reward' : 'Expected proxy reward';
    formula.classList.toggle('rt-shown',visible);
    formula.classList.toggle('rt-reference-lit',visible&&(stage===1||dragged));
    formula.classList.toggle('rt-pressure-lit',visible&&(stage===2||stage===4||dragged));
    formula.classList.toggle('rt-normalizer-lit',visible&&(stage===3||stage===5||stage===6));
    // Pausing during a drag may have repainted the slider from the timeline.
    // Restore the requested value as well as the picture after that repaint.
    slider.value=String(beta);
    readout.textContent=beta.toFixed(2);
    slider.setAttribute('aria-valuetext',`Beta ${beta.toFixed(2)}. ${visible ? `Expected proxy reward ${current.reward.toFixed(6)}, KL to reference ${current.kl.toFixed(6)}. ` : ''}Lower beta weakens the stay-near penalty.`);
    const sentence=dragged
      ? 'The fixture stays fixed. This dial changes reward pressure, not the quality of the proxy.'
      : captions[stage];
    if (caption.textContent!==sentence) caption.textContent=sentence;
    return `${names[stage]}. Beta ${beta.toFixed(2)}.${visible ? ` Expected proxy reward ${current.reward.toFixed(6)}, KL ${current.kl.toFixed(6)}.` : ''}`;
  }
  function drag() {
    // Pausing redraws from the timeline once; capture the requested value first.
    const requested=Math.max(Number(slider.min),Math.min(Number(slider.max),Number(slider.value)));
    if (root.dataset.playing==='true') $('[data-action="play"]').click();
    override=requested;
    render(lastTime,reduced);
  }
  slider.addEventListener('input',drag);
  slider.addEventListener('change',drag);
  pane.addEventListener('click',event => {
    if (event.target.closest('[data-action="play"]')&&root.dataset.playing!=='true') override=null;
  },true);
  pane.addEventListener('keydown',event => {
    if (event.target!==pane) return;
    if ([' ','k','K'].includes(event.key)&&root.dataset.playing!=='true') override=null;
    if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) override=null;
  },true);
  $('[data-controls] input[type="range"]').addEventListener('input',() => { override=null; });
  const typeset = () => {
    const done=() => { root.dataset.typeset=root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    if (window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  measure();
  window.BookPlayback(root,render,() => { measure(); render(lastTime,reduced); });
  typeset();
})();
