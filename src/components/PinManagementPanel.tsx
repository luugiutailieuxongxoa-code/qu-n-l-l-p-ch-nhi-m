import React, { useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, UserRound, Save, Ban } from 'lucide-react';
import type { ClassInfo, CurrentUserSession, Student } from '../types';
import { revokeStudentPin, setStudentPin } from '../utils/authClient';

export const PinManagementPanel: React.FC<{ classId: string; classInfo: ClassInfo; students: Student[]; currentSession: CurrentUserSession }> = ({ classId, classInfo, students, currentSession }) => {
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'student' | 'officer'>('student');
  const [canLogs, setCanLogs] = useState(false);
  const [canAttendance, setCanAttendance] = useState(false);
  const [canPoints, setCanPoints] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const selected = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
  const assignment = classInfo.officerAssignments?.find(x => x.studentId === studentId);
  if (currentSession.role !== 'admin') return null;
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return;
    setBusy(true); setMessage('');
    try {
      const effectiveRole = role === 'officer' && assignment ? 'officer' : role;
      await setStudentPin({ classId, studentId: selected.id, displayName: selected.name, pin, role: effectiveRole, permissions: {
        canInputLogs: effectiveRole === 'officer' && canLogs,
        canTakeAttendance: effectiveRole === 'officer' && canAttendance,
        canEditPoints: effectiveRole === 'officer' && canPoints,
        assignedCategories: assignment?.assignedCategories || [], assignedTeams: assignment?.assignedTeams || [selected.team],
      }});
      setPin(''); setMessage(`Đã lưu PIN cho ${selected.name}.`);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Không thể lưu PIN.'); }
    finally { setBusy(false); }
  };
  const revoke = async () => {
    if (!selected || !confirm(`Thu hồi PIN của ${selected.name}?`)) return;
    setBusy(true); setMessage('');
    try { await revokeStudentPin(classId, selected.id); setMessage(`Đã thu hồi PIN của ${selected.name}.`); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Không thể thu hồi PIN.'); }
    finally { setBusy(false); }
  };
  return <section className="mb-6 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-4 flex items-start gap-3"><div className="rounded-xl bg-blue-100 p-3 text-blue-700"><KeyRound className="h-5 w-5" /></div><div><h2 className="text-lg font-bold text-slate-900">Cấp PIN và phân quyền học sinh</h2><p className="mt-1 text-sm text-slate-600">PIN được băm và lưu trên máy chủ. Học sinh không có PIN sẽ không đăng nhập được.</p></div></div>
    <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Học sinh<select value={studentId} onChange={e => { setStudentId(e.target.value); const a = classInfo.officerAssignments?.find(x => x.studentId === e.target.value); setRole(a ? 'officer' : 'student'); setCanLogs(Boolean(a)); setCanAttendance(Boolean(a?.canTakeAttendance)); setCanPoints(Boolean(a?.canEditPoints)); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal">{students.map(s => <option key={s.id} value={s.id}>{s.name} · Tổ {s.team}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700">PIN mới (4–8 chữ số)<input required type="password" inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} value={pin} onChange={e => setPin(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="Nhập PIN mới" /></label>
      <label className="text-sm font-semibold text-slate-700">Vai trò<select value={role} onChange={e => setRole(e.target.value as 'student' | 'officer')} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"><option value="student">Học sinh thường — chỉ phản hồi</option><option value="officer" disabled={!assignment}>Ban cán sự — theo phân công</option></select>{role === 'officer' && !assignment && <span className="mt-1 block text-xs text-rose-600">Hãy phân công học sinh trong mục Ban cán sự trước.</span>}</label>
      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><p className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Quyền được cấp</p>
        <label className="mb-2 flex items-center gap-2"><input type="checkbox" checked={canLogs} disabled={role !== 'officer'} onChange={e => setCanLogs(e.target.checked)} /> Nhập vi phạm/khen thưởng</label>
        <label className="mb-2 flex items-center gap-2"><input type="checkbox" checked={canAttendance} disabled={role !== 'officer'} onChange={e => setCanAttendance(e.target.checked)} /> Điểm danh</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={canPoints} disabled={role !== 'officer'} onChange={e => setCanPoints(e.target.checked)} /> Được điều chỉnh điểm</label>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:col-span-2"><button disabled={busy || !selected || (role === 'officer' && !assignment)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? 'Đang xử lý…' : 'Lưu PIN và quyền'}</button><button type="button" onClick={revoke} disabled={busy || !selected} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-3 font-semibold text-rose-700 disabled:opacity-50"><Ban className="h-4 w-4" />Thu hồi PIN</button><span className="inline-flex items-center gap-1 text-xs text-slate-500"><UserRound className="h-3.5 w-3.5" />{students.length} học sinh</span></div>
    </form>
    {message && <p role="status" className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
  </section>;
};
