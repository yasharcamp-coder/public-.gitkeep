const express=require('express');const path = require('path');
const path=require('path');
const Database=require('better-sqlite3');
const app=expressapp.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
const db=new Database('attendance.db');
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
db.exec(`CREATE TABLE IF NOT EXISTS employees(id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, national_id TEXT, address TEXT, phone TEXT, department TEXT, job TEXT, start_time TEXT, end_time TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL, date TEXT NOT NULL, check_in TEXT, check_out TEXT, note TEXT, UNIQUE(employee_id,date), FOREIGN KEY(employee_id) REFERENCES employees(id));`);
app.get('/api/employees',(req,res)=>res.json(db.prepare('SELECT * FROM employees ORDER BY id DESC').all()));
app.post('/api/employees',(req,res)=>{try{const x=req.body; const r=db.prepare(`INSERT INTO employees(code,name,national_id,address,phone,department,job,start_time,end_time) VALUES(?,?,?,?,?,?,?,?,?)`).run(x.code,x.name,x.national_id||'',x.address||'',x.phone||'',x.department||'',x.job||'',x.start_time||'08:00',x.end_time||'16:00');res.json({id:r.lastInsertRowid});}catch(e){res.status(400).json({error:e.message})}});
app.put('/api/employees/:id',(req,res)=>{try{const x=req.body;db.prepare(`UPDATE employees SET code=?,name=?,national_id=?,address=?,phone=?,department=?,job=?,start_time=?,end_time=? WHERE id=?`).run(x.code,x.name,x.national_id||'',x.address||'',x.phone||'',x.department||'',x.job||'',x.start_time||'08:00',x.end_time||'16:00',req.params.id);res.json({ok:true});}catch(e){res.status(400).json({error:e.message})}});
app.delete('/api/employees/:id',(req,res)=>{db.prepare('DELETE FROM attendance WHERE employee_id=?').run(req.params.id);db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);res.json({ok:true})});
app.get('/api/attendance',(req,res)=>{const date=req.query.date||new Date().toISOString().slice(0,10);res.json(db.prepare(`SELECT a.*,e.code,e.name,e.department,e.start_time,e.end_time FROM attendance a JOIN employees e ON e.id=a.employee_id WHERE a.date=? ORDER BY e.name`).all(date))});
app.post('/api/attendance',(req,res)=>{try{const x=req.body;db.prepare(`INSERT INTO attendance(employee_id,date,check_in,check_out,note) VALUES(?,?,?,?,?) ON CONFLICT(employee_id,date) DO UPDATE SET check_in=excluded.check_in,check_out=excluded.check_out,note=excluded.note`).run(x.employee_id,x.date,x.check_in||null,x.check_out||null,x.note||'');res.json({ok:true})}catch(e){res.status(400).json({error:e.message})}});
app.get('/api/summary',(req,res)=>{const date=req.query.date||new Date().toISOString().slice(0,10);const employees=db.prepare('SELECT COUNT(*) c FROM employees').get().c;const present=db.prepare('SELECT COUNT(*) c FROM attendance WHERE date=? AND check_in IS NOT NULL').get(date).c;const out=db.prepare('SELECT COUNT(*) c FROM attendance WHERE date=? AND check_out IS NOT NULL').get(date).c;res.json({employees,present,out,absent:Math.max(0,employees-present)});});
app.listen(process.env.PORT||3000,()=>console.log('Attendance system running'));
