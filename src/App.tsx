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
import { PrintReportView } from './components/PrintReportView';
import { LoginModal } from './components/LoginModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { LoginScreen } from './components/LoginScreen';
import { PeriodLockModal } from './components/PeriodLockModal';
import { ParentMeetingModal } from './components/ParentMeetingModal';
import { ParentMeetingPrintView } from './components/ParentMeetingPrintView';

export default function App() {
  const [classes, setClasses] = useState<ClassItem[]>(getStoredClasses);
  const [activeClassId, setActiveClassIdState] = useState<string>(getActiveClassId);
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    // Nếu session hiện tại đã đăng nhập thì tự động cho phép vào giao diện
    const session = getStoredSession();
    return getIsAuthenticated() || !!session.isLoggedIn;
  });

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
    setClasses(getStoredClasses());
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
        if (activeClassId === classIdToDelete) {
          handleSelectClass(remaining[0].id);
        }
      }
    }
  };

  // Đăng nhập thành công từ LoginScreen
  const handleLoginSuccess = (session: CurrentUserSession, classId: string) => {
    persistIsAuthenticated(true);
    setIsAuthenticatedState(true);
    setCurrentSession(session);
    saveStoredSession(session);
    handleSelectClass(classId);
  };

  // Đăng xuất và quay lại màn hình LoginScreen
  const handleLogout = () => {
    persistIsAuthenticated(false);
    setIsAuthenticatedState(false);
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
    if (currentSession.role === 'admin') {
      const updatedSession: CurrentUserSession = {
        ...currentSession,
        displayName: `${newInfo.teacherName} (GVCN - Admin)`,
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
