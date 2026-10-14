import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  KeyRound,
  CheckCircle2,
  Search,
  Users,
  Award,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Plus,
  ArrowRight,
  School,
  MapPin,
  Calendar,
  Layers,
  Check,
  X,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react';
import { loginWithPin } from '../utils/authClient';
import {
  ClassInfo,
  ClassItem,
  CurrentUserSession,
  Student,
  OfficerAssignment,
} from '../types';

interface LoginScreenProps {
  classes: ClassItem[];
  activeClassId: string;
  onSelectClass: (classId: string) => void;
  onAddNewClass: (newClass: {
    className: string;
    teacherName: string;
    schoolName?: string;
    academicYear?: string;
    location?: string;
    adminPin?: string;
  }) => ClassItem;
  classInfo: ClassInfo;
  students: Student[];
  onLoginSuccess: (session: CurrentUserSession, classId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  classes,
  activeClassId,
  onSelectClass,
  onAddNewClass,
  classInfo,
  students,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [pinInput, setPinInput] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [loginMode, setLoginMode] = useState<'teacher' | 'admin'>('teacher');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'all' | number>('all');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPin, setStudentPin] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  // State form thêm lớp mới
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState(classInfo.teacherName || 'Nguyễn Văn Thắng');
  const [newSchoolName, setNewSchoolName] = useState(classInfo.schoolName || 'THPT Thống Nhất B');
  const [newLocation, setNewLocation] = useState(classInfo.location || 'Phước Sơn');
  const [newAcademicYear, setNewAcademicYear] = useState('2024 - 2025');
  const [newAdminPin, setNewAdminPin] = useState('123456');

  const adminPin = classInfo.adminPin || '123456';
  const officerList = classInfo.officerAssignments || [];

  const getOfficerInfo = (studentId: string): OfficerAssignment | undefined => {
    return officerList.find((o) => o.studentId === studentId);
  };

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

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setPinError(false); setAuthMessage(''); setAuthBusy(true);
    try {
      const result = loginMode === 'admin'
        ? await loginWithPin({ role: 'admin', classId: activeClassId, password: pinInput.trim() })
        : await loginWithPin({ role: 'teacher', classId: activeClassId, username: teacherUsername.trim(), password: pinInput.trim() });
      const session = result.session;
      onLoginSuccess({ ...session, role: session.role === 'admin' ? 'admin' : 'teacher', classId: session.classId || activeClassId, canEditPoints: true, canTakeAttendance: true, canInputLogs: true, isReadOnly: false, isLoggedIn: true }, session.classId || activeClassId);
    } catch (error) { setPinError(true); setAuthMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại.'); }
    finally { setAuthBusy(false); }
  };

  const handleStudentLogin = (student: Student) => {
    setSelectedStudent(student); setStudentPin(''); setAuthMessage('');
  };

