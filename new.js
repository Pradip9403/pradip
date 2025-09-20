/*
AttendanceDashboard.jsx
A polished React + Tailwind frontend for "Automated Student Attendance Monitoring and Analytics System".

Usage:
1. Create a React app (Vite recommended):
   npm create vite@latest attendance-app --template react
   cd attendance-app
2. Install dependencies:
   npm install recharts lucide-react
   (Tailwind: follow Tailwind install for Create React App / Vite)
3. Copy this file to src/components/AttendanceDashboard.jsx
4. Import and use in App.jsx: import AttendanceDashboard from './components/AttendanceDashboard';

This component is self-contained with mock data. Replace mock data and handlers with real API calls.
*/

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { User, Calendar, Search, Download } from 'lucide-react';

const COLORS = ['#10b981','#f97316','#ef4444','#3b82f6'];

export default function AttendanceDashboard(){
  // mock students
  const initialStudents = Array.from({length:18}).map((_,i)=>({
    id: i+1,
    name: ['Amit Patil','Riya Sharma','Suresh More','Nikhil Deshmukh','Ankita Rane','Rohit Gaikwad','Sneha Kulkarni','Vivek Joshi','Pooja Khatri','Manish Patange','Kajal More','Prasad Kale','Madhuri Joshi','Aakash Patil','Rakesh Jadhav','Divya Bhosale','Swapnil Pawar','Tanvi Desai'][i],
    roll: `CE20${100+i+1}`,
    dept: 'Computer',
    percent: Math.floor(60 + Math.random()*40)
  }));

  const [students] = useState(initialStudents);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [subject, setSubject] = useState('CS101');
  const [filter, setFilter] = useState('all');
  const [attendanceMap, setAttendanceMap] = useState(() => {
    // keyed by date|subject -> {roll: status}
    const key = `${date}|${subject}`;
    const obj = {};
    initialStudents.forEach(s=> obj[s.roll] = Math.random()>0.3 ? 'present' : 'absent');
    return {[key]: obj};
  });

  const key = `${date}|${subject}`;
  const currentAttendance = attendanceMap[key] || {};

  const presentCount = useMemo(()=> students.reduce((acc,s)=> acc + (currentAttendance[s.roll] === 'present' ? 1 : 0),0), [students, currentAttendance]);

  function mark(roll, status){
    setAttendanceMap(prev => ({
      ...prev,
      [key]: {...(prev[key]||{}), [roll]: status}
    }));
  }

  function markAllPresent(){
    const newMap = {...(attendanceMap[key]||{})};
    students.forEach(s => newMap[s.roll] = 'present');
    setAttendanceMap(prev => ({...prev, [key]: newMap}));
  }

  function exportCSV(){
    const rows = [['Name','Roll','Dept','Status']];
    students.forEach(s=> rows.push([s.name,s.roll,s.dept, (attendanceMap[key] && attendanceMap[key][s.roll]) || 'absent']));
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${key.replace('|','_')}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const defaulters = useMemo(()=> students.filter(s=> s.percent < 75), [students]);

  const barData = students.slice(0,10).map(s=> ({name: s.name.split(' ')[0], percent: s.percent}));
  const pieData = [{name:'Present', value: presentCount},{name:'Absent', value: students.length - presentCount}];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow"><User/></div>
            <div>
              <h1 className="text-2xl font-semibold text-sky-700">Automated Attendance — Dashboard</h1>
              <p className="text-sm text-slate-500">XYZ College • Semester 4 • Demo</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow">
              <Calendar className="w-4 h-4 text-slate-400"/>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="text-sm outline-none" />
            </div>
            <select value={subject} onChange={e=>setSubject(e.target.value)} className="bg-white p-2 rounded-lg shadow text-sm">
              <option value="CS101">CS101 - Data Structures</option>
              <option value="CS102">CS102 - Operating Systems</option>
              <option value="CS103">CS103 - DBMS</option>
            </select>
            <button onClick={exportCSV} className="bg-white p-2 rounded-lg shadow flex items-center gap-2 text-sm"><Download/> Export</button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Attendance Register — {subject}</h2>
                <div className="flex items-center gap-2">
                  <select value={filter} onChange={e=>setFilter(e.target.value)} className="p-2 rounded-lg border text-sm">
                    <option value="all">All</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                  <button onClick={markAllPresent} className="bg-sky-600 text-white px-3 py-2 rounded-lg text-sm">Mark All Present</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">Roll</th>
                      <th className="text-left p-2">Dept</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s=> {
                      const st = (attendanceMap[key] && attendanceMap[key][s.roll]) || 'absent';
                      if(filter==='present' && st!=='present') return false;
                      if(filter==='absent' && st!=='absent') return false;
                      return true;
                    }).map((s,idx)=> (
                      <tr key={s.roll} className="border-b last:border-none hover:bg-slate-50">
                        <td className="p-2">{idx+1}</td>
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2">{s.roll}</td>
                        <td className="p-2">{s.dept}</td>
                        <td className="p-2">{
                          ((attendanceMap[key] && attendanceMap[key][s.roll]) || 'absent') === 'present' ?
                          <span className="text-green-600 font-semibold">Present</span> :
                          <span className="text-red-600 font-semibold">Absent</span>
                        }</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button onClick={()=>mark(s.roll,'present')} className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm">Present</button>
                            <button onClick={()=>mark(s.roll,'absent')} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-sm">Absent</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow">
                <h3 className="text-sm text-slate-500 mb-3">Attendance Trend (Top 10)</h3>
                <div style={{height:200}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{left:0,right:0,top:0,bottom:0}}>
                      <XAxis dataKey="name" tick={false} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percent" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow">
                <h3 className="text-sm text-slate-500 mb-3">Present vs Absent</h3>
                <div style={{height:200}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} label>
                        {pieData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Legend verticalAlign="bottom" />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-sm text-slate-600">Defaulters: <span className="font-semibold">{defaulters.length}</span></div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow">
              <h3 className="text-base font-medium mb-3">Summary</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Total Students</span><strong>{students.length}</strong></div>
                <div className="flex justify-between"><span>Present</span><strong className="text-green-600">{presentCount}</strong></div>
                <div className="flex justify-between"><span>Absent</span><strong className="text-red-600">{students.length - presentCount}</strong></div>
                <div className="flex justify-between"><span>Defaulters (&lt;75%)</span><strong>{defaulters.length}</strong></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow">
              <h3 className="text-base font-medium mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <button onClick={markAllPresent} className="w-full bg-emerald-500 text-white py-2 rounded-lg">Mark All Present</button>
                <button onClick={exportCSV} className="w-full border border-slate-200 py-2 rounded-lg">Export CSV</button>
                <button className="w-full bg-sky-600 text-white py-2 rounded-lg">Sync with Server</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow">
              <h3 className="text-base font-medium mb-3">Filters</h3>
              <div className="flex flex-col gap-2">
                <input placeholder="Search name or roll" className="p-2 border rounded-lg text-sm" />
                <select className="p-2 border rounded-lg text-sm">
                  <option>All Departments</option>
                  <option>Computer</option>
                  <option>Mechanical</option>
                </select>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 text-center text-sm text-slate-500">Prototype • Replace mock data with real APIs • Built with React + Tailwind + Recharts</footer>
      </div>
    </div>
  );
}