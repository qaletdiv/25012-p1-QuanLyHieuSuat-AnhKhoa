// === editfix/tasks_fix.js (full fields) ===
(function(){
  if(window.__editfix_tasks_loaded__) return; window.__editfix_tasks_loaded__=true;

  const STATUSES = ['backlog','doing','in review','done']; // keep common variants
  let tasks = (typeof loadTasks==='function') ? loadTasks() : [];
  if(!Array.isArray(tasks)) tasks = [];

  function q(id){ return document.getElementById(id); }
  function esc(s){ return (s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // Build modal that matches "create" experience and supports ALL fields
  
  function ensureModal(){
    if(q('taskModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'taskModal';
    modal.innerHTML = `
      <div class="dialog" style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;min-width:360px;max-width:720px;padding:16px;color:#111;box-shadow:0 10px 30px rgba(0,0,0,.25)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 id="taskModalTitle" style="margin:0;font-size:20px;font-weight:700">Sửa task</h3>
          <button id="efX" aria-label="Close" style="border:0;background:transparent;font-size:18px;cursor:pointer">✕</button>
        </div>
        <div class="muted" style="color:#6b7280;margin-bottom:10px">Nhập thông tin task</div>

        <div class="pill" style="display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0">
          <span>📝</span>
          <input id="taskTitle" class="input" maxlength="200" placeholder="Tiêu đề (bắt buộc)" style="flex:1;border:0;background:transparent;outline:none;font-size:14px"/>
        </div>

        <div class="pill" style="display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0">
          <span>🗓️</span>
          <input id="taskDue" type="date" class="input" style="flex:1;border:0;background:transparent;outline:none;font-size:14px"/>
        </div>

        <div class="pill" style="display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0">
          <span>🏷️</span>
          <input id="taskTags" class="input" placeholder="Nhãn (ví dụ: UI, API)" style="flex:1;border:0;background:transparent;outline:none;font-size:14px"/>
        </div>

        <div class="pill" style="display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0">
          <span>👤</span>
          <input id="taskAssignee" class="input" placeholder="Người phụ trách" style="flex:1;border:0;background:transparent;outline:none;font-size:14px"/>
        </div>

        <div class="pill" style="display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0">
          <span>📌</span>
          <select id="taskPriority" class="input" style="flex:1;border:0;background:transparent;outline:none;font-size:14px">
            <option value="">(none)</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>

        <div class="pill" style="display:flex;align-items:flex-start;gap:8px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0">
          <span>🧾</span>
          <textarea id="taskDesc" rows="4" placeholder="Mô tả" style="flex:1;border:0;background:transparent;outline:none;font-size:14px;resize:vertical"></textarea>
        </div>

        <div class="pill" style="display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0">
          <span>🔁</span>
          <select id="taskStatus" class="input" style="flex:1;border:0;background:transparent;outline:none;font-size:14px">
            <option value="backlog">backlog</option>
            <option value="to do">to do</option>
            <option value="doing">doing</option>
            <option value="in progress">in progress</option>
            <option value="in review">in review</option>
            <option value="done">done</option>
          </select>
        </div>

        <div class="row" style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button class="btn" id="btnCancel" style="border:1px solid #d1d5db;padding:8px 14px;border-radius:12px;background:#fff;color:#111;cursor:pointer">Huỷ</button>
          <button class="btn primary" id="btnSave" style="border:1px solid #111827;padding:8px 14px;border-radius:12px;background:#111827;color:#fff;cursor:pointer">Lưu</button>
        </div>
      </div>`;
    const style = document.createElement('style');
    style.textContent = `.modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45);z-index:9999}.modal.open{display:flex}`;
    document.head.appendChild(style);
    document.body.appendChild(modal);
    document.getElementById('efX').onclick = ()=>{ q('taskModal').classList.remove('open'); };
  }

  let editingId = null;

  function openEditModal(id){
    ensureModal();
    const t = id ? (tasks.find(x=> x.id===id) || {}) : {};
    editingId = id || null;
    q('taskModalTitle').textContent = editingId ? 'Sửa Task' : 'Tạo Task';

    q('taskTitle').value    = t.title || '';
    q('taskDesc').value     = t.desc || '';
    q('taskStatus').value   = (t.status||'backlog');
    q('taskPriority').value = (t.priority||'');
    q('taskDue').value      = (t.due||'').slice(0,10);
    q('taskAssignee').value = (t.assignee||'');
    q('taskTags').value     = Array.isArray(t.tags) ? t.tags.join(', ') : (t.tags||'');

    q('taskModal').classList.add('open');
    q('taskTitle').focus();
  }

  function closeModal(){ const m=q('taskModal'); if(m) m.classList.remove('open'); }

  function onSave(){
    const title = (q('taskTitle').value||'').trim();
    if(!title){ alert('Tên task không được để trống.'); q('taskTitle').focus(); return; }
    const payload = {
      title,
      desc: (q('taskDesc').value||'').trim(),
      status: (q('taskStatus').value||'backlog').toLowerCase(),
      priority: (q('taskPriority').value||'').toLowerCase(),
      due: (q('taskDue').value||''),
      assignee: (q('taskAssignee').value||'').trim(),
      tags: (q('taskTags').value||'').split(',').map(s=>s.trim()).filter(Boolean)
    };

    // load current copy
    tasks = (typeof loadTasks==='function') ? loadTasks() : tasks;

    if(editingId){
      const i = tasks.findIndex(x=> x.id===editingId);
      if(i>=0){
        tasks[i] = Object.assign({}, tasks[i], payload);
      }
    }else{
      const obj = Object.assign({ id: (typeof uid==='function'? uid(): String(Date.now())), created: Date.now() }, payload);
      tasks.push(obj);
    }

    if(typeof saveTasks==='function') saveTasks(tasks);
    closeModal();

    // optional page hook
    if(typeof window.render==='function') window.render();
  }

  function attachModalButtons(){
    const c = q('btnCancel'), s = q('btnSave');
    if(c) c.onclick = closeModal;
    if(s) s.onclick = onSave;
  }

  
  function closeExistingDialogFrom(btn){
    const dlg = btn.closest('[role="dialog"], .dialog, .task-detail, .modal');
    if(!dlg) return;
    // try common close buttons
    const closeBtn = dlg.querySelector('[aria-label="Close"], .close, [data-action="close"]');
    if(closeBtn){ try{ closeBtn.click(); return; }catch(_){ } }
    // fallback: remove dialog node
    try{ dlg.remove(); }catch(_){}
  }

  function attachButtons(root){
    const container = root || document;
    // generic data-action
    container.querySelectorAll('[data-action="edit"],[data-action="add-task"]').forEach(btn=>{
      if(btn.__editfix_bound__) return;
      btn.__editfix_bound__ = true;
      btn.addEventListener('click', ()=>{
        const act = btn.getAttribute('data-action');
        if(act==='edit'){
          const id = btn.getAttribute('data-id') || (btn.closest('[data-id]') && btn.closest('[data-id]').getAttribute('data-id'));
          openEditModal(id || null);
        }else{
          openEditModal(null);
        }
      });
    });
    // common classes
    container.querySelectorAll('.btn-edit,.btn-edit-task,.edit-task').forEach(btn=>{
      if(btn.__editfix_bound__) return;
      btn.__editfix_bound__ = true;
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id') || (btn.closest('[data-id]') && btn.closest('[data-id]').getAttribute('data-id'));
        openEditModal(id || null);
      });
    });
  }

  // Expose
  window.openTaskEditor = openEditModal;
  window.editfixAttach = attachButtons;

  
  // --- Dynamic delegation for late-rendered buttons (e.g., inside detail dialogs) ---
  function inferCurrentTaskIdFromDialog(target){
    // Find nearest dialog title and map to tasks by exact title
    try{
      const root = target && target.closest('[role="dialog"], .dialog, .modal, .task-detail, .popup') || document;
      const heading = root.querySelector('h1,h2,h3,.title');
      const text = heading ? (heading.textContent||'').trim() : '';
      if(!text) return null;
      let title = text;
      // remove trailing badges or "(Edited)" duplicates if any
      title = title.replace(/\(Edited\)/gi,'').replace(/\s{2,}/g,' ').trim();
      const list = (typeof loadTasks==='function') ? loadTasks() : tasks;
      const found = Array.isArray(list) ? list.find(x => (x.title||'').trim()===title) : null;
      return found ? found.id : null;
    }catch(e){ return null; }
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('button, a');
    if(!btn) return;
    const label = (btn.textContent||btn.getAttribute('aria-label')||'').trim().toLowerCase();
    const isEdit = label==='edit task' || label==='edit' || btn.classList.contains('btn-edit') || btn.classList.contains('btn-edit-task') || btn.getAttribute('data-action')==='edit';
    if(!isEdit) return;

    // Prefer explicit data-id
    let id = btn.getAttribute('data-id');
    if(!id){
      const host = btn.closest('[data-id]');
      if(host) id = host.getAttribute('data-id');
    }
    if(!id){
      id = inferCurrentTaskIdFromDialog(btn);
    }
    openEditModal(id || null);
    e.preventDefault();
    e.stopPropagation();
  }, true);

  // Watch for new nodes to (optionally) attach explicit handlers if needed
  const mo = new MutationObserver((muts)=>{
    for(const m of muts){
      if(m.addedNodes && m.addedNodes.length){
        // try to attach basic edit handlers on new subtree
        try{ attachButtons(m.target || document); }catch(_){}
      }
    }
  });
  try{
    mo.observe(document.documentElement, {childList:true, subtree:true});
  }catch(_){}

  document.addEventListener('DOMContentLoaded', ()=>{
    ensureModal();
    attachModalButtons();
    attachButtons(document);
  });
})();