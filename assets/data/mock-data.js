// Mock data (independent, no nid() dependency)
const initData = {
  columns: [
    { id: 'backlog',  title: 'Backlog',   tasks: [
      { id: 't1', title: 'Design System Updates', pri: 'high',  date: 'Nov 15', note:'Cập nhật màu và spacing', tags:['Figma','2/5'] },
    ]},
    { id: 'todo',     title: 'To Do',     tasks: [
      { id: 't2', title: 'Task mới', pri: 'medium', date: 'Hôm nay', note:'Đầu việc mới', tags:['0/1','UI'] },
    ]},
    { id: 'progress', title: 'In Progress', tasks: [
      { id: 't3', title: 'User Research Analysis', pri: 'low', date: 'Nov 18', note:'Phỏng vấn 5 user', tags:['4/4'] },
      { id: 't4', title: 'API Integration', pri: 'high', date: 'Nov 25', note:'Kết nối ERP', tags:['1/4'] },
    ]},
    { id: 'review',   title: 'In Review', tasks: [
      { id: 't5', title: 'Component Documentation', pri: 'high', date: 'Nov 22', note:'Viết doc Button', tags:['2/6'] },
      { id: 't6', title: 'Product Catalog', pri: 'medium', date: 'Nov 20', note:'Ảnh sản phẩm', tags:['3/3'] },
    ]},
    { id: 'done',     title: 'Done',      tasks: [
      { id: 't7', title: 'Content Strategy', pri: 'medium', date: 'Nov 10', note:'Plan Q4', tags:['3/3'] },
      { id: 't8', title: 'Analytics Dashboard', pri: 'medium', date: 'Dec 5', note:'V1 hoàn tất', tags:['0/5'] },
    ]},
  ]
};
