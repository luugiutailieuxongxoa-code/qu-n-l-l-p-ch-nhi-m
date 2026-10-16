import React, { useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, UserRound, Save, Ban, Eye, EyeOff, Users, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ClassInfo, CurrentUserSession, Student } from '../types';
import { revokeStudentPin, setStudentPin } from '../utils/authClient';

type GeneratedCredential = { studentId: string; name: string; team: number; role: 'student' | 'officer'; password: string };

const makePassword = () => {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%*-_+';
  const all = lower + upper + digits + symbols;
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const chars = [pick(lower), pick(upper), pick(digits), pick(symbols)];
  while (chars.length < 12) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

export const PinManagementPanel: React.FC<{
  classId: string;
  classInfo: ClassInfo;
  students: Student[];
  currentSession: CurrentUserSession;
}> = ({ classId, classInfo, students, currentSession }) => {
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'officer'>('student');
  const [canLogs, setCanLogs] = useState(false);
  const [canAttendance, setCanAttendance] = useState(false);
  const [canPoints, setCanPoints] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [bulkCredentials, setBulkCredentials] = useState<GeneratedCredential[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const selected = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
  const assignment = classInfo.officerAssignments?.find(x => x.studentId === studentId);
  if (currentSession.role !== 'admin' && currentSession.role !== 'teacher') return null;

  const validPassword = pin.length >= 8 && pin.length <= 64 && /[A-Za-z]/.test(pin) && /[0-9]/.test(pin) && /[^A-Za-z0-9\s]/.test(pin);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return setMessage('Vui lòng chọn học sinh.');
    if (!validPassword) return setMessage('Mật khẩu phải dài 8–64 ký tự, gồm chữ cái, chữ số và ký tự đặc biệt.');
    setBusy(true); setMessage('');
    try {
      const effectiveRole = role === 'officer' && assignment ? 'officer' : 'student';
      await setStudentPin({
        classId, studentId: selected.id, displayName: selected.name, pin, role: effectiveRole,
        permissions: {
          canInputLogs: effectiveRole === 'officer' && canLogs,
          canTakeAttendance: effectiveRole === 'officer' && canAttendance,
          canEditPoints: effectiveRole === 'officer' && canPoints,
          assignedCategories: assignment?.assignedCategories || [],
          assignedTeams: assignment?.assignedTeams || [selected.team],
        },
      });
      setPin(''); setShowPassword(false); setMessage(`Đã lưu mật khẩu cho ${selected.name}.`);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Không thể lưu mật khẩu.'); }
    finally { setBusy(false); }
  };

  const revoke = async () => {
    if (!selected || !confirm(`Thu hồi mật khẩu của ${selected.name}?`)) return;
    setBusy(true); setMessage('');
    try { await revokeStudentPin(classId, selected.id); setMessage(`Đã thu hồi mật khẩu của ${selected.name}.`); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Không thể thu hồi mật khẩu.'); }
    finally { setBusy(false); }
  };

  const createBulkPasswords = async () => {
    if (!students.length) { setMessage('Lớp chưa có danh sách học sinh.'); return; }
    if (!confirm(`Tạo mật khẩu riêng cho ${students.length} học sinh của lớp ${classInfo.className}? Mật khẩu hiện tại của các em sẽ bị thay thế.`)) return;
    setBulkBusy(true); setMessage('Đang tạo và lưu mật khẩu cho từng học sinh…'); setBulkCredentials([]);
    const seen = new Set<string>();
    const results: GeneratedCredential[] = [];
    const errors: string[] = [];
    try {
      for (const student of students) {
        let password = makePassword();
        while (seen.has(password)) password = makePassword();
        seen.add(password);
        const assigned = classInfo.officerAssignments?.find(x => x.studentId === student.id);
        const studentRole: 'student' | 'officer' = assigned ? 'officer' : 'student';
        try {
          await setStudentPin({
            classId, studentId: student.id, displayName: student.name, pin: password, role: studentRole,
            permissions: {
              canInputLogs: Boolean(assigned && assigned.assignedCategories?.length),
              canTakeAttendance: Boolean(assigned?.canTakeAttendance),
              canEditPoints: Boolean(assigned?.canEditPoints),
              assignedCategories: assigned?.assignedCategories || [],
              assignedTeams: assigned?.assignedTeams || [student.team],
            },
          });
          results.push({ studentId: student.id, name: student.name, team: student.team, role: studentRole, password });
          setBulkCredentials([...results]);
        } catch (err) {
          errors.push(`${student.name}: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
        }
      }
      setMessage(`Đã lưu ${results.length}/${students.length} mật khẩu.${errors.length ? ` Có ${errors.length} học sinh lỗi: ${errors.slice(0, 3).join('; ')}` : ''}`);
    } finally { setBulkBusy(false); }
  };

  const exportExcel = () => {
    if (!bulkCredentials.length) return;
    const rows = bulkCredentials.map((item, index) => ({
      'STT': index + 1,
      'Họ và tên học sinh': item.name,
      'Mã học sinh': item.studentId,
      'Lớp': classInfo.className,
      'Tổ': item.team,
      'Vai trò': item.role === 'officer' ? 'Ban cán sự' : 'Học sinh',
      'Mật khẩu đăng nhập': item.password,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 24 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Tai khoan hoc sinh');
    XLSX.writeFile(workbook, `Mat_khau_hoc_sinh_${classInfo.className}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <section className="mb-6 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700"><KeyRound className="h-5 w-5" /></div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cấp mật khẩu và phân quyền học sinh</h2>
          <p className="mt-1 text-sm text-slate-600">Mật khẩu được băm và lưu trên máy chủ. Mỗi học sinh có mật khẩu riêng.</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Users className="mt-1 h-5 w-5 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-emerald-950">Tạo mật khẩu riêng cho toàn bộ học sinh</h3>
            <p className="mt-1 text-sm text-emerald-900">Mỗi học sinh được tạo một mật khẩu ngẫu nhiên khác nhau. Sau khi lưu thành công, xuất Excel để gửi riêng thông tin cho từng em.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={createBulkPasswords} disabled={bulkBusy || students.length === 0} className="rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white disabled:opacity-50">
                {bulkBusy ? 'Đang tạo mật khẩu…' : `Tạo mật khẩu cho ${students.length} học sinh`}
              </button>
              <button type="button" onClick={exportExcel} disabled={!bulkCredentials.length || bulkBusy} className="inline-flex items-center gap-2 rounded-xl border border-emerald-700 px-4 py-2.5 font-bold text-emerald-800 disabled:opacity-50">
                <FileSpreadsheet className="h-4 w-4" /> Xuất Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>
        {bulkCredentials.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-emerald-100 text-emerald-950"><tr><th className="p-2">STT</th><th className="p-2">Họ tên</th><th className="p-2">Mã HS</th><th className="p-2">Mật khẩu riêng</th><th className="p-2">Vai trò</th></tr></thead>
              <tbody>{bulkCredentials.map((item, index) => <tr key={item.studentId} className="border-t border-slate-100"><td className="p-2">{index + 1}</td><td className="p-2">{item.name}</td><td className="p-2">{item.studentId}</td><td className="p-2 font-mono font-semibold">{item.password}</td><td className="p-2">{item.role === 'officer' ? 'Ban cán sự' : 'Học sinh'}</td></tr>)}</tbody>
            </table>
            <p className="p-2 text-xs text-amber-800">Lưu ý: bảng chứa mật khẩu dạng rõ. Chỉ tải và gửi đúng mật khẩu cho từng học sinh; không chia sẻ file chung công khai.</p>
          </div>
        )}
      </div>

      <form onSubmit={save} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Học sinh
          <select value={studentId} onChange={e => { const id = e.target.value; const a = classInfo.officerAssignments?.find(x => x.studentId === id); setStudentId(id); setRole(a ? 'officer' : 'student'); setCanLogs(Boolean(a)); setCanAttendance(Boolean(a?.canTakeAttendance)); setCanPoints(Boolean(a?.canEditPoints)); setMessage(''); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal">
            {students.map(s => <option key={s.id} value={s.id}>{s.name} · Tổ {s.team}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Mật khẩu mới (8–64 ký tự)
          <div className="mt-1 flex rounded-xl border border-slate-300 focus-within:border-blue-500">
            <input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={64} value={pin} onChange={e => setPin(e.target.value)} className="w-full min-w-0 rounded-l-xl bg-white px-3 py-3 font-normal outline-none" placeholder="Ví dụ: HocSinh@2026!" aria-describedby="password-help" />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="rounded-r-xl px-3 text-slate-600 hover:bg-slate-50" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
          </div>
          <span id="password-help" className="mt-1 block text-xs font-normal text-slate-500">Cần có chữ cái, số và ký tự đặc biệt. Không dùng khoảng trắng.</span>
          {pin.length > 0 && <span className={`mt-1 block text-xs font-normal ${validPassword ? 'text-green-700' : 'text-amber-700'}`}>{validPassword ? 'Mật khẩu đáp ứng các điều kiện.' : 'Mật khẩu chưa đáp ứng đủ các điều kiện.'}</span>}
        </label>
        <label className="text-sm font-semibold text-slate-700">Vai trò
          <select value={role} onChange={e => setRole(e.target.value as 'student' | 'officer')} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal"><option value="student">Học sinh thường — chỉ phản hồi</option><option value="officer" disabled={!assignment}>Ban cán sự — theo phân công</option></select>
          {role === 'officer' && !assignment && <span className="mt-1 block text-xs text-rose-600">Hãy phân công học sinh trong mục Ban cán sự trước.</span>}
        </label>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <p className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Quyền được cấp</p>
          <label className="mb-2 flex items-center gap-2"><input type="checkbox" checked={canLogs} disabled={role !== 'officer'} onChange={e => setCanLogs(e.target.checked)} />Nhập vi phạm/khen thưởng</label>
          <label className="mb-2 flex items-center gap-2"><input type="checkbox" checked={canAttendance} disabled={role !== 'officer'} onChange={e => setCanAttendance(e.target.checked)} />Điểm danh</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={canPoints} disabled={role !== 'officer'} onChange={e => setCanPoints(e.target.checked)} />Được điều chỉnh điểm</label>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <button type="submit" disabled={busy || !selected || !validPassword || (role === 'officer' && !assignment)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? 'Đang xử lý…' : 'Lưu mật khẩu và quyền'}</button>
          <button type="button" onClick={revoke} disabled={busy || !selected} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-3 font-semibold text-rose-700 disabled:opacity-50"><Ban className="h-4 w-4" />Thu hồi mật khẩu</button>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500"><UserRound className="h-3.5 w-3.5" />{students.length} học sinh</span>
        </div>
      </form>
      {message && <p role="status" className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    </section>
  );
};
