// ===== Globals =====
const STORAGE_KEY = 'kanban_state_v3';
var state = null;

// ===== Local DB helpers (use same storage style as profile) =====
const TEAM_KEY = 'team_members_v1'; // [{id,name,avatar?,today?}]

function loadLocalTeam(){
  try{
    const raw = localStorage.getItem(TEAM_KEY);
    if(!raw) return null;
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) return arr;
  }catch(e){ console.warn('[TEAM_KEY] parse error', e); }
  return null;
}

function saveLocalTeam(list){
  try{ localStorage.setItem(TEAM_KEY, JSON.stringify(list||[])); }
  catch(e){ console.warn('[TEAM_KEY] save error', e); }
}


// ===== User storage helpers =====
const AUTH_KEY = 'user_auth_v1';        // {username, password}
const PROFILE_KEY = 'user_profile_v1';  // {name, phone, email, rating, avatar}
const LOCK_KEY = 'auth_lock_v1';        // {fail, until}

function ensureUserDefaults(){
  if(!localStorage.getItem(AUTH_KEY)){
    localStorage.setItem(AUTH_KEY, JSON.stringify({username:'123', password:'123'}));
  }
  if(!localStorage.getItem(PROFILE_KEY)){
    localStorage.setItem(PROFILE_KEY, JSON.stringify({name:'User', phone:'', email:'', rating:80, avatar:'assets/img/avatar.svg'}));
  }
}
function getAuth(){ try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'{}');}catch(_){return{};} }
function setAuth(obj){ localStorage.setItem(AUTH_KEY, JSON.stringify(obj||{})); }
function getProfile(){ try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}');}catch(_){return{};} }
function setProfile(obj){ localStorage.setItem(PROFILE_KEY, JSON.stringify(obj||{})); }
function getLock(){ try{return JSON.parse(localStorage.getItem(LOCK_KEY)||'{}');}catch(_){return{};} }
function setLock(obj){ localStorage.setItem(LOCK_KEY, JSON.stringify(obj||{})); }
function clearLock(){ localStorage.removeItem(LOCK_KEY); }

// ===== Kanban core =====
function startKanban(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved){ state = JSON.parse(saved); }
  }catch(e){ state = null; }
  if(!state || !Array.isArray(state.columns) || state.columns.length===0){
    if(typeof initData!=='undefined' && Array.isArray(initData.columns)){
      state = JSON.parse(JSON.stringify(initData));
    }else{
      state = {columns:[]};
    }
    saveState();
  }
  render();
}

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e){ console.warn('Cannot save state:', e); }
}

const $kanban = document.getElementById('kanban');
function el(tag,cls,txt){ const e=document.createElement(tag); if(cls)e.className=cls; if(txt!==undefined)e.textContent=txt; return e; }
function cap(s){return s? s[0].toUpperCase()+s.slice(1):''}

function render(){
  $kanban.innerHTML='';
  (state.columns||[]).forEach(col=>{
    const wrap=el('div','col');
    const h=el('div','col-h'); const ttl=el('div','ttl'); 
    ttl.append(document.createTextNode(col.title||'Column'), el('span','count', String((col.tasks||[]).length)));
    h.append(ttl, el('div','act'));
    const list=el('div','list');
    (col.tasks||[]).forEach(t=> list.append(renderCard(t)) );
    const add=el('div','add'); const addBtn=el('button','add-btn','+ Add Task');
// Open popup to create task, store column index in form dataset
addBtn.onclick=()=>{
  const idx = (state.columns||[]).indexOf(col);
  const dlg = document.getElementById('newTaskDlg');
  const form = document.getElementById('newTaskForm');
  const ntTitle = document.getElementById('ntTitle');
  const ntSubmit = document.getElementById('ntSubmit');
  const ntTitleErr = document.getElementById('ntTitleErr');
  if(form){ form.setAttribute('data-col', String(idx)); }
  if(ntTitle){ ntTitle.value=''; ntTitle.focus(); }
  if(ntDue){ ntDue.value = new Date().toISOString().slice(0,10); }
  if(ntSubmit){ ntSubmit.disabled = true; }
  if(ntTitleErr){ ntTitleErr.textContent=''; }
  if(dlg?.showModal) dlg.showModal(); else if(dlg) dlg.open = true;
  if(ntAssignee && assigneesCache && assigneesCache.length){ ntAssignee.value = String(assigneesCache[0].id); }
};
add.append(addBtn);
    wrap.append(h,list,add); $kanban.append(wrap);
  });
}

