const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const ROOT=document.body.dataset.root||'../../', CLIENT=document.body.dataset.client||'lavareda';
const NAV=[['inicio','Início'],['entregas','Entregas'],['calendario','Calendário'],['arquivos','Arquivos']];
const DELIVERY={id:'08',start:'2026-09-01',end:'2026-09-05',estimate:6,contentIds:['HO-01','KP-01','VM-01','ES-01'],intent:'Presença, autoridade e temas jurídicos distribuídos ao longo da semana.'};
const MEDIA={
  'HO-01':{type:'reel',label:'REEL',intent:'AUTORIDADE',orientation:'vertical'},
  'KP-01':{type:'static',label:'ESTÁTICO',intent:'RELACIONAMENTO',image:'1eOFPH5mYWFv79zhxC5VorGKnzVTCrXNx',title:'Gravidez de alto risco e benefício por incapacidade sem carência',date:'2026-09-02'},
  'VM-01':{type:'carousel',label:'CARROSSEL',intent:'POSICIONAMENTO',slides:['1r0fQRijZaMmrAVP1fgREq8EV_buNi6mt','1x_cx2gtECzvErlIPn8NQZQctH_EISNk_','1BOyJ9LsMl-ualKIDUBfc9n673SLkWaKN','1iLIKAe9yRRWAc_O7fVaHoxtn-BKO1L7r','1H4_yLgSdLAgOq9OELij0oqCP2SRZowCW'],title:'Cônjuge separado e dependência econômica para pensão militar',date:'2026-09-04'},
  'ES-01':{type:'reel',label:'REEL',intent:'AQUISIÇÃO',orientation:'vertical',date:'2026-09-05'}
};
const state={config:null,contents:[],actions:[],lot:'',page:'inicio',reviewId:null,carousel:{},feedbackOpen:false,busy:false};

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2300)}
function thumbUrl(id,size='w1600'){return`https://drive.google.com/thumbnail?id=${id}&sz=${size}`}
function videoUrl(c){return`https://drive.google.com/file/d/${c.videoId}/preview`}
function dateObj(d){if(!d)return null;const[y,m,day]=d.split('-').map(Number);return new Date(y,m-1,day)}
function dateShort(d){const x=dateObj(d);return x?x.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','').toUpperCase():''}
function weekdayDate(d){const x=dateObj(d);return x?x.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'}).replace(/\./g,'').toUpperCase():''}
function periodLabel(){return`${dateShort(DELIVERY.start)} — ${dateShort(DELIVERY.end)}`}
function mediaFor(c){const m=MEDIA[c.id]||{};let orientation=m.orientation;if(!orientation&&c.videoWidth&&c.videoHeight)orientation=+c.videoWidth>+c.videoHeight?'horizontal':'vertical';return{type:'reel',label:'REEL',intent:'PRESENÇA',orientation:orientation||'vertical',...m}}
function view(c){const m=mediaFor(c);return{...c,title:m.title||c.title,date:m.date||c.date,media:m}}
function thumb(c){const d=view(c),m=d.media;if(m.type==='static')return thumbUrl(m.image);if(m.type==='carousel')return thumbUrl(m.slides[0]);return thumbUrl(c.coverId||c.videoId,'w1200')}
function statusFor(c){let s=c.initialStatus||'aguardando';state.actions.filter(a=>a.contentId===c.id).forEach(a=>{if(a.action==='APROVADO')s='aprovado';if(a.action==='ALTERACAO')s='alteracao'});return s}
function deliveryContents(){const set=DELIVERY.contentIds.map(id=>state.contents.find(c=>c.id===id)).filter(Boolean);return set.length?set:state.contents.slice(0,4)}
function stats(){const items=deliveryContents(),approved=items.filter(c=>statusFor(c)==='aprovado'),changes=items.filter(c=>statusFor(c)==='alteracao');return{items,total:items.length,approved,changes,reviewed:approved.length+changes.length}}
function firstUnreviewed(){return deliveryContents().find(c=>statusFor(c)==='aguardando')||deliveryContents()[0]||null}
function nextUnreviewedAfter(c){const a=deliveryContents(),idx=a.findIndex(x=>x.id===c.id);return[...a.slice(idx+1),...a.slice(0,idx)].find(x=>statusFor(x)==='aguardando')||null}
function formatCount(){const x={reel:0,carousel:0,static:0};deliveryContents().forEach(c=>x[mediaFor(c).type]++);return [x.reel&&`${x.reel} ${x.reel===1?'Reel':'Reels'}`,x.carousel&&`${x.carousel} ${x.carousel===1?'carrossel':'carrosséis'}`,x.static&&`${x.static} ${x.static===1?'estático':'estáticos'}`].filter(Boolean).join(' · ')}

function setTheme(mode){localStorage.setItem('audaz-theme-v5',mode);applyTheme()}
function applyTheme(){const pref=localStorage.getItem('audaz-theme-v5')||'system',resolved=pref==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):pref;document.documentElement.dataset.theme=resolved;document.querySelector('meta[name=theme-color]')?.setAttribute('content',resolved==='dark'?'#151514':'#e8e4d6')}
function cycleTheme(){const cur=localStorage.getItem('audaz-theme-v5')||'system';setTheme(cur==='system'?'light':cur==='light'?'dark':'system')}

function renderNav(){const html=NAV.map(([id,label])=>`<button data-nav="${id}" class="nav-link ${state.page===id?'active':''}">${label}</button>`).join('');$('#desktopNav').innerHTML=html;$('#mobileNav').innerHTML=html}
function navigate(page){state.page=page;state.reviewId=null;state.feedbackOpen=false;$$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));$('#menuDrawer').classList.remove('show');$('#menuDrawer').setAttribute('aria-hidden','true');renderNav();renderPage(page);window.scrollTo({top:0,behavior:'smooth'})}
function openReview(id){state.reviewId=id;state.feedbackOpen=false;$$('.page').forEach(p=>p.classList.remove('active'));$('#page-revisao').classList.add('active');renderReview();window.scrollTo({top:0,behavior:'smooth'})}
function startReview(){const c=firstUnreviewed();if(c)openReview(c.id)}

