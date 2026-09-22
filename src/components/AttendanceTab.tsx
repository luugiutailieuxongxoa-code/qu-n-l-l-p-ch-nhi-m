import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  Users,
  CheckCheck,
  Calendar,
  AlertCircle,
  Sparkles,
  Info,
  Shield,
  ArrowRightLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  MessageSquareText,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  AttendanceStatus,
  CurrentUserSession,
  ClassInfo,
} from '../types';
import { ATTENDANCE_PENALTY_CONFIG } from '../data/mockData';
import { getTodayLocalDateString, isWeekLocked } from '../utils/storage';

interface AttendanceTabProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  currentSession: CurrentUserSession;
  classInfo: ClassInfo;
  onOpenRoleSwitcher: () => void;
  onNavigateFeedback?: () => void;
  onToggleLockPeriod?: (type: 'week' | 'month', periodNumber: number) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  students,
  attendance,
  onUpdateAttendance,
  currentSession,
  classInfo,
  onOpenRoleSwitcher,
  onNavigateFeedback,
  onToggleLockPeriod,
}) => {
  const isAdmin = currentSession.role === 'admin';
  const isStudent = currentSession.role === 'student' || !!currentSession.isReadOnly;
  const isLocked = isWeekLocked(classInfo.weekNumber, classInfo);
  const canEdit = !isStudent && (!isLocked || isAdmin);
  const allowedTeams = currentSession.assignedTeams || [1, 2, 3, 4];
  const canTakeAttendance = !isStudent && (isAdmin || currentSession.canTakeAttendance !== false);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalDateString());
  const [selectedTeam, setSelectedTeam] = useState<number | 'all'>(
    !isAdmin && allowedTeams.length === 1 ? allowedTeams[0] : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'unrecorded' | 'absent' | 'late' | 'present'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

  // Điều hướng ngày nhanh chóng
  const handleShiftDate = (days: number) => {
    const parts = selectedDate.split('-');
    const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    cur.setDate(cur.getDate() + days);
    setSelectedDate(getTodayLocalDateString(cur));
  };

  const handleGoToday = () => {
    setSelectedDate(getTodayLocalDateString());
  };

  // Lọc bản ghi điểm danh cho ngày đã chọn
  const dayRecords = attendance.filter((a) => a.date === selectedDate);

  // Helper tìm trạng thái học sinh trong ngày
  const getStudentStatus = (studentId: string): AttendanceStatus | null => {
    const record = dayRecords.find((a) => a.studentId === studentId);
    return record ? record.status : null;
  };

  const getStudentNote = (studentId: string): string => {
    const record = dayRecords.find((a) => a.studentId === studentId);
    return record?.note || '';
  };

  // Cập nhật trạng thái điểm danh cho 1 học sinh
  const handleSetStatus = (studentId: string, status: AttendanceStatus, note?: string) => {
    if (!canEdit) {
      if (isStudent) {
        alert('Tài khoản học sinh chỉ có quyền xem chuyên cần. Nếu có sai sót về điểm danh, xin vui lòng gửi phản hồi tại mục Phản Hồi!');
      } else if (isLocked) {
        alert(`Tuần ${classInfo.weekNumber} đã được Giáo viên chủ nhiệm khóa sổ tổng kết. Không thể sửa đổi chuyên cần!`);
      }
      return;
    }
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const existingIndex = attendance.findIndex(
      (a) => a.date === selectedDate && a.studentId === studentId
    );

    let updated: AttendanceRecord[];
    if (existingIndex >= 0) {
      updated = [...attendance];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        note: note !== undefined ? note : updated[existingIndex].note,
        timestamp: `${selectedDate} ${nowTime}`,
        weekNumber: classInfo.weekNumber,
        recordedBy: currentSession.displayName,
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${studentId}`,
        date: selectedDate,
        weekNumber: classInfo.weekNumber,
        studentId,
        status,
        note,
        timestamp: `${selectedDate} ${nowTime}`,
        recordedBy: currentSession.displayName,
      };
      updated = [...attendance, newRecord];
    }
    onUpdateAttendance(updated);
  };

  // Điểm danh nhanh tất cả học sinh đang hiển thị là "Có mặt"
  const handleMarkAllPresent = () => {
    if (!canEdit) {
      if (isStudent) {
        alert('Tài khoản học sinh chỉ có quyền xem chuyên cần.');
      } else if (isLocked) {
        alert(`Tuần ${classInfo.weekNumber} đã được Giáo viên chủ nhiệm khóa sổ tổng kết.`);
      }
      return;
    }
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    let updated = [...attendance];

    filteredStudents.forEach((student) => {
      // Chỉ cho phép điểm danh các học sinh trong phạm vi được phân công
      if (!isAdmin && !allowedTeams.includes(student.team)) return;

      const idx = updated.findIndex(
        (a) => a.date === selectedDate && a.studentId === student.id
      );
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          status: 'present',
          timestamp: `${selectedDate} ${nowTime}`,
          weekNumber: classInfo.weekNumber,
          recordedBy: currentSession.displayName,
        };
      } else {
        updated.push({
          id: `att-${Date.now()}-${student.id}`,
          date: selectedDate,
          weekNumber: classInfo.weekNumber,
          studentId: student.id,
          status: 'present',
          timestamp: `${selectedDate} ${nowTime}`,
          recordedBy: currentSession.displayName,
        });
      }
    });

    onUpdateAttendance(updated);
  };

  // Lưu ghi chú lý do
  const handleSaveNote = (studentId: string) => {
    const currentStatus = getStudentStatus(studentId) || 'present';
    handleSetStatus(studentId, currentStatus, tempNote.trim());
    setEditingNoteStudentId(null);
    setTempNote('');
  };

  // Lọc theo tổ, trạng thái và tìm kiếm
  const filteredStudents = students.filter((s) => {
    if (selectedTeam !== 'all' && s.team !== selectedTeam) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchPhone = s.parentPhone?.includes(q);
      if (!matchName && !matchPhone) return false;
    }

    if (statusFilter !== 'all') {
      const status = getStudentStatus(s.id);
      if (statusFilter === 'unrecorded') {
        if (status !== null) return false;
      } else if (statusFilter === 'absent') {
        if (status !== 'excused' && status !== 'unexcused') return false;
      } else if (statusFilter === 'late') {
        if (status !== 'late') return false;
      } else if (statusFilter === 'present') {
        if (status !== 'present') return false;
      }
    }

    return true;
  });

  // Thống kê nhanh trong ngày
  const totalStudents = students.length;
  const presentCount = dayRecords.filter((a) => a.status === 'present').length;
  const lateCount = dayRecords.filter((a) => a.status === 'late').length;
  const excusedCount = dayRecords.filter((a) => a.status === 'excused').length;
  const unexcusedCount = dayRecords.filter((a) => a.status === 'unexcused').length;
  const unrecordedCount = totalStudents - (presentCount + lateCount + excusedCount + unexcusedCount);

  return (
    <div className="space-y-6">
      {/* BANNER PHÂN QUYỀN VAI TRÒ */}
      <div className="bg-white rounded-2xl shadow-xs border border-blue-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAdmin
                ? 'bg-amber-100 text-amber-700'
                : isStudent
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-[#1E3A8A]'
            }`}
          >
            {isAdmin ? (
              <Shield className="w-5 h-5" />
            ) : isStudent ? (
              <UserCheck className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">
                {currentSession.displayName}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isStudent
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {isAdmin
                  ? 'Toàn quyền Điểm danh (Admin)'
                  : isStudent
                  ? 'Học sinh (Chỉ xem)'
                  : 'Ban Cán Sự Lớp'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'GVCN quản lý sĩ số chuyên cần toàn lớp.'
                : isStudent
                ? 'Bạn đang ở chế độ xem lịch sử chuyên cần. Nếu có nhầm lẫn, hãy gửi khiếu nại để GVCN sửa đổi.'
                : `Phạm vi điểm danh: ${
                    allowedTeams.length === 4 ? 'Cả lớp' : `Tổ ${allowedTeams.join(', ')}`
                  }`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isStudent && onNavigateFeedback && (
            <button
              onClick={onNavigateFeedback}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-300 transition-colors shrink-0 cursor-pointer"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-amber-700" />
              <span>Phản Hồi Điểm Danh</span>
            </button>
          )}

          <button
            onClick={onOpenRoleSwitcher}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-blue-50 text-[#1E3A8A] rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-300 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Đổi Vai Trò</span>
          </button>
        </div>
      </div>

      {/* CẢNH BÁO NẾU TUẦN ĐÃ KHÓA SỔ */}
      {isLocked && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 text-xs shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-950">
                Tuần thi đua số {classInfo.weekNumber} đã khóa sổ chuyên cần
              </h4>
              <p className="text-rose-800 mt-0.5">
                Dữ liệu chuyên cần tuần này đã được chốt. {isAdmin ? 'Thầy/Cô có quyền mở khóa để cập nhật nếu cần.' : 'Ban cán sự và học sinh không thể thay đổi dữ liệu.'}
              </p>
            </div>
          </div>
          {isAdmin && onToggleLockPeriod && (
            <button
              onClick={() => onToggleLockPeriod('week', classInfo.weekNumber)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Mở khóa tuần {classInfo.weekNumber}
            </button>
          )}
        </div>
      )}

      {/* THANH ĐIỀU KHIỂN & BỘ LỌC NGÀY / TỔ */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-[#1E3A8A] rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Sổ Điểm Danh Chuyên Cần
              </h3>
              <p className="text-xs text-slate-500">
                Tuần thi đua số: <strong className="text-[#1E3A8A]">{classInfo.weekNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                title="Lùi 1 ngày"
                className="p-1.5 text-slate-600 hover:text-[#1E3A8A] hover:bg-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent px-1.5 py-1 focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                title="Tiến 1 ngày"
                className="p-1.5 text-slate-600 hover:text-[#1E3A8A] hover:bg-white rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2 py-1 text-[11px] font-bold text-[#1E3A8A] hover:bg-white rounded-lg transition-colors"
              >
                Hôm nay
              </button>
            </div>

            {canEdit && (
              <button
                onClick={handleMarkAllPresent}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Điểm Danh Có Mặt Hàng Loạt</span>
              </button>
            )}
          </div>
        </div>

        {/* THẺ THỐNG KÊ NHANH TRONG NGÀY (Bấm để lọc nhanh) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'present'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400'
                : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Có Mặt</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black text-emerald-700">{presentCount}</span>
              <span className="text-[11px] text-emerald-600">0đ phạt</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'late'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                : 'bg-amber-50 border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">Đi Trễ</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black text-amber-700">{lateCount}</span>
              <span className="text-[11px] text-amber-600">-{ATTENDANCE_PENALTY_CONFIG.late}đ/buổi</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'absent'
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-400'
                : 'bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">Có Phép</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black text-blue-700">{excusedCount}</span>
              <span className="text-[11px] text-blue-600">0đ phạt</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'absent'
                ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400'
                : 'bg-rose-50 border-rose-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">Không Phép</span>
              <UserX className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black text-rose-700">{unexcusedCount}</span>
              <span className="text-[11px] text-rose-600">
                -{ATTENDANCE_PENALTY_CONFIG.unexcused}đ/buổi
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'unrecorded' ? 'all' : 'unrecorded')}
            className={`col-span-2 sm:col-span-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'unrecorded'
                ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-400'
                : 'bg-slate-100 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Chưa Điểm Danh</span>
              <AlertCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-700">{unrecordedCount}</span>
              <span className="text-[11px] text-slate-500">/ {totalStudents} HS</span>
            </div>
          </button>
        </div>

        {/* BỘ LỌC TỔ & TÌM KIẾM NHANH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Lọc theo tổ:</span>
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setSelectedTeam('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  selectedTeam === 'all'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({students.length})
              </button>
              {[1, 2, 3, 4].map((team) => (
                <button
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    selectedTeam === team
                      ? 'bg-white text-[#1E3A8A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tổ {team}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên học sinh, SĐT..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-[11px] font-bold text-rose-600 hover:underline px-1"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH HỌC SINH ĐIỂM DANH */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center">STT</th>
                <th className="py-3 px-3">Họ và Tên</th>
                <th className="py-3 px-2 text-center">Tổ</th>
                <th className="py-3 px-4 text-center">Trạng Thái Điểm Danh Hôm Nay</th>
                <th className="py-3 px-3">Ghi Chú Lý Do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student, idx) => {
                const currentStatus = getStudentStatus(student.id);
                const currentNote = getStudentNote(student.id);
                const isEditingNote = editingNoteStudentId === student.id;
                const isPermitted = isAdmin || allowedTeams.includes(student.team);

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !isPermitted ? 'opacity-60 bg-slate-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {student.gender} • SĐT PH: {student.parentPhone || 'Chưa cập nhật'}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-700">
                      Tổ {student.team}
                    </td>
                    <td className="py-3 px-4">
                      {isStudent ? (
                        <div className="flex items-center justify-center">
                          {currentStatus === 'present' && (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Có mặt</span>
                            </span>
                          )}
                          {currentStatus === 'late' && (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Đi trễ (-2đ)</span>
                            </span>
                          )}
                          {currentStatus === 'excused' && (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>Vắng có phép</span>
                            </span>
                          )}
                          {currentStatus === 'unexcused' && (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                              <span>Vắng KP (-5đ)</span>
                            </span>
                          )}
                          {!currentStatus && (
                            <span className="text-slate-400 italic text-[11px]">Chưa ghi nhận</span>
                          )}
                        </div>
                      ) : isPermitted ? (
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Có mặt */}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleSetStatus(student.id, 'present')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Có mặt</span>
                          </button>

                          {/* Đi trễ */}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleSetStatus(student.id, 'late')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Trễ (-2đ)</span>
                          </button>

                          {/* Có phép */}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleSetStatus(student.id, 'excused')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              currentStatus === 'excused'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Có phép</span>
                          </button>

                          {/* Không phép */}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleSetStatus(student.id, 'unexcused')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              currentStatus === 'unexcused'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>KP (-5đ)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 italic">
                          Thuộc phụ trách của cán sự Tổ {student.team}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isEditingNote ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            autoFocus
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            placeholder="Lý do (VD: Bị hỏng xe, sốt có đơn...)"
                            className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                          />
                          <button
                            onClick={() => handleSaveNote(student.id)}
                            className="px-2 py-1 bg-[#1E3A8A] text-white rounded text-[11px] font-bold"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingNoteStudentId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px]"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            if (!isPermitted) return;
                            setEditingNoteStudentId(student.id);
                            setTempNote(currentNote);
                          }}
                          className={`cursor-pointer group flex items-center space-x-1.5 text-slate-600 ${
                            isPermitted ? 'hover:text-[#1E3A8A]' : ''
                          }`}
                        >
                          <span className={currentNote ? 'font-medium' : 'text-slate-400 italic'}>
                            {currentNote || (isPermitted ? '+ Thêm lý do ghi chú...' : '—')}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