function renderCard(t){
  const c = el('div','card');
  c.onclick = () => showDetail(t);

  // top row with priority and delete button
  const top = el('div','row');
  top.append(el('span','pri '+(t.pri||'low'), cap(t.pri||'low')));
  const del = el('button','icon-btn','×');
  del.title = 'Xoá task';
  del.onclick = (ev)=>{
    ev.stopPropagation();
    // find and remove from state
    for (const col of (state.columns||[])) {
      const idx = (col.tasks||[]).indexOf(t);
      if (idx >= 0) {
        col.tasks.splice(idx,1);
        saveState(); render();
        break;
      }
    }
  };
  top.append(del);

  // title
  const title = el('div','title', t.title || '—');

  // meta row
  const meta = el('div','meta');
  if (t.date) meta.append(el('span','chip','📅 '+t.date));
  if (t.assignee) meta.append(el('span','chip','👤 '+t.assignee));
  (t.tags||[]).forEach(s => meta.append(el('span','chip', s)));

  c.append(top, title, meta);
  return c;
}

// ===== Detail modal & universal close =====
const dDlg=document.getElementById('detailDlg'); const q=id=>document.getElementById(id);
document.addEventListener('click', (e)=>{ if(e.target.matches('[data-close]')){ const dlg=e.target.closest('dialog'); if(dlg) dlg.close(); }});
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ document.querySelectorAll('dialog[open]').forEach(d=> d.close()); }});
document.querySelectorAll('dialog').forEach(d=>{ d.addEventListener('click', (e)=>{ if(e.target===d) d.close(); }); });

function showDetail(t){
  q('dTitle').textContent=t.title||'—'; q('dProject').textContent=t.project||'—';
  const badges=q('dBadges'); badges.innerHTML=''; (t.tags||[]).forEach(tag=> badges.append(el('span','badge '+(tag.toLowerCase().includes('high')?'pink':'gray'), tag)));
  q('dDesc').textContent=t.note||''; q('dDue').textContent=t.due||(t.date||'—'); q('dCreated').textContent=t.created||'—';
  const as=q('dAssignees'); as.innerHTML=''; (t.assignees||[]).forEach(a=>{ const chip=el('span','avatar'); const img=document.createElement('img'); img.src=a.avatar||'assets/img/avatar.svg'; chip.append(img, document.createTextNode(a.name||'')); as.append(chip); });
  const done=t.subtasks?.done||0, total=t.subtasks?.total||0, pct= total? Math.round(done/total*100):0; q('dSubC').textContent=`${done}/${total}`; q('dProg').style.width=pct+'%'; q('dPct').textContent=pct+'%';
  document.getElementById('fAtt').textContent=t.attachments||0; document.getElementById('fCmt').textContent=t.comments||0; document.getElementById('fSpace').textContent=t.space||'—';
  q('dEdit').onclick=()=>{ t.title=(t.title||'Task')+' (Edited)'; saveState(); render(); dDlg.close(); };
  q('dComplete').onclick=()=>{ alert('✅ Completed (demo)'); };
  dDlg.showModal();
}

