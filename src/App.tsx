import React, { useState, useEffect } from 'react';
import {
  Student,
  Rule,
  AttendanceRecord,
  BehaviorLog,
  ClassInfo,
  CurrentUserSession,
  EvaluationPeriod,
  AppThemeConfig,
  StudentFeedback,
  ClassItem,
  ParentMeetingInvitationConfig,
} from './types';
import {
  getStoredClasses,
  getActiveClassId,
  setActiveClassId,
  addNewClass,
  getIsAuthenticated,
  setIsAuthenticated as persistIsAuthenticated,
  getStoredStudents,
  saveStudents,
  getStoredRules,
  saveRules,
  getStoredAttendance,
  saveAttendance,
  getStoredLogs,
  saveLogs,
  getStoredClassInfo,
  saveClassInfo,
  getStoredSession,
  saveStoredSession,
  getStoredThemeConfig,
  saveStoredThemeConfig,
  getStoredFeedbacks,
  saveFeedbacks,
  toggleLockPeriod,
  deleteClass,
  resetAllToMockData,
  calculateStudentScores,
  calculateTeamScores,
  getStoredMeetingInvitationConfig,
  saveStoredMeetingInvitationConfig,
} from './utils/storage';
import { applyThemeToDocument } from './utils/theme';
import { downloadStandaloneHtmlFile } from './utils/generateStandaloneHtml';
import { Navbar, TabType } from './components/Navbar';
import { AttendanceTab } from './components/AttendanceTab';
import { RulesTab } from './components/RulesTab';
import { LeaderboardTab } from './components/LeaderboardTab';
import { ActivityLogTab } from './components/ActivityLogTab';
import { ReportTab } from './components/ReportTab';
import { SettingsTab } from './components/SettingsTab';
import { FeedbackTab } from './components/FeedbackTab';
import { SeatingChartTab } from './components/SeatingChartTab';
import { PrintReportView } from './components/PrintReportView';
import { LoginModal } from './components/LoginModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { LoginScreen } from './components/LoginScreen';
import { PeriodLockModal } from './components/PeriodLockModal';
import { ParentMeetingModal } from './components/ParentMeetingModal';
import { ParentMeetingPrintView } from './components/ParentMeetingPrintView';
import { PinManagementPanel } from './components/PinManagementPanel';
import { AccountSecurityPanel } from './components/AccountSecurityPanel';
import { initializeTursoSync } from './utils/tursoSync';
import { logoutServer } from './utils/authClient';

