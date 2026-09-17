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
  // The scrubber names the timeline's beat, which stays true while the dial is on a detour.
  const names = ['Predict', 'Hold at beta four', 'Glide to beta one', 'Hold at beta one', 'Glide to beta one half', 'Hold at beta one half', 'The price'];
  const captions = [
    'The reference favors A; the proxy favors D. What changes when the stay-near penalty weakens?',
    'The green policy is already tilted. Gray outlines keep its reference visible.',
    'Lower the stay-near penalty: the same four probabilities redistribute, rather than adding new responses.',
    'At beta one, read the policy, its expected proxy reward, and its KL from the reference.',
    'Press harder. A middle response can lose mass as D gains it.',
    'At beta one half, expected proxy reward is higher, and so is KL drift.',
    'More proxy reward comes with more measured drift. Pressure does not repair the proxy.'
  ];
  // One sentence for every frame the picture is revealed in; the live numbers are
  // announced by the beta slider alone, and the scrubber names the beat.
  const pictures = {
    hidden:'Four fixed reference probabilities and proxy scores above two empty gauges. Predict how lowering the stay-near penalty changes the exact policy.',
    shown:'Responses A to D on one probability axis: dashed gray outlines are the fixed reference, green bars the exact policy at the current beta. Two gauges beneath read expected proxy reward and KL to reference on fixed scales, each with a dashed reference mark. The beta slider announces the values.'
  };
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => (1 - Math.cos(Math.PI * clamp(x))) / 2;
  const glide = (time, start, end, a, b) => {
    const u = ease((time-start)/(end-start));
    if (u === 0) return a;
    if (u === 1) return b;
    return Math.exp(Math.log(a) + u*(Math.log(b)-Math.log(a)));
  };
  // Both glides arrive exactly AT the named witness beat; time inside a hold
  // cannot move any numerical mark.
  const betaAt = time => time < beats[2] ? witnesses[0]
    : time < beats[3] ? glide(time, beats[2], beats[3], witnesses[0], witnesses[1])
    : time < beats[4] ? witnesses[1]
    : time < beats[5] ? glide(time, beats[4], beats[5], witnesses[1], witnesses[2])
    : witnesses[2];
  const gliding = stage => stage === 2 || stage === 4;
  // Reduced motion draws one still per beat. A glide beat's caption describes the
  // redistribution, so its still is the finished glide, not the state it left.
  const rest = stage => beats[gliding(stage) ? stage+1 : stage];
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
  // Every printed number: fixed decimals, and a true minus sign if one is ever needed.
  const num = (value,digits) => value.toFixed(digits).replace('-','−');

  // Build once, then change attributes only. A generated final-frame fallback
  // is discarded after mounting so it cannot accumulate duplicate marks.
  drawing.replaceChildren();
  const NS = 'http://www.w3.org/2000/svg';
  // Geometry is serialised at 0.0001 px so a last-bit libm difference cannot change
  // the byte-compared static print. The mathematical state is never rounded.
  const px = value => typeof value === 'number' ? String(Number(value.toFixed(4))) : String(value);
  const attrs = (node, values) => {
    for (const [key,value] of Object.entries(values)) node.setAttribute(key,px(value));
    return node;
  };
  const make = (tag, attributes, parent=drawing, text='') => {
    const node = attrs(document.createElementNS(NS,tag),attributes);
    node.textContent = text;
    parent.appendChild(node);
    return node;
  };
  const show = (node,visible) => visible ? node.removeAttribute('hidden') : node.setAttribute('hidden','');
  const text = (content,cls='rt-label',size=12,parent=drawing,extra={}) =>
    make('text',{class:cls,'font-size':size,...extra},parent,content);
  const probabilityTitle = text('Probability','rt-ink',13);
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
      reward:text(`r = ${String(rewards[i]).replace('-','−')}`,'rt-ink',12,group,{'data-fixed-reward':i,'text-anchor':'middle'})
    };
  });
  // Two gauges on fixed scales, so a longer fill always means a larger number. Expected
  // proxy reward lives between the smallest and largest declared score; KL to the
  // reference can never exceed -log of the smallest reference probability. The dashed
  // mark is the reference itself: its own expected score, and zero drift.
  const lowest = Math.min(...rewards), span = (Math.max(...rewards)-lowest) || 1;
  const ceiling = -Math.log(Math.min(...reference)) || 1;
  const gauge = (name,label,cls,fraction,home) => {
    const group = make('g',{'data-gauge':name});
    return {fraction,home,
      label:text(label,'rt-label',12,group,{'data-gauge-label':name}),
      rail:make('rect',{class:'rt-rail','data-rail':name,height:8},group),
      fill:make('rect',{class:cls,'data-fill':name,height:8},group),
      casing:make('line',{class:'rt-casing'},group),
      mark:make('line',{class:'rt-reference','data-gauge-reference':name},group),
      value:text('',cls,15,group,{'data-value':name})};
  };
  const gauges = {
    reward:gauge('reward','Expected proxy reward','rt-output',value => clamp((value-lowest)/span),
      clamp((reference.reduce((total,p,i) => total+p*rewards[i],0)-lowest)/span)),
    kl:gauge('kl','KL to reference','rt-ink',value => clamp(value/ceiling),0)
  };
  root.dataset.gaugeScales = JSON.stringify({reward:[lowest,lowest+span],kl:[0,ceiling]});
  // The slider's readout is the one place beta is drawn. While the player runs, the
  // slider's own value text speaks it, so the visible copy leaves the accessibility tree.
  $('[data-beta-display]').setAttribute('aria-hidden','true');

  let width=713,lastTime=0,reduced=false,override=null,g=null;
  const measure = () => {
    width = Math.max(180,Math.round(figure.getBoundingClientRect().width || 713));
    root.dataset.layout = width < 520 ? 'narrow' : 'wide';
  };
  // Everything that depends only on the fixture and the measured width: drawn at mount
  // and on a resize, never per frame.
  function place() {
    const narrow=width<520, top=narrow ? 70 : 52, chartHeight=170, baseline=top+chartHeight;
    const left=34, right=width-12, step=(right-left)/reference.length;
    g={narrow,left,right,baseline,chartHeight,step,
      ghostWidth:Math.min(52,step*.72),liveWidth:Math.min(32,step*.46)};
    svg.setAttribute('viewBox',`0 0 ${width} ${narrow ? 372 : 330}`);
    root.dataset.baseline=String(baseline);
    root.dataset.chartHeight=String(chartHeight);
    attrs(probabilityTitle,{x:left,y:20});
    const legendX=narrow ? Math.min(left,width-240) : right-236, legendY=narrow ? 43 : 20;
    attrs(referenceKey,{x1:legendX,x2:legendX+18,y1:legendY-4,y2:legendY-4});
    attrs(referenceName,{x:legendX+24,y:legendY});
    attrs(policyKey,{x:legendX+120,y:legendY-10});
    attrs(policyName,{x:legendX+141,y:legendY});
    attrs(axis,{x1:left,x2:left,y1:top,y2:baseline});
    for (const tick of ticks) {
      const y=baseline-chartHeight*tick.value;
      attrs(tick.line,{x1:left,x2:right,y1:y,y2:y});
      attrs(tick.text,{x:left-8,y:y+4});
    }
    bars.forEach((bar,i) => {
      const x=left+step*(i+.5), refH=chartHeight*reference[i];
      attrs(bar.reference,{x:x-g.ghostWidth/2,y:baseline-refH,width:g.ghostWidth,height:refH});
      attrs(bar.live,{x:x-g.liveWidth/2,width:g.liveWidth});
      attrs(bar.value,{x});
      attrs(bar.label,{x,y:baseline+21});
      attrs(bar.reward,{x,y:baseline+40});
    });
    // Wide: name, rail, number on one line. Narrow: name and number above a rail that
    // spans the plot. The number is left-aligned, so digits added at a hold extend it
    // to the right and the digits already read do not move.
    gauges.reward.label.textContent=width<280 ? 'Proxy reward' : 'Expected proxy reward';
    Object.values(gauges).forEach((mark,row) => {
      const y=narrow ? baseline+73+row*40 : baseline+62+row*24;
      const x0=narrow ? left : left+152, x1=narrow ? right : right-84;
      const valueX=narrow ? right-72 : x1+10;
      mark.x0=x0; mark.length=x1-x0;
      attrs(mark.label,narrow ? {x:left,y:y-10,'text-anchor':'start'} : {x:x0-12,y:y+8,'text-anchor':'end'});
      attrs(mark.rail,{x:x0,y,width:x1-x0});
      attrs(mark.fill,{x:x0,y});
      const home=x0+mark.length*mark.home;
      // A white casing keeps the dashed mark legible where the fill runs under it.
      attrs(mark.casing,{x1:home,x2:home,y1:y,y2:y+8});
      attrs(mark.mark,{x1:home,x2:home,y1:y-3,y2:y+11});
      attrs(mark.value,{x:valueX,y:narrow ? y-10 : y+9});
    });
  }

  function render(time,reducedMotion) {
    lastTime=time; reduced=reducedMotion;
    const stage=stageAt(time), held=reducedMotion ? rest(stage) : time;
    const dragged=override!==null, beta=dragged ? override : betaAt(held);
    const current=gibbs(beta), visible=dragged||stage>=1;
    // Six decimals only where they can be checked against the manuscript: the three
    // witness holds. A glide or a dragged dial reads to three.
    const digits=!dragged&&stage>=1&&!gliding(stage) ? 6 : 3;
    root.dataset.stage=String(stage);
    root.dataset.beta=String(beta);
    root.dataset.policy=JSON.stringify(current.policy);
    root.dataset.reward=String(current.reward);
    root.dataset.kl=String(current.kl);
    root.dataset.override=dragged ? 'slider' : '';
    root.dataset.revealed=String(visible);
    const picture=visible ? pictures.shown : pictures.hidden;
    if (svg.getAttribute('aria-label')!==picture) svg.setAttribute('aria-label',picture);
    show(policyKey,visible); show(policyName,visible);
    bars.forEach((bar,i) => {
      const p=current.policy[i], h=g.chartHeight*p, refH=g.chartHeight*reference[i];
      attrs(bar.live,{y:g.baseline-h,height:h});
      // The number rides whichever top is higher, so the dashed reference edge can
      // never strike through it; the rule is continuous, so the label never jumps.
      attrs(bar.value,{y:g.baseline-Math.max(h,refH)-7}); bar.value.textContent=num(p,3);
      show(bar.live,visible); show(bar.value,visible);
    });
    for (const [name,mark] of Object.entries(gauges)) {
      attrs(mark.fill,{width:mark.length*mark.fraction(current[name])});
      mark.value.textContent=num(current[name],digits);
      show(mark.fill,visible); show(mark.value,visible);
    }
    formula.classList.toggle('rt-shown',visible);
    formula.classList.toggle('rt-reference-lit',visible&&(stage===1||dragged));
    formula.classList.toggle('rt-pressure-lit',visible&&(gliding(stage)||dragged));
    formula.classList.toggle('rt-normalizer-lit',visible&&(stage===3||stage===5||stage===6));
    // Pausing during a drag may have repainted the slider from the timeline.
    // Restore the requested value as well as the picture after that repaint.
    slider.value=String(beta);
    readout.textContent=num(beta,2);
    slider.setAttribute('aria-valuetext',`Beta ${num(beta,2)}. ${visible ? `Expected proxy reward ${num(current.reward,digits)}, KL to reference ${num(current.kl,digits)}. ` : ''}Lower beta weakens the stay-near penalty.`);
    const sentence=dragged
      ? 'The fixture stays fixed. This dial changes reward pressure, not the quality of the proxy.'
      : captions[stage];
    if (caption.textContent!==sentence) caption.textContent=sentence;
    return `${names[stage]}.`;
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
  // The drag ends only when the transport really acts. This is the transport's own
  // guard (shared/playback.js): a key it ignores must leave the dragged beta alone.
  pane.addEventListener('keydown',event => {
    if (event.target!==pane||event.altKey||event.ctrlKey||event.metaKey) return;
    const toggles=[' ','k','K'].includes(event.key);
    if (toggles&&(event.repeat||root.dataset.playing==='true')) return;
    if (toggles||['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) override=null;
  },true);
  $('[data-controls] input[type="range"]').addEventListener('input',() => { override=null; });
  const typeset = () => {
    const done=() => { root.dataset.typeset=root.querySelector('mjx-container') ? 'mathjax' : 'none'; };
    if (window.MathJax&&typeof window.MathJax.typesetPromise==='function'&&!root.querySelector('mjx-container')) {
      window.MathJax.typesetPromise([root]).then(done,done);
    } else done();
  };
  measure(); place();
  window.BookPlayback(root,render,() => { measure(); place(); render(lastTime,reduced); });
  typeset();
})();
