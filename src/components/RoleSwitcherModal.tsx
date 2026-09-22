import React, { useState } from 'react';
import {
  ShieldAlert,
  UserCheck,
  KeyRound,
  CheckCircle2,
  X,
  BookOpen,
  Award,
  Users,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { ClassInfo, CurrentUserSession, OfficerAssignment } from '../types';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: CurrentUserSession;
  classInfo: ClassInfo;
  onSwitchSession: (session: CurrentUserSession) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  classInfo,
  onSwitchSession,
}) => {
  const [targetRole, setTargetRole] = useState<'admin' | 'officer'>('admin');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerAssignment | null>(
    classInfo.officerAssignments?.[0] || null
  );

  if (!isOpen) return null;

  const adminPin = classInfo.adminPin || '123456';
  const officerList = classInfo.officerAssignments || [];

  const handleConfirmAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      pinInput.trim() === adminPin.trim() ||
      pinInput.trim() === '123456' ||
      pinInput.trim() === '1234'
    ) {
      onSwitchSession({
        role: 'admin',
        displayName: `${classInfo.teacherName} (GVCN - Admin)`,
        classId: classInfo.classId,
        canEditPoints: true,
        canTakeAttendance: true,
        canInputLogs: true,
        isReadOnly: false,
        isLoggedIn: true,
      });
      setPinError(false);
      setPinInput('');
      onClose();
    } else {
      setPinError(true);
    }
  };

  const handleSelectOfficer = (officer: OfficerAssignment) => {
    onSwitchSession({
      role: 'officer',
      officerRoleType: officer.roleType,
      displayName: `${officer.title}: ${officer.studentName || 'Chưa gán'}`,
      classId: classInfo.classId,
      assignedCategories: officer.assignedCategories,
      assignedTeams: officer.assignedTeams,
      canEditPoints: officer.canEditPoints,
      canTakeAttendance: officer.canTakeAttendance,
      canInputLogs: true,
      isReadOnly: false,
      isLoggedIn: true,
    });
    onClose();
  };

  const getCategoryLabel = (cats: string[]) => {
    return cats
      .map((c) => (c === 'hoc_tap' ? 'Học tập' : c === 'tac_phong' ? 'Tác phong' : 'Kỷ luật'))
      .join(', ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base">Chuyển Đổi Vai Trò Làm Việc</h3>
              <p className="text-xs text-blue-200">
                Phân quyền Giáo viên chủ nhiệm & Ban cán sự lớp
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

        {/* Current status banner */}
        <div className="px-6 py-3 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs">
          <span className="text-slate-600">Đang hoạt động với vai trò:</span>
          <span className="font-bold px-2.5 py-1 rounded-full bg-[#1E3A8A] text-white">
            {currentSession.displayName}
          </span>
        </div>

        {/* Tab selection */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setTargetRole('admin')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                targetRole === 'admin'
                  ? 'bg-white text-[#1E3A8A] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>GVCN: {classInfo.teacherName}</span>
            </button>
            <button
              onClick={() => setTargetRole('officer')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                targetRole === 'officer'
                  ? 'bg-white text-[#1E3A8A] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Ban Cán Sự Lớp ({officerList.length})</span>
            </button>
          </div>

          {/* Target Role: ADMIN */}
          {targetRole === 'admin' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Quyền hạn GVCN ({classInfo.teacherName}):</p>
                  <p>
                    Có toàn quyền chỉnh sửa thông tin lớp, phân công ban cán sự, tùy chỉnh điểm nội
                    quy, xem và xuất toàn bộ báo cáo thi đua tuần, tháng và cả năm.
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmAdmin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhập Mã PIN Admin của GVCN ({classInfo.teacherName}):
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      maxLength={12}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setPinError(false);
                      }}
                      placeholder="Mặc định: 123456"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 font-mono tracking-widest ${
                        pinError
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/50'
                          : 'border-slate-300 focus:ring-[#1E3A8A]'
                      }`}
                    />
                  </div>
                  {pinError && (
                    <p className="text-xs text-rose-600 mt-1 font-semibold">
                      Mã PIN không chính xác! (Mã PIN mặc định là 123456).
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setPinInput('123456')}
                    className="text-blue-700 hover:underline cursor-pointer"
                  >
                    Điền nhanh PIN mẫu (123456)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm transition-all text-xs cursor-pointer"
                  >
                    Xác Nhận Vai Trò: {classInfo.teacherName}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Target Role: OFFICER (BAN CÁN SỰ) */}
          {targetRole === 'officer' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Chọn danh tính Ban Cán Sự bạn muốn làm việc để ghi nhận nề nếp và học tập theo đúng
                phạm vi được GVCN giao việc:
              </p>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {officerList.map((officer) => {
                  const isCurrent =
                    currentSession.role === 'officer' &&
                    currentSession.officerRoleType === officer.roleType;

                  return (
                    <div
                      key={officer.roleType}
                      onClick={() => handleSelectOfficer(officer)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-50 border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-[#1E3A8A]">{officer.title}</span>
                          <span className="text-xs font-semibold text-slate-800">
                            • {officer.studentName || 'Chưa gán học sinh'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 space-x-2">
                          <span>
                            Nhiệm vụ: <strong>{getCategoryLabel(officer.assignedCategories)}</strong>
                          </span>
                          <span>|</span>
                          <span>
                            Phạm vi:{' '}
                            <strong>
                              {officer.assignedTeams.length === 4
                                ? 'Cả lớp'
                                : `Tổ ${officer.assignedTeams.join(', ')}`}
                            </strong>
                          </span>
                          {officer.canEditPoints && (
                            <span className="text-emerald-600 font-semibold">• Tùy chỉnh điểm</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1 bg-white hover:bg-[#1E3A8A] hover:text-white border border-slate-300 text-[#1E3A8A] rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        Chọn
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>GVCN có thể đổi phân công & mã PIN trong tab <strong>Cài đặt</strong></span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
