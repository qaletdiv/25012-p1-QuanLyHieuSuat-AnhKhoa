// --- State ---
const KEY='taskora_kanban_v1';
let state = load();
function load(){ try{ const s = localStorage.getItem(KEY); if(s){ return JSON.parse(s);} }catch(e){} return initData; }
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }

const $kanban = document.getElementById('kanban');

// --- Helpers ---
function el(tag, cls, text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; }
function cap(s){return s? s.charAt(0).toUpperCase()+s.slice(1):''}
function nid(){ return Math.random().toString(36).slice(2,9); }
function iconButton(symbol, fn){ const b = el('button','icon-btn'); b.type='button'; b.textContent=symbol; b.onclick=fn; return b; }

// --- Render ---
function render(){
  $kanban.innerHTML = '';
  state.columns.forEach(col => {
    const wrap = el('div','col');
    // header
    const h = el('div','col-h');
    const ttl = el('div','ttl');
    ttl.append(document.createTextNode(col.title), el('span','count', String(col.tasks.length)) );
    const act = el('div','act');
    act.append(iconButton('+',()=> openDialog(col.id)));
    h.append(ttl, act);
    wrap.append(h);

    // list
    const list = el('div','list');
    list.dataset.col = col.id;
    list.addEventListener('dragover', onDragOver);
    list.addEventListener('drop', onDrop);

    col.tasks.forEach(t => list.append(renderCard(t)) );

    // add button
    const add = el('div','add');
    const btn = el('button','add-btn','+ Add Task');
    btn.onclick = ()=> openDialog(col.id);
    add.append(btn);

    wrap.append(list, add);
    $kanban.append(wrap);
  });
}

function renderCard(t){
  const c = el('div','card');
  c.draggable = true; c.dataset.id = t.id;
  c.addEventListener('dragstart', onDragStart);
  c.addEventListener('dragend', onDragEnd);
  // mở chi tiết khi click card
  c.addEventListener('click', ()=> showDetail(t));

  const top = el('div','row');
  const editBtn = iconButton('✎', (e)=>{ e.stopPropagation(); openDialog(null,t); });
  const delBtn  = iconButton('🗑', (e)=>{ e.stopPropagation(); removeTask(t.id); });
  top.append(el('span',`pri ${t.pri}`,cap(t.pri)) , editBtn , delBtn );

  const title = el('div','title', t.title);
  const meta = el('div','meta');
  meta.append(el('span','chip', '📅 ' + (t.date||'')));
  (t.tags||[]).forEach(s=> meta.append(el('span','chip', s)));

  c.append(top,title,meta);
  return c;
}

// --- DnD ---
let dragId = null, isDragging = false;
function onDragStart(e){ dragId = e.currentTarget.dataset.id; isDragging = true; e.currentTarget.classList.add('dragging'); }
function onDragEnd(e){ e.currentTarget.classList.remove('dragging'); dragId=null; setTimeout(()=>{ isDragging=false; },0); }
function onDragOver(e){ e.preventDefault(); }
function onDrop(e){ e.preventDefault(); const colId = e.currentTarget.dataset.col; if(!dragId) return; const info = findTask(dragId); if(!info) return; info.col.tasks.splice(info.i,1); const targetCol = state.columns.find(c=>c.id===colId); targetCol.tasks.push(info.task); save(); render(); }

function findTask(id){ for(const col of state.columns){ const i = col.tasks.findIndex(x=>x.id===id); if(i>-1) return {col,i,task:col.tasks[i]} } return null }

// --- CRUD ---
function removeTask(id){ const info = findTask(id); if(!info) return; if(confirm('Xoá task này?')){ info.col.tasks.splice(info.i,1); save(); render(); } }

const dlg = document.getElementById('taskDlg');
const fId = document.getElementById('taskId');
const fT = document.getElementById('taskTitle');
const fP = document.getElementById('taskPriority');
const fN = document.getElementById('taskNote');
const fG = document.getElementById('taskTag');

function openDialog(colId, task){
  dlg.returnValue='';
  fId.value = task? task.id : '';
  fT.value  = task? task.title : '';
  fP.value  = task? task.pri   : 'medium';
  fN.value  = task? (task.note||'') : '';
  fG.value  = task? (task.tags||[]).join(', ') : '';
  dlg.dataset.col = colId || (findTask(task?.id)?.col.id);
  dlg.showModal();
}

document.getElementById('btnSaveTask').addEventListener('click', (e)=>{
  e.preventDefault();
  const id = fId.value || nid();
  const t  = { id, title:fT.value.trim(), pri:fP.value, note:fN.value.trim(), date:'Hôm nay', tags: fG.value? fG.value.split(',').map(s=>s.trim()).filter(Boolean):[] };
  const exists = findTask(id);
  if(exists){ Object.assign(exists.task, t); }
  else { const cid = dlg.dataset.col; const target = state.columns.find(c=>c.id===cid); target.tasks.push(t); }
  save(); render(); dlg.close();
});

// --- Detail ---
const dDlg   = document.getElementById('detailDlg');
const dBody  = document.getElementById('detailBody');
const dEdit  = document.getElementById('dEdit');
const dDel   = document.getElementById('dDelete');
let curTask  = null;

function showDetail(t){
  curTask = t;
  dBody.innerHTML = '';
  const row = (label, val)=>{ const wrap = el('div','dlg-row'); const lb = document.createElement('label'); lb.textContent=label; const v = document.createElement('div'); v.textContent = val || '—'; wrap.append(lb,v); return wrap; };
  dBody.append(
    row('Tiêu đề', t.title),
    row('Ưu tiên', cap(t.pri)),
    row('Ngày', t.date||''),
    row('Ghi chú', t.note||'')
  );
  // tags
  const tagWrap = el('div','dlg-row'); const lb = document.createElement('label'); lb.textContent='Tags'; const box = document.createElement('div'); (t.tags||[]).forEach(s=> box.append(el('span','chip',s))); tagWrap.append(lb,box); dBody.append(tagWrap);

  dEdit.onclick = ()=>{ dDlg.close(); openDialog(null, t); };
  dDel.onclick  = ()=>{ if(confirm('Xoá task này?')){ dDlg.close(); removeTask(t.id); } };

  dDlg.showModal();
}

// Tìm kiếm
document.getElementById('q-task').addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.card').forEach(card=>{
    const title = card.querySelector('.title').textContent.toLowerCase();
    card.style.display = title.includes(q) ? '' : 'none';
  });
});
document.getElementById('btn-clear').onclick = ()=>{
  document.getElementById('q-task').value = '';
  document.querySelectorAll('.card').forEach(c=> c.style.display='');
};
document.getElementById('btn-refresh').onclick = ()=> render();

// initial render
render();

// Legacy shim
window.openDetail = function(id){ try{ const info = findTask(id); if(info) showDetail(info.task); }catch(err){ console.error('openDetail shim error', err); } };
