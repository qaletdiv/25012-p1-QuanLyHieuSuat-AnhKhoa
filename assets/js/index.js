// ===== Globals =====
const STORAGE_KEY = 'kanban_state_v3';
var state = null;

// ===== User storage helpers =====
const AUTH_KEY = 'user_auth_v1';        // {username, password}
const PROFILE_KEY = 'user_profile_v1';  // {name, phone, email, rating, avatar}

function ensureUserDefaults(){
  // default user/pass: 123 / 123 (theo yêu cầu demo)
  if(!localStorage.getItem(AUTH_KEY)){
    localStorage.setItem(AUTH_KEY, JSON.stringify({username:'123', password:'123'}));
  }
  if(!localStorage.getItem(PROFILE_KEY)){
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      name:'User', phone:'', email:'', rating:80, avatar:'assets/img/avatar.svg'
    }));
  }
}

function getAuth(){ try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'{}');}catch(_){return{};} }
function setAuth(obj){ localStorage.setItem(AUTH_KEY, JSON.stringify(obj||{})); }
function getProfile(){ try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}');}catch(_){return{};} }
function setProfile(obj){ localStorage.setItem(PROFILE_KEY, JSON.stringify(obj||{})); }

// ===== Login lockout helpers =====
const LOCK_KEY = 'auth_lock_v1';   // {fail: number, until: timestamp_ms}
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
    addBtn.onclick=()=>{ const t={id:Math.random().toString(36).slice(2,9),title:'New Task',pri:'medium',date:'Today',tags:['New']}; col.tasks=col.tasks||[]; col.tasks.push(t); saveState(); render(); };
    add.append(addBtn);
    wrap.append(h,list,add); $kanban.append(wrap);
  });
}

function renderCard(t){
  const c=el('div','card'); c.onclick=()=>showDetail(t);
  const top=el('div','row'); top.append(el('span','pri '+(t.pri||'low'), cap(t.pri||'low')));
  const title=el('div','title', t.title||'—');
  const meta=el('div','meta'); meta.append(el('span','chip','📅 '+(t.due||t.date||''))); (t.tags||[]).forEach(s=> meta.append(el('span','chip',s)));
  c.append(top,title,meta); return c;
}

// Detail modal
const dDlg=document.getElementById('detailDlg'); const q=id=>document.getElementById(id);
// Universal close handlers for all dialogs
document.addEventListener('click', (e)=>{
  if(e.target.matches('[data-close]')){
    const dlg = e.target.closest('dialog');
    if(dlg) dlg.close();
  }
});
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    document.querySelectorAll('dialog[open]').forEach(d=> d.close());
  }
});
// Close when clicking backdrop
document.querySelectorAll('dialog').forEach(d=>{
  d.addEventListener('click', (e)=>{ if(e.target === d) d.close(); });
});

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