function homeCopy(){const s=stats();if(!s.reviewed)return{eyebrow:'ENTREGA DA SEMANA',title:'SUA SEMANA ESTÁ PRONTA.',body:`${s.total} conteúdos preparados para esta semana.`,cta:'VER ENTREGA'};if(s.reviewed<s.total)return{eyebrow:'SUA ENTREGA',title:'SUA ENTREGA ESTÁ ESPERANDO POR VOCÊ.',body:`${s.reviewed} de ${s.total} revisados. Continue de onde parou.`,cta:'CONTINUAR'};return{eyebrow:'TUDO CERTO POR AQUI',title:'SUA SEMANA FOI REVISADA.',body:`${s.approved.length} aprovados${s.changes.length?` · ${s.changes.length} ajuste${s.changes.length>1?'s':''}`:''}.`,cta:'VER ENTREGA'}}
function renderInicio(){const s=stats(),copy=homeCopy();$('#page-inicio').innerHTML=`
<section class="editorial-hero reveal">
  <div class="hero-mark"><span></span><em>AUDAZ × ${esc(state.config.name.toUpperCase())}</em></div>
  <div class="hero-copy">
    <span class="kicker">${copy.eyebrow}</span>
    <h1>${copy.title}</h1>
    <div class="hero-period">${periodLabel()}</div>
    <p class="hero-lead">${copy.body}</p>
    <p class="hero-intent">${esc(DELIVERY.intent)}</p>
    <div class="hero-meta"><span>${s.total} CONTEÚDOS</span><span>~${DELIVERY.estimate} MIN DE REVISÃO</span></div>
    <button class="editorial-cta" data-start-review>${copy.cta} <b>→</b></button>
  </div>
  <div class="hero-index"><b>08</b><span>ENTREGA</span></div>
  ${s.reviewed?`<div class="quiet-progress"><i style="width:${s.total?Math.round(s.reviewed/s.total*100):0}%"></i></div>`:''}
</section>
<section class="works-intro reveal"><span>NESTA SEMANA</span><h2>O trabalho, antes da aprovação.</h2><p>Quatro peças pensadas como uma sequência — cada uma com uma função dentro da semana.</p></section>
<section class="work-showcase">${s.items.map(workEditorial).join('')}</section>
<section class="week-note reveal"><div><span>ORDEM DE PUBLICAÇÃO</span><strong>${periodLabel()}</strong></div><p>${formatCount()}</p><button class="plain-link" data-nav="calendario">VER PLANEJAMENTO →</button></section>
<footer class="editorial-footer reveal"><span>AUDAZ × ${esc(state.config.name.toUpperCase())}</span><strong>TRABALHO COM INTENÇÃO.<br>ENTREGA COM CLAREZA.</strong><p>${esc(state.config.headline||'')}</p></footer>`;bindReveal()}

