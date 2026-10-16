import React, { useEffect, useMemo, useState } from 'react';
import { Download, Printer, RefreshCw, Save, Users, WandSparkles, ArrowLeftRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Student } from '../types';

type Seat = { desk: number; studentIds: string[] };
type Plan = { rows: number; columns: number; seats: Seat[] };

interface SeatingChartTabProps { classId: string; className: string; schoolName: string; students: Student[]; }
const keyFor = (id: string) => `smartclass_seating_plan_v1_${id}`;

export const SeatingChartTab: React.FC<SeatingChartTabProps> = ({ classId, className, schoolName, students }) => {
  const [deskCount, setDeskCount] = useState(24);
  const [studentsPerDesk, setStudentsPerDesk] = useState(2);
  const [columns, setColumns] = useState(4);
  const [plan, setPlan] = useState<Plan>({ rows: 6, columns: 4, seats: [] });
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState('');
  const [moveTeam, setMoveTeam] = useState('1');
  const [targetColumn, setTargetColumn] = useState(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(classId));
      if (raw) {
        const parsed = JSON.parse(raw) as Plan;
        if (Array.isArray(parsed.seats)) { setPlan(parsed); setDeskCount(parsed.seats.length); setColumns(parsed.columns || 4); }
        else makePlan(24, 4, 2, students, setPlan);
      } else makePlan(24, 4, 2, students, setPlan);
    } catch { makePlan(24, 4, 2, students, setPlan); }
    setSaved(false);
  }, [classId, students]);

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const assignedIds = useMemo(() => new Set(plan.seats.flatMap(s => s.studentIds).filter(Boolean)), [plan]);
  const unassigned = students.filter(s => !assignedIds.has(s.id));

  function makePlan(count: number, cols: number, perDesk: number, roster: Student[], setter: (p: Plan) => void) {
    const seats: Seat[] = Array.from({ length: count }, (_, i) => ({ desk: i + 1, studentIds: roster.slice(i * perDesk, i * perDesk + perDesk).map(s => s.id) }));
    setter({ rows: Math.ceil(count / cols), columns: cols, seats });
  }
  const generate = () => {
    const shuffled = [...students];
    // Tạo phương án cân bằng đơn giản: luân phiên học sinh theo tổ, sau đó điền lần lượt vào bàn.
    shuffled.sort((a, b) => (a.team - b.team) || a.name.localeCompare(b.name, 'vi'));
    const count = Math.max(1, Math.min(60, Math.floor(deskCount)));
    const perDesk = Math.max(1, Math.min(3, Math.floor(studentsPerDesk)));
    const ordered: Student[] = [];
    const teams = new Map<number, Student[]>();
    shuffled.forEach(s => { if (!teams.has(s.team)) teams.set(s.team, []); teams.get(s.team)!.push(s); });
    while ([...teams.values()].some(a => a.length)) for (const group of teams.values()) { const next = group.shift(); if (next) ordered.push(next); }
    makePlan(count, Math.max(1, Math.min(count, columns)), perDesk, ordered, setPlan);
    setSelectedStudent(null); setSaved(false); setNotice('Đã tạo phương án chỗ ngồi. Hãy kiểm tra và nhấn Lưu sơ đồ.');
  };
  const savePlan = () => { try { localStorage.setItem(keyFor(classId), JSON.stringify(plan)); setSaved(true); setNotice('Đã lưu sơ đồ trên thiết bị này.'); } catch { setNotice('Không thể lưu sơ đồ trên trình duyệt.'); } };
  const moveTeamToColumn = () => {
    const teamNumber = Number(moveTeam);
    const teamStudents = students.filter(s => Number(s.team) === teamNumber);
    if (!teamStudents.length) { setNotice(`Không tìm thấy học sinh thuộc Tổ ${teamNumber}.`); return; }
    const cols = Math.max(1, plan.columns);
    const col = Math.max(1, Math.min(cols, targetColumn));
    const capacity = plan.seats.reduce((sum, seat, index) => sum + (index % cols === col - 1 ? studentsPerDesk : 0), 0);
    if (teamStudents.length > capacity) { setNotice(`Tổ ${teamNumber} có ${teamStudents.length} học sinh, vượt quá ${capacity} chỗ ở Dãy ${col}. Hãy tăng số bàn hoặc chọn dãy khác.`); return; }
    const teamIds = new Set(teamStudents.map(s => s.id));
    const allIds = plan.seats.flatMap(seat => seat.studentIds).filter(id => id && !teamIds.has(id));
    const seats = plan.seats.map((seat, index) => ({ ...seat, studentIds: Array.from({ length: studentsPerDesk }, () => '') }));
    let teamIndex = 0;
    seats.forEach((seat, index) => { if (index % cols === col - 1) { for (let slot = 0; slot < studentsPerDesk && teamIndex < teamStudents.length; slot++) seat.studentIds[slot] = teamStudents[teamIndex++].id; } });
    let otherIndex = 0;
    seats.forEach((seat, index) => { for (let slot = 0; slot < studentsPerDesk; slot++) { if (seat.studentIds[slot]) continue; if (otherIndex < allIds.length) seat.studentIds[slot] = allIds[otherIndex++]; } });
    setPlan({ ...plan, seats }); setSaved(false); setSelectedStudent(null);
    setNotice(`Đã chuyển Tổ ${teamNumber} sang Dãy ${col}. Nhấn “Lưu sơ đồ” để lưu thay đổi.`);
  };
  const swap = (desk: number, slot: number) => {
    const targetSeat = plan.seats.find(seat => seat.desk === desk);
    const targetId = targetSeat?.studentIds[slot] || '';
    if (!selectedStudent) {
      if (targetId) setSelectedStudent(targetId);
      return;
    }
    if (selectedStudent === targetId) { setSelectedStudent(null); return; }

    // Hoán đổi hai học sinh thay vì ghi đè khiến một em bị mất khỏi sơ đồ.
    const nextSeats = plan.seats.map(seat => ({ ...seat, studentIds: [...seat.studentIds] }));
    let sourceDesk = -1;
    let sourceSlot = -1;
    nextSeats.forEach((seat, seatIndex) => {
      const slotIndex = seat.studentIds.findIndex(id => String(id) === String(selectedStudent));
      if (slotIndex >= 0) { sourceDesk = seatIndex; sourceSlot = slotIndex; }
    });
    const targetDeskIndex = nextSeats.findIndex(seat => seat.desk === desk);
    if (sourceDesk >= 0 && targetDeskIndex >= 0) {
      while (nextSeats[sourceDesk].studentIds.length <= sourceSlot) nextSeats[sourceDesk].studentIds.push('');
      while (nextSeats[targetDeskIndex].studentIds.length <= slot) nextSeats[targetDeskIndex].studentIds.push('');
      nextSeats[sourceDesk].studentIds[sourceSlot] = targetId;
      nextSeats[targetDeskIndex].studentIds[slot] = selectedStudent;
      setPlan({ ...plan, seats: nextSeats });
      setSaved(false);
      setNotice('Đã đổi vị trí học sinh. Nhấn “Lưu sơ đồ” để lưu thay đổi.');
    }
    setSelectedStudent(null);
  };

  const exportPdf = async () => {
    const node = document.getElementById('seating-chart-pdf-content');
    if (!node) { setNotice('Không tạo được vùng xuất PDF. Vui lòng tải lại trang.'); return; }
    try {
      setNotice('Đang tạo file PDF sơ đồ chỗ ngồi...');
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const image = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      pdf.addImage(image, 'PNG', (pageWidth - width) / 2, margin, width, height);
      pdf.save(`So_do_cho_ngoi_${String(className).replace(/[^a-z0-9_-]/gi, '_')}.pdf`);
      setNotice('Đã tải PDF sơ đồ chỗ ngồi theo đúng bố cục hiện tại.');
    } catch (error) {
      console.error('Lỗi xuất PDF sơ đồ chỗ ngồi:', error);
      setNotice('Không xuất được PDF. Hãy thử lại hoặc dùng In / Lưu PDF.');
    }
  };
  const exportExcel = () => {
    const rows = plan.seats.map(seat => ({ 'Bàn số': seat.desk, 'Vị trí 1': studentMap.get(seat.studentIds[0])?.name || '', 'Mã HS 1': seat.studentIds[0] || '', 'Vị trí 2': studentMap.get(seat.studentIds[1])?.name || '', 'Mã HS 2': seat.studentIds[1] || '' }));
    const ws = XLSX.utils.json_to_sheet([{ 'Lớp': className, 'Trường': schoolName }, ...rows]);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 18 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'So do cho ngoi'); XLSX.writeFile(wb, `So_do_lop_${className}.xlsx`);
  };
  return <div className="space-y-5">
    <div className="rounded-2xl bg-gradient-to-r from-indigo-900 to-blue-800 p-5 text-white shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-sm text-blue-200">SMARTCLASS · SƠ ĐỒ LỚP HỌC</div><h2 className="mt-1 text-2xl font-bold">Sơ đồ chỗ ngồi {className}</h2><p className="mt-1 text-sm text-blue-100">{schoolName} · {students.length} học sinh</p></div><div className="rounded-xl bg-white/10 p-3"><Users className="h-8 w-8"/></div></div>
    </div>
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
      <label className="text-sm font-medium">Số bàn<input type="number" min={1} max={60} value={deskCount} onChange={e=>setDeskCount(Math.max(1, Math.min(60, Number(e.target.value)||1)))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"/></label>
      <label className="text-sm font-medium">Học sinh/bàn<select value={studentsPerDesk} onChange={e=>setStudentsPerDesk(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value={1}>1 học sinh</option><option value={2}>2 học sinh</option><option value={3}>3 học sinh</option></select></label>
      <label className="text-sm font-medium">Số cột bàn<select value={columns} onChange={e=>setColumns(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{[2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n} cột</option>)}</select></label>
      <div className="flex items-end"><button onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 font-semibold text-white hover:bg-indigo-700"><WandSparkles size={17}/> AI tạo sơ đồ</button></div>
    </div>
    <div className="grid gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 md:grid-cols-[1fr_1fr_auto]">
      <label className="text-sm font-semibold text-indigo-950">Chọn tổ cần di chuyển<select value={moveTeam} onChange={e=>setMoveTeam(e.target.value)} className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2">{Array.from(new Set(students.map(s=>Number(s.team)).filter(n=>Number.isFinite(n)&&n>0))).sort((a,b)=>a-b).map(team=><option key={team} value={team}>Tổ {team}</option>)}</select></label>
      <label className="text-sm font-semibold text-indigo-950">Chuyển đến dãy<select value={targetColumn} onChange={e=>setTargetColumn(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2">{Array.from({length:plan.columns},(_,i)=><option key={i+1} value={i+1}>Dãy {i+1}</option>)}</select></label>
      <div className="flex items-end"><button onClick={moveTeamToColumn} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Di chuyển tổ</button></div>
      <p className="text-xs text-indigo-800 md:col-span-3">Di chuyển toàn bộ học sinh của tổ sang dãy đã chọn; các học sinh khác được xếp lại vào những chỗ còn lại. Kiểm tra sơ đồ rồi nhấn “Lưu sơ đồ”.</p>
    </div>
    <div className="flex flex-wrap items-center gap-2"><button onClick={savePlan} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Save size={16}/> Lưu sơ đồ</button><button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"><Download size={16}/> Xuất Excel</button><button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"><Download size={16}/> Tải sơ đồ PDF</button><button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"><Printer size={16}/> In sơ đồ</button><span className="text-sm text-slate-500">{saved ? 'Đã lưu trên thiết bị này' : 'Có thay đổi chưa lưu'}</span></div>
    {notice && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>}
    <div id="seating-chart-pdf-content" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" style={{ width: 1100, maxWidth: "100%", boxSizing: "border-box" }}>
      <div className="mb-5 text-center text-slate-900"><div className="text-lg font-extrabold">{schoolName}</div><div className="text-base font-bold">SƠ ĐỒ CHỖ NGỒI LỚP {className}</div><div className="text-sm">{students.length} học sinh · {plan.seats.length} bàn · {plan.columns} dãy</div></div>
      <div className="mx-auto mb-6 max-w-2xl rounded-xl border-2 border-slate-300 bg-slate-800 px-4 py-3 text-center font-bold tracking-[0.2em] text-white shadow">BẢNG · BÀN GIÁO VIÊN</div>
      {selectedStudent && <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><ArrowLeftRight size={16}/> Đang chọn {studentMap.get(selectedStudent)?.name}. Nhấn vị trí khác để chuyển học sinh.</div>}
      <div className="grid gap-3" style={{gridTemplateColumns:`repeat(${plan.columns}, minmax(0, 1fr))`}}>{plan.seats.map(seat=><div key={seat.desk} className="min-w-0 rounded-xl border border-blue-200 bg-white p-2 shadow-sm"><div className="mb-2 text-center text-xs font-bold uppercase text-slate-400">Bàn {seat.desk}</div>{Array.from({length:studentsPerDesk},(_,slot)=>{const id=seat.studentIds[slot]; const student=id?studentMap.get(id):undefined; return <button key={slot} onClick={()=>swap(seat.desk,slot)} className={`mb-1 min-h-12 w-full break-words rounded-lg border px-1.5 py-2 text-xs font-medium ${student?'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100':'border-dashed border-slate-300 bg-slate-50 text-slate-400'} ${selectedStudent===id?'ring-2 ring-amber-400':''}`}>{student?.name || `Chỗ trống ${slot+1}`}</button>})}</div>)}</div>
      {unassigned.length>0 && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3"><h3 className="font-semibold text-amber-900">Học sinh chưa xếp ({unassigned.length})</h3><div className="mt-2 flex flex-wrap gap-2">{unassigned.map(s=><span key={s.id} className="rounded-full bg-white px-3 py-1 text-sm text-slate-700">{s.name}</span>)}</div></div>}
      <p className="mt-4 text-xs text-slate-500">Đổi chỗ: nhấn tên học sinh để chọn, sau đó nhấn vị trí muốn chuyển đến. Sơ đồ hiện được lưu trên trình duyệt của thiết bị này.</p>
    </div>
  </div>;
};
