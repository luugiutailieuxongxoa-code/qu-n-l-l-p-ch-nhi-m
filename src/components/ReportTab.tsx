import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Settings,
  CheckCircle,
  School,
  UserCheck,
  Calendar,
  Trophy,
  Sparkles,
  AlertTriangle,
  Search,
  Users,
  Mail,
  Scissors,
  ShieldCheck,
} from 'lucide-react';
import { ClassInfo, StudentScoreSummary, TeamScoreSummary, EvaluationPeriod, CurrentUserSession } from '../types';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';
import { PeriodSelector } from './PeriodSelector';

interface ReportTabProps {
  classInfo: ClassInfo;
  onUpdateClassInfo: (info: ClassInfo) => void;
  studentSummaries: StudentScoreSummary[];
  teamSummaries: TeamScoreSummary[];
  currentPeriod: EvaluationPeriod;
  onChangePeriod: (period: EvaluationPeriod) => void;
  onOpenPrint: () => void;
  onDownloadStandalone: () => void;
  currentSession: CurrentUserSession;
  onToggleLockPeriod?: (period: EvaluationPeriod, lock: boolean) => void;
  onOpenPeriodLockModal?: () => void;
  onOpenParentMeetingInvitation?: () => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  classInfo,
  onUpdateClassInfo,
  studentSummaries,
  teamSummaries,
  currentPeriod,
  onChangePeriod,
  onOpenPrint,
  onDownloadStandalone,
  currentSession,
  onToggleLockPeriod,
  onOpenPeriodLockModal,
  onOpenParentMeetingInvitation,
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [formData, setFormData] = useState<ClassInfo>(classInfo);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Đồng bộ formData khi classInfo từ ngoài thay đổi
  React.useEffect(() => {
    setFormData(classInfo);
  }, [classInfo]);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClassInfo(formData);
    setIsEditingInfo(false);
    setExportSuccessMsg('Đã cập nhật thông tin lớp học!');
    setTimeout(() => setExportSuccessMsg(null), 3000);
  };

  const handleExcelExport = () => {
    exportToExcel(classInfo, studentSummaries, teamSummaries, currentPeriod);
    setExportSuccessMsg('Đã xuất file Excel (.xlsx) theo kỳ thi đua thành công!');
    setTimeout(() => setExportSuccessMsg(null), 3500);
  };

  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      await exportToPdf(classInfo, studentSummaries, teamSummaries, currentPeriod);
      setExportSuccessMsg('Đã xuất file PDF (.pdf) chuẩn tiếng Việt thành công!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Không thể tạo file PDF. Vui lòng thử lại hoặc sử dụng nút In A4.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const avgClassScore = (
    studentSummaries.reduce((sum, s) => sum + s.totalScore, 0) / (studentSummaries.length || 1)
  ).toFixed(2);

  const bestTeam = teamSummaries.find((t) => t.rank === 1);

  const getPeriodLabel = () => {
    if (currentPeriod.type === 'month') return `Tháng ${currentPeriod.month}`;
    if (currentPeriod.type === 'year') return `Chung cuộc cả năm học ${classInfo.academicYear}`;
    return `Tuần ${currentPeriod.weekNumber}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {exportSuccessMsg && (
        <div className="bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 border border-emerald-500 animate-pulse">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-medium">{exportSuccessMsg}</span>
        </div>
      )}

      {/* BỘ CHỌN KỲ THI ĐUA CHO BÁO CÁO */}
      <PeriodSelector
        currentPeriod={currentPeriod}
        onChangePeriod={onChangePeriod}
        academicYear={classInfo.academicYear}
        defaultWeek={classInfo.weekNumber}
        classInfo={classInfo}
        currentSession={currentSession}
        onToggleLockPeriod={onToggleLockPeriod}
        onOpenPeriodLockModal={onOpenPeriodLockModal}
      />

      {/* TOP HERO & EXPORT ACTION CARDS */}
      <div className="bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-indigo-900 rounded-2xl shadow-md p-5 sm:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
              Trung Tâm Xuất Báo Cáo Sư Phạm
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Báo Cáo Thi Đua Lớp {classInfo.className} — {getPeriodLabel()}
            </h2>
            <p className="text-xs text-blue-200">
              {classInfo.schoolName} • GVCN: {classInfo.teacherName} • Sĩ số: {studentSummaries.length} học sinh
            </p>
          </div>

          {/* 3 Nút Xuất Báo Cáo Chính */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePdfExport}
              disabled={isExportingPdf}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Xuất File PDF (.pdf)'}</span>
            </button>

            <button
              onClick={handleExcelExport}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất File Excel (.xlsx)</span>
            </button>

            <button
              onClick={onOpenPrint}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-900" />
              <span>In Ngay Khổ A4</span>
            </button>

            {onOpenParentMeetingInvitation && (
              <button
                onClick={onOpenParentMeetingInvitation}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer ring-2 ring-white/30"
              >
                <Mail className="w-4 h-4 text-amber-300" />
                <span>Giấy Mời Họp PH</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KHỐI TIỆN ÍCH CHUYÊN DỤNG: TẠO GIẤY MỜI HỌP PHỤ HUYNH CHUẨN VĂN BẢN VIỆT NAM */}
      {onOpenParentMeetingInvitation && (
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-5 border-2 border-blue-200/80 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1E3A8A] text-white uppercase tracking-wider">
                  Nghị định 30/2020/NĐ-CP
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Có Chữ Ký GVCN</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center space-x-1">
                  <Scissors className="w-3 h-3 text-amber-600" />
                  <span>Tiết Kiệm Giấy In (2 Bản/A4)</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 flex items-center space-x-1">
                  <span>Mới: Bản Chung Cả Lớp & Từng Em</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#1E3A8A] flex items-center space-x-2">
                <Mail className="w-5 h-5 text-[#1E3A8A]" />
                <span>Tạo Giấy Mời Họp Phụ Huynh (Chuẩn Thể Thức Nghị Định 30/2020/NĐ-CP)</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tự động tạo giấy mời họp phụ huynh trang trọng với <strong>Quốc hiệu, Tiêu ngữ, Số hiệu, Chương trình họp</strong> và <strong>chữ ký GVCN</strong> (ký số, vẽ tay, tải ảnh scan hoặc ký bút mực). Hỗ trợ linh hoạt <strong>Giấy Mời Chung Toàn Lớp</strong> (dán bảng tin, báo cáo BGH, gửi nhóm Zalo lớp) hoặc <strong>Giấy Mời Riêng Từng Học Sinh</strong> ({studentSummaries.length} em).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onOpenParentMeetingInvitation}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Tạo Giấy Mời Họp Phụ Huynh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THÔNG KÊ NHANH & THÔNG TIN HÀNH CHÍNH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Điểm TB Toàn Lớp</span>
          <div className="text-2xl font-black text-[#1E3A8A] mt-1">{avgClassScore} / 100đ</div>
          <p className="text-xs text-slate-400 mt-1">Đánh giá chung: Nề nếp tốt</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Tổ Dẫn Đầu Kỳ Thi Đua</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {bestTeam ? `Tổ ${bestTeam.team}` : 'Chưa xếp hạng'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Điểm trung bình: {bestTeam?.averageScore.toFixed(2)}đ
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Tải File Chạy Độc Lập</span>
            <p className="text-xs text-slate-700 font-bold mt-1">Lưu trữ HTML Offline</p>
            <p className="text-[11px] text-slate-400">1 file duy nhất, mở không cần mạng</p>
          </div>
          <button
            onClick={onDownloadStandalone}
            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] rounded-xl font-bold transition-all border border-blue-200"
            title="Tải ứng dụng 1 file HTML offline"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* FORM NHẬN XÉT CỦA GVCN */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-[#1E3A8A]" />
            <h3 className="text-base font-bold text-slate-900">
              Nhận Xét & Đánh Giá Của Giáo Viên Chủ Nhiệm
            </h3>
          </div>
          <button
            onClick={() => setIsEditingInfo(!isEditingInfo)}
            className="inline-flex items-center space-x-1 text-xs font-bold text-[#1E3A8A] hover:underline"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isEditingInfo ? 'Đóng chỉnh sửa' : 'Chỉnh sửa nhận xét'}</span>
          </button>
        </div>

        {isEditingInfo ? (
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nội dung nhận xét đánh giá thi đua nề nếp của GVCN:
              </label>
              <textarea
                rows={4}
                value={formData.teacherComment}
                onChange={(e) => setFormData({ ...formData, teacherComment: e.target.value })}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] leading-relaxed"
                placeholder="Nhập nhận xét của giáo viên chủ nhiệm..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-xl shadow-xs"
              >
                Lưu Nhận Xét
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-700 italic">
            "{classInfo.teacherComment}"
          </div>
        )}
      </div>

      {/* BẢNG TỔNG KẾT XẾP HẠNG THI ĐUA CÁC TỔ */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Bảng Tổng Kết Thi Đua 4 Tổ — {getPeriodLabel()}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Dựa trên điểm trung bình thành viên
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {teamSummaries.map((t) => {
            const isFirst = t.rank === 1;
            return (
              <div
                key={t.team}
                className={`p-4 rounded-xl border transition-all relative ${
                  isFirst
                    ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400'
                    : 'bg-slate-50/70 border-slate-200 hover:border-blue-200'
                }`}
              >
                {isFirst && (
                  <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center space-x-1">
                    <Trophy className="w-3 h-3" />
                    <span>Dẫn Đầu</span>
                  </span>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[#1E3A8A]">Tổ {t.team}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isFirst ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Hạng {t.rank}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sĩ số:</span>
                    <strong className="text-slate-800">{t.memberCount} học sinh</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Điểm thưởng:</span>
                    <strong className="text-emerald-600">+{t.totalBonus}đ</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Điểm trừ:</span>
                    <strong className="text-rose-600">-{t.totalPenalty}đ</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-200/80 flex justify-between items-baseline">
                    <span className="font-semibold text-slate-700">Điểm TB:</span>
                    <span className="text-lg font-black text-[#1E3A8A]">
                      {t.averageScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DANH SÁCH VINH DANH & CẦN NHẮC NHỞ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Tuyên Dương */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-900">
              Gương Mặt Xuất Sắc — Tuyên Dương Trong Kỳ
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {studentSummaries.slice(0, 4).map((item, idx) => (
              <div key={item.student.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{item.student.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Tổ {item.student.team} • {item.category}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#1E3A8A]">{item.totalScore}đ</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">+{item.totalBonus}đ thưởng</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cần Đôn Đốc Rèn Luyện */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Học Sinh Cần Lưu Ý Đôn Đốc & Phối Hợp Phụ Huynh
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {studentSummaries
              .filter((s) => s.totalScore < 85 || s.totalPenalty >= 10 || s.attendanceStats.unexcused > 0)
              .slice(0, 4)
              .map((item) => (
                <div key={item.student.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{item.student.name}</div>
                    <div className="text-[11px] text-rose-600">
                      Tổ {item.student.team} • Trừ: -{item.totalPenalty}đ
                      {item.attendanceStats.unexcused > 0 && ` • Vắng KP: ${item.attendanceStats.unexcused}`}
                      {item.attendanceStats.late > 0 && ` • Trễ: ${item.attendanceStats.late}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-700">{item.totalScore}đ</div>
                    <div className="text-[10px] text-slate-500">
                      PH: {item.student.parentPhone || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              ))}
            {studentSummaries.filter((s) => s.totalScore < 85 || s.totalPenalty >= 10 || s.attendanceStats.unexcused > 0).length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500 italic">
                Cả lớp duy trì nề nếp tốt, không có học sinh bị trừ điểm cao!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG ĐIỂM TỔNG HỢP TOÀN BỘ HỌC SINH */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bảng Tổng Kết Điểm Thi Đua Toàn Lớp ({studentSummaries.length} Học Sinh)
            </h3>
            <p className="text-xs text-slate-500">
              Chi tiết điểm danh, điểm thưởng và điểm phạt trong {getPeriodLabel()}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 text-center">STT</th>
                <th className="py-2.5 px-3">Họ và Tên</th>
                <th className="py-2.5 px-2 text-center">Tổ</th>
                <th className="py-2.5 px-2 text-center text-rose-700" title="Vắng không phép">Vắng KP</th>
                <th className="py-2.5 px-2 text-center text-blue-700" title="Vắng có phép">Vắng CP</th>
                <th className="py-2.5 px-2 text-center text-amber-700" title="Đi trễ">Trễ</th>
                <th className="py-2.5 px-2 text-center text-emerald-700">Điểm (+)</th>
                <th className="py-2.5 px-2 text-center text-rose-700">Điểm (-)</th>
                <th className="py-2.5 px-3 text-center font-black text-[#1E3A8A]">Tổng Điểm</th>
                <th className="py-2.5 px-3 text-center">Xếp Loại</th>
                <th className="py-2.5 px-2 text-center">Thứ Hạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentSummaries
                .filter((s) => !tableSearchQuery.trim() || s.student.name.toLowerCase().includes(tableSearchQuery.toLowerCase().trim()))
                .map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.student.name}</div>
                      <div className="text-[11px] text-slate-400">{item.student.gender}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-slate-700">
                      Tổ {item.student.team}
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-rose-600">
                      {item.attendanceStats.unexcused || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-blue-600">
                      {item.attendanceStats.excused || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-amber-600">
                      {item.attendanceStats.late || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-emerald-600">
                      +{item.totalBonus}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-rose-600">
                      -{item.totalPenalty}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-[#1E3A8A] text-sm">
                      {item.totalScore}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.category === 'Xuất sắc'
                            ? 'bg-amber-100 text-amber-800'
                            : item.category === 'Tốt'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.category === 'Đạt'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-extrabold text-slate-800">
                      #{item.rank}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
