import React, { useState } from 'react';
import {
  MessageSquareText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  Trash2,
  Check,
  X,
  Filter,
  User,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
  FileCheck,
} from 'lucide-react';
import {
  StudentFeedback,
  FeedbackType,
  FeedbackStatus,
  CurrentUserSession,
  Student,
  BehaviorLog,
  ClassInfo,
} from '../types';
import { getTodayLocalDateString } from '../utils/storage';

interface FeedbackTabProps {
  feedbacks: StudentFeedback[];
  onAddFeedback: (feedback: Omit<StudentFeedback, 'id' | 'createdAt' | 'status'>) => void;
  onResolveFeedback: (
    feedbackId: string,
    status: 'approved' | 'rejected',
    teacherReply: string,
    deleteRelatedLog?: boolean
  ) => void;
  onDeleteFeedback: (feedbackId: string) => void;
  currentSession: CurrentUserSession;
  students: Student[];
  logs: BehaviorLog[];
  classInfo: ClassInfo;
  currentWeek: number;
  preselectedLogId?: string;
  onClearPreselectedLog?: () => void;
}

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, { label: string; badgeColor: string }> = {
  khieu_nai_vi_pham: {
    label: 'Khiếu nại điểm vi phạm',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  khieu_nai_diem_danh: {
    label: 'Khiếu nại điểm danh',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  de_xuat_khen_thuong: {
    label: 'Đề xuất khen thưởng (+đ)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  dong_gop_y_kien: {
    label: 'Đóng góp ý kiến lớp',
    badgeColor: 'bg-blue-100 text-[#1E3A8A] border-blue-200',
  },
  khac: {
    label: 'Ý kiến khác',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export const FeedbackTab: React.FC<FeedbackTabProps> = ({
  feedbacks,
  onAddFeedback,
  onResolveFeedback,
  onDeleteFeedback,
  currentSession,
  students,
  logs,
  classInfo,
  currentWeek,
  preselectedLogId,
  onClearPreselectedLog,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all');
  const [onlyMyFeedbacks, setOnlyMyFeedbacks] = useState<boolean>(
    !!(currentSession.studentId && currentSession.role === 'student')
  );

  // Form State
  const [studentId, setStudentId] = useState<string>(currentSession.studentId || '');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('khieu_nai_vi_pham');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [weekNumber, setWeekNumber] = useState<number>(currentWeek);

  // Auto-open modal when preselectedLogId is passed from ActivityLogTab
  React.useEffect(() => {
    if (preselectedLogId) {
      const targetLog = logs.find((l) => l.id === preselectedLogId);
      if (targetLog) {
        setStudentId(targetLog.studentId);
        setFeedbackType('khieu_nai_vi_pham');
        setSelectedLogId(targetLog.id);
        setWeekNumber(targetLog.weekNumber || currentWeek);
        setTitle(`Khiếu nại: ${targetLog.actionName} (-${targetLog.points}đ ngày ${targetLog.date})`);
        setContent(
          `Kính gửi Thầy/Cô và Ban Cán Sự Lớp,\n\nEm xin phép trình bày và giải trình về việc bị trừ ${targetLog.points} điểm đối với lỗi "${targetLog.actionName}" vào ngày ${targetLog.date} (${targetLog.timestamp}):\n- Lý do / Minh chứng: `
        );
        setShowCreateModal(true);
      }
      onClearPreselectedLog?.();
    }
  }, [preselectedLogId, logs, currentWeek, onClearPreselectedLog]);

  // Resolution Modal State for Teacher
  const [activeFeedbackToResolve, setActiveFeedbackToResolve] = useState<StudentFeedback | null>(null);
  const [resolveAction, setResolveAction] = useState<'approved' | 'rejected'>('approved');
  const [teacherReplyText, setTeacherReplyText] = useState('');
  const [deleteRelatedLogChecked, setDeleteRelatedLogChecked] = useState(true);

  const isAdmin = currentSession.role === 'admin';
  const isStudent = currentSession.role === 'student' || currentSession.role === 'officer';

  // Lọc phản hồi
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (onlyMyFeedbacks && currentSession.studentId && fb.studentId !== currentSession.studentId) {
      return false;
    }
    if (statusFilter !== 'all' && fb.status !== statusFilter) return false;
    if (typeFilter !== 'all' && fb.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = feedbacks.filter((f) => f.status === 'pending').length;
  const myFeedbackCount = currentSession.studentId
    ? feedbacks.filter((f) => f.studentId === currentSession.studentId).length
    : 0;

  // Lấy danh sách vi phạm của học sinh được chọn để khiếu nại nhanh
  const studentLogs = logs.filter(
    (l) => l.studentId === studentId && l.type === 'penalty'
  );

  const handleOpenCreate = () => {
    if (currentSession.studentId) {
      setStudentId(currentSession.studentId);
    } else if (students.length > 0) {
      setStudentId(students[0].id);
    }
    setTitle('');
    setContent('');
    setSelectedLogId('');
    setWeekNumber(currentWeek);
    setShowCreateModal(true);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === studentId);
    if (!student || !title.trim() || !content.trim()) return;

    let relatedLogTitle = undefined;
    if (selectedLogId) {
      const log = logs.find((l) => l.id === selectedLogId);
      if (log) {
        relatedLogTitle = `${log.actionName} (-${log.points}đ, ${log.date})`;
      }
    }

    onAddFeedback({
      studentId: student.id,
      studentName: student.name,
      team: student.team,
      type: feedbackType,
      title: title.trim(),
      content: content.trim(),
      relatedLogId: selectedLogId || undefined,
      relatedLogTitle,
      weekNumber,
    });

    setShowCreateModal(false);
  };

  const handleOpenResolve = (fb: StudentFeedback, action: 'approved' | 'rejected') => {
    setActiveFeedbackToResolve(fb);
    setResolveAction(action);
    setTeacherReplyText(
      action === 'approved'
        ? 'Thầy/Cô đã kiểm tra và chấp thuận phản hồi của em. Đã điều chỉnh lại điểm thi đua.'
        : 'Thầy/Cô đã kiểm tra với Ban cán sự lớp, trường hợp này em vẫn vi phạm theo đúng nội quy.'
    );
    setDeleteRelatedLogChecked(!!fb.relatedLogId);
  };

  const handleConfirmResolve = () => {
    if (!activeFeedbackToResolve) return;
    onResolveFeedback(
      activeFeedbackToResolve.id,
      resolveAction,
      teacherReplyText.trim(),
      resolveAction === 'approved' ? deleteRelatedLogChecked : false
    );
    setActiveFeedbackToResolve(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center border border-blue-200 shrink-0">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">
                Phản Hồi & Khiếu Nại Thi Đua
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  {pendingCount} chờ xử lý
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Kênh đối thoại công khai, minh bạch giữa học sinh và Giáo viên chủ nhiệm. Học sinh có thể giải trình, khiếu nại điểm trừ bị nhầm lẫn hoặc đề xuất khen thưởng.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Gửi Phản Hồi / Khiếu Nại Mới</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {currentSession.studentId && (
            <button
              type="button"
              onClick={() => setOnlyMyFeedbacks(!onlyMyFeedbacks)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center space-x-1.5 cursor-pointer ${
                onlyMyFeedbacks
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Ý kiến của em ({myFeedbackCount})</span>
            </button>
          )}

          <span className="font-semibold text-slate-600 flex items-center space-x-1 ml-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Trạng thái:</span>
          </span>
          <div className="flex p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Tất cả ({feedbacks.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Chờ duyệt ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Đã chấp thuận ({feedbacks.filter((f) => f.status === 'approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Từ chối ({feedbacks.filter((f) => f.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Phân loại:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1E3A8A]"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="khieu_nai_vi_pham">Khiếu nại điểm vi phạm</option>
            <option value="khieu_nai_diem_danh">Khiếu nại điểm danh</option>
            <option value="de_xuat_khen_thuong">Đề xuất khen thưởng</option>
            <option value="dong_gop_y_kien">Đóng góp ý kiến</option>
            <option value="khac">Khác</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Chưa có phản hồi nào phù hợp</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Học sinh có thể bấm "Gửi Phản Hồi / Khiếu Nại Mới" để gửi ý kiến giải trình hoặc đề xuất đến Giáo viên chủ nhiệm.
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((fb) => {
            const typeConfig = FEEDBACK_TYPE_LABELS[fb.type] || FEEDBACK_TYPE_LABELS.khac;
            const isPending = fb.status === 'pending';
            const isApproved = fb.status === 'approved';
            const isRejected = fb.status === 'rejected';

            return (
              <div
                key={fb.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/20'
                    : isApproved
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${typeConfig.badgeColor}`}
                      >
                        {typeConfig.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        Tuần {fb.weekNumber} • {fb.createdAt}
                      </span>
                      {isPending && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          <Clock className="w-3 h-3" />
                          <span>Đang chờ GVCN duyệt</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã chấp thuận</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                          <XCircle className="w-3 h-3" />
                          <span>Từ chối</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{fb.title}</h3>
                    <p className="text-xs text-slate-600 flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Người gửi: <strong className="text-slate-900">{fb.studentName}</strong> (Tổ {fb.team})
                      </span>
                    </p>
                  </div>

                  {/* Actions for Teacher Admin */}
                  {isAdmin && (
                    <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenResolve(fb, 'approved')}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Chấp thuận</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenResolve(fb, 'rejected')}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenResolve(fb, isApproved ? 'rejected' : 'approved')}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Sửa quyết định
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteFeedback(fb.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Xóa phản hồi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Related Log Notice if any */}
                {fb.relatedLogTitle && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-4 h-4 text-[#1E3A8A]" />
                      <span>
                        Vi phạm gắn liền: <strong className="text-rose-700">{fb.relatedLogTitle}</strong>
                      </span>
                    </div>
                    {isApproved && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Đã xóa bỏ khỏi sổ nề nếp
                      </span>
                    )}
                  </div>
                )}

                {/* Feedback Content */}
                <div className="mt-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  {fb.content}
                </div>

                {/* Teacher Reply Section */}
                {fb.teacherReply && (
                  <div className="mt-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1E3A8A] flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>Phản hồi từ Giáo Viên Chủ Nhiệm:</span>
                      </span>
                      {fb.resolvedAt && (
                        <span className="text-[10px] text-slate-400">{fb.resolvedAt}</span>
                      )}
                    </div>
                    <p className="text-slate-800 italic pl-5 border-l-2 border-blue-400 my-1">
                      "{fb.teacherReply}"
                    </p>
                    {fb.resolvedBy && (
                      <p className="text-[10px] text-right font-medium text-slate-500">
                        Người duyệt: {fb.resolvedBy}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Gửi phản hồi mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquareText className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Gửi Ý Kiến / Khiếu Nại Mới</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
              {/* Chọn học sinh gửi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Học sinh gửi phản hồi:
                </label>
                <select
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setSelectedLogId('');
                  }}
                  disabled={!!currentSession.studentId && currentSession.role === 'student'}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Tổ {s.team})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loại phản hồi */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân loại ý kiến:
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] bg-white"
                  >
                    <option value="khieu_nai_vi_pham">Khiếu nại điểm vi phạm</option>
                    <option value="khieu_nai_diem_danh">Khiếu nại điểm danh</option>
                    <option value="de_xuat_khen_thuong">Đề xuất khen thưởng (+đ)</option>
                    <option value="dong_gop_y_kien">Đóng góp ý kiến nề nếp</option>
                    <option value="khac">Ý kiến khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thuộc tuần học:
                  </label>
                  <select
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] bg-white font-semibold text-[#1E3A8A]"
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w} {w === currentWeek ? '(Tuần này)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nếu là khiếu nại vi phạm: Chọn lỗi vi phạm liên quan */}
              {feedbackType === 'khieu_nai_vi_pham' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn lỗi vi phạm muốn khiếu nại / giải trình:
                  </label>
                  {studentLogs.length > 0 ? (
                    <select
                      value={selectedLogId}
                      onChange={(e) => {
                        setSelectedLogId(e.target.value);
                        const log = logs.find((l) => l.id === e.target.value);
                        if (log && !title) {
                          setTitle(`Khiếu nại điểm trừ lỗi: ${log.actionName}`);
                        }
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A] bg-white text-rose-700 font-medium"
                    >
                      <option value="">-- Chọn vi phạm trong nhật ký (Tùy chọn) --</option>
                      {studentLogs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.date} (Tuần {l.weekNumber}): {l.actionName} (-{l.points}đ) - {l.note}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                      Học sinh này hiện không có lỗi vi phạm nào bị trừ điểm trong sổ.
                    </p>
                  )}
                </div>
              )}

              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề phản hồi / giải trình:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Em xin giải trình vắng tiết sinh hoạt, Đã nộp bài tập bù..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiết & lý do cụ thể:
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Trình bày rõ sự việc, lý do, người xác nhận hoặc đính kèm minh chứng..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-xl shadow-xs transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Cho GVCN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: GVCN Giải quyết & Phản hồi khiếu nại */}
      {activeFeedbackToResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div
              className={`text-white px-6 py-4 flex items-center justify-between ${
                resolveAction === 'approved' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {resolveAction === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                ) : (
                  <XCircle className="w-5 h-5 text-white" />
                )}
                <h3 className="font-bold text-base">
                  {resolveAction === 'approved'
                    ? 'Chấp Thuận Khiếu Nại Của Học Sinh'
                    : 'Từ Chối Khiếu Nại'}
                </h3>
              </div>
              <button
                onClick={() => setActiveFeedbackToResolve(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">{activeFeedbackToResolve.title}</p>
                <p className="text-slate-600 mt-1">
                  Học sinh: <strong>{activeFeedbackToResolve.studentName}</strong> (Tổ {activeFeedbackToResolve.team})
                </p>
                <p className="text-slate-600 italic mt-1 bg-white p-2 rounded border border-slate-200">
                  "{activeFeedbackToResolve.content}"
                </p>
              </div>

              {/* Tùy chọn xóa vi phạm nếu chấp thuận */}
              {resolveAction === 'approved' && activeFeedbackToResolve.relatedLogId && (
                <label className="flex items-start space-x-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteRelatedLogChecked}
                    onChange={(e) => setDeleteRelatedLogChecked(e.target.checked)}
                    className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-emerald-900 block">
                      Tự động xóa lỗi vi phạm này khỏi Nhật ký nề nếp
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Điểm trừ của lỗi ({activeFeedbackToResolve.relatedLogTitle}) sẽ được hoàn trả ngay cho học sinh và tổ.
                    </span>
                  </div>
                </label>
              )}

              {/* Lời nhắn phản hồi của GVCN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời dặn / Phản hồi của Giáo viên gửi học sinh:
                </label>
                <textarea
                  rows={3}
                  value={teacherReplyText}
                  onChange={(e) => setTeacherReplyText(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]"
                  placeholder="Nhập lý do hoặc lời nhắc nhở..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackToResolve(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 ${
                    resolveAction === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Xác Nhận Quyết Định
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