  const handleStudentPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedStudent) return;
    setAuthBusy(true); setAuthMessage('');
    try {
      const result = await loginWithPin({ role: 'student', classId: activeClassId, studentId: selectedStudent.id, pin: studentPin.trim(), displayName: selectedStudent.name });
      const session = result.session;
      onLoginSuccess({
        ...session,
        role: session.role === 'officer' ? 'officer' : 'student',
        studentId: selectedStudent.id,
        classId: activeClassId,
        displayName: session.displayName || selectedStudent.name,
        canEditPoints: Boolean(session.canEditPoints),
        canTakeAttendance: Boolean(session.canTakeAttendance),
        canInputLogs: Boolean(session.canInputLogs),
        isReadOnly: session.role !== 'officer', isLoggedIn: true,
      }, activeClassId);
      setSelectedStudent(null);
    } catch (error) { setAuthMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại.'); }
    finally { setAuthBusy(false); }
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const created = onAddNewClass({
      className: newClassName.trim(),
      teacherName: newTeacherName.trim(),
      schoolName: newSchoolName.trim(),
      academicYear: newAcademicYear.trim(),
      location: newLocation.trim(),
      adminPin: newAdminPin.trim() || '123456',
    });

    setIsAddClassModalOpen(false);
    setNewClassName('');
    onSelectClass(created.id);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#1E3A8A]/30 to-transparent pointer-events-none blur-3xl"></div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-400/40">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-wide text-white">SmartClass</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Cổng Đăng Nhập
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                <School className="w-3.5 h-3.5 text-blue-400 inline" />
                <span>{classInfo.schoolName || 'THPT Thống Nhất B'}</span>
                <span>•</span>
                <MapPin className="w-3 h-3 text-emerald-400 inline" />
                <span>{classInfo.location || 'Phước Sơn'}</span>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-4 bg-slate-800/70 px-3.5 py-1.5 rounded-xl border border-slate-700/60">
            <span>GVCN: <strong className="text-white">{classInfo.teacherName}</strong></span>
            <span>•</span>
            <span>Năm học: <strong className="text-blue-300">{classInfo.academicYear}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Danh sách lớp chỉ dùng cho luồng học sinh; Admin/GVCN đăng nhập không phải chọn lớp. */}
        {activeTab === 'student' && <section className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                1
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Danh Sách Lớp Đã Được Quản Trị Viên Tạo
              </h2>
            </div>

          </div>

          {/* Grid Thẻ Lớp Học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((c) => {
              const isSelected = c.id === activeClassId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectClass(c.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-950/80 ring-2 ring-blue-500/30'
                      : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {c.className}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">Lớp {c.className}</h3>
                        <p className="text-xs text-slate-400">GVCN: {c.teacherName}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        <Check className="w-3 h-3" />
                        <span>Đang chọn</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Trường: {c.schoolName}</span>
                    <span>Sĩ số: <strong className="text-slate-200">{c.studentCount || students.length || 0} HS</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>}

        {/* Step 2: Chọn Vai Trò Đăng Nhập */}
        <section className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          {/* Header Tab Switcher */}
          <div className="p-2 bg-slate-900/60 border-b border-slate-700/70 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-[#1E3A8A] text-white shadow-md border border-blue-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'teacher' ? 'text-amber-400' : ''}`} />
              <span>1. Giáo Viên Chủ Nhiệm (Admin)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-[#1E3A8A] text-white shadow-md border border-blue-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'student' ? 'text-amber-400' : ''}`} />
              <span>2. Học Sinh & Ban Cán Sự Lớp</span>
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: GIÁO VIÊN CHỦ NHIỆM (ADMIN) */}
            {activeTab === 'teacher' && (
              <div className="max-w-xl mx-auto space-y-5">
                {/* Quyền hạn Admin */}
                <div className="flex gap-2"><button type="button" onClick={() => { setLoginMode('teacher'); setPinInput(''); setPinError(false); }} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${loginMode === 'teacher' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Đăng nhập GVCN</button><button type="button" onClick={() => { setLoginMode('admin'); setPinInput(''); setPinError(false); }} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${loginMode === 'admin' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Admin hệ thống</button></div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
                    <Shield className="w-4 h-4" />
                    <span>{loginMode === 'admin' ? 'Quản trị viên hệ thống' : 'Giáo viên chủ nhiệm lớp được phân công'}:</span>
                  </div>
                  <ul className="space-y-1.5 text-amber-200/90 pl-5 list-disc text-xs leading-relaxed">
                    <li>{loginMode === 'admin' ? 'Quản lý tài khoản GVCN và phân công lớp.' : 'Quản lý dữ liệu của lớp được Admin phân công.'}</li>
                    <li>Điểm danh, ghi nhận lỗi vi phạm & điểm cộng cho tất cả học sinh.</li>
                    <li>Phân quyền nhiệm vụ cho Ban cán sự (Lớp trưởng, Cờ đỏ, Tổ trưởng).</li>
                    <li><strong>Khóa sổ tổng kết thi đua sau mỗi tuần học và tháng học</strong> để chốt điểm và chống sửa đổi.</li>
                    <li>Tiếp nhận, xử lý và phản hồi ý kiến / khiếu nại của học sinh.</li>
                  </ul>
                </div>

                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {loginMode === 'admin' ? 'Mật khẩu Admin hệ thống:' : 'Mật khẩu GVCN:'}
                    </label>
                    {loginMode === 'teacher' && <div><label className="block text-xs font-bold text-slate-300 mb-1.5" htmlFor="teacher-username">Tên đăng nhập GVCN</label><input id="teacher-username" type="text" autoComplete="username" required value={teacherUsername} onChange={e => setTeacherUsername(e.target.value)} placeholder="Tên đăng nhập do Admin cấp" className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500" /></div>}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          setPinError(false);
                        }}
                        placeholder="Nhập mật khẩu"
                        autoComplete={loginMode === 'admin' ? 'current-password' : 'current-password'}
                        required
                        maxLength={64}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pinError ? (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Mã PIN không chính xác hoặc máy chủ chưa được cấu hình.</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        {loginMode === 'admin' ? 'Mật khẩu Admin được cấu hình trong biến SMARTCLASS_ADMIN_PASSWORD trên Vercel.' : 'Sử dụng tên đăng nhập và mật khẩu do Admin cấp.'}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-[#1E3A8A] hover:from-blue-500 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
                  >
                    <span>{loginMode === 'admin' ? 'Đăng nhập Admin hệ thống' : 'Đăng nhập GVCN'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: HỌC SINH & BAN CÁN SỰ */}
            {activeTab === 'student' && (
              <div className="space-y-4">
                {/* Hướng dẫn quyền học sinh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-blue-950/60 border border-blue-500/40 rounded-xl">
                    <div className="flex items-center space-x-2 font-bold text-blue-300 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Học sinh được phân quyền (Ban cán sự):</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Lớp trưởng, Cờ đỏ, Tổ trưởng... <strong>Được phép nhập nội dung</strong> (ghi lỗi vi phạm, điểm cộng và điểm danh theo phạm vi được phân công).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-xl">
                    <div className="flex items-center space-x-2 font-bold text-slate-300 mb-1">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Thành viên còn lại:</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      <strong>Chỉ được xem nội dung</strong> bảng điểm, xếp hạng và <strong>có phần gửi phản hồi / khiếu nại</strong> trực tiếp đến GVCN.
                    </p>
                  </div>
                </div>

                {/* Bộ lọc tìm kiếm & Tổ */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm học sinh theo họ tên hoặc SĐT..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamFilter('all')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                        selectedTeamFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Tất cả ({students.length})
                    </button>
                    {[1, 2, 3, 4].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTeamFilter(t)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                          selectedTeamFilter === t
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Tổ {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh sách học sinh */}
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Không tìm thấy học sinh nào phù hợp trong Lớp {classInfo.className}.
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const officer = getOfficerInfo(student.id);
                      return (
                        <div
                          key={student.id}
                          className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                officer
                                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              T{student.team}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-white">{student.name}</span>
                                {officer ? (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                                    <Award className="w-3 h-3 text-amber-300" />
                                    <span>{officer.title}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                    Thành viên
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {officer ? (
                                  <span className="text-emerald-400 font-medium">
                                    ⚡ Quyền hạn: Được phép nhập vi phạm & điểm cộng
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    👁️ Quyền hạn: Chỉ xem & Gửi phản hồi / khiếu nại
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStudentLogin(student)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              officer
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            Đăng nhập
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Đăng nhập học sinh">
          <form onSubmit={handleStudentPinSubmit} className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div><h3 className="text-lg font-bold text-white">Xác thực học sinh</h3><p className="mt-1 text-sm text-slate-300">{selectedStudent.name} · Tổ {selectedStudent.team}</p></div>
              <button type="button" onClick={() => setSelectedStudent(null)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800" aria-label="Đóng">✕</button>
            </div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="student-pin">Mật khẩu cá nhân</label>
            <input id="student-pin" type="password" autoComplete="current-password" minLength={8} maxLength={64} required value={studentPin} onChange={e => setStudentPin(e.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-lg tracking-[0.3em] text-white outline-none focus:border-blue-500" placeholder="Nhập mật khẩu cá nhân" />
            {authMessage && <p className="mt-3 text-sm text-rose-300">{authMessage}</p>}
            <button type="submit" disabled={authBusy} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-60">{authBusy ? 'Đang xác thực…' : 'Đăng nhập'}</button>
            <p className="mt-3 text-xs text-slate-400">Nếu chưa có mật khẩu, liên hệ giáo viên chủ nhiệm.</p>
          </form>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-3 px-4 text-center text-xs text-slate-400">
        SmartClass • Phần mềm Quản lý Lớp Chủ nhiệm Offline-first • {classInfo.schoolName}
      </footer>

      {/* Modal Thêm Lớp Mới */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-2">
                <School className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Thêm Lớp Chủ Nhiệm Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tên Lớp (ví dụ: 10A3, 11B1):</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Nhập tên lớp..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Giáo Viên Chủ Nhiệm:</label>
                  <input
                    type="text"
                    required
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Mã PIN Admin:</label>
                  <input
                    type="text"
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tên Trường:</label>
                  <input
                    type="text"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Địa Danh:</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  Tạo Lớp & Vào Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