function workEditorial(c,index){const d=view(c),m=d.media,reverse=index%2?' reverse':'';return`<article class="work-piece${reverse} reveal" data-review="${c.id}">
  <button class="work-media" data-review="${c.id}"><img src="${thumb(c)}" alt="${esc(d.title)}" loading="lazy"><span class="work-open">VER PEÇA ↗</span>${m.type==='carousel'?`<em>${m.slides.length} SLIDES</em>`:''}</button>
  <div class="work-copy"><span class="work-number">0${index+1}</span><div class="work-tags"><b>${m.label}</b><i>${m.intent}</i></div><h3>${esc(d.title)}</h3><p>${weekdayDate(d.date)} · PUBLICAÇÃO PREVISTA</p><button class="plain-link" data-review="${c.id}">VER PEÇA →</button></div>
</article>`}

function renderEntregas(){const s=stats(),past=pastDeliveries();$('#page-entregas').innerHTML=`<section class="simple-head reveal"><span>ENTREGAS</span><h1>O que a Audaz preparou, organizado no tempo.</h1><p>Sem biblioteca de tarefas. Cada ciclo reúne o trabalho entregue em um período.</p></section>
<section class="current-delivery reveal"><div><span>ENTREGA 08 · ATUAL</span><h2>${periodLabel()}</h2><p>${s.total} conteúdos · ${formatCount()}</p></div><div><small>${s.reviewed?s.reviewed+' DE '+s.total+' REVISADOS':'PRONTA PARA VOCÊ'}</small><button class="editorial-cta small" data-start-review>${s.reviewed<s.total?'ABRIR ENTREGA':'REVER ENTREGA'} →</button></div></section>
<section class="archive-list"><div class="archive-title"><span>ANTERIORES</span></div>${past.length?past.map((p,i)=>`<article class="archive-row reveal"><span>${String(i+7).padStart(2,'0')}</span><div><strong>${esc(p.lot)}</strong><small>${p.items.length} conteúdos registrados</small></div><em>ENTREGA ANTERIOR</em></article>`).join(''):`<div class="empty-editorial reveal"><strong>O histórico começa com esta entrega.</strong><p>Os próximos ciclos aparecerão aqui, sem misturar trabalho atual com arquivo antigo.</p></div>`}</section>`;bindReveal()}
function pastDeliveries(){const buckets={};state.actions.forEach(a=>{const lot=a.lot||'';if(!lot||lot===state.lot)return;buckets[lot]||={};buckets[lot][a.contentId]={title:a.title||a.contentId}});return Object.entries(buckets).map(([lot,items])=>({lot,items:Object.values(items)}))}

