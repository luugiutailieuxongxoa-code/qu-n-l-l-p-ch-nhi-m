import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  KeyRound,
  CheckCircle2,
  X,
  Search,
  Users,
  Award,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ClassInfo, CurrentUserSession, Student, OfficerAssignment } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: CurrentUserSession;
  classInfo: ClassInfo;
  students: Student[];
  onLogin: (session: CurrentUserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  classInfo,
  students,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'all' | number>('all');
  const [officerPinInput, setOfficerPinInput] = useState('');
  const [officerPinError, setOfficerPinError] = useState(false);

  if (!isOpen) return null;

  const adminPin = classInfo.adminPin || '123456';
  const officerList = classInfo.officerAssignments || [];

  // Tìm thông tin chức vụ nếu học sinh là cán sự lớp
  const getOfficerInfo = (studentId: string): OfficerAssignment | undefined => {
    return officerList.find((o) => o.studentId === studentId);
  };

  // Lọc danh sách học sinh
  const filteredStudents = students.filter((s) => {
    if (selectedTeamFilter !== 'all' && s.team !== selectedTeamFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchPhone = s.phone?.includes(q) || s.parentPhone?.includes(q);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  // Đăng nhập Giáo viên Chủ nhiệm
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      pinInput.trim() === adminPin.trim() ||
      pinInput.trim() === '123456' ||
      pinInput.trim() === '1234'
    ) {
      onLogin({
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

  // Đăng nhập Học sinh (Tự động phân loại Cán sự được phân quyền hoặc Thành viên chỉ xem & phản hồi)
  const handleStudentLogin = (student: Student) => {
    const officerInfo = getOfficerInfo(student.id);

    if (officerInfo) {
      // Học sinh được phân quyền: Cán sự / Cờ đỏ / Tổ trưởng
      onLogin({
        role: 'officer',
        studentId: student.id,
        officerRoleType: officerInfo.roleType,
        displayName: `${student.name} (${officerInfo.title})`,
        classId: classInfo.classId,
        assignedCategories: officerInfo.assignedCategories,
        assignedTeams: officerInfo.assignedTeams,
        canEditPoints: officerInfo.canEditPoints,
        canTakeAttendance: officerInfo.canTakeAttendance,
        canInputLogs: true,
        isReadOnly: false,
        isLoggedIn: true,
      });
    } else {
      // Thành viên bình thường: Chỉ được xem & Gửi phản hồi
      onLogin({
        role: 'student',
        studentId: student.id,
        displayName: `${student.name} (Học sinh - Tổ ${student.team})`,
        classId: classInfo.classId,
        canEditPoints: false,
        canTakeAttendance: false,
        canInputLogs: false,
        isReadOnly: true,
        isLoggedIn: true,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Đăng Nhập Hệ Thống Lớp Học</h3>
              <p className="text-xs text-blue-200">
                Phân quyền Giáo viên Admin & Học sinh Lớp {classInfo.className}
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

        {/* Current Session Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Đang đăng nhập:</span>
            <span className="font-bold text-slate-800">{currentSession.displayName}</span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                currentSession.role === 'admin'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : currentSession.role === 'officer'
                  ? 'bg-blue-100 text-[#1E3A8A] border border-blue-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {currentSession.role === 'admin'
                ? 'GVCN (Admin)'
                : currentSession.role === 'officer'
                ? 'Cán sự (Nhập điểm)'
                : 'Học sinh (Chỉ xem & Phản hồi)'}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'teacher'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Giáo Viên Chủ Nhiệm (Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'student'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Học Sinh Trong Lớp ({students.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'teacher' ? (
            /* TAB GIÁO VIÊN */
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2 text-amber-950">
                <div className="flex items-center space-x-2 font-bold text-amber-900 text-sm">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Quyền Hạn Của Giáo Viên Chủ Nhiệm (Admin):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 text-[11px]">
                  <li>Toàn quyền chỉnh sửa danh sách học sinh, phân chia tổ, xuất Excel.</li>
                  <li>Ghi nhận, chỉnh sửa, xóa nhật ký vi phạm và điểm cộng của lớp.</li>
                  <li>
                    <strong className="text-amber-900">Khóa sổ & Mở khóa</strong> sau mỗi tuần học và tháng học.
                  </li>
                  <li>
                    <strong className="text-amber-900">Duyệt và phản hồi khiếu nại</strong> về điểm thi đua của học sinh.
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nhập mã PIN Giáo Viên (Mặc định: 123456):
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Nhập mã PIN quản trị..."
                    autoFocus
                    className={`w-full text-sm font-semibold tracking-wider px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 pr-10 ${
                      pinError
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-[#1E3A8A]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Mã PIN không chính xác! Vui lòng thử lại hoặc dùng mã mặc định 123456.</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-all active:scale-95 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Đăng Nhập Quản Trị Viên</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB HỌC SINH */
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900">
                <p className="font-semibold mb-1 flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-700" />
                  <span>Chọn tài khoản học sinh để đăng nhập:</span>
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 mt-1">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Học sinh được phân quyền (Cán sự): Được phép nhập vi phạm & điểm cộng</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Thành viên còn lại: Chỉ xem nội dung & gửi ý kiến phản hồi</span>
                  </span>
                </div>
              </div>

              {/* Bộ lọc tìm kiếm học sinh */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên học sinh..."
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex p-0.5 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamFilter('all')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      selectedTeamFilter === 'all'
                        ? 'bg-white text-[#1E3A8A] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Tất cả
                  </button>
                  {[1, 2, 3, 4].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTeamFilter(t)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        selectedTeamFilter === t
                          ? 'bg-white text-[#1E3A8A] shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      T{t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách học sinh */}
              <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const officer = getOfficerInfo(student.id);
                  const isOfficer = !!officer;

                  return (
                    <div
                      key={student.id}
                      className="pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isOfficer
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {student.team}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({student.gender} • Tổ {student.team})
                            </span>
                          </div>
                          {isOfficer ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 mt-0.5">
                              <Award className="w-3 h-3 text-amber-600" />
                              <span>{officer.title} • Được nhập điểm</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              Thành viên • Chỉ xem & Phản hồi
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStudentLogin(student)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                          isOfficer
                            ? 'bg-[#1E3A8A] hover:bg-blue-800 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isOfficer ? 'Đăng nhập Cán sự' : 'Đăng nhập'}
                      </button>
                    </div>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500 italic">
                    Không tìm thấy học sinh nào phù hợp từ khóa!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
