// Guard: must be logged in
document.addEventListener('DOMContentLoaded', ()=>{
  if(localStorage.getItem('auth_ok')!=='1'){ window.location.href='login.html'; return; }
  const grid = document.getElementById('teamGrid');
  if(grid && typeof members!=='undefined'){
    grid.innerHTML = '';
    members.forEach(m=>{
      const el = document.createElement('div');
      el.className='team-card';
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${m.avatar}" style="width:40px;height:40px;border-radius:999px;border:1px solid var(--border);background:#fff"/>
          <div>
            <h4>${m.name}</h4>
            <div class="mini">${m.today||''}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn" data-emp="${m.id}" data-act="assign">Giao việc</button>
          <button class="btn btn--primary" data-emp="${m.id}" data-act="review">Đánh giá</button>
        </div>`;
      grid.appendChild(el);
    });

    grid.addEventListener('click', (e)=>{
      const act = e.target.getAttribute('data-act');
      const empId = e.target.getAttribute('data-emp');
      if(!act || !empId) return;
      const emp = members.find(x=>x.id===empId);
      if(!emp) return;
      if(act==='assign'){ 
        const assignDlg = document.getElementById('assignDlg');
        const assignEmpEl = document.getElementById('assignEmp');
        if(assignEmpEl) assignEmpEl.textContent = emp.name;
        if(assignDlg?.showModal){ assignDlg.showModal(); } else if(assignDlg){ assignDlg.open = true; }
      } else { assignDlg.open = true; }
      }else if(act==='review'){
        alert('Đi tới màn hình A.5 của ' + emp.name + ' (demo)');
      }
      // Hook assign dialog submit/close AFTER DOM is ready
  const assignDlg = document.getElementById('assignDlg');
  const assignForm = document.getElementById('assignForm');
  const aTitle = document.getElementById('aTitle');
  const aDue = document.getElementById('aDue');
  const aLabels = document.getElementById('aLabels');
  if(assignDlg){
    assignDlg.addEventListener('click', (e)=>{
      if(e.target?.hasAttribute?.('data-close')) assignDlg.close();
    });
  }
  if(assignForm){
    assignForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const payload = {
        title: (aTitle?.value||'').trim(),
        dueDate: aDue?.value || null,
        labels: (aLabels?.value||'').trim(),
        assignee: document.getElementById('assignEmp')?.textContent || ''
      };
      console.log('[AssignTask] submit', payload);
      assignDlg?.close();
      if(aTitle) aTitle.value='';
      if(aDue) aDue.value='';
      if(aLabels) aLabels.value='';
    });
  }
}
});


// Assign dialog helpers
const assignDlg = document.getElementById('assignDlg');
const assignEmp = document.getElementById('assignEmp');
const aTitle = document.getElementById('aTitle');
const aDue = document.getElementById('aDue');
const aLabels = document.getElementById('aLabels');
const assignForm = document.getElementById('assignForm');
if(assignDlg){
  assignDlg.addEventListener('click', (e)=>{
    if(e.target?.hasAttribute?.('data-close')) assignDlg.close();
  });
  assignForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const payload = {
      title: aTitle.value.trim(),
      dueDate: aDue.value || null,
      labels: aLabels.value.trim(),
      assignee: assignEmp.textContent
    };
    console.log('[AssignTask] submit', payload);
    assignDlg.close();
    aTitle.value=''; aDue.value=''; aLabels.value='';
  });
}