// ===== App wiring (no login code here) =====
document.addEventListener('DOMContentLoaded', function(){
  // Guard: must be logged in
  if(localStorage.getItem('auth_ok')!=='1'){ window.location.href='login.html'; return; }
  ensureUserDefaults();

  // Start app
  startKanban();
  renderMembers();

  // Account menu

  // Load profile into dialog
  function loadProfileUI(){
    const p = getProfile();
    (document.getElementById('pfAvatar')||{}).src = p.avatar || 'assets/img/avatar.svg';
    (document.getElementById('pfName')||{}).value = p.name || '';
    (document.getElementById('pfPhone')||{}).value = p.phone || '';
    (document.getElementById('pfEmail')||{}).value = p.email || '';
    (document.getElementById('pfRating')||{}).value = (p.rating!=null?p.rating:'');
  }

  const btnAccount = document.getElementById('btnAccount');
  const menu = document.getElementById('acctMenu');
  const profileDlg = document.getElementById('profileDlg');
  function hideMenu(){ if(menu && !menu.hidden){ menu.hidden = true; } }
  function toggleMenu(){ if(menu){ menu.hidden = !menu.hidden; } }
  btnAccount.addEventListener('click', (e)=>{ e.stopPropagation(); toggleMenu(); });
  document.addEventListener('click', (e)=>{ if(!menu) return; const inside = menu.contains(e.target)||btnAccount.contains(e.target); if(!inside) hideMenu(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideMenu(); });
  menu.addEventListener('click', (e)=>{
    const act = e.target.getAttribute('data-action');
    if(!act) return;
    if(act==='team'){ window.location.href='team.html'; }
    else if(act==='logout'){ localStorage.setItem('auth_ok','0'); window.location.href='login.html'; }
    else if(act==='profile'){ loadProfileUI(); (document.getElementById('profileDlg')).showModal(); }
  });

  // Search
  document.getElementById('btn-refresh').onclick=()=>render();
  document.getElementById('btn-clear').onclick=()=>{ document.getElementById('q-task').value=''; document.querySelectorAll('.card').forEach(c=>c.style.display=''); };
  document.getElementById('q-task').addEventListener('input',(e)=>{ const qv=e.target.value.toLowerCase(); document.querySelectorAll('.card').forEach(c=>{ const tt=c.querySelector('.title').textContent.toLowerCase(); c.style.display= tt.includes(qv)?'':'none';});});

  // Profile actions
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  if(btnSaveProfile){
    btnSaveProfile.addEventListener('click', ()=>{
      const p = getProfile();
      const np = {
        ...p,
        name:(document.getElementById('pfName').value||'').trim(),
        phone:(document.getElementById('pfPhone').value||'').trim(),
        email:(document.getElementById('pfEmail').value||'').trim(),
        rating:Number(document.getElementById('pfRating').value||p.rating||0),
      };
      setProfile(np);
      alert('✅ Đã lưu hồ sơ'); profileDlg.close();
    });
  }
  const btnChangePw = document.getElementById('btnChangePw');
  if(btnChangePw){
    btnChangePw.addEventListener('click', ()=>{
      const oldv=(document.getElementById('pwOld').value||''); const newv=(document.getElementById('pwNew').value||''); const new2=(document.getElementById('pwNew2').value||'');
      const auth=getAuth();
      if(!oldv || oldv!==String(auth.password||'')){ alert('❌ Mật khẩu hiện tại không đúng'); return; }
      if(!newv || newv.length<3){ alert('❌ Mật khẩu mới tối thiểu 3 ký tự'); return; }
      if(newv!==new2){ alert('❌ Xác nhận mật khẩu không khớp'); return; }
      setAuth({...auth, password:newv});
      document.getElementById('pwOld').value=''; document.getElementById('pwNew').value=''; document.getElementById('pwNew2').value='';
      alert('✅ Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.');
    });
  }

  window.addEventListener('beforeunload', saveState);
});

// ===== Members rendering =====
function renderMembers(){
  const grid = document.getElementById('membersGrid');
  if(!grid || typeof members==='undefined') return;
  grid.innerHTML = '';
  members.forEach(m=>{
    const wrap = document.createElement('div'); wrap.className='member';
    const top = document.createElement('div'); top.className='member__top';
    const img = document.createElement('img'); img.className='member__avatar'; img.src = m.avatar||'assets/img/avatar.svg';
    const name = document.createElement('div'); name.className='member__name'; name.textContent = m.name;
    top.append(img, name);

    const stats = document.createElement('div'); stats.className='member__stats'; stats.textContent = m.today || '';

    const actions = document.createElement('div'); actions.className='member__actions';
    const btnAssign = document.createElement('button'); btnAssign.className='btn'; btnAssign.textContent='Giao việc'; btnAssign.dataset.emp = m.id;
    const btnReview = document.createElement('button'); btnReview.className='btn btn--primary'; btnReview.textContent='Đánh giá'; btnReview.dataset.emp = m.id;
    actions.append(btnAssign, btnReview);

    wrap.append(top, stats, actions); grid.append(wrap);
  });

  // wire actions
  grid.addEventListener('click', (e)=>{
    const t = e.target; const empId = t.dataset.emp; if(!empId) return;
    const emp = (typeof members!=='undefined' ? members.find(x=>x.id===empId) : null); if(!emp) return;
    if(t.textContent==='Giao việc'){
      document.getElementById('asgEmpName').textContent = emp.name;
      document.getElementById('assignForm').setAttribute('data-emp', emp.id);
      document.getElementById('assignDlg').showModal();
    }else if(t.textContent==='Đánh giá'){
      document.getElementById('rvEmpName').textContent = emp.name;
      document.getElementById('rvToday').textContent = emp.today || '';
      document.getElementById('reviewDlg').showModal();
    }
  });
}

// Assign form submit
document.addEventListener('DOMContentLoaded', ()=>{
  // seed team into TEAM_KEY if not present
  if(!loadLocalTeam() && Array.isArray(window.members)){
    const seed = window.members.map(m=>({id:String(m.id), name:m.name, avatar:m.avatar, today:m.today||''}));
    saveLocalTeam(seed);
  }

  const asgForm = document.getElementById('assignForm');
  if(asgForm){
    asgForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const empId = asgForm.getAttribute('data-emp');
      const title = document.getElementById('asgTitle').value.trim();
      const due = document.getElementById('asgDue').value;
      const tags = (document.getElementById('asgTags').value||'').split(',').map(s=>s.trim()).filter(Boolean);
      if(!title){ alert('Vui lòng nhập tiêu đề công việc!'); document.getElementById('asgTitle').focus(); return; }
      if(!due){ alert('Vui lòng chọn hạn hoàn thành!'); document.getElementById('asgDue').focus(); return; }
      const todo = (state.columns||[]).find(c=> (c.title||'').toLowerCase().includes('to do')) || (state.columns||[])[0];
      if(todo){
        const t = { id:Math.random().toString(36).slice(2,9), title, pri:'medium', date: due, tags: (['Assigned']).concat(tags) };
        todo.tasks = todo.tasks||[]; todo.tasks.push(t);
        saveState(); render();
      }
      document.getElementById('assignDlg').close(); asgForm.reset();
    });
  }
  const rvBtn = document.getElementById('rvSave');
  if(rvBtn){
    rvBtn.addEventListener('click', ()=>{ alert('✅ Đã lưu đánh giá!'); document.getElementById('reviewDlg').close(); });
  }
});


