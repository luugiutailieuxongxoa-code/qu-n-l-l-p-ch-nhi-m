import React from 'react';
import {
  Lock,
  Unlock,
  Calendar,
  CalendarDays,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { ClassInfo } from '../types';
import { toggleLockPeriod } from '../utils/storage';

interface PeriodLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: ClassInfo;
  onUpdateClassInfo: (updated: ClassInfo) => void;
}

export const PeriodLockModal: React.FC<PeriodLockModalProps> = ({
  isOpen,
  onClose,
  classInfo,
  onUpdateClassInfo,
}) => {
  if (!isOpen) return null;

  const lockedWeeks = classInfo.lockedWeeks || [];
  const lockedMonths = classInfo.lockedMonths || [];

  const schoolMonths = [
    { value: 9, label: 'Tháng 9 (Đầu năm)' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11 (20/11)' },
    { value: 12, label: 'Tháng 12 (Cuối HK1)' },
    { value: 1, label: 'Tháng 1 (Đầu HK2)' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5 (Tổng kết HK2)' },
  ];

  const handleToggleWeek = (week: number) => {
    const updated = toggleLockPeriod('week', week, classInfo);
    onUpdateClassInfo(updated);
  };

  const handleToggleMonth = (month: number) => {
    const updated = toggleLockPeriod('month', month, classInfo);
    onUpdateClassInfo(updated);
  };

  const handleLockAllWeeksUpToCurrent = () => {
    const currentWeek = classInfo.weekNumber || 24;
    const weeksToLock = Array.from({ length: currentWeek }, (_, i) => i + 1);
    const newLocked = Array.from(new Set([...lockedWeeks, ...weeksToLock])).sort((a, b) => a - b);
    onUpdateClassInfo({ ...classInfo, lockedWeeks: newLocked });
  };

  const handleUnlockAll = () => {
    if (confirm('Thầy/Cô có chắc chắn muốn mở khóa toàn bộ các tuần và các tháng?')) {
      onUpdateClassInfo({ ...classInfo, lockedWeeks: [], lockedMonths: [] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Lock className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Quản Lý Khóa Sổ Thi Đua (Tuần Học & Tháng Học)</h3>
              <p className="text-xs text-blue-200">
                Lớp {classInfo.className} • GVCN: {classInfo.teacherName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note Banner */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Quy chế khóa sổ thi đua:</p>
            <p className="text-amber-800 leading-relaxed">
              Khi một tuần hoặc tháng được khóa sổ (🔒), Ban cán sự và học sinh chỉ được xem kết quả, không thể ghi nhận thêm vi phạm hoặc điểm thưởng. Chỉ Giáo viên chủ nhiệm mới có quyền mở khóa (🔓) để điều chỉnh.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Khóa sổ Tuần học */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#1E3A8A]" />
                <h4 className="font-bold text-sm text-slate-900">
                  1. Khóa Sổ Theo 35 Tuần Học (Đã khóa {lockedWeeks.length}/35 tuần)
                </h4>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleLockAllWeeksUpToCurrent}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Khóa từ tuần 1 đến tuần {classInfo.weekNumber}
                </button>
                <button
                  type="button"
                  onClick={handleUnlockAll}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Mở khóa tất cả
                </button>
              </div>
            </div>

            {/* Grid 35 Tuần */}
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => i + 1).map((week) => {
                const isLocked = lockedWeeks.includes(week);
                const isCurrent = week === classInfo.weekNumber;
                return (
                  <button
                    key={week}
                    type="button"
                    onClick={() => handleToggleWeek(week)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      isLocked
                        ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>T.{week}</span>
                      {isCurrent && <span className="text-[10px] text-amber-600">★</span>}
                    </div>
                    <div className="flex items-center space-x-1 text-[10px]">
                      {isLocked ? (
                        <>
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Đã khóa</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Mở</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Khóa sổ Tháng học */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-[#1E3A8A]" />
              <h4 className="font-bold text-sm text-slate-900">
                2. Khóa Sổ Theo 9 Tháng Học (Đã khóa {lockedMonths.length}/9 tháng)
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {schoolMonths.map((m) => {
                const isLocked = lockedMonths.includes(m.value);
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleToggleMonth(m.value)}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      isLocked
                        ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className="flex items-center space-x-1 text-[11px]">
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>Đã khóa</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mở ghi điểm</span>
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Thay đổi trạng thái khóa sổ được áp dụng và lưu tự động.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Đóng & Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
};