function renderCalendario(){const items=deliveryContents().slice().sort((a,b)=>view(a).date.localeCompare(view(b).date));$('#page-calendario').innerHTML=`<section class="simple-head reveal"><span>CALENDÁRIO</span><h1>Sua semana, em ordem.</h1><p>Uma visão ampliada do planejamento. A data principal de cada peça também aparece dentro da própria entrega.</p></section><div class="timeline">${items.map(c=>{const d=view(c),m=d.media;return`<button class="timeline-row reveal" data-review="${c.id}"><time>${weekdayDate(d.date)}</time><span class="timeline-dot"></span><img src="${thumb(c)}" alt=""><div><small>${m.label} · ${m.intent}</small><strong>${esc(d.title)}</strong></div><b>VER →</b></button>`}).join('')}</div>`;bindReveal()}
function renderArquivos(){const files=(state.config.files||[]).filter(f=>f.url&&f.url!=='#');$('#page-arquivos').innerHTML=`<section class="simple-head reveal"><span>ARQUIVOS</span><h1>O que precisa ficar à mão.</h1><p>Materiais finais, documentos e recursos importantes. Esta área é apoio — não compete com a entrega.</p></section>${files.length?`<div class="file-list">${files.map(f=>`<a class="file-row reveal" href="${esc(f.url)}" target="_blank" rel="noopener"><span>${esc((f.type||'arquivo').toUpperCase())}</span><div><strong>${esc(f.title)}</strong><p>${esc(f.description||'')}</p></div><b>ABRIR ↗</b></a>`).join('')}</div>`:`<div class="empty-editorial reveal"><strong>Nenhum material adicional nesta entrega.</strong><p>Quando houver documentos ou pastas úteis, eles aparecem aqui.</p></div>`}`;bindReveal()}

