const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

const ICONS={
  inicio:'<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5V20H4z"/><path d="M9 20v-6h6v6"/></svg>',
  conteudos:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>',
  calendario:'<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v6M16 3v6M4 10h16"/></svg>',
  arquivos:'<svg viewBox="0 0 24 24"><path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2"/></svg>',
  check:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M14 7l5 5-5 5"/></svg>'
};

const NAV=[['inicio','Início'],['conteudos','Conteúdos'],['calendario','Calendário'],['arquivos','Arquivos']];
const state={config:null,contents:[],actions:[],page:'inicio',reviewId:null,calendarDate:new Date(),lot:''};
const BASE=document.body.dataset.base||'../';
const ROOT=document.body.dataset.root||'../../';
const CLIENT=document.body.dataset.client||'lavareda';

function toast(t){
  const el=$('#toast'); if(!el)return;
  el.textContent=t; el.classList.add('show');
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200);
}
function setTheme(mode){localStorage.setItem('audaz-theme',mode);applyTheme()}
function applyTheme(){
  const pref=localStorage.getItem('audaz-theme')||'system';
  const resolved=pref==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):pref;
  document.documentElement.dataset.theme=resolved;
  $$('[data-theme-mode]').forEach(b=>b.classList.toggle('active',b.dataset.themeMode===pref));
  document.querySelector('meta[name=theme-color]')?.setAttribute('content',resolved==='dark'?'#151514':'#e8e4d6');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((localStorage.getItem('audaz-theme')||'system')==='system')applyTheme()});
function setupTheme(){
  applyTheme();
  $$('[data-theme-mode]').forEach(b=>b.onclick=()=>setTheme(b.dataset.themeMode));
  $('#mobileTheme').onclick=()=>{
    const cur=localStorage.getItem('audaz-theme')||'system';
    setTheme(cur==='system'?'light':cur==='light'?'dark':'system');
  };
}

function navHtml(){
  return NAV.map(([id,label])=>`<button class="nav-btn ${id===state.page?'active':''}" data-nav="${id}">${ICONS[id]}<span>${label}</span></button>`).join('');
}
function renderNav(){const h=navHtml();$('#sideNav').innerHTML=h;$('#drawerNav').innerHTML=h}
function bindNav(){
  const handler=e=>{const b=e.target.closest('[data-nav]');if(!b)return;navigate(b.dataset.nav)};
  $('#sideNav').onclick=handler; $('#drawerNav').onclick=handler;
}
function navigate(page){
  state.page=page; state.reviewId=null;
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));
  $('#page-revisao').classList.remove('active');
  renderNav(); $('#drawer').classList.remove('show');
  window.scrollTo({top:0,behavior:'smooth'}); renderPage(page);
}
function openReview(id){
  const item=state.contents.find(c=>c.id===id); if(!item)return;
  state.reviewId=id;
  $$('.page').forEach(p=>p.classList.remove('active'));
  $('#page-revisao').classList.add('active');
  renderReview(); window.scrollTo({top:0,behavior:'smooth'});
}

