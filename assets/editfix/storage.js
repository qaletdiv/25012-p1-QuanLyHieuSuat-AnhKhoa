// === editfix/storage.js ===
(function(){
  if(window.__editfix_storage_loaded__) return; window.__editfix_storage_loaded__=true;
  window.EDITFIX_TASKS_KEY = window.EDITFIX_TASKS_KEY || 'kanban_tasks_v1';
  window.loadTasks = window.loadTasks || function(){
    try{
      const raw = localStorage.getItem(EDITFIX_TASKS_KEY);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr)? arr: [];
    }catch(e){ console.warn('[editfix] loadTasks error', e); return []; }
  };
  window.saveTasks = window.saveTasks || function(list){
    try{ localStorage.setItem(EDITFIX_TASKS_KEY, JSON.stringify(list||[])); }
    catch(e){ console.warn('[editfix] saveTasks error', e); }
  };
  window.uid = window.uid || function(){ return Math.random().toString(36).slice(2,10); };
})();