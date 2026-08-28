const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const ICONS={
 dashboard:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/></svg>',
 conteudos:'<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6"/></svg>',
 calendario:'<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v6M16 3v6M4 10h16"/></svg>',
 aprovacoes:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
 arquivos:'<svg viewBox="0 0 24 24"><path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2"/></svg>'
};
const NAV=[['dashboard','Dashboard'],['conteudos','Conteúdos'],['calendario','Calendário'],['aprovacoes','Aprovações'],['arquivos','Arquivos']];
const state={config:null,contents:[],actions:[],page:'dashboard'};
const params=new URLSearchParams(location.search);
const BASE=document.body.dataset.base||'./';
const CLIENT=document.body.dataset.client||params.get('cliente')||'';

function toast(t){
  const el=$('#toast');
  if(!el)return;
  el.textContent=t;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>el.classList.remove('show'),1900);
}
function setTheme(mode){localStorage.setItem('audaz-theme',mode);applyTheme()}
function applyTheme(){
  const pref=localStorage.getItem('audaz-theme')||'system';
  let resolved=pref;
  if(pref==='system')resolved=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
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
  return NAV.filter(([id])=>state.config.features?.[id]!==false)
    .map(([id,label])=>`<button class="nav-btn ${id===state.page?'active':''}" data-nav="${id}">${ICONS[id]}<span>${label}</span></button>`)
    .join('');
}
function bindNav(){
  const handler=e=>{
    const b=e.target.closest('[data-nav]');
    if(!b)return;
    navigate(b.dataset.nav);
  };
  $('#sideNav').onclick=handler;
  $('#drawerNav').onclick=handler;
  $$('.help-card').forEach(b=>b.onclick=handler);
}
function renderNav(){
  const h=navHtml();
  $('#sideNav').innerHTML=h;
  $('#drawerNav').innerHTML=h;
}
function navigate(page){
  state.page=page;
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));
  renderNav();
  $('#drawer').classList.remove('show');
  window.scrollTo({top:0,behavior:'smooth'});
  renderPage(page);
}
function statusFor(c){
  let s=c.initialStatus||'aguardando';
  state.actions.filter(a=>a.contentId===c.id).forEach(a=>{
    if(a.action==='APROVADO')s='aprovado';
    if(a.action==='ALTERACAO')s='alteracao';
  });
  return s;
}
function latestDateRequest(c){return [...state.actions].reverse().find(a=>a.contentId===c.id&&a.action==='MUDANCA_DATA')||null}
function actionHistory(c){return state.actions.filter(a=>a.contentId===c.id).slice(-4).reverse()}
function thumb(c){return `https://drive.google.com/thumbnail?id=${c.coverId||c.videoId}&sz=w1000`}
function video(c){return `https://drive.google.com/file/d/${c.videoId}/preview`}
function dateBR(d){
  if(!d)return'';
  const [y,m,day]=d.split('-').map(Number);
  return new Date(y,m-1,day).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function pageHead(title,desc,action=''){
  return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div>${action?`<div class="page-actions">${action}</div>`:''}</div>`;
}
function stats(){
  const total=state.contents.length;
  const ap=state.contents.filter(c=>statusFor(c)==='aprovado').length;
  const rev=state.contents.filter(c=>statusFor(c)==='alteracao').length;
  return {total,ap,rev,pending:Math.max(0,total-ap),published:0};
}
function iconBox(name){return `<span class="stat-icon">${ICONS[name]||ICONS.dashboard}</span>`}

function dashboardPendingRow(c){
  const st=statusFor(c);
  return `<button class="decision-row" data-content="${c.id}">
    <span class="decision-thumb"><img src="${thumb(c)}" onerror="this.style.display='none'"></span>
    <span class="decision-copy"><strong>${c.title}</strong><small>${c.person} · ${dateBR(c.date)}</small></span>
    <span class="badge ${st}">${labelStatus(st)}</span>
    <span class="decision-arrow">→</span>
  </button>`;
}

function quickAction(icon,title,text,go){
  return `<button class="quick-action" data-go="${go}">
    <span class="quick-icon">${ICONS[icon]}</span>
    <span><strong>${title}</strong><small>${text}</small></span>
    <i>→</i>
  </button>`;
}

function renderDashboard(){
  const s=stats();
  const pending=state.contents.filter(c=>statusFor(c)!=='aprovado').slice(0,4);
  const recent=[...state.contents].slice(0,3);
  const progress=s.total?Math.round((s.ap/s.total)*100):0;
  const pendingTitle=s.pending===1?'1 conteúdo precisa da sua decisão':`${s.pending} conteúdos precisam da sua decisão`;

  $('#page-dashboard').innerHTML=`
    ${pageHead(state.config.name,'Revise o que está pendente, acompanhe o calendário e registre suas decisões em poucos cliques.')}

    <div class="stats">
      <button class="stat stat-button record" data-go="conteudos">
        <span class="eyebrow">CONTEÚDOS DO CICLO</span>${iconBox('conteudos')}<b>${s.total}</b><small>Planejados</small>
      </button>
      <button class="stat stat-button" data-go="conteudos">
        <span class="eyebrow">APROVADOS</span>${iconBox('aprovacoes')}<b>${s.ap}</b><small>${progress}% do total</small>
      </button>
      <button class="stat stat-button attention" data-go="aprovacoes">
        <span class="eyebrow">AGUARDANDO DECISÃO</span>${iconBox('dashboard')}<b>${s.pending}</b><small>Prontos para revisar</small>
      </button>
      <button class="stat stat-button" data-go="aprovacoes">
        <span class="eyebrow">EM REVISÃO</span>${iconBox('calendario')}<b>${s.rev}</b><small>Alterações solicitadas</small>
      </button>
    </div>

    <div class="dashboard-grid approval-first">
      <article class="approval-focus-card">
        <div class="focus-head">
          <div>
            <span class="eyebrow accent">SUA PRÓXIMA AÇÃO</span>
            <h2>${s.pending?pendingTitle:'Tudo aprovado por aqui.'}</h2>
            <p>${s.pending?'Abra um conteúdo, assista, confira capa e legenda e aprove ou solicite o ajuste necessário.':'Quando novos conteúdos entrarem no ciclo, eles aparecerão aqui para sua revisão.'}</p>
          </div>
          <div class="progress-badge">
            <strong>${progress}%</strong>
            <span>aprovado</span>
          </div>
        </div>

        <div class="progress-track"><span style="width:${progress}%"></span></div>

        <div class="decision-list">
          ${pending.length?pending.map(dashboardPendingRow).join(''):'<div class="decision-empty"><span>✓</span><strong>Ciclo em dia</strong><small>Não há conteúdos aguardando decisão.</small></div>'}
        </div>

        <div class="focus-actions">
          <button class="btn primary btn-wide" data-go="aprovacoes"><span>REVISAR PENDENTES</span><i>→</i></button>
          <button class="btn ghost" data-go="conteudos"><span>VER TODOS</span><i>→</i></button>
        </div>
      </article>

      <article class="calendar-card">
        <div class="section-title"><h3>CALENDÁRIO DE PUBLICAÇÕES</h3><button data-go="calendario">VER COMPLETO <span>→</span></button></div>
        ${miniCalendar()}
      </article>
    </div>

    <div class="below-grid">
      <article class="recent-card">
        <div class="section-title"><h3>CONTEÚDOS RECENTES</h3><button data-go="conteudos">VER TODOS <span>→</span></button></div>
        ${recent.map(recentRow).join('')||'<div class="empty">Nenhum conteúdo carregado.</div>'}
      </article>

      <article class="quick-card">
        <div class="section-title"><h3>ACESSO RÁPIDO</h3><span class="eyebrow">SEU PROJETO</span></div>
        <div class="quick-list">
          ${quickAction('conteudos','Todos os conteúdos','Vídeos, capas e legendas.','conteudos')}
          ${quickAction('calendario','Planejamento','Confira as próximas datas.','calendario')}
          ${quickAction('arquivos','Arquivos','Materiais e acessos do projeto.','arquivos')}
        </div>
      </article>
    </div>

    <article class="partnership-banner">
      <span class="partnership-kicker">AUDAZ × ${state.config.name.toUpperCase()}</span>
      <div class="partnership-copy">
        <h2>${state.config.manifesto}</h2>
        <p>${state.config.headline}</p>
      </div>
      <div class="partnership-sign">CONSTRUÍMOS JUNTOS <span>●</span></div>
    </article>
  `;
  bindGo();
}

function recentRow(c){
  const st=statusFor(c);
  return `<button class="recent-row" data-content="${c.id}">
    <div class="recent-thumb"><img src="${thumb(c)}" onerror="this.style.display='none'"></div>
    <div><strong>${c.title}</strong><br><small>${c.person}</small></div>
    <span class="badge ${st}">${labelStatus(st)}</span>
    <small>${dateBR(c.date)}</small>
    <span class="row-arrow">→</span>
  </button>`;
}
function labelStatus(s){return s==='aprovado'?'Aprovado':s==='alteracao'?'Em revisão':'Aguardando'}

function miniCalendar(){
  if(!state.contents.length)return'<div class="empty">Calendário será exibido quando houver conteúdos.</div>';
  const dates=state.contents.map(c=>c.date).filter(Boolean).sort();
  const base=dates[0]||'2026-09-01';
  const [y,m]=base.split('-').map(Number);
  const first=new Date(y,m-1,1),days=new Date(y,m,0).getDate(),lead=(first.getDay()+6)%7;
  let cells=[];
  for(let i=0;i<lead;i++)cells.push('<div class="mini-cell"></div>');
  for(let d=1;d<=days;d++){
    const ds=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const c=state.contents.find(x=>x.date===ds);
    cells.push(`<div class="mini-cell"><span class="day">${String(d).padStart(2,'0')}</span>${c?`<div class="mini-post" data-content="${c.id}"><img src="${thumb(c)}"><i class="status-dot ${statusFor(c)}"></i></div>`:''}</div>`);
  }
  return `<div class="mini-calendar">${cells.join('')}</div>`;
}

function renderConteudos(filter=null){
  let arr=state.contents;
  if(filter)arr=arr.filter(filter);
  $('#page-conteudos').innerHTML=`${pageHead('Conteúdos','Assista, confira capa e legenda e registre sua decisão.')}<div class="content-grid">${arr.map(contentCard).join('')||'<div class="empty">Nenhum conteúdo disponível.</div>'}</div>`;
  bindContentActions();
}
function contentCard(c){
  const st=statusFor(c),hist=actionHistory(c);
  return `<article class="content-card" data-card="${c.id}">
    <div class="content-media">
      <div class="video-box"><button class="play-btn" data-play="${c.id}"><span>▶</span></button></div>
      <div class="cover-box"><img src="${thumb(c)}" loading="lazy"></div>
    </div>
    <div class="content-body">
      <div class="content-top">
        <div><span class="content-meta">${c.id} · ${c.person}</span><h3>${c.title}</h3></div>
        <span class="badge ${st}">${labelStatus(st)}</span>
      </div>
      <div class="caption">${c.caption||'Legenda ainda não adicionada.'}</div>
      <textarea class="feedback-box" placeholder="Ex.: aos 00:18, trocar a frase..."></textarea>
      <div class="card-actions">
        <button class="btn primary" data-approve="${c.id}"><span>APROVAR</span><i>✓</i></button>
        <button class="btn" data-revise="${c.id}"><span>PEDIR ALTERAÇÃO</span><i>→</i></button>
      </div>
      ${hist.length?`<div class="history"><span class="eyebrow">HISTÓRICO</span>${hist.map(h=>`<div class="history-item"><b>${h.action==='APROVADO'?'Aprovado':h.action==='ALTERACAO'?'Alteração solicitada':'Mudança de data'}</b> · ${h.timestamp}${h.feedback?`<br>${h.feedback}`:''}${h.requestedDate?`<br>Nova data: ${dateBR(h.requestedDate)}`:''}</div>`).join('')}</div>`:''}
    </div>
  </article>`;
}
function bindContentActions(){
  $$('[data-play]').forEach(b=>b.onclick=()=>{
    const c=state.contents.find(x=>x.id===b.dataset.play);
    const iframe=document.createElement('iframe');
    iframe.src=video(c);
    iframe.allowFullscreen=true;
    b.parentElement.appendChild(iframe);
    b.remove();
  });
  $$('[data-approve]').forEach(b=>b.onclick=()=>sendAction({action:'APROVADO',contentId:b.dataset.approve}));
  $$('[data-revise]').forEach(b=>b.onclick=()=>{
    const card=b.closest('[data-card]'),ta=card.querySelector('textarea'),feedback=ta.value.trim();
    if(!feedback){ta.focus();toast('Descreva a alteração primeiro');return}
    sendAction({action:'ALTERACAO',contentId:b.dataset.revise,feedback});
  });
}

function renderCalendar(){
  const dates=state.contents.map(c=>c.date).filter(Boolean).sort();
  const base=dates[0]||new Date().toISOString().slice(0,7)+'-01';
  const [y,m]=base.split('-').map(Number);
  const first=new Date(y,m-1,1),days=new Date(y,m,0).getDate(),lead=(first.getDay()+6)%7;
  let cells=[];
  for(let i=0;i<lead;i++)cells.push('<div class="calendar-day out"></div>');
  for(let d=1;d<=days;d++){
    const ds=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const items=state.contents.filter(x=>x.date===ds);
    cells.push(`<div class="calendar-day"><span class="calendar-daynum">${String(d).padStart(2,'0')}</span>${items.map(c=>`<div class="calendar-item" data-date-content="${c.id}"><img src="${thumb(c)}"><div>${c.person.split(' ')[0]} · ${labelStatus(statusFor(c))}</div></div>`).join('')}</div>`);
  }
  const agenda=state.contents.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(c=>`<div class="agenda-item" data-date-content="${c.id}"><img src="${thumb(c)}"><div><h4>${c.title}</h4><small>${c.person} · ${dateBR(c.date)}</small></div><span class="badge ${statusFor(c)}">${labelStatus(statusFor(c))}</span></div>`).join('');
  $('#page-calendario').innerHTML=`${pageHead('Calendário','Visualize o planejamento e solicite uma nova data quando necessário.')}<div class="calendar-large"><div class="calendar-toolbar"><h2>${new Date(y,m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h2><span class="eyebrow">DATAS PREVISTAS</span></div><div class="calendar-grid">${cells.join('')}</div><div class="mobile-agenda">${agenda}</div></div>`;
  $$('[data-date-content]').forEach(el=>el.onclick=()=>openDateModal(el.dataset.dateContent));
}

function renderAprovacoes(){
  const pending=state.contents.filter(c=>statusFor(c)!=='aprovado');
  $('#page-aprovacoes').innerHTML=`${pageHead('Aprovações','Uma visão objetiva do que ainda precisa de decisão.')}<div class="approval-list">${pending.map(c=>`<div class="approval-row"><img src="${thumb(c)}"><div><h4>${c.title}</h4><p>${c.person} · ${labelStatus(statusFor(c))}</p></div><button class="btn" data-open-content="${c.id}"><span>REVISAR</span><i>→</i></button></div>`).join('')||'<div class="empty">Tudo aprovado por aqui. ✓</div>'}</div>`;
  $$('[data-open-content]').forEach(b=>b.onclick=()=>{
    navigate('conteudos');
    setTimeout(()=>document.querySelector(`[data-card="${b.dataset.openContent}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),100);
  });
}

function renderArquivos(){
  const files=state.config.files||[];
  $('#page-arquivos').innerHTML=`${pageHead('Arquivos','Materiais de apoio e acessos relacionados ao projeto.')}<div class="files-grid">${files.map(f=>`<a class="file-card" href="${f.url||'#'}" ${f.url&&f.url!=='#'?'target="_blank"':''}><div class="file-icon">${f.type==='folder'?'⌁':f.type==='video'?'▶':'→'}</div><h3>${f.title}</h3><p>${f.description}</p><span class="file-arrow">→</span></a>`).join('')||'<div class="empty">Nenhum arquivo adicional neste momento.</div>'}</div>`;
}

function renderPage(p){
  if(p==='dashboard')renderDashboard();
  if(p==='conteudos')renderConteudos();
  if(p==='calendario')renderCalendar();
  if(p==='aprovacoes')renderAprovacoes();
  if(p==='arquivos')renderArquivos();
}
function bindGo(){
  $$('[data-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.go));
  $$('[data-content]').forEach(b=>b.onclick=()=>{
    navigate('conteudos');
    setTimeout(()=>document.querySelector(`[data-card="${b.dataset.content}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),100);
  });
}

async function sendAction(payload){
  try{
    toast('Registrando...');
    await fetch(state.config.backend,{
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({...payload,projectKey:state.config.projectKey})
    });
    setTimeout(()=>loadData({silent:true}),900);
  }catch(e){
    toast('Não foi possível registrar agora');
  }
}
function openDateModal(id){
  const c=state.contents.find(x=>x.id===id),req=latestDateRequest(c);
  $('#modalCard').innerHTML=`<span class="eyebrow">ALTERAR DATA</span><h3>${c.title}</h3><p>${c.person}<br>Data planejada: <strong>${dateBR(c.date)}</strong>${req?`<br>Solicitação atual: <strong>${dateBR(req.requestedDate)}</strong>`:''}</p><input id="requestedDate" type="date" value="${req?.requestedDate||c.date}"><textarea id="dateReason" placeholder="Motivo (opcional)">${req?.reason||''}</textarea><div class="modal-actions"><button class="btn" id="cancelModal"><span>FECHAR</span></button><button class="btn primary" id="sendDate"><span>SOLICITAR NOVA DATA</span><i>→</i></button></div>`;
  $('#modal').classList.add('show');
  $('#cancelModal').onclick=()=>$('#modal').classList.remove('show');
  $('#sendDate').onclick=()=>{
    const requestedDate=$('#requestedDate').value,reason=$('#dateReason').value.trim();
    if(!requestedDate)return toast('Escolha uma data');
    $('#modal').classList.remove('show');
    sendAction({action:'MUDANCA_DATA',contentId:id,requestedDate,reason});
  };
}
async function loadData({silent=false}={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const url=`${state.config.backend}?key=${encodeURIComponent(state.config.projectKey)}&_=${Date.now()}`;
    const res=await fetch(url,{signal:controller.signal,cache:'no-store'});
    if(!res.ok)throw new Error(`http_${res.status}`);
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||'backend_error');
    state.contents=data.contents||[];
    state.actions=data.actions||[];
    renderPage(state.page);
    if(!silent)toast('Portal sincronizado');
  }catch(e){
    console.error('Falha de sincronização',e);
    renderPage(state.page);
    if(!silent)toast('Portal aberto · sincronização indisponível no momento');
  }finally{
    clearTimeout(timeout);
  }
}
async function mountShell(){
  if($('#app'))return;
  const r=await fetch(`${BASE}shell.html`,{cache:'no-store'});
  if(!r.ok)throw new Error('shell_not_found');
  document.body.innerHTML=await r.text();
}
async function init(){
  if(!CLIENT){
    document.body.innerHTML='<div class="loading">Link de cliente inválido.</div>';
    return;
  }
  try{await mountShell()}
  catch(e){
    document.body.innerHTML='<div class="loading">Não foi possível carregar o portal.</div>';
    return;
  }
  setupTheme();
  $('#mobileMenu').onclick=()=>$('#drawer').classList.add('show');
  $('#closeDrawer').onclick=()=>$('#drawer').classList.remove('show');
  $('#drawer').onclick=e=>{if(e.target===$('#drawer'))$('#drawer').classList.remove('show')};
  bindNav();

  try{
    const r=await fetch(`${BASE}clientes/${CLIENT}.json`,{cache:'no-store'});
    if(!r.ok)throw new Error('client_config_not_found');
    state.config=await r.json();
  }catch(e){
    $('#page-dashboard').innerHTML='<div class="loading">Cliente não encontrado.</div>';
    return;
  }

  document.documentElement.style.setProperty('--client-accent',state.config.accent||'#ff1900');
  $('#clientLogo').innerHTML=state.config.logo
    ?`<img class="client-logo-img" src="${BASE}${state.config.logo}" alt="${state.config.name}">`
    :`<div class="client-word">${state.config.name.toUpperCase()}</div><small>${(state.config.descriptor||'').toUpperCase()}</small>`;

  renderNav();
  renderPage('dashboard');

  if(state.config.backend&&state.config.projectKey)loadData({silent:true});
  else toast('Portal em preparação');
}
init();