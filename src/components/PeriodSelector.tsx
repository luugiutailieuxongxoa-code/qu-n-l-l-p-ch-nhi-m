import React from 'react';
import {
  Calendar,
  Award,
  CalendarDays,
  Check,
  Sparkles,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { EvaluationPeriod, EvaluationPeriodType, ClassInfo, CurrentUserSession } from '../types';
import { isWeekLocked, isMonthLocked, isPeriodLocked } from '../utils/storage';

interface PeriodSelectorProps {
  currentPeriod: EvaluationPeriod;
  onChangePeriod: (period: EvaluationPeriod) => void;
  academicYear: string;
  defaultWeek: number;
  classInfo: ClassInfo;
  currentSession: CurrentUserSession;
  onToggleLockPeriod?: (period: EvaluationPeriod, lock: boolean) => void;
  onOpenPeriodLockModal?: () => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  currentPeriod,
  onChangePeriod,
  academicYear,
  defaultWeek,
  classInfo,
  currentSession,
  onToggleLockPeriod,
  onOpenPeriodLockModal,
}) => {
  const months = [
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

  const isAdmin = currentSession.role === 'admin';
  const isCurrentLocked = isPeriodLocked(currentPeriod, classInfo);

  const handleTypeChange = (type: EvaluationPeriodType) => {
    onChangePeriod({
      ...currentPeriod,
      type,
      academicYear,
      weekNumber: currentPeriod.weekNumber || defaultWeek,
      month: currentPeriod.month || 2,
    });
  };

  const handleWeekChange = (w: number) => {
    onChangePeriod({
      ...currentPeriod,
      type: 'week',
      weekNumber: w,
    });
  };

  const handleMonthChange = (m: number) => {
    onChangePeriod({
      ...currentPeriod,
      type: 'month',
      month: m,
    });
  };

  const handleLockToggle = () => {
    if (!onToggleLockPeriod) return;
    onToggleLockPeriod(currentPeriod, !isCurrentLocked);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-[#1E3A8A]" />
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-slate-900">
                Kỳ Thi Đua & Đánh Giá Xếp Hạng
              </h4>
              {/* Lock status pill */}
              {currentPeriod.type !== 'year' && (
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isCurrentLocked
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {isCurrentLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-rose-600" />
                      <span>Đã khóa sổ</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3 text-emerald-600" />
                      <span>Đang mở ghi điểm</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Năm học: <strong className="text-[#1E3A8A]">{academicYear}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Nút Khóa / Mở khóa dành riêng cho Giáo viên Chủ nhiệm (Admin) */}
          {isAdmin && currentPeriod.type !== 'year' && onToggleLockPeriod && (
            <button
              type="button"
              onClick={handleLockToggle}
              title={
                isCurrentLocked
                  ? 'Mở khóa để Ban cán sự và GVCN tiếp tục ghi nhận điểm'
                  : 'Khóa sổ tổng kết tuần/tháng này để chốt điểm và không cho sửa đổi'
              }
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer border ${
                isCurrentLocked
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
              }`}
            >
              {isCurrentLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mở Khóa {currentPeriod.type === 'week' ? `Tuần ${currentPeriod.weekNumber}` : `Tháng ${currentPeriod.month}`}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                  <span>Khóa Sổ {currentPeriod.type === 'week' ? `Tuần ${currentPeriod.weekNumber}` : `Tháng ${currentPeriod.month}`}</span>
                </>
              )}
            </button>
          )}

          {/* Nút mở hộp thoại Quản lý khóa sổ toàn bộ tuần và tháng */}
          {isAdmin && onOpenPeriodLockModal && (
            <button
              type="button"
              onClick={onOpenPeriodLockModal}
              title="Mở bảng điều khiển khóa/mở khóa tất cả các tuần học và tháng học"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Quản lý khóa sổ</span>
            </button>
          )}

          {/* 3 tabs: Tuần / Tháng / Cả Năm */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentPeriod.type === 'week'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Từng Tuần
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentPeriod.type === 'month'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng Kết Tháng
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                currentPeriod.type === 'year'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Cả Năm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-selector for Week */}
      {currentPeriod.type === 'week' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Chọn tuần thi đua:</span>
            <select
              value={currentPeriod.weekNumber}
              onChange={(e) => handleWeekChange(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-[#1E3A8A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => {
                const locked = isWeekLocked(w, classInfo);
                return (
                  <option key={w} value={w}>
                    Tuần {w} {locked ? '🔒 (Đã khóa)' : ''} {w === defaultWeek ? '⭐ (Hiện tại)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1">
            <span className="text-slate-400 mr-1 shrink-0">Chọn nhanh:</span>
            {[20, 21, 22, 23, 24, 25].map((w) => {
              const locked = isWeekLocked(w, classInfo);
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleWeekChange(w)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 flex items-center space-x-0.5 ${
                    currentPeriod.weekNumber === w
                      ? 'bg-blue-100 text-[#1E3A8A] font-bold border border-blue-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {locked && <Lock className="w-2.5 h-2.5 text-rose-500" />}
                  <span>T{w}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-selector for Month */}
      {currentPeriod.type === 'month' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Chọn tháng tổng kết:</span>
            <select
              value={currentPeriod.month}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-[#1E3A8A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              {months.map((m) => {
                const locked = isMonthLocked(m.value, classInfo);
                return (
                  <option key={m.value} value={m.value}>
                    {m.label} {locked ? '🔒 (Đã khóa)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1">
            <span className="text-slate-400 mr-1 shrink-0">Tháng:</span>
            {[9, 10, 11, 12, 1, 2, 3, 4, 5].map((m) => {
              const locked = isMonthLocked(m, classInfo);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthChange(m)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 flex items-center space-x-0.5 ${
                    currentPeriod.month === m
                      ? 'bg-blue-100 text-[#1E3A8A] font-bold border border-blue-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {locked && <Lock className="w-2.5 h-2.5 text-rose-500" />}
                  <span>Th{m}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-banner for Year */}
      {currentPeriod.type === 'year' && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-amber-900">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Bảng tổng kết toàn diện cả năm học {academicYear}</strong>: Tích lũy toàn bộ điểm thưởng, điểm trừ và điểm danh từ tất cả các tuần trong năm học để xếp hạng chung cuộc!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