function mediaViewer(c){const d=view(c),m=d.media;if(m.type==='static')return`<div class="review-image"><img src="${thumbUrl(m.image)}" alt="${esc(d.title)}"></div>`;if(m.type==='carousel'){const i=state.carousel[c.id]||0;return`<div class="review-carousel"><div class="carousel-stage"><button data-slide-prev="${c.id}" ${i===0?'disabled':''}>←</button><img src="${thumbUrl(m.slides[i])}" alt="Slide ${i+1}"><button data-slide-next="${c.id}" ${i===m.slides.length-1?'disabled':''}>→</button><span>${String(i+1).padStart(2,'0')} / ${String(m.slides.length).padStart(2,'0')}</span></div><div class="carousel-strip">${m.slides.map((id,n)=>`<button class="${n===i?'active':''}" data-slide="${c.id}" data-index="${n}"><img src="${thumbUrl(id,'w300')}" alt=""></button>`).join('')}</div></div>`}return`<div class="review-video ${m.orientation}"><button class="video-launch" data-play="${c.id}"><span>▶</span><strong>ASSISTIR REEL</strong></button></div>`}
function reviewDots(id){return deliveryContents().map(c=>`<i class="${c.id===id?'current':''} ${statusFor(c)!=='aguardando'?'done':''}"></i>`).join('')}
function renderReview(){const c=deliveryContents().find(x=>x.id===state.reviewId)||state.contents.find(x=>x.id===state.reviewId);if(!c)return navigate('inicio');const d=view(c),items=deliveryContents(),idx=Math.max(0,items.findIndex(x=>x.id===c.id)),next=nextUnreviewedAfter(c),st=statusFor(c);$('#page-revisao').innerHTML=`
<div class="review-shell reveal">
  <div class="review-top"><button class="plain-link" data-nav="inicio">← SAIR DA REVISÃO</button><div><span>${String(idx+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}</span><div class="review-dots">${reviewDots(c.id)}</div></div><span>ENTREGA 08</span></div>
  <header class="review-heading"><div class="work-tags"><b>${d.media.label}</b><i>${d.media.intent}</i></div><h1>${esc(d.title)}</h1><p>${weekdayDate(d.date)} · PUBLICAÇÃO PREVISTA${c.version?` · V${esc(c.version)}`:''}</p></header>
  <section class="review-media-section">${mediaViewer(c)}</section>
  <section class="caption-section"><span>LEGENDA</span><div>${formatCaption(c.caption||'Legenda ainda não adicionada.')}</div><button class="plain-link" data-copy="${c.id}">COPIAR LEGENDA</button></section>
  ${decisionBlock(c,next,st)}
</div>
<div class="mobile-decision">${st==='aguardando'?`<button data-open-feedback="${c.id}">PEDIR AJUSTE</button><button class="mobile-approve" data-approve="${c.id}">APROVAR →</button>`:next?`<button class="mobile-approve" data-review="${next.id}">PRÓXIMA PEÇA →</button>`:`<button class="mobile-approve" data-finish>CONCLUIR →</button>`}</div>`;bindReview();bindReveal()}
function formatCaption(t){return esc(t).replace(/\n/g,'<br>')}
function decisionBlock(c,next,st){if(st==='aprovado')return`<section class="decision-section success"><span>TUDO CERTO COM ESSA PEÇA.</span><h2>Aprovado.</h2><p>Ela está liberada para seguir para publicação.</p>${next?`<button class="editorial-cta small" data-review="${next.id}">PRÓXIMA PEÇA →</button>`:`<button class="editorial-cta small" data-finish>CONCLUIR ENTREGA →</button>`}</section>`;if(st==='alteracao')return`<section class="decision-section adjust"><span>AJUSTE REGISTRADO.</span><h2>A Audaz recebeu seu pedido.</h2><p>Você pode continuar normalmente. Quando a nova versão estiver pronta, ela ficará disponível aqui.</p>${next?`<button class="editorial-cta small" data-review="${next.id}">PRÓXIMA PEÇA →</button>`:`<button class="editorial-cta small" data-finish>CONCLUIR ENTREGA →</button>`}</section>`;return`<section class="decision-section"><span>ESTÁ TUDO CERTO COM ESSA PEÇA?</span><h2>Sua decisão vem depois do trabalho.</h2><div class="decision-buttons"><button class="ask-adjust" data-open-feedback="${c.id}">PEDIR AJUSTE</button><button class="editorial-cta small" data-approve="${c.id}">APROVAR →</button></div><div class="feedback ${state.feedbackOpen?'show':''}"><label>O que precisa ser ajustado?</label><textarea id="feedbackText" placeholder="Ex.: aos 00:18, trocar a frase de abertura."></textarea><div><button class="plain-link" data-cancel-feedback>CANCELAR</button><button class="editorial-cta small" data-send-feedback="${c.id}">ENVIAR SOLICITAÇÃO →</button></div></div></section>`}
function renderCompletion(){const s=stats();$('#page-revisao').innerHTML=`<section class="completion reveal"><span class="completion-mark">✓</span><div class="hero-mark"><span></span><em>AUDAZ × ${esc(state.config.name.toUpperCase())}</em></div><span class="kicker">TUDO CERTO POR AQUI</span><h1>ENTREGA REVISADA.</h1><p>Sua semana foi revisada por completo.</p><div class="completion-summary"><span><b>${s.approved.length}</b> APROVADOS</span><span><b>${s.changes.length}</b> AJUSTE${s.changes.length===1?'':'S'} SOLICITADO${s.changes.length===1?'':'S'}</span></div><div class="what-next"><span>O QUE ACONTECE AGORA</span><p>Os conteúdos aprovados seguem para publicação.</p>${s.changes.length?`<p>O conteúdo com ajuste volta para a Audaz. Quando a nova versão estiver pronta, ela aparecerá aqui.</p>`:''}</div><button class="editorial-cta" data-nav="inicio">VOLTAR →</button></section>`;bindReveal()}

