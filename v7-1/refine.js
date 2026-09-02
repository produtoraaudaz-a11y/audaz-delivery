// AUDAZ Delivery V7.1 — camada de refinamento sobre a V7
(() => {
  const hero=document.querySelector('.hero');
  if(hero){
    hero.id='hero';hero.dataset.state='new';
    const period=hero.querySelector('.period');if(period)period.id='heroPeriod';
    const lead=hero.querySelector('.lead');if(lead)lead.id='heroLead';
    const cta=hero.querySelector('.hero-cta');if(cta){cta.id='heroCta';const text=document.createElement('span');text.id='heroCtaText';text.textContent='VER ENTREGA';const arrow=cta.querySelector('.arrow');cta.replaceChildren(text,document.createTextNode(' '),arrow)}
    const meta=hero.querySelector('.meta');if(meta){meta.id='heroMeta';meta.innerHTML='<span><b id="heroMetaPrimary">04</b><i id="heroMetaPrimaryLabel">conteúdos</i></span><span><b id="heroMetaSecondary">~6</b><i id="heroMetaSecondaryLabel">min de revisão</i></span>'}
  }

function updateProgress(){
  const s=stats(),pct=s.total?Math.round(s.reviewed/s.total*100):0;
  $('#globalProgress').style.width=pct+'%';$('#doneApproved').textContent=s.approved.length;$('#doneChanges').textContent=s.changes.length;
  $('#completion').classList.toggle('show',s.total>0&&s.reviewed===s.total);
  const hero=$('#hero'),title=$('#heroTitle'),period=$('#heroPeriod'),lead=$('#heroLead'),cta=$('#heroCta'),ctaText=$('#heroCtaText');
  const primary=$('#heroMetaPrimary'),primaryLabel=$('#heroMetaPrimaryLabel'),secondary=$('#heroMetaSecondary'),secondaryLabel=$('#heroMetaSecondaryLabel');
  if(!s.reviewed){
    hero.dataset.state='new';title.innerHTML='SUA SEMANA <em>ESTÁ PRONTA.</em>';period.textContent='01 — 05 SETEMBRO';
    lead.innerHTML='<strong>Quatro conteúdos preparados para esta semana.</strong><br>Uma sequência pensada para presença, autoridade e consistência jurídica.';
    primary.textContent=String(s.total).padStart(2,'0');primaryLabel.textContent='conteúdos';secondary.textContent='~6';secondaryLabel.textContent='min de revisão';
    cta.href='#conteudo-1';ctaText.textContent='VER ENTREGA';
  }else if(s.reviewed<s.total){
    hero.dataset.state='progress';title.innerHTML='CONTINUE <em>DE ONDE PAROU.</em>';period.textContent=`${s.reviewed} DE ${s.total} CONTEÚDOS REVISADOS`;
    lead.innerHTML='<strong>Sua revisão já está em andamento.</strong><br>Continue a partir da próxima peça que ainda precisa da sua decisão.';
    primary.textContent=String(s.reviewed).padStart(2,'0');primaryLabel.textContent=`de ${String(s.total).padStart(2,'0')} revisados`;secondary.textContent=String(s.total-s.reviewed).padStart(2,'0');secondaryLabel.textContent='restantes';
    const next=s.items.findIndex(c=>statusFor(c)==='aguardando');cta.href=`#conteudo-${Math.max(0,next)+1}`;ctaText.textContent='CONTINUAR';
  }else{
    hero.dataset.state='done';title.innerHTML='TUDO CERTO <em>POR AQUI.</em>';period.textContent='SUA SEMANA FOI REVISADA.';
    lead.innerHTML='<strong>A entrega foi revisada por completo.</strong><br>Os aprovados seguem para publicação e os ajustes retornam para a Audaz.';
    primary.textContent=String(s.approved.length).padStart(2,'0');primaryLabel.textContent='aprovados';secondary.textContent=String(s.changes.length).padStart(2,'0');secondaryLabel.textContent=s.changes.length===1?'ajuste':'ajustes';
    cta.href='#conteudo-1';ctaText.textContent='VER ENTREGA';
  }
}

function editorialCopy(c){return`<div class="editorial-copy"><div class="copy-title"><div><span>A MENSAGEM QUE ACOMPANHA</span><h3>Legenda</h3></div><button class="utility-btn" data-copy="${c.id}">COPIAR LEGENDA</button></div><div class="caption-text ${c.caption?'':'caption-empty'}">${esc(c.caption||'Legenda ainda não adicionada.')}</div></div>`}

function reelChapter(c,i,total){
  const d=view(c),m=d.media,cover=c.coverId||c.videoId;
  return`<article id="conteudo-${i+1}" class="chapter chapter--reel" data-state="${statusFor(c)}"><div class="wrap chapter-inner reel-grid">
    <aside class="reel-context">
      <div class="chapter-meta reveal">
        <div class="chapter-number">${String(i+1).padStart(2,'0')}</div>
        <div class="chapter-kicker"><b>${m.intent}</b><i></i><span>${m.label}</span></div>
        <h2 class="chapter-title">${esc(d.title)}</h2>
        <div class="date"><strong>${weekdayDate(d.date)}</strong>PUBLICAÇÃO PREVISTA</div>
      </div>
      <p class="reel-quote">${esc(d.title)}</p>
      <div>${stateNote(c)}</div>
    </aside>
    <div>
      <div class="reel-stage reveal reveal-delay-1">
        <div class="video-unit"><div class="video-frame" data-video-frame="${c.id}"><button class="video-placeholder" data-play="${c.id}" style="background-image:url('${thumb(cover,'w900')}')"><span>▶</span></button></div><div class="object-tool">${downloadBtn('BAIXAR VÍDEO',c.videoId)}</div></div>
        <div class="reel-cover reveal reveal-delay-2"><span class="cover-label">CAPA DO REEL</span><img src="${thumb(cover)}" data-zoom alt="Capa — ${esc(d.title)}" loading="lazy"><div class="object-tool">${downloadBtn('BAIXAR CAPA',cover)}</div></div>
        <div class="reel-pack-line"></div><div class="reel-pack-label">VÍDEO + CAPA · UM PACOTE COMPLETO</div>
      </div>
      ${editorialCopy(c)}
      <div>${decisionBlock(c)}</div>
      <div class="chapter-signature"><i></i>${i<total-1?'PRÓXIMO CAPÍTULO ↓':'ÚLTIMA PEÇA'}</div>
    </div>
  </div></article>`;
}

function carouselChapter(c,i,total){
  const d=view(c),m=d.media;
  return`<article id="conteudo-${i+1}" class="chapter chapter--carousel" data-state="${statusFor(c)}">
    <div class="wrap carousel-head">
      <div class="chapter-meta reveal"><div class="chapter-number">${String(i+1).padStart(2,'0')}</div><div class="chapter-kicker"><b>${m.intent}</b><i></i><span>${m.label}</span></div></div>
      <div class="carousel-head-copy reveal reveal-delay-1"><h2 class="chapter-title">${esc(d.title)}</h2><div class="date"><strong>${weekdayDate(d.date)}</strong>PUBLICAÇÃO PREVISTA</div><div>${stateNote(c)}</div></div>
    </div>
    <div class="carousel-sequence reveal reveal-delay-1">
      <div class="carousel-viewport" data-carousel="${c.id}" tabindex="0" aria-label="Carrossel ${esc(d.title)}"><div class="carousel-track">${m.slides.map((id,n)=>`<button class="carousel-slide ${n===0?'active':''}" type="button" data-carousel-slide="${c.id}" data-index="${n}" data-slide="${String(n+1).padStart(2,'0')} / ${String(m.slides.length).padStart(2,'0')}" aria-label="Ver slide ${n+1}"><img src="${thumb(id)}" alt="Slide ${n+1} de ${m.slides.length}" loading="${n?'lazy':'eager'}"></button>`).join('')}</div></div>
    </div>
    <div class="carousel-controls"><div class="group"><button class="round" data-prev="${c.id}" aria-label="Slide anterior">←</button><button class="round" data-next="${c.id}" aria-label="Próximo slide">→</button></div><span class="carousel-count" id="count-${c.id}">01 / ${String(m.slides.length).padStart(2,'0')}</span></div>
    <div class="carousel-tools"><div class="media-tools"><button class="utility-btn" data-toggle-downloads="${c.id}">↓ BAIXAR CARROSSEL</button></div><div class="carousel-downloads" id="downloads-${c.id}">${m.slides.map((id,n)=>`<a data-download href="${download(id)}" target="_blank" rel="noopener">↓ Slide ${String(n+1).padStart(2,'0')}</a>`).join('')}</div>
      ${editorialCopy(c)}<div>${decisionBlock(c)}</div><div class="chapter-signature"><i></i>${i<total-1?'PRÓXIMO CAPÍTULO ↓':'ÚLTIMA PEÇA'}</div></div>
  </article>`;
}

function staticChapter(c,i,total){
  const d=view(c),m=d.media;
  return`<article id="conteudo-${i+1}" class="chapter chapter--static" data-state="${statusFor(c)}"><div class="wrap static-grid">
    <div><div class="static-poster reveal reveal-delay-1"><img src="${thumb(m.image)}" data-zoom alt="${esc(d.title)}" loading="lazy"></div><div class="media-tools">${downloadBtn('BAIXAR ARTE',m.image)}</div></div>
    <aside class="static-context">
      <div class="chapter-meta reveal"><div class="chapter-number">${String(i+1).padStart(2,'0')}</div><div class="chapter-kicker"><b>${m.intent}</b><i></i><span>${m.label}</span></div><h2 class="chapter-title">${esc(d.title)}</h2><div class="date"><strong>${weekdayDate(d.date)}</strong>PUBLICAÇÃO PREVISTA</div></div>
      <p class="static-note">Uma peça para ser vista como peça — não como arquivo dentro de um sistema.</p><div>${stateNote(c)}</div>
      ${editorialCopy(c)}<div>${decisionBlock(c)}</div><div class="chapter-signature"><i></i>${i<total-1?'PRÓXIMO CAPÍTULO ↓':'ÚLTIMA PEÇA'}</div>
    </aside>
  </div></article>`;
}

function currentCarouselIndex(vp){
  const slides=[...vp.querySelectorAll('.carousel-slide')];if(!slides.length)return 0;
  const active=slides.findIndex(s=>s.classList.contains('active'));if(active>=0)return active;
  const center=vp.scrollLeft+vp.clientWidth/2;let best=0,dist=Infinity;
  slides.forEach((s,i)=>{const d=Math.abs((s.offsetLeft+s.offsetWidth/2)-center);if(d<dist){dist=d;best=i}});return best;
}
function setCarouselActive(id,idx,{scroll=false}={}){
  const vp=$(`[data-carousel="${id}"]`),slides=[...vp.querySelectorAll('.carousel-slide')];if(!vp||!slides.length)return;
  idx=Math.max(0,Math.min(slides.length-1,idx));slides.forEach((s,i)=>s.classList.toggle('active',i===idx));vp.dataset.activeIndex=idx;
  const count=$(`#count-${id}`);if(count)count.textContent=`${String(idx+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
  const prev=$(`[data-prev="${id}"]`),next=$(`[data-next="${id}"]`);if(prev)prev.disabled=idx===0;if(next)next.disabled=idx===slides.length-1;
  if(scroll){const s=slides[idx],left=Math.max(0,s.offsetLeft-(vp.clientWidth-s.offsetWidth)/2);vp.scrollTo({left,behavior:'smooth'})}
}
function moveCarousel(id,d){const vp=$(`[data-carousel="${id}"]`);setCarouselActive(id,currentCarouselIndex(vp)+d,{scroll:true})}
function bindDynamic(){
  $$('[data-play]').forEach(b=>b.onclick=()=>{const c=state.contents.find(x=>x.id===b.dataset.play);b.closest('[data-video-frame]').innerHTML=`<iframe src="${preview(c.videoId)}" allow="autoplay; fullscreen" allowfullscreen></iframe>`});
  $$('[data-zoom]').forEach(img=>img.onclick=()=>{$('#lightboxImage').src=img.src;$('#lightboxImage').alt=img.alt;$('#lightbox').classList.add('open')});
  $$('[data-copy]').forEach(b=>b.onclick=async()=>{const c=state.contents.find(x=>x.id===b.dataset.copy),old=b.textContent;try{await navigator.clipboard.writeText(c?.caption||'');b.textContent='✓ COPIADA';b.classList.add('success');setTimeout(()=>{b.textContent=old;b.classList.remove('success')},1600)}catch{toast('Não foi possível copiar')}});
  $$('[data-download]').forEach(a=>a.onclick=()=>{const old=a.textContent;a.textContent='↓ DOWNLOAD INICIADO';a.classList.add('success');setTimeout(()=>{a.textContent=old;a.classList.remove('success')},1800)});
  $$('[data-toggle-downloads]').forEach(b=>b.onclick=()=>{const e=$(`#downloads-${b.dataset.toggleDownloads}`);e.classList.toggle('open');b.textContent=e.classList.contains('open')?'FECHAR DOWNLOADS':'↓ BAIXAR CARROSSEL'});
  $$('[data-prev]').forEach(b=>b.onclick=()=>moveCarousel(b.dataset.prev,-1));$$('[data-next]').forEach(b=>b.onclick=()=>moveCarousel(b.dataset.next,1));
  $$('[data-open-feedback]').forEach(b=>b.onclick=()=>{state.feedbackOpen.add(b.dataset.openFeedback);$(`#feedback-${b.dataset.openFeedback}`).classList.add('open');setTimeout(()=>$(`#textarea-${b.dataset.openFeedback}`)?.focus(),220)});
  $$('[data-cancel-feedback]').forEach(b=>b.onclick=()=>{$(`#feedback-${b.dataset.cancelFeedback}`).classList.remove('open');state.feedbackOpen.delete(b.dataset.cancelFeedback)});
  $$('[data-approve]').forEach(b=>b.onclick=()=>sendAction(b,{action:'APROVADO',contentId:b.dataset.approve}));
  $$('[data-send-feedback]').forEach(b=>b.onclick=()=>{const id=b.dataset.sendFeedback,f=$(`#textarea-${id}`).value.trim();if(!f)return $(`#feedback-status-${id}`).textContent='Descreva o ajuste antes de enviar.';sendAction(b,{action:'ALTERACAO',contentId:id,feedback:f})});
  setupCarousels();
}
function setupCarousels(){
  $$('[data-carousel]').forEach(vp=>{
    if(vp.dataset.bound)return;vp.dataset.bound='1';const id=vp.dataset.carousel,slides=[...vp.querySelectorAll('.carousel-slide')],desktop=matchMedia('(min-width:901px)');
    slides.forEach((slide,i)=>{slide.addEventListener('click',e=>{if(vp.classList.contains('dragging'))return;setCarouselActive(id,i,{scroll:!desktop.matches})})});
    const syncMobile=()=>{if(desktop.matches)return;const center=vp.scrollLeft+vp.clientWidth/2;let idx=0,dist=Infinity;slides.forEach((s,i)=>{const d=Math.abs((s.offsetLeft+s.offsetWidth/2)-center);if(d<dist){dist=d;idx=i}});setCarouselActive(id,idx)};
    vp.addEventListener('scroll',()=>requestAnimationFrame(syncMobile),{passive:true});
    vp.addEventListener('keydown',e=>{if(e.key==='ArrowRight')moveCarousel(id,1);if(e.key==='ArrowLeft')moveCarousel(id,-1)});
    let down=false,sx=0,ss=0,moved=false;
    vp.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;down=true;moved=false;sx=e.clientX;ss=vp.scrollLeft;vp.setPointerCapture?.(e.pointerId)});
    vp.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>5){moved=true;vp.classList.add('dragging');vp.scrollLeft=ss-dx}});
    const end=e=>{if(!down)return;down=false;setTimeout(()=>vp.classList.remove('dragging'),0);if(moved){const center=vp.scrollLeft+vp.clientWidth/2;let idx=0,dist=Infinity;slides.forEach((s,i)=>{const d=Math.abs((s.offsetLeft+s.offsetWidth/2)-center);if(d<dist){dist=d;idx=i}});setCarouselActive(id,idx,{scroll:!desktop.matches})}};
    vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);setCarouselActive(id,0);
  });
}

  if(typeof init==='function') init();
})();