// ===== App/Login + Menu wiring =====
document.addEventListener('DOMContentLoaded', function(){
  const app = document.getElementById('app');
  const login = document.getElementById('login');
  function showApp(){
    login.classList.add('is-hidden');
    app.classList.remove('is-hidden');
    startKanban();
  }
  function showLogin(){
    login.classList.remove('is-hidden');
    app.classList.add('is-hidden');
  }

  ensureUserDefaults();
  const ok = localStorage.getItem('auth_ok')==='1';
  if(ok) showApp(); else showLogin();
  renderMembers();

  
  document.getElementById('loginForm').addEventListener('submit', e=>{
    e.preventDefault();
    ensureUserDefaults();
    const lock = getLock();
    const now = Date.now();
    if(lock.until && now < lock.until){
      const remain = Math.ceil((lock.until - now)/1000);
      alert('Tài khoản tạm khóa. Vui lòng thử lại sau ' + remain + ' giây.');
      return;
    }
    const u=(document.getElementById('lg_user').value||'').trim();
    const p=(document.getElementById('lg_pass').value||'').trim();
    const auth=getAuth();
    if(u===String(auth.username||'') && p===String(auth.password||'')){ 
      localStorage.setItem('auth_ok','1'); 
      clearLock(); // reset fail count
      showApp(); 
    } else {
      // fail
      const l = getLock();
      const fails = (l.fail||0)+1;
      let msg = 'Sai mật khẩu, vui lòng thử lại.';
      if(fails>=5){
        const until = Date.now() + 60*1000; // 1 phút
        setLock({fail:fails, until});
        msg = 'Sai mật khẩu quá 5 lần. Tài khoản bị khóa 1 phút. Vui lòng thử lại sau.';
      }else{
        setLock({fail:fails});
        msg += ' (Lần ' + fails + '/5)';
      }
      alert(msg);
    }
  });

  document.querySelector('[data-toggle]').addEventListener('click', ()=>{
    const ip=document.getElementById('lg_pass'); ip.type = ip.type==='password' ? 'text' : 'password';
  });

  // Account menu
  const btnAccount = document.getElementById('btnAccount');
  const menu = document.getElementById('acctMenu');
  const profileDlg = document.getElementById('profileDlg');
  btnAccount.addEventListener('click', (e)=>{
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  document.addEventListener('click', ()=>{ menu.hidden = true; });

  menu.addEventListener('click', (e)=>{
    const act = e.target.getAttribute('data-action');
    if(!act) return;
    if(act==='logout'){
      localStorage.setItem('auth_ok','0'); 
      menu.hidden = true; 
      showLogin();
    }else if(act==='profile'){
      document.getElementById('pfName').textContent = 'User';
      profileDlg.showModal();
      menu.hidden = true;
    }
  });

  // Search
  document.getElementById('btn-refresh').onclick=()=>render();
  document.getElementById('btn-clear').onclick=()=>{ document.getElementById('q-task').value=''; document.querySelectorAll('.card').forEach(c=>c.style.display=''); };
  document.getElementById('q-task').addEventListener('input',(e)=>{ const qv=e.target.value.toLowerCase(); document.querySelectorAll('.card').forEach(c=>{ const tt=c.querySelector('.title').textContent.toLowerCase(); c.style.display= tt.includes(qv)?'':'none';});});

  

  // Load profile into dialog
  function loadProfileUI(){
    const p = getProfile();
    (document.getElementById('pfAvatar')||{}).src = p.avatar || 'assets/img/avatar.svg';
    (document.getElementById('pfName')||{}).value = p.name || '';
    (document.getElementById('pfPhone')||{}).value = p.phone || '';
    (document.getElementById('pfEmail')||{}).value = p.email || '';
    (document.getElementById('pfRating')||{}).value = (p.rating!=null?p.rating:'');
  }

  // Open profile from menu
  menu.addEventListener('click', (e)=>{
    const act = e.target.getAttribute('data-action');
    if(!act) return;
    if(act==='logout'){
      localStorage.setItem('auth_ok','0'); 
      menu.hidden = true; 
      showLogin();
    }else if(act==='profile'){
      loadProfileUI();
      (document.getElementById('profileDlg')).showModal();
      menu.hidden = true;
    }
  }, {capture:true});

  // Save profile button
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  if(btnSaveProfile){
    btnSaveProfile.addEventListener('click', ()=>{
      const p = getProfile();
      const np = {
        ...p,
        name: (document.getElementById('pfName').value||'').trim(),
        phone: (document.getElementById('pfPhone').value||'').trim(),
        email: (document.getElementById('pfEmail').value||'').trim(),
        rating: Number(document.getElementById('pfRating').value||p.rating||0),
      };
      setProfile(np);
      alert('✅ Đã lưu hồ sơ');
      (document.getElementById('profileDlg')).close();
    });
  }

  // Change password
  const btnChangePw = document.getElementById('btnChangePw');
  if(btnChangePw){
    btnChangePw.addEventListener('click', ()=>{
      const oldv = (document.getElementById('pwOld').value||'');
      const newv = (document.getElementById('pwNew').value||'');
      const new2 = (document.getElementById('pwNew2').value||'');
      const auth = getAuth();
      if(!oldv || oldv !== String(auth.password||'')){ alert('❌ Mật khẩu hiện tại không đúng'); return; }
      if(!newv || newv.length<3){ alert('❌ Mật khẩu mới tối thiểu 3 ký tự'); return; }
      if(newv !== new2){ alert('❌ Xác nhận mật khẩu không khớp'); return; }
      setAuth({...auth, password:newv});
      // dọn input
      document.getElementById('pwOld').value='';
      document.getElementById('pwNew').value='';
      document.getElementById('pwNew2').value='';
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
    const t = e.target;
    const empId = t.dataset.emp;
    if(!empId) return;
    const emp = (typeof members!=='undefined' ? members.find(x=>x.id===empId) : null);
    if(!emp) return;
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
  const asgForm = document.getElementById('assignForm');
  if(asgForm){
    asgForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const empId = asgForm.getAttribute('data-emp');
      const title = document.getElementById('asgTitle').value.trim();
      const due = document.getElementById('asgDue').value;
      const tags = (document.getElementById('asgTags').value||'').split(',').map(s=>s.trim()).filter(Boolean);
      if(!title || !due){ return; }

      // Add to first column "To Do" by default
      const todo = (state.columns||[]).find(c=> (c.title||'').toLowerCase().includes('to do')) || (state.columns||[])[0];
      if(todo){
        const t = { id:Math.random().toString(36).slice(2,9), title, pri:'medium', date: due, tags: (['Assigned']).concat(tags) };
        todo.tasks = todo.tasks||[]; todo.tasks.push(t);
        saveState(); render();
      }
      document.getElementById('assignDlg').close();
      asgForm.reset();
    });
  }

  // Review save
  const rvBtn = document.getElementById('rvSave');
  if(rvBtn){
    rvBtn.addEventListener('click', ()=>{
      // Just close with a demo toast
      alert('✅ Đã lưu đánh giá!');
      document.getElementById('reviewDlg').close();
    });
  }
});