function statusFor(c){
  let s=c.initialStatus||'aguardando';
  state.actions.filter(a=>a.contentId===c.id).forEach(a=>{
    if(a.action==='APROVADO')s='aprovado';
    if(a.action==='ALTERACAO')s='alteracao';
  });
  return s;
}
function statusLabel(s){return s==='aprovado'?'Aprovado':s==='alteracao'?'Em alteração':s==='programado'?'Programado':'Aguardando você'}
function latestAction(c,type=null){return [...state.actions].reverse().find(a=>a.contentId===c.id&&(!type||a.action===type))||null}
function history(c){return state.actions.filter(a=>a.contentId===c.id).slice().reverse()}
function thumb(c){return `https://drive.google.com/thumbnail?id=${c.coverId||c.videoId}&sz=w1200`}
function video(c){return `https://drive.google.com/file/d/${c.videoId}/preview`}
function dateObj(d){if(!d)return null;const [y,m,day]=d.split('-').map(Number);return new Date(y,m-1,day)}
function dateBR(d,opts={day:'2-digit',month:'short'}){const x=dateObj(d);return x?x.toLocaleDateString('pt-BR',opts).replace('.',''):''}
function dateLong(d){const x=dateObj(d);return x?x.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}):''}
function isoDate(x){return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`}
function dayDiff(d){
  const target=dateObj(d); if(!target)return null;
  const now=new Date(); now.setHours(0,0,0,0); target.setHours(0,0,0,0);
  return Math.round((target-now)/86400000);
}
function urgency(c){
  const n=dayDiff(c.date);
  if(n===null)return '';
  if(n===0)return 'Publicação prevista para hoje';
  if(n===1)return 'Publicação prevista para amanhã';
  if(n>1&&n<=7)return `Publicação em ${n} dias`;
  if(n<0)return `Data prevista: ${dateLong(c.date)}`;
  return `Previsto para ${dateLong(c.date)}`;
}
function stats(){
  const total=state.contents.length;
  const waiting=state.contents.filter(c=>statusFor(c)==='aguardando');
  const approved=state.contents.filter(c=>statusFor(c)==='aprovado');
  const changes=state.contents.filter(c=>statusFor(c)==='alteracao');
  return {total,waiting,approved,changes};
}
function nextPublication(){
  return state.contents.filter(c=>c.date).slice().sort((a,b)=>a.date.localeCompare(b.date)).find(c=>(dayDiff(c.date)??-999)>=0)
    || state.contents.filter(c=>c.date).slice().sort((a,b)=>a.date.localeCompare(b.date))[0]||null;
}
function pageHead(title,desc='',meta=''){
  return `<header class="page-head"><div><span class="page-kicker">${meta||'PORTAL DE ENTREGAS'}</span><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</div></header>`;
}
function statusBadge(c){const s=statusFor(c);return `<span class="status-pill ${s}"><i></i>${statusLabel(s)}</span>`}

function renderInicio(){
  const s=stats(), next=nextPublication(), focus=s.waiting.slice(0,3);
  const pct=s.total?Math.round((s.approved.length/s.total)*100):0;
  $('#page-inicio').innerHTML=`
    ${pageHead(`Olá, ${state.config.name}.`,'Aqui está o que precisa da sua atenção agora.',state.lot||'CICLO ATUAL')}
    <section class="attention">
      <div class="attention-copy">
        <span class="eyebrow">SUA PRÓXIMA AÇÃO</span>
        <div class="attention-number">${s.waiting.length}</div>
        <h2>${s.waiting.length===1?'conteúdo aguarda você':'conteúdos aguardam você'}</h2>
        <p>${s.waiting.length?'Revise o que está pendente para manter o planejamento em movimento.':'Tudo certo por aqui. Não há conteúdo aguardando sua decisão.'}</p>
        ${s.waiting.length?`<button class="btn primary big" data-review="${s.waiting[0].id}">REVISAR AGORA ${ICONS.arrow}</button>`:`<button class="btn big" data-nav="conteudos">VER CONTEÚDOS ${ICONS.arrow}</button>`}
      </div>
      <div class="progress-panel">
        <div class="progress-top"><span>CICLO ATUAL</span><strong>${pct}% aprovado</strong></div>
        <div class="progress-track"><i style="width:${pct}%"></i></div>
        <div class="mini-stats">
          <div><b>${s.approved.length}</b><span>Aprovados</span></div>
          <div><b>${s.changes.length}</b><span>Em alteração</span></div>
          <div><b>${s.total}</b><span>Total</span></div>
        </div>
        ${next?`<div class="next-pub"><span>PRÓXIMA PUBLICAÇÃO</span><strong>${dateLong(next.date)}</strong><small>${next.title}</small></div>`:''}
      </div>
    </section>

    <section class="home-grid">
      <article class="pending-panel">
        <div class="section-head"><div><span class="eyebrow">PRECISAM DE VOCÊ</span><h3>${s.waiting.length?`${s.waiting.length} ${s.waiting.length===1?'pendência':'pendências'}`:'Tudo aprovado'}</h3></div><button class="text-link" data-nav="conteudos">Ver todos ${ICONS.arrow}</button></div>
        <div class="decision-list">
          ${focus.length?focus.map((c,i)=>decisionRow(c,i+1)).join(''):`<div class="empty-state">${ICONS.check}<strong>Nenhuma decisão pendente.</strong><span>Você está em dia com este ciclo.</span></div>`}
        </div>
      </article>

      <article class="next-panel">
        <div class="section-head"><div><span class="eyebrow">PRÓXIMAS PUBLICAÇÕES</span><h3>Planejamento</h3></div><button class="text-link" data-nav="calendario">Calendário ${ICONS.arrow}</button></div>
        <div class="publication-list">${upcomingRows()}</div>
      </article>
    </section>

    <section class="partnership">
      <div><span class="eyebrow">AUDAZ × ${state.config.name.toUpperCase()}</span><strong>${state.config.manifesto||'CONTEÚDO COM INTENÇÃO.'}</strong></div>
      <p>${state.config.headline||''}</p>
    </section>`;
  bindDynamic();
}
function decisionRow(c,index){
  return `<button class="decision-row" data-review="${c.id}">
    <span class="decision-index">${String(index).padStart(2,'0')}</span>
    <img src="${thumb(c)}" alt="" loading="lazy">
    <span class="decision-copy"><strong>${c.title}</strong><small>${c.person} · ${dateLong(c.date)}</small><em>${urgency(c)}</em></span>
    ${statusBadge(c)}
    <span class="row-arrow">${ICONS.arrow}</span>
  </button>`;
}
function upcomingRows(){
  const arr=state.contents.filter(c=>c.date).slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  if(!arr.length)return '<div class="empty-state"><span>Sem publicações programadas.</span></div>';
  return arr.map(c=>`<button class="publication-row" data-review="${c.id}">
    <time><b>${dateBR(c.date,{day:'2-digit'})}</b><span>${dateBR(c.date,{month:'short'}).replace(/\d/g,'').trim()}</span></time>
    <img src="${thumb(c)}" alt="" loading="lazy">
    <span><strong>${c.title}</strong><small>${c.person}</small></span>
    ${statusBadge(c)}
  </button>`).join('');
}

function renderConteudos(){
  const s=stats();
  const waiting=[...s.waiting,...s.changes];
  $('#page-conteudos').innerHTML=`
    ${pageHead('Conteúdos','Encontre rapidamente o que precisa de você. A revisão completa acontece ao abrir cada item.',state.lot||'CICLO ATUAL')}
    <div class="content-summary"><span><b>${waiting.length}</b> precisam de você</span><span><b>${s.approved.length}</b> aprovados</span><span><b>${s.total}</b> no ciclo</span></div>
    <section class="content-section">
      <div class="section-head"><div><span class="eyebrow">PRIORIDADE</span><h3>Precisam de você · ${waiting.length}</h3></div></div>
      <div class="editorial-list">${waiting.length?waiting.map(editorialRow).join(''):'<div class="empty-state">'+ICONS.check+'<strong>Nada pendente.</strong></div>'}</div>
    </section>
    <details class="approved-section">
      <summary><span><span class="eyebrow">CONCLUÍDOS</span><strong>Aprovados · ${s.approved.length}</strong></span><i>+</i></summary>
      <div class="editorial-list">${s.approved.map(editorialRow).join('')||'<div class="empty-state">Nenhum conteúdo aprovado ainda.</div>'}</div>
    </details>`;
  bindDynamic();
}
function editorialRow(c){
  return `<button class="editorial-row" data-review="${c.id}">
    <img src="${thumb(c)}" alt="" loading="lazy">
    <span class="editorial-main"><strong>${c.title}</strong><small>${c.person} · ${dateLong(c.date)}</small></span>
    <span class="urgency">${urgency(c)}</span>
    ${statusBadge(c)}
    <span class="review-label">${statusFor(c)==='aprovado'?'VER':'REVISAR'} ${ICONS.arrow}</span>
  </button>`;
}

function reviewQueue(){
  const actionable=state.contents.filter(c=>statusFor(c)!=='aprovado');
  return actionable.length?actionable:state.contents;
}
function renderReview(){
  const c=state.contents.find(x=>x.id===state.reviewId); if(!c)return navigate('conteudos');
  const baseQueue=reviewQueue();
  const queue=baseQueue.some(x=>x.id===c.id)?baseQueue:state.contents;
  const pos=Math.max(0,queue.findIndex(x=>x.id===c.id));
  const prev=queue[pos-1], next=queue[pos+1], st=statusFor(c), last=latestAction(c), hist=history(c);
  $('#page-revisao').innerHTML=`
    <div class="review-topbar">
      <button class="back-link" data-nav="conteudos">← Voltar aos conteúdos</button>
      <div class="review-position"><strong>${pos+1}</strong> de <strong>${queue.length}</strong></div>
      <div class="review-nav">
        <button class="icon-round" ${prev?'data-review="'+prev.id+'"':'disabled'} aria-label="Anterior">←</button>
        <button class="icon-round" ${next?'data-review="'+next.id+'"':'disabled'} aria-label="Próximo">→</button>
      </div>
    </div>
    <header class="review-head">
      <div>
        ${statusBadge(c)}
        <h1>${c.title}</h1>
        <p>${c.person} · Publicação prevista: <strong>${dateLong(c.date)}</strong></p>
        <span class="urgency-line">${urgency(c)}</span>
      </div>
    </header>

    <div class="review-layout">
      <main class="review-main">
        <section class="review-block video-review">
          <div class="block-head"><span>VÍDEO</span><small>Assista antes de decidir</small></div>
          <div class="review-video"><button class="video-launch" data-play="${c.id}"><span>▶</span><strong>Assistir vídeo</strong></button></div>
        </section>

        <section class="review-block">
          <div class="block-head"><span>CAPA</span><small>Visual previsto para publicação</small></div>
          <div class="cover-review"><img src="${thumb(c)}" alt="Capa de ${c.title}" loading="lazy"></div>
        </section>

        <section class="review-block">
          <div class="block-head"><span>LEGENDA</span><button class="copy-btn" data-copy-caption="${c.id}">COPIAR LEGENDA</button></div>
          <div class="caption-review">${c.caption||'Legenda ainda não adicionada.'}</div>
        </section>

        ${hist.length?`<section class="review-block history-block"><div class="block-head"><span>HISTÓRICO</span></div>${hist.slice(0,5).map(h=>historyRow(h)).join('')}</section>`:''}
      </main>

      <aside class="decision-panel">
        <span class="eyebrow">SUA DECISÃO</span>
        ${st==='alteracao'?`<div class="alteration-received"><strong>Alteração solicitada</strong><p>${last?.feedback||'Solicitação registrada.'}</p><small>A Audaz está ajustando este conteúdo.</small></div>`:''}
        <textarea id="reviewFeedback" placeholder="O que precisa ser ajustado? Ex.: aos 00:18, trocar a frase de abertura."></textarea>
        <button class="btn primary approve-btn" data-approve="${c.id}">✓ APROVAR CONTEÚDO</button>
        <button class="btn revision-btn" data-revise="${c.id}">SOLICITAR ALTERAÇÃO</button>
        <p class="decision-help">Sua decisão fica registrada no histórico deste conteúdo.</p>
      </aside>
    </div>

    <div class="mobile-decision-bar">
      <button class="btn revision-btn" data-revise="${c.id}">PEDIR AJUSTE</button>
      <button class="btn primary" data-approve="${c.id}">✓ APROVAR</button>
    </div>`;
  bindDynamic();
}
function historyRow(h){
  const d=h.timestamp||'';
  const label=h.action==='APROVADO'?'Conteúdo aprovado.':h.action==='ALTERACAO'?'Alteração solicitada.':'Mudança de data solicitada.';
  return `<div class="human-history"><time>${d}</time><div><strong>${label}</strong>${h.feedback?`<p>“${h.feedback}”</p>`:''}${h.requestedDate?`<p>Nova data solicitada: ${dateLong(h.requestedDate)}</p>`:''}</div></div>`;
}

function renderCalendario(){
  const y=state.calendarDate.getFullYear(),m=state.calendarDate.getMonth();
  const first=new Date(y,m,1), days=new Date(y,m+1,0).getDate(), lead=(first.getDay()+6)%7;
  let cells=[];
  for(let i=0;i<lead;i++)cells.push('<div class="calendar-day out"></div>');
  for(let d=1;d<=days;d++){
    const ds=isoDate(new Date(y,m,d)),items=state.contents.filter(x=>x.date===ds);
    cells.push(`<div class="calendar-day"><span class="calendar-num">${d}</span>${items.map(c=>`<button class="calendar-content" data-review="${c.id}"><img src="${thumb(c)}"><span>${c.title}</span>${statusBadge(c)}</button>`).join('')}</div>`);
  }
  const monthItems=state.contents.filter(c=>{const x=dateObj(c.date);return x&&x.getFullYear()===y&&x.getMonth()===m}).sort((a,b)=>a.date.localeCompare(b.date));
  const groups={}; monthItems.forEach(c=>(groups[c.date]??=[]).push(c));
  const agenda=Object.entries(groups).map(([d,items])=>`<div class="agenda-group"><h3>${dateObj(d).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'}).replace(/\./g,'').toUpperCase()}</h3>${items.map(c=>`<button class="agenda-row" data-review="${c.id}"><img src="${thumb(c)}"><span><strong>${c.title}</strong><small>${c.person}</small></span>${statusBadge(c)}</button>`).join('')}</div>`).join('');
  $('#page-calendario').innerHTML=`
    ${pageHead('Calendário','Planejamento de publicação com status visível em cada conteúdo.',state.lot||'CICLO ATUAL')}
    <section class="calendar-shell">
      <div class="calendar-toolbar">
        <button class="icon-round" data-month="-1">←</button>
        <div><span class="eyebrow">PLANEJAMENTO</span><h2>${new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).toUpperCase()}</h2></div>
        <button class="today-btn" data-today>Hoje</button>
        <button class="icon-round" data-month="1">→</button>
      </div>
      <div class="calendar-legend"><span><i class="leg aprovado"></i>Aprovado</span><span><i class="leg aguardando"></i>Aguardando você</span><span><i class="leg alteracao"></i>Em alteração</span></div>
      <div class="week-head">${['SEG','TER','QUA','QUI','SEX','SÁB','DOM'].map(x=>`<span>${x}</span>`).join('')}</div>
      <div class="calendar-grid">${cells.join('')}</div>
      <div class="mobile-agenda">${agenda||'<div class="empty-state">Nenhuma publicação neste mês.</div>'}</div>
    </section>`;
  bindDynamic();
}

function renderArquivos(){
  const files=(state.config.files||[]).filter(f=>f.url&&f.url!=='#');
  $('#page-arquivos').innerHTML=`
    ${pageHead('Arquivos','Somente acessos disponíveis aparecem aqui. Nada de botões que não levam a lugar nenhum.','MATERIAIS')}
    <div class="file-list">${files.length?files.map(f=>`<a class="file-row" href="${f.url}" target="_blank" rel="noopener"><span class="file-symbol">↗</span><span><strong>${f.title}</strong><small>${f.description||''}</small></span><span>ABRIR ${ICONS.arrow}</span></a>`).join(''):`<div class="empty-state large"><strong>Nenhum material adicional disponível agora.</strong><span>Quando houver arquivos de apoio, eles aparecem aqui.</span></div>`}</div>`;
}

function renderPage(p){
  if(p==='inicio')renderInicio();
  if(p==='conteudos')renderConteudos();
  if(p==='calendario')renderCalendario();
  if(p==='arquivos')renderArquivos();
}

function bindDynamic(){
  $$('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
  $$('[data-review]').forEach(b=>b.onclick=()=>openReview(b.dataset.review));
  $$('[data-month]').forEach(b=>b.onclick=()=>{state.calendarDate=new Date(state.calendarDate.getFullYear(),state.calendarDate.getMonth()+Number(b.dataset.month),1);renderCalendario()});
  $$('[data-today]').forEach(b=>b.onclick=()=>{state.calendarDate=new Date();renderCalendario()});
  $$('[data-play]').forEach(b=>b.onclick=()=>{
    const c=state.contents.find(x=>x.id===b.dataset.play); if(!c)return;
    const iframe=document.createElement('iframe'); iframe.src=video(c); iframe.allowFullscreen=true; iframe.allow='autoplay; encrypted-media';
    b.parentElement.appendChild(iframe); b.remove();
  });
  $$('[data-copy-caption]').forEach(b=>b.onclick=async()=>{
    const c=state.contents.find(x=>x.id===b.dataset.copyCaption);
    try{await navigator.clipboard.writeText(c?.caption||'');toast('Legenda copiada')}catch{toast('Não foi possível copiar')}
  });
  $$('[data-approve]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.approve;
    const ok=await sendAction({action:'APROVADO',contentId:id}); if(!ok)return;
    toast('✓ Conteúdo aprovado');
    await new Promise(r=>setTimeout(r,850));
    await loadData({silent:true});
    const next=state.contents.find(c=>statusFor(c)!=='aprovado'&&c.id!==id);
    if(next)openReview(next.id); else navigate('inicio');
  });
  $$('[data-revise]').forEach(b=>b.onclick=async()=>{
    const feedback=$('#reviewFeedback')?.value.trim()||'';
    if(!feedback){$('#reviewFeedback')?.focus();toast('Descreva o ajuste primeiro');return}
    const ok=await sendAction({action:'ALTERACAO',contentId:b.dataset.revise,feedback}); if(!ok)return;
    toast('✓ Solicitação registrada');
    await new Promise(r=>setTimeout(r,850));
    await loadData({silent:true});
  });
}

async function sendAction(payload){
  try{
    await fetch(state.config.backend,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,projectKey:state.config.projectKey})});
    return true;
  }catch(e){console.error(e);toast('Não foi possível registrar agora');return false}
}
async function loadData({silent=false}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const res=await fetch(`${state.config.backend}?key=${encodeURIComponent(state.config.projectKey)}&_=${Date.now()}`,{signal:controller.signal,cache:'no-store'});
    if(!res.ok)throw new Error(`http_${res.status}`);
    const data=await res.json(); if(!data.ok)throw new Error(data.error||'backend_error');
    state.contents=data.contents||[];state.actions=data.actions||[];state.lot=data.lot||state.lot;
    const dates=state.contents.map(c=>c.date).filter(Boolean).sort();
    if(dates.length&&state.calendarDate.getFullYear()===new Date().getFullYear()&&state.calendarDate.getMonth()===new Date().getMonth()){
      const d=dateObj(dates[0]); if(d)state.calendarDate=new Date(d.getFullYear(),d.getMonth(),1);
    }
    if(state.reviewId)renderReview();else renderPage(state.page);
    if(!silent)toast('Portal sincronizado');
  }catch(e){console.error('sync',e);renderPage(state.page);if(!silent)toast('Portal aberto · sincronização indisponível')}finally{clearTimeout(timer)}
}
async function mountShell(){
  const r=await fetch(`${BASE}shell.html`,{cache:'no-store'}); if(!r.ok)throw new Error('shell');
  document.body.innerHTML=await r.text();
}
async function init(){
  try{await mountShell()}catch{document.body.innerHTML='<div class="boot-screen">Não foi possível carregar a V2.</div>';return}
  setupTheme(); bindNav();
  $('#mobileMenu').onclick=()=>$('#drawer').classList.add('show');
  $('#closeDrawer').onclick=()=>$('#drawer').classList.remove('show');
  $('#drawer').onclick=e=>{if(e.target===$('#drawer'))$('#drawer').classList.remove('show')};
  try{
    const r=await fetch(`${ROOT}clientes/${CLIENT}.json`,{cache:'no-store'}); if(!r.ok)throw new Error('config');
    state.config=await r.json();
  }catch{document.body.innerHTML='<div class="boot-screen">Cliente não encontrado.</div>';return}
  document.documentElement.style.setProperty('--client-accent',state.config.accent||'#ff1900');
  $$('[data-client-name]').forEach(el=>el.textContent=state.config.name.toUpperCase());
  $('#clientDescriptor').textContent=(state.config.descriptor||'').toUpperCase();
  renderNav();renderInicio();
  if(state.config.backend&&state.config.projectKey)loadData({silent:true});
}
init();