// ===== New Task Popup logic ===== (kanban add button opens this)
document.addEventListener('DOMContentLoaded', ()=>{
  // seed team into TEAM_KEY if not present
  if(!loadLocalTeam() && Array.isArray(window.members)){
    const seed = window.members.map(m=>({id:String(m.id), name:m.name, avatar:m.avatar, today:m.today||''}));
    saveLocalTeam(seed);
  }

  const dlg = document.getElementById('newTaskDlg');
  const form = document.getElementById('newTaskForm');
  const ntTitle = document.getElementById('ntTitle');
  const ntDue = document.getElementById('ntDue');
  const ntTags = document.getElementById('ntTags');
  const ntAssignee = document.getElementById('ntAssignee');
  let assigneesCache = [];
  async function loadAssignees(){
    assigneesCache = [];
    // 3.1 Try API (if provided or default Frappe path)

    try{
      const url = (window.API_EMPLOYEES_URL) 
        ? window.API_EMPLOYEES_URL 
        : '/api/resource/Employee?fields=%5B%22name%22,%20%22employee_name%22%5D&filters=%5B%5B%22status%22,%22=%22,%22Active%22%5D%5D&limit_page_length=1000';
      const r = await fetch(url, { credentials: 'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json();
      const list = Array.isArray(data?.data) ? data.data.map(x=>({id:x.name, name:x.employee_name||x.name}))
                  : Array.isArray(data) ? data.map(x=>({id:x.id||x.name, name:x.name||x.employee_name||x.full_name||x.id}))
                  : [];
      assigneesCache = list;
    }catch(err){
      // fallback to window.members if API fails
      if(Array.isArray(window.members)){
        assigneesCache = window.members.map(m=>({id:String(m.id), name:m.name}));
      } else {
        assigneesCache = [];
      }
      console.warn('[Assignees] fallback:', err);
      // fallback 1: TEAM_KEY in localStorage
      const team = loadLocalTeam();
      if(Array.isArray(team) && team.length){
        assigneesCache = team.map(m=>({id:String(m.id), name:m.name}));
      } else if(Array.isArray(window.members) && window.members.length){
        // fallback 2: window.members
        assigneesCache = window.members.map(m=>({id:String(m.id), name:m.name}));
      } else {
        // fallback 3: PROFILE_KEY (current user only)
        try{
          const PROFILE_KEY = 'user_profile_v1';
          const raw = localStorage.getItem(PROFILE_KEY);
          if(raw){
            const me = JSON.parse(raw);
            if(me && me.name){
              assigneesCache = [{id: me.email||me.name, name: me.name}];
            }
          }
        }catch(e2){ console.warn('[PROFILE fallback] error', e2); }
      }
    }
    if(ntAssignee){
      ntAssignee.innerHTML = '';
      assigneesCache.forEach(m=>{
        const opt = document.createElement('option');
        opt.value = String(m.id);
        opt.textContent = m.name;
        ntAssignee.appendChild(opt);
      });
    }
  }

  const ntSubmit = document.getElementById('ntSubmit');
  const ntTitleErr = document.getElementById('ntTitleErr');

  function updateSubmit(){ 
    const ok = (ntTitle?.value||'').trim().length > 0; 
    if(ntSubmit) ntSubmit.disabled = !ok; if(ntTitle) ntTitle.setAttribute('aria-invalid', ok? 'false':'true'); 
    if(ntTitleErr) ntTitleErr.textContent = ok ? '' : 'Tên task không được để trống.';
  }
  ntTitle?.addEventListener('input', updateSubmit);
  updateSubmit();
  loadAssignees(); // load from DB or fallback
  // populate assignees
  if (Array.isArray(window.members) && ntAssignee) {
    ntAssignee.innerHTML = '';
    window.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = String(m.id);
      opt.textContent = m.name;
      ntAssignee.appendChild(opt);
    });
  }


  if(dlg){
    dlg.addEventListener('click', (e)=>{
      const t = e.target;
      if(t && t instanceof Element && t.hasAttribute('data-close')) dlg.close();
    });
  }

  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const colIdx = parseInt(form.getAttribute('data-col')||'0', 10);
      const col = (state.columns||[])[colIdx] || (state.columns||[])[0];
      const title = (ntTitle?.value||'').trim();
      if(!title){ updateSubmit();
  loadAssignees(); // load from DB or fallback
  // populate assignees
  if (Array.isArray(window.members) && ntAssignee) {
    ntAssignee.innerHTML = '';
    window.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = String(m.id);
      opt.textContent = m.name;
      ntAssignee.appendChild(opt);
    });
  }
 ntTitle?.focus(); return; }
      const due = ntDue?.value || null;
      const tags = (ntTags?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
      const assignee = ntAssignee?.value || '';
      const assigneeId = assignee;
      const assigneeName = (assigneesCache.find(x=>String(x.id)===String(assigneeId))||{}).name || assigneeId;
      const t = { id: Math.random().toString(36).slice(2,9), title: title, pri: 'medium', date: due, tags, assignee: assigneeName, assignee_id: assigneeId };
      col.tasks = col.tasks || []; col.tasks.push(t);
      saveState(); render();
      dlg?.close(); form.reset(); updateSubmit();
  loadAssignees(); // load from DB or fallback
  // populate assignees
  if (Array.isArray(window.members) && ntAssignee) {
    ntAssignee.innerHTML = '';
    window.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = String(m.id);
      opt.textContent = m.name;
      ntAssignee.appendChild(opt);
    });
  }

    });
  }
});
