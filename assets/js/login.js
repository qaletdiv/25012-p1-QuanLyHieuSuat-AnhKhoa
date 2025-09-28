// Auth & Profile helpers (shared shape with app.js)
const AUTH_KEY = 'user_auth_v1';
const PROFILE_KEY = 'user_profile_v1';
const LOCK_KEY = 'auth_lock_v1';
function ensureUserDefaults(){
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
function getLock(){ try{return JSON.parse(localStorage.getItem(LOCK_KEY)||'{}');}catch(_){return{};} }
function setLock(obj){ localStorage.setItem(LOCK_KEY, JSON.stringify(obj||{})); }
function clearLock(){ localStorage.removeItem(LOCK_KEY); }

document.addEventListener('DOMContentLoaded', ()=>{
  ensureUserDefaults();
  if(localStorage.getItem('auth_ok')==='1'){ window.location.href='app.html'; return; }

  document.querySelector('[data-toggle]').addEventListener('click', ()=>{
    const ip=document.getElementById('lg_pass'); ip.type = ip.type==='password' ? 'text' : 'password';
  });

  document.getElementById('loginForm').addEventListener('submit', (e)=>{
    e.preventDefault();
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
      clearLock();
      window.location.href='app.html';
    }else{
      const l=getLock();
      const fails=(l.fail||0)+1;
      if(fails>=5){ setLock({fail:fails, until: Date.now()+60*1000}); alert('Sai mật khẩu quá 5 lần. Tài khoản bị khóa 1 phút. Vui lòng thử lại sau.'); }
      else{ setLock({fail:fails}); alert('Sai mật khẩu, vui lòng thử lại. (Lần '+fails+'/5)'); }
    }
  });
});