// users.js — CRUD to TEAM_KEY in localStorage; compatible with app.js
const TEAM_KEY = 'team_members_v1';

function loadTeam(){
  try{ const raw = localStorage.getItem(TEAM_KEY); return raw? JSON.parse(raw):[]; }catch(e){ return []; }
}
function saveTeam(list){
  localStorage.setItem(TEAM_KEY, JSON.stringify(list||[]));
}

function uid(){ return Math.random().toString(36).slice(2,9); }

function render(){
  const tbody = document.getElementById('tbody');
  const list = loadTeam();
  tbody.innerHTML = '';
  list.forEach(m => {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const row = document.createElement('div'); row.className='row';
    const img = document.createElement('img'); img.className='avatar'; img.src = m.avatar || 'assets/img/avatar.svg';
    const div = document.createElement('div');
    div.innerHTML = `<div>${m.name||''}</div><div class="mini">${m.id||''}</div>`;
    row.append(img, div); td1.append(row);

    const td2 = document.createElement('td'); td2.textContent = m.today||'';
    const td3 = document.createElement('td');
    const bEdit = document.createElement('button'); bEdit.className='btn'; bEdit.textContent='Sửa';
    const bDel = document.createElement('button'); bDel.className='btn'; bDel.textContent='Xoá';
    bEdit.onclick = () => fillForm(m);
    bDel.onclick = () => {
      if(confirm('Xoá người dùng này?')){
        const cur = loadTeam().filter(x => String(x.id)!==String(m.id));
        saveTeam(cur); render();
      }
    };
    td3.append(bEdit, bDel);

    tr.append(td1, td2, td3); tbody.append(tr);
  });
}

function fillForm(m){
  document.getElementById('uId').value = m.id || '';
  document.getElementById('uName').value = m.name || '';
  document.getElementById('uEmail').value = m.email || '';
  document.getElementById('uAvatar').value = m.avatar || 'assets/img/avatar.svg';
  document.getElementById('uToday').value = m.today || '';
  document.getElementById('uErr').textContent = '';
}

function clearForm(){
  document.getElementById('uId').value = '';
  document.getElementById('uName').value = '';
  document.getElementById('uEmail').value = '';
  document.getElementById('uAvatar').value = 'assets/img/avatar.svg';
  document.getElementById('uToday').value = '';
  document.getElementById('uErr').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  document.getElementById('btnClear').onclick = clearForm;
  document.getElementById('fUser').addEventListener('submit', (e)=>{
    e.preventDefault();
    const id = (document.getElementById('uId').value || '').trim() || uid();
    const name = (document.getElementById('uName').value || '').trim();
    const email = (document.getElementById('uEmail').value || '').trim();
    const avatar = (document.getElementById('uAvatar').value || '').trim() || 'assets/img/avatar.svg';
    const today = (document.getElementById('uToday').value || '').trim();
    if(!name){ document.getElementById('uErr').textContent='Họ tên không được để trống.'; return; }

    const list = loadTeam();
    const i = list.findIndex(x => String(x.id)===String(id));
    const obj = { id, name, email, avatar, today };
    if(i>=0) list[i] = obj; else list.push(obj);
    saveTeam(list);
    clearForm(); render();
    alert('✅ Đã lưu.');
  });
});