export default function App() {
  const [classes, setClasses] = useState<ClassItem[]>(getStoredClasses);
  const [activeClassId, setActiveClassIdState] = useState<string>(getActiveClassId);
  // Không tin trạng thái đăng nhập lưu trong localStorage; xác minh cookie HttpOnly với máy chủ.
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(false);
  const [adminHasOpenedClass, setAdminHasOpenedClass] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ className: '', teacherName: '', username: '', password: '', schoolName: 'THPT Thống Nhất B', academicYear: '2026 - 2027', location: 'Phước Sơn' });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/classes', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(result => {
        if (cancelled || !Array.isArray(result?.classes)) return;
        const cloudClasses = result.classes as ClassItem[];
        localStorage.setItem('smartclass_classes_list_v1', JSON.stringify(cloudClasses));
        setClasses(cloudClasses);
        const current = localStorage.getItem('smartclass_active_class_id_v1');
        if (cloudClasses.length > 0 && (!current || !cloudClasses.some(c => c.id === current))) {
          localStorage.setItem('smartclass_active_class_id_v1', cloudClasses[0].id);
          setActiveClassIdState(cloudClasses[0].id);
        }
      })
      .catch(() => undefined);
    fetch('/api/auth', { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(result => {
        if (cancelled || !result?.ok || !result.session) return;
        const serverSession = result.session as CurrentUserSession;
        if (serverSession.classId) {
          setActiveClassId(serverSession.classId);
          setActiveClassIdState(serverSession.classId);
          setStudents(getStoredStudents(serverSession.classId));
          setRules(getStoredRules(serverSession.classId));
          setAttendance(getStoredAttendance(serverSession.classId));
          setLogs(getStoredLogs(serverSession.classId));
          setClassInfo(getStoredClassInfo(serverSession.classId));
          setFeedbacks(getStoredFeedbacks(serverSession.classId));
        }
        setCurrentSession({ ...serverSession, isLoggedIn: true });
        saveStoredSession({ ...serverSession, isLoggedIn: true });
        persistIsAuthenticated(true);
        setIsAuthenticatedState(true);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const [currentTab, setCurrentTab] = useState<TabType>('attendance');
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents(activeClassId));
  const [rules, setRules] = useState<Rule[]>(() => getStoredRules(activeClassId));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getStoredAttendance(activeClassId));
  const [logs, setLogs] = useState<BehaviorLog[]>(() => getStoredLogs(activeClassId));
  const [classInfo, setClassInfo] = useState<ClassInfo>(() => getStoredClassInfo(activeClassId));
  const [currentSession, setCurrentSession] = useState<CurrentUserSession>(getStoredSession);
  const [themeConfig, setThemeConfig] = useState<AppThemeConfig>(getStoredThemeConfig);
  const [feedbacks, setFeedbacks] = useState<StudentFeedback[]>(() => getStoredFeedbacks(activeClassId));
  const [feedbackTargetLogId, setFeedbackTargetLogId] = useState<string | undefined>(undefined);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isPeriodLockModalOpen, setIsPeriodLockModalOpen] = useState<boolean>(false);
  const [isParentMeetingModalOpen, setIsParentMeetingModalOpen] = useState<boolean>(false);
  const [isParentMeetingPrintOpen, setIsParentMeetingPrintOpen] = useState<boolean>(false);
  const [meetingInvitationConfig, setMeetingInvitationConfig] = useState<ParentMeetingInvitationConfig>(
    () => getStoredMeetingInvitationConfig(activeClassId, classInfo)
  );
  const [meetingTargetStudentIds, setMeetingTargetStudentIds] = useState<string[]>([]);

  // Khởi tạo và cập nhật CSS Variables & Theme attributes trên documentElement
  useEffect(() => {
    applyThemeToDocument(themeConfig);
  }, [themeConfig]);

  useEffect(() => {
    if (isAuthenticated) { void initializeTursoSync(); }
  }, [isAuthenticated]);

  useEffect(() => {
    const refreshFromCloud = () => {
      setClasses(getStoredClasses());
      setStudents(getStoredStudents(activeClassId));
      setRules(getStoredRules(activeClassId));
      setAttendance(getStoredAttendance(activeClassId));
      setLogs(getStoredLogs(activeClassId));
      setClassInfo(getStoredClassInfo(activeClassId));
      setFeedbacks(getStoredFeedbacks(activeClassId));
    };
    window.addEventListener('smartclass-cloud-ready', refreshFromCloud);
    return () => window.removeEventListener('smartclass-cloud-ready', refreshFromCloud);
  }, [activeClassId]);

  const handleUpdateThemeConfig = (newConfig: AppThemeConfig) => {
    setThemeConfig(newConfig);
    saveStoredThemeConfig(newConfig);
    applyThemeToDocument(newConfig);
  };

  const handleOpenMeetingPrintView = (
    config: ParentMeetingInvitationConfig,
    targetIds: string[]
  ) => {
    setMeetingInvitationConfig(config);
    saveStoredMeetingInvitationConfig(activeClassId, config);
    setMeetingTargetStudentIds(targetIds);
    setIsParentMeetingPrintOpen(true);
  };

  // Chuyển đổi lớp học đang hoạt động (Multi-tenancy isolation)
  const handleSelectClass = (newClassId: string) => {
    if (currentSession.role === 'admin') setAdminHasOpenedClass(true);
    if (currentSession.role === 'teacher' && newClassId !== currentSession.classId) return;
    if (currentSession.role === 'admin' && classes.length > 0 && !classes.some((item) => item.id === newClassId)) return;
    setActiveClassId(newClassId);
    setActiveClassIdState(newClassId);

    const newClassInfo = getStoredClassInfo(newClassId);
    const newStudents = getStoredStudents(newClassId);
    const newRules = getStoredRules(newClassId);
    const newAttendance = getStoredAttendance(newClassId);
    const newLogs = getStoredLogs(newClassId);
    const newFeedbacks = getStoredFeedbacks(newClassId);
    const newMeetingConfig = getStoredMeetingInvitationConfig(newClassId, newClassInfo);

    setClassInfo(newClassInfo);
    setStudents(newStudents);
    setRules(newRules);
    setAttendance(newAttendance);
    setLogs(newLogs);
    setFeedbacks(newFeedbacks);
    setMeetingInvitationConfig(newMeetingConfig);

    setCurrentPeriod({
      type: 'week',
      academicYear: newClassInfo.academicYear,
      weekNumber: newClassInfo.weekNumber,
      month: 2,
    });

    if (currentSession.role === 'admin') {
      const updatedSession: CurrentUserSession = {
        ...currentSession,
        displayName: `${newClassInfo.teacherName} (GVCN - Admin)`,
        classId: newClassId,
      };
      setCurrentSession(updatedSession);
      saveStoredSession(updatedSession);
    } else if (currentSession.role === 'teacher') {
      const updatedSession = { ...currentSession, classId: currentSession.classId };
      setCurrentSession(updatedSession);
      saveStoredSession(updatedSession);
    } else {
      const defaultStudent = newStudents[0];
      const updatedSession: CurrentUserSession = defaultStudent
        ? {
            role: 'student',
            studentId: defaultStudent.id,
            displayName: `${defaultStudent.name} (Học sinh - Lớp ${newClassInfo.className})`,
            classId: newClassId,
            canEditPoints: false,
            canTakeAttendance: false,
            canInputLogs: false,
            isReadOnly: true,
            isLoggedIn: true,
          }
        : {
            role: 'student',
            displayName: `Học sinh (Lớp ${newClassInfo.className})`,
            classId: newClassId,
            canEditPoints: false,
            canTakeAttendance: false,
            canInputLogs: false,
            isReadOnly: true,
            isLoggedIn: true,
          };
      setCurrentSession(updatedSession);
      saveStoredSession(updatedSession);
    }
  };

  // Thêm lớp mới
  const handleAddNewClass = (newClassData: {
    className: string;
    teacherName: string;
    schoolName?: string;
    academicYear?: string;
    location?: string;
    adminPin?: string;
  }): ClassItem => {
    const created = addNewClass(newClassData);
    const updated = getStoredClasses();
    setClasses(updated);
    void fetch('/api/classes', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classes: updated }) })
      .then(async response => { if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Không lưu được danh sách lớp lên máy chủ.'); } })
      .catch(error => alert(error instanceof Error ? error.message : 'Không đồng bộ được danh sách lớp.'));
    handleSelectClass(created.id);
    return created;
  };

  // Xóa lớp (chỉ khi có nhiều hơn 1 lớp)
  const handleDeleteClass = (classIdToDelete: string) => {
    if (classes.length <= 1) {
      alert('Hệ thống cần duy trì ít nhất một lớp học!');
      return;
    }
    const target = classes.find((c) => c.id === classIdToDelete);
    if (
      confirm(
        `Thầy/Cô có chắc chắn muốn xóa dữ liệu lớp "${target?.className || classIdToDelete}" không?\nToàn bộ danh sách học sinh, điểm danh, nội quy và nhật ký của lớp này sẽ bị xóa khỏi bộ nhớ máy.`
      )
    ) {
      const success = deleteClass(classIdToDelete);
      if (success) {
        const remaining = getStoredClasses();
        setClasses(remaining);
        void fetch('/api/classes', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classes: remaining }) })
          .then(async response => { if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Không lưu được danh sách lớp lên máy chủ.'); } })
          .catch(error => alert(error instanceof Error ? error.message : 'Không đồng bộ được danh sách lớp.'));
        if (activeClassId === classIdToDelete) {
          handleSelectClass(remaining[0].id);
        }
      }
    }
  };

  // Tạo lớp từ màn hình quản trị: không tự động mở lớp sau khi tạo.
  const handleCreateClassFromAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentSession.role !== 'admin') return;
    const f = newClassForm;
    if (!f.className.trim() || !f.teacherName.trim() || !f.username.trim() || !f.password) { alert('Vui lòng nhập tên lớp, họ tên GVCN, tên đăng nhập và mật khẩu.'); return; }
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password) || !/[^A-Za-z0-9\s]/.test(f.password)) { alert('Mật khẩu GVCN cần 8–64 ký tự, gồm chữ, số và ký tự đặc biệt.'); return; }
    if (classes.some(c => c.className.trim().toLowerCase() === f.className.trim().toLowerCase())) { alert('Tên lớp đã tồn tại.'); return; }
    setCreatingClass(true);
    try {
      const created = addNewClass({ className: f.className, teacherName: f.teacherName, schoolName: f.schoolName, academicYear: f.academicYear, location: f.location });
      const updated = getStoredClasses();
      const saveClasses = await fetch('/api/classes', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classes: updated }) });
      const saveResult = await saveClasses.json().catch(() => ({}));
      if (!saveClasses.ok) throw new Error(saveResult.error || 'Không lưu được lớp lên máy chủ.');
      const teacherResponse = await fetch('/api/auth', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'manage-teacher', username: f.username, classId: created.id, displayName: f.teacherName, password: f.password }) });
      const teacherResult = await teacherResponse.json().catch(() => ({}));
      if (!teacherResponse.ok) throw new Error(teacherResult.error || 'Lớp đã tạo nhưng chưa cấp được tài khoản GVCN. Hãy kiểm tra lại trong quản lý tài khoản.');
      setClasses(updated); setShowCreateClass(false);
      setNewClassForm({ className: '', teacherName: '', username: '', password: '', schoolName: 'THPT Thống Nhất B', academicYear: '2026 - 2027', location: 'Phước Sơn' });
      alert(`Đã tạo lớp ${created.className} và cấp tài khoản GVCN ${f.username}.`);
    } catch (error) {
      setClasses(getStoredClasses());
      alert(error instanceof Error ? error.message : 'Không tạo được lớp.');
    } finally { setCreatingClass(false); }
  };

  // Đăng nhập thành công từ LoginScreen
  const handleLoginSuccess = (session: CurrentUserSession, classId: string) => {
    const assignedClassId = session.role === 'teacher' ? String(session.classId || classId) : classId;
    persistIsAuthenticated(true);
    setIsAuthenticatedState(true);
    setCurrentSession({ ...session, classId: assignedClassId, isLoggedIn: true });
    saveStoredSession({ ...session, classId: assignedClassId, isLoggedIn: true });
    setAdminHasOpenedClass(session.role !== 'admin');
    setActiveClassId(assignedClassId);
    setActiveClassIdState(assignedClassId);
    setStudents(getStoredStudents(assignedClassId));
    setRules(getStoredRules(assignedClassId));
    setAttendance(getStoredAttendance(assignedClassId));
    setLogs(getStoredLogs(assignedClassId));
    setClassInfo(getStoredClassInfo(assignedClassId));
    setFeedbacks(getStoredFeedbacks(assignedClassId));
  };

  // Đăng xuất và quay lại màn hình LoginScreen
  const handleLogout = () => {
    void logoutServer().catch(() => undefined);
    persistIsAuthenticated(false);
    setIsAuthenticatedState(false);
    setAdminHasOpenedClass(false);
    const updatedSession = { ...currentSession, isLoggedIn: false };
    setCurrentSession(updatedSession);
    saveStoredSession(updatedSession);
  };

  // Kỳ thi đua đang xem xét: Tuần hiện tại / Hàng tháng / Cả năm học
  const [currentPeriod, setCurrentPeriod] = useState<EvaluationPeriod>({
    type: 'week',
    academicYear: classInfo.academicYear,
    weekNumber: classInfo.weekNumber,
    month: 2,
  });

  // Tính toán bảng điểm cá nhân & xếp hạng tổ theo kỳ thi đua đã chọn
  const studentSummaries = calculateStudentScores(students, attendance, logs, currentPeriod);
  const teamSummaries = calculateTeamScores(studentSummaries);

  // Handlers cập nhật & lưu trữ tự động (luôn lưu theo activeClassId)
  const handleUpdateAttendance = (newAttendance: AttendanceRecord[]) => {
    setAttendance(newAttendance);
    saveAttendance(newAttendance, activeClassId);
  };

  const handleUpdateRules = (newRules: Rule[]) => {
    setRules(newRules);
    saveRules(newRules, activeClassId);
  };

  const handleAddLog = (newLog: BehaviorLog) => {
    const updated = [newLog, ...logs];
    setLogs(updated);
    saveLogs(updated, activeClassId);
  };

  const handleDeleteLog = (logId: string) => {
    const updated = logs.filter((l) => l.id !== logId);
    setLogs(updated);
    saveLogs(updated, activeClassId);
  };

  const handleClearAllLogs = () => {
    setLogs([]);
    saveLogs([], activeClassId);
  };

  const handleUpdateClassInfo = (newInfo: ClassInfo) => {
    const oldTeacherName = classInfo.teacherName;
    setClassInfo(newInfo);
    saveClassInfo(newInfo, activeClassId);
    setClasses(getStoredClasses());

    // Đồng bộ ngay lập tức tên vai trò hiển thị của GVCN nếu đang là phiên admin
    if (currentSession.role === 'admin' || currentSession.role === 'teacher') {
      const updatedSession: CurrentUserSession = {
        ...currentSession,
        displayName: currentSession.role === 'admin' ? `${newInfo.teacherName} (Admin)` : newInfo.teacherName,
      };
      setCurrentSession(updatedSession);
      saveStoredSession(updatedSession);
    }

    // Đồng bộ năm học trong kỳ thi đua nếu có cập nhật
    setCurrentPeriod((prev) => ({
      ...prev,
      academicYear: newInfo.academicYear,
    }));

    // Nếu tên GVCN thay đổi, cập nhật các nhật ký được ghi nhận bởi GVCN cũ để đồng bộ
    if (oldTeacherName !== newInfo.teacherName) {
      const updatedLogs = logs.map((log) => {
        if (
          !log.recordedBy ||
          log.recordedBy.includes('GVCN') ||
          log.recordedBy.includes(oldTeacherName) ||
          log.recordedBy.includes('Thầy Tuấn') ||
          log.recordedBy.includes('Thầy Hoàng Minh Tuấn')
        ) {
          return {
            ...log,
            recordedBy: `${newInfo.teacherName} (GVCN)`,
          };
        }
        return log;
      });
      setLogs(updatedLogs);
      saveLogs(updatedLogs, activeClassId);
    }
  };

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents, activeClassId);
  };

  const handleUpdateSession = (session: CurrentUserSession) => {
    setCurrentSession(session);
    saveStoredSession(session);
  };

  // Khóa / Mở khóa kỳ thi đua (Tuần / Tháng)
  const handleToggleLockPeriod = (
    typeOrPeriod: 'week' | 'month' | EvaluationPeriod,
    periodNumberOrLock?: number | boolean
  ) => {
    let type: 'week' | 'month';
    let num: number;

    if (typeof typeOrPeriod === 'object') {
      if (typeOrPeriod.type === 'year') return;
      type = typeOrPeriod.type;
      num = typeOrPeriod.type === 'week' ? typeOrPeriod.weekNumber : typeOrPeriod.month;
    } else {
      type = typeOrPeriod;
      num = typeof periodNumberOrLock === 'number' ? periodNumberOrLock : 1;
    }

    const updated = toggleLockPeriod(type, num, classInfo);
    setClassInfo(updated);
    saveClassInfo(updated, activeClassId);
  };

  // Quản lý phản hồi & khiếu nại của học sinh
  const handleAddFeedback = (newFb: Omit<StudentFeedback, 'id' | 'createdAt' | 'status'>) => {
    const fullFeedback: StudentFeedback = {
      ...newFb,
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: `${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      status: 'pending',
    };
    const updated = [fullFeedback, ...feedbacks];
    setFeedbacks(updated);
    saveFeedbacks(updated, activeClassId);
  };

  const handleResolveFeedback = (
    feedbackId: string,
    status: 'approved' | 'rejected',
    teacherReply: string,
    deleteRelatedLog?: boolean
  ) => {
    const targetFeedback = feedbacks.find((f) => f.id === feedbackId);
    if (deleteRelatedLog && targetFeedback?.relatedLogId) {
      handleDeleteLog(targetFeedback.relatedLogId);
    }

    const updatedFeedbacks = feedbacks.map((fb) =>
      fb.id === feedbackId
        ? {
            ...fb,
            status,
            teacherReply,
            resolvedAt: `${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}`,
            resolvedBy: currentSession.displayName,
          }
        : fb
    );
    setFeedbacks(updatedFeedbacks);
    saveFeedbacks(updatedFeedbacks, activeClassId);
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    const updated = feedbacks.filter((f) => f.id !== feedbackId);
    setFeedbacks(updated);
    saveFeedbacks(updated, activeClassId);
  };

  const pendingFeedbackCount = feedbacks.filter((f) => f.status === 'pending').length;

  const handleResetData = () => {
    if (
      confirm(
        `Thầy/Cô có chắc chắn muốn khôi phục toàn bộ dữ liệu mẫu cho Lớp ${classInfo.className} (15 học sinh, 4 tổ, các nội quy và điểm danh mẫu)?`
      )
    ) {
      resetAllToMockData(activeClassId);
      setStudents(getStoredStudents(activeClassId));
      setRules(getStoredRules(activeClassId));
      setAttendance(getStoredAttendance(activeClassId));
      setLogs(getStoredLogs(activeClassId));
      setClassInfo(getStoredClassInfo(activeClassId));
      setCurrentSession(getStoredSession());
      setFeedbacks(getStoredFeedbacks(activeClassId));
    }
  };

  const handleDownloadStandalone = () => {
    downloadStandaloneHtmlFile(
      classInfo,
      students,
      rules,
      attendance,
      logs,
      feedbacks,
      themeConfig,
      currentSession
    );
  };

  // MÀN HÌNH ĐĂNG NHẬP BAN ĐẦU (NẾU CHƯA XÁC THỰC)
  if (!isAuthenticated) {
    return (
      <LoginScreen
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onAddNewClass={handleAddNewClass}
        classInfo={classInfo}
        students={students}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (isAuthenticated && currentSession.role === 'admin' && !adminHasOpenedClass) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
            <div><p className="text-sm text-blue-300 font-semibold">SMARTCLASS · QUẢN TRỊ HỆ THỐNG</p><h1 className="text-3xl font-black mt-1">Quản lý danh sách lớp</h1><p className="text-slate-400 mt-2">Chọn một lớp đã tạo để mở giao diện quản lý riêng.</p></div>
            <button onClick={handleLogout} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">Đăng xuất</button>
          </header>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="text-lg font-bold">Các lớp đã tạo ({classes.length})</h2><button onClick={() => setShowCreateClass(true)} className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 font-semibold">+ Tạo lớp mới</button></div>
          {classes.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">Chưa có lớp nào. Nhấn “Tạo lớp mới” để bắt đầu.</div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{classes.map(item => <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-extrabold">Lớp {item.className}</h3><button onClick={() => handleSelectClass(item.id)} className="text-blue-300 text-sm hover:text-blue-200">Mở lớp →</button></div><p className="text-sm text-slate-300 mt-3">GVCN: {item.teacherName || 'Chưa phân công'}</p><p className="text-xs text-slate-500 mt-1">{item.schoolName || ''}</p><p className="text-xs text-slate-500 mt-1">Năm học: {item.academicYear || 'Chưa thiết lập'}</p><button onClick={() => handleDeleteClass(item.id)} className="mt-4 rounded-lg border border-red-900/80 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/60">Xóa lớp</button></div>)}</div>}
          {showCreateClass && <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center overflow-y-auto"><form onSubmit={handleCreateClassFromAdmin} className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between gap-3 mb-5"><div><h2 className="text-2xl font-bold">Tạo lớp mới</h2><p className="text-sm text-slate-400 mt-1">Thông tin lớp và tài khoản GVCN</p></div><button type="button" onClick={() => setShowCreateClass(false)} className="rounded-lg border border-slate-700 px-3 py-1.5">Đóng</button></div><div className="grid sm:grid-cols-2 gap-4">{[{key:'className',label:'Tên lớp',placeholder:'Ví dụ: 10A4',required:true},{key:'teacherName',label:'Họ tên giáo viên chủ nhiệm',placeholder:'Nguyễn Văn A',required:true},{key:'username',label:'Tên đăng nhập GVCN',placeholder:'gvcn10a4',required:true},{key:'password',label:'Mật khẩu ban đầu',placeholder:'Tối thiểu 8 ký tự, có chữ, số, ký tự đặc biệt',required:true},{key:'schoolName',label:'Tên trường',placeholder:'Tên trường',required:true},{key:'academicYear',label:'Năm học',placeholder:'2026 - 2027',required:true},{key:'location',label:'Địa điểm',placeholder:'Xã/phường',required:false}].map(field => <label key={field.key} className="block"><span className="block text-sm text-slate-300 mb-1">{field.label}</span><input required={field.required} type={field.key==='password'?'password':'text'} autoComplete={field.key==='password'?'new-password':'off'} value={(newClassForm as any)[field.key]} onChange={e => setNewClassForm(prev => ({...prev,[field.key]:e.target.value}))} placeholder={field.placeholder} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder:text-slate-600 focus:border-blue-500 outline-none" /></label>)}</div><p className="text-xs text-slate-400 mt-4">Mật khẩu được gửi đến API xác thực để băm và lưu trên máy chủ; không lưu mật khẩu rõ trong thông tin lớp.</p><div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setShowCreateClass(false)} className="rounded-xl border border-slate-700 px-4 py-2">Hủy</button><button disabled={creatingClass} type="submit" className="rounded-xl bg-blue-600 px-5 py-2 font-semibold disabled:opacity-50">{creatingClass?'Đang tạo…':'Tạo lớp và tài khoản GVCN'}</button></div></form></div>}
          <p className="text-xs text-slate-500 mt-8">Chỉ Admin được tạo/xóa lớp. Tạo lớp không tự động mở lớp; hãy nhấn “Mở lớp” khi muốn vào giao diện quản lý.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-200">
      {/* Navbar Điều Hướng */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        classInfo={classInfo}
        onResetData={handleResetData}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onDownloadStandalone={handleDownloadStandalone}
        currentSession={currentSession}
        onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
        themeConfig={themeConfig}
        onOpenThemeCustomizer={() => setIsThemeModalOpen(true)}
        pendingFeedbackCount={pendingFeedbackCount}
        classes={classes}
        activeClassId={activeClassId}
        onSelectClass={handleSelectClass}
        onLogout={handleLogout}
        onOpenParentMeeting={() => setIsParentMeetingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:hidden">
        {currentTab === 'attendance' && (
          <AttendanceTab
            students={students}
            attendance={attendance}
            onUpdateAttendance={handleUpdateAttendance}
            currentSession={currentSession}
            classInfo={classInfo}
            onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
            onNavigateFeedback={() => setCurrentTab('feedback')}
            onToggleLockPeriod={handleToggleLockPeriod}
          />
        )}

        {currentTab === 'rules' && (
          <RulesTab
            students={students}
            rules={rules}
            onUpdateRules={handleUpdateRules}
            onAddLog={handleAddLog}
            currentSession={currentSession}
            classInfo={classInfo}
            onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
            onNavigateFeedback={() => setCurrentTab('feedback')}
            onToggleLockPeriod={handleToggleLockPeriod}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardTab
            studentSummaries={studentSummaries}
            teamSummaries={teamSummaries}
            logs={logs}
            attendance={attendance}
            currentPeriod={currentPeriod}
            onChangePeriod={setCurrentPeriod}
            classInfo={classInfo}
            currentSession={currentSession}
            onToggleLockPeriod={handleToggleLockPeriod}
            onOpenPeriodLockModal={() => setIsPeriodLockModalOpen(true)}
          />
        )}

        {currentTab === 'logs' && (
          <ActivityLogTab
            logs={logs}
            students={students}
            onDeleteLog={handleDeleteLog}
            onClearAllLogs={handleClearAllLogs}
            currentSession={currentSession}
            classInfo={classInfo}
            onNavigateFeedback={(logId?: string) => {
              setFeedbackTargetLogId(logId);
              setCurrentTab('feedback');
            }}
          />
        )}

        {currentTab === 'reports' && (
          <ReportTab
            classInfo={classInfo}
            onUpdateClassInfo={handleUpdateClassInfo}
            studentSummaries={studentSummaries}
            teamSummaries={teamSummaries}
            currentPeriod={currentPeriod}
            onChangePeriod={setCurrentPeriod}
            onOpenPrint={() => setIsPrintModalOpen(true)}
            onDownloadStandalone={handleDownloadStandalone}
            currentSession={currentSession}
            onToggleLockPeriod={handleToggleLockPeriod}
            onOpenPeriodLockModal={() => setIsPeriodLockModalOpen(true)}
            onOpenParentMeetingInvitation={() => setIsParentMeetingModalOpen(true)}
          />
        )}

        {currentTab === 'seating' && (
          <SeatingChartTab
            classId={activeClassId}
            className={classInfo.className}
            schoolName={classInfo.schoolName}
            students={students}
          />
        )}

        {currentTab === 'feedback' && (
          <FeedbackTab
            feedbacks={feedbacks}
            onAddFeedback={handleAddFeedback}
            onResolveFeedback={handleResolveFeedback}
            onDeleteFeedback={handleDeleteFeedback}
            currentSession={currentSession}
            students={students}
            logs={logs}
            classInfo={classInfo}
            currentWeek={classInfo.weekNumber}
            preselectedLogId={feedbackTargetLogId}
            onClearPreselectedLog={() => setFeedbackTargetLogId(undefined)}
          />
        )}

        {currentTab === 'settings' && (
          <>
          <AccountSecurityPanel session={currentSession} classes={classes} />
          <PinManagementPanel classId={activeClassId} classInfo={classInfo} students={students} currentSession={currentSession} />
          <SettingsTab
            classInfo={classInfo}
            onUpdateClassInfo={handleUpdateClassInfo}
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onResetAllData={handleResetData}
            currentSession={currentSession}
            onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
            themeConfig={themeConfig}
            onUpdateThemeConfig={handleUpdateThemeConfig}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onOpenPeriodLockModal={() => setIsPeriodLockModalOpen(true)}
            classes={classes}
            activeClassId={activeClassId}
            onSelectClass={handleSelectClass}
            onAddNewClass={handleAddNewClass}
            onDeleteClass={handleDeleteClass}
            onOpenParentMeetingInvitation={() => setIsParentMeetingModalOpen(true)}
          />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SmartClass • Phần mềm Quản lý Lớp Chủ nhiệm Offline-first • Lớp {classInfo.className} (Năm học {classInfo.academicYear})
          </span>
          <span>
            Đang đăng nhập: <strong className="text-[#1E3A8A]">{currentSession.displayName}</strong> • Lưu dữ liệu riêng từng lớp an toàn LocalStorage
          </span>
        </div>
      </footer>

      {/* A4 Print Modal / View */}
      {isPrintModalOpen && (
        <PrintReportView
          classInfo={classInfo}
          studentSummaries={studentSummaries}
          teamSummaries={teamSummaries}
          period={currentPeriod}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Modal Đăng Nhập & Phân Quyền (GVCN Admin / Cán Sự Lớp / Học Sinh) */}
      <LoginModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentSession={currentSession}
        classInfo={classInfo}
        students={students}
        onLogin={handleUpdateSession}
      />

      {/* Modal Tùy Biến Giao Diện Chính (Màu Sắc & Kiểu Hiển Thị) */}
      {isThemeModalOpen && (
        <ThemeCustomizerModal
          themeConfig={themeConfig}
          onUpdateThemeConfig={handleUpdateThemeConfig}
          onClose={() => setIsThemeModalOpen(false)}
        />
      )}

      {/* Modal Quản Lý Khóa Sổ Tuần & Tháng Học */}
      <PeriodLockModal
        isOpen={isPeriodLockModalOpen}
        onClose={() => setIsPeriodLockModalOpen(false)}
        classInfo={classInfo}
        onUpdateClassInfo={handleUpdateClassInfo}
      />

      {/* Modal Tùy Chỉnh Giấy Mời Họp Phụ Huynh Định Kỳ */}
      <ParentMeetingModal
        isOpen={isParentMeetingModalOpen}
        onClose={() => setIsParentMeetingModalOpen(false)}
        classInfo={classInfo}
        students={students}
        studentSummaries={studentSummaries}
        initialConfig={meetingInvitationConfig}
        onSaveConfig={(cfg) => {
          setMeetingInvitationConfig(cfg);
          saveStoredMeetingInvitationConfig(activeClassId, cfg);
        }}
        onOpenPrintView={handleOpenMeetingPrintView}
      />

      {/* Modal / Màn Hình In Giấy Mời Họp Phụ Huynh Chuẩn Thể Thức Văn Bản */}
      {isParentMeetingPrintOpen && (
        <ParentMeetingPrintView
          classInfo={classInfo}
          config={meetingInvitationConfig}
          students={students}
          targetStudentIds={meetingTargetStudentIds}
          studentSummaries={studentSummaries}
          onClose={() => setIsParentMeetingPrintOpen(false)}
          onOpenSettings={() => {
            setIsParentMeetingPrintOpen(false);
            setIsParentMeetingModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