function bindReview(){
  $$('[data-play]').forEach(b=>b.onclick=()=>{const c=state.contents.find(x=>x.id===b.dataset.play),box=b.parentElement;box.innerHTML=`<iframe src="${videoUrl(c)}" allow="autoplay; fullscreen" allowfullscreen></iframe>`});
  $$('[data-slide-prev]').forEach(b=>b.onclick=()=>{state.carousel[b.dataset.slidePrev]=Math.max(0,(state.carousel[b.dataset.slidePrev]||0)-1);renderReview()});
  $$('[data-slide-next]').forEach(b=>b.onclick=()=>{const c=state.contents.find(x=>x.id===b.dataset.slideNext),max=mediaFor(c).slides.length-1;state.carousel[b.dataset.slideNext]=Math.min(max,(state.carousel[b.dataset.slideNext]||0)+1);renderReview()});
  $$('[data-slide]').forEach(b=>b.onclick=()=>{state.carousel[b.dataset.slide]=Number(b.dataset.index);renderReview()});
  $$('[data-open-feedback]').forEach(b=>b.onclick=()=>{state.feedbackOpen=true;renderReview();setTimeout(()=>$('#feedbackText')?.focus(),80)});
  $$('[data-cancel-feedback]').forEach(b=>b.onclick=()=>{state.feedbackOpen=false;renderReview()});
  $$('[data-approve]').forEach(b=>b.onclick=()=>sendAction({action:'APROVADO',contentId:b.dataset.approve},'Aprovado'));
  $$('[data-send-feedback]').forEach(b=>b.onclick=()=>{const feedback=$('#feedbackText')?.value.trim();if(!feedback)return toast('Descreva o ajuste primeiro');sendAction({action:'ALTERACAO',contentId:b.dataset.sendFeedback,feedback},'Ajuste registrado')});
  $$('[data-copy]').forEach(b=>b.onclick=async()=>{const c=state.contents.find(x=>x.id===b.dataset.copy);try{await navigator.clipboard.writeText(c?.caption||'');toast('Legenda copiada')}catch{toast('Não foi possível copiar')}});
  $$('[data-finish]').forEach(b=>b.onclick=renderCompletion);
}
async function sendAction(payload,message){if(state.busy)return;state.busy=true;const c=state.contents.find(x=>x.id===payload.contentId);try{await fetch(state.config.backend,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,projectKey:state.config.projectKey})});state.actions.push({contentId:payload.contentId,action:payload.action,feedback:payload.feedback||'',lot:state.lot,title:c?.title||''});toast(message);state.feedbackOpen=false;const next=nextUnreviewedAfter(c);if(next)setTimeout(()=>openReview(next.id),480);else setTimeout(renderCompletion,480)}catch(e){toast('Não foi possível registrar agora')}finally{state.busy=false}}

function renderPage(page){if(page==='inicio')renderInicio();if(page==='entregas')renderEntregas();if(page==='calendario')renderCalendario();if(page==='arquivos')renderArquivos()}
function bindReveal(){const els=$$('.reveal');if(!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('visible'));return}const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08});els.forEach(e=>io.observe(e))}
function bindGlobal(){document.body.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav)return navigate(nav.dataset.nav);const rev=e.target.closest('[data-review]');if(rev)return openReview(rev.dataset.review);if(e.target.closest('[data-start-review]'))return startReview()});$('#menuButton').onclick=()=>{$('#menuDrawer').classList.add('show');$('#menuDrawer').setAttribute('aria-hidden','false')};$('#closeMenu').onclick=()=>{$('#menuDrawer').classList.remove('show');$('#menuDrawer').setAttribute('aria-hidden','true')};$('#menuDrawer').onclick=e=>{if(e.target===$('#menuDrawer'))$('#closeMenu').click()};$('#themeButton').onclick=cycleTheme;matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((localStorage.getItem('audaz-theme-v5')||'system')==='system')applyTheme()})}
async function init(){applyTheme();bindGlobal();try{state.config=await fetch(`${ROOT}clientes/${CLIENT}.json`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('config');return r.json()});$('#headerClient').textContent=state.config.name.toUpperCase();renderNav();const data=await fetch(`${state.config.backend}?key=${encodeURIComponent(state.config.projectKey)}&t=${Date.now()}`,{cache:'no-store'}).then(r=>r.json());if(!data.ok)throw new Error(data.error||'backend');state.contents=data.contents||[];state.actions=data.actions||[];state.lot=data.lot||'';renderPage('inicio')}catch(e){$('#page-inicio').innerHTML=`<section class="load-error"><span>AUDAZ × LAVAREDA</span><h1>NÃO FOI POSSÍVEL ABRIR ESTA ENTREGA.</h1><p>Atualize a página em alguns instantes.</p></section>`}}
init();
