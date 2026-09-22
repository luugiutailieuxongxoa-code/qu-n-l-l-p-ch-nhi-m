import React, { useState } from 'react';
import {
  History,
  Trash2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MessageSquareText,
  User,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { BehaviorLog, Student, CurrentUserSession, ClassInfo } from '../types';
import { isWeekLocked } from '../utils/storage';

interface ActivityLogTabProps {
  logs: BehaviorLog[];
  students: Student[];
  onDeleteLog: (logId: string) => void;
  onClearAllLogs: () => void;
  currentSession?: CurrentUserSession;
  onNavigateFeedback?: (logId?: string) => void;
  classInfo?: ClassInfo;
}

export const ActivityLogTab: React.FC<ActivityLogTabProps> = ({
  logs,
  students,
  onDeleteLog,
  onClearAllLogs,
  currentSession,
  onNavigateFeedback,
  classInfo,
}) => {
  const isAdmin = currentSession?.role === 'admin';
  const isStudent = currentSession?.role === 'student' || !!currentSession?.isReadOnly;
  const currentStudentId = currentSession?.studentId;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudentId, setFilterStudentId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'bonus' | 'penalty'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [onlyMyLogs, setOnlyMyLogs] = useState<boolean>(false);

  // Sắp xếp logs từ mới nhất đến cũ nhất
  const sortedLogs = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Lọc
  const filteredLogs = sortedLogs.filter((log) => {
    if (onlyMyLogs && currentStudentId && log.studentId !== currentStudentId) {
      return false;
    }

    const student = students.find((s) => s.id === log.studentId);
    const studentName = student ? student.name.toLowerCase() : '';

    const matchSearch =
      log.actionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.includes(searchTerm.toLowerCase()) ||
      (log.note && log.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStudent = filterStudentId === 'all' || log.studentId === filterStudentId;
    const matchType = filterType === 'all' || log.type === filterType;
    const matchCategory = filterCategory === 'all' || log.category === filterCategory;

    return matchSearch && matchStudent && matchType && matchCategory;
  });

  const getStudent = (id: string) => students.find((s) => s.id === id);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'hoc_tap':
        return 'Học tập';
      case 'tac_phong':
        return 'Tác phong';
      case 'ky_luat':
        return 'Kỷ luật';
      case 'diem_danh':
        return 'Điểm danh';
      default:
        return category;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-[#1E3A8A]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Nhật Ký Hoạt Động & Ghi Nhận Lớp
                </h2>
                {isStudent && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Chế độ Học sinh
                  </span>
                )}
                {isAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span>GVCN Toàn quyền</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Lưu trữ toàn bộ dòng thời gian khen thưởng, nhắc nhở và kỷ luật trong tuần
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            {currentStudentId && (
              <button
                onClick={() => setOnlyMyLogs(!onlyMyLogs)}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors border flex items-center space-x-1 cursor-pointer ${
                  onlyMyLogs
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Chỉ xem của em</span>
              </button>
            )}

            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
              Tổng: {filteredLogs.length}/{logs.length} bản ghi
            </span>

            {isAdmin && logs.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Thầy/Cô có chắc chắn muốn xóa toàn bộ nhật ký sự kiện?')) {
                    onClearAllLogs();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors border border-rose-200 cursor-pointer"
              >
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
          {/* Tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh, hành vi..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* Lọc học sinh */}
          <select
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            disabled={onlyMyLogs}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] disabled:opacity-50"
          >
            <option value="all">Tất cả học sinh ({students.length})</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Tổ {s.team})
              </option>
            ))}
          </select>

          {/* Lọc loại */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
          >
            <option value="all">Tất cả biến động (Cộng & Trừ)</option>
            <option value="bonus">+ Điểm cộng (Khen thưởng)</option>
            <option value="penalty">- Điểm trừ (Vi phạm)</option>
          </select>

          {/* Lọc phân loại */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="hoc_tap">Học tập</option>
            <option value="tac_phong">Tác phong</option>
            <option value="ky_luat">Kỷ luật</option>
          </select>
        </div>
      </div>

      {/* Danh sách Timeline Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const student = getStudent(log.studentId);
              const isBonus = log.type === 'bonus';
              const isCurrentUsersLog = currentStudentId && log.studentId === currentStudentId;

              return (
                <div
                  key={log.id}
                  className={`p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 ${
                    isCurrentUsersLog ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon loại */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isBonus
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                    >
                      {isBonus ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {student ? student.name : 'Học sinh'}
                        </span>
                        {student && (
                          <span className="text-xs text-slate-500 font-medium">
                            (Tổ {student.team})
                          </span>
                        )}
                        {isCurrentUsersLog && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-800">
                            Của bạn
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          {getCategoryLabel(log.category)}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-700">
                        {log.actionName}
                      </p>

                      {log.note && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">
                          Ghi chú: {log.note}
                        </p>
                      )}

                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{log.timestamp}</span>
                        </div>

                        {log.recordedBy && (
                          <div className="flex items-center space-x-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
                            <User className="w-3 h-3 text-blue-500" />
                            <span>Ghi nhận bởi: <strong className="text-slate-800">{log.recordedBy}</strong></span>
                          </div>
                        )}

                        {log.weekNumber && (
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                            Tuần {log.weekNumber}
                          </span>
                        )}

                        {classInfo && log.weekNumber && isWeekLocked(log.weekNumber, classInfo) && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Đã khóa sổ</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cột điểm & Hành động (Khiếu nại cho Học sinh / Xóa cho Admin) */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                        isBonus
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isBonus ? `+${log.points}đ` : `-${log.points}đ`}
                    </span>

                    {/* Nút khiếu nại cho học sinh nếu là lỗi vi phạm */}
                    {!isBonus && onNavigateFeedback && (
                      <button
                        onClick={() => onNavigateFeedback(log.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Khiếu nại bản ghi trừ điểm này"
                      >
                        <MessageSquareText className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">Khiếu nại</span>
                      </button>
                    )}

                    {/* Nút xóa chỉ dành cho GVCN Admin */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          const isLockedWeek = classInfo && log.weekNumber ? isWeekLocked(log.weekNumber, classInfo) : false;
                          const msg = isLockedWeek
                            ? `CẢNH BÁO: Tuần ${log.weekNumber} đã được khóa sổ tổng kết.\nThầy/Cô có chắc chắn muốn can thiệp XÓA bản ghi "${log.actionName}" để hoàn lại điểm cho học sinh?`
                            : `Xóa bản ghi "${log.actionName}" của học sinh?`;
                          if (confirm(msg)) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa bản ghi này (hoàn tác điểm)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm">Không có bản ghi nhật ký nào phù hợp với bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
};
