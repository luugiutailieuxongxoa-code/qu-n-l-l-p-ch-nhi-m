import {
  Student,
  Rule,
  AttendanceRecord,
  BehaviorLog,
  ClassInfo,
  ClassItem,
  StudentScoreSummary,
  TeamScoreSummary,
  RankCategory,
  CurrentUserSession,
  EvaluationPeriod,
  AppThemeConfig,
  StudentFeedback,
  ParentMeetingInvitationConfig,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_STUDENTS_10A2,
  INITIAL_RULES,
  INITIAL_ATTENDANCE,
  INITIAL_BEHAVIOR_LOGS,
  INITIAL_CLASS_INFO,
  INITIAL_CLASS_INFO_10A2,
  INITIAL_CLASSES,
  ATTENDANCE_PENALTY_CONFIG,
  INITIAL_FEEDBACKS,
} from '../data/mockData';
import { DEFAULT_THEME_CONFIG, applyThemeToDocument } from './theme';

const STORAGE_KEYS = {
  CLASSES: 'smartclass_classes_list_v1',
  ACTIVE_CLASS: 'smartclass_active_class_id_v1',
  IS_AUTH: 'smartclass_is_authenticated_v1',
  STUDENTS: 'smartclass_students_v1',
  RULES: 'smartclass_rules_v1',
  ATTENDANCE: 'smartclass_attendance_v1',
  LOGS: 'smartclass_logs_v1',
  CLASS_INFO: 'smartclass_class_info_v1',
  SESSION: 'smartclass_current_session_v1',
  THEME: 'smartclass_theme_v1',
  FEEDBACKS: 'smartclass_feedbacks_v1',
  PARENT_MEETING: 'smartclass_parent_meeting_invitation_v1',
};

export const getTodayLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DEFAULT_EVALUATION_PERIOD: EvaluationPeriod = {
  type: 'week',
  weekNumber: 24,
  month: 2,
  academicYear: '2024 - 2025',
};

export const DEFAULT_ADMIN_SESSION: CurrentUserSession = {
  role: 'admin',
  displayName: `${INITIAL_CLASS_INFO.teacherName} (GVCN - Admin)`,
  canEditPoints: true,
  canTakeAttendance: true,
  canInputLogs: true,
  isReadOnly: false,
  isLoggedIn: true,
};

// ==========================================
// 1. QUẢN LÝ DANH SÁCH LỚP HỌC (MULTI-CLASS)
// ==========================================

export const getStoredClasses = (): ClassItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (data) {
      const parsed = JSON.parse(data) as ClassItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load classes list', e);
  }
  return INITIAL_CLASSES;
};

export const saveStoredClasses = (classes: ClassItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  } catch (e) {
    console.error('Failed to save classes list', e);
  }
};

export const getActiveClassId = (): string => {
  try {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS);
    if (active) return active;
  } catch (e) {}
  return 'class-10A1';
};

export const setActiveClassId = (classId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, classId);
  } catch (e) {}
};

export const addNewClass = (newClassData: {
  className: string;
  teacherName: string;
  schoolName?: string;
  academicYear?: string;
  semester?: string;
  location?: string;
  adminPin?: string;
}): ClassItem => {
  const classes = getStoredClasses();
  const id = `class-${Date.now()}`;
  const newClass: ClassItem = {
    id,
    className: newClassData.className.trim(),
    schoolName: newClassData.schoolName?.trim() || 'THPT Thống Nhất B',
    teacherName: newClassData.teacherName?.trim() || 'Nguyễn Văn Thắng',
    academicYear: newClassData.academicYear?.trim() || '2024 - 2025',
    semester: newClassData.semester || '',
    location: newClassData.location?.trim() || 'Phước Sơn',
    adminPin: newClassData.adminPin?.trim() || '123456',
    studentCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updatedClasses = [...classes, newClass];
  saveStoredClasses(updatedClasses);

  // Khởi tạo ClassInfo riêng cho lớp mới
  const newClassInfo: ClassInfo = {
    schoolName: newClass.schoolName,
    className: newClass.className,
    teacherName: newClass.teacherName,
    academicYear: newClass.academicYear,
    semester: newClass.semester || '',
    location: newClass.location || 'Phước Sơn',
    weekNumber: 24,
    weekStartDate: '2025-02-24',
    weekEndDate: '2025-02-28',
    teacherComment: `Lớp ${newClass.className} - Chúc các em một năm học đạt nhiều thành tích tốt!`,
    adminPin: newClass.adminPin,
    officerAssignments: [],
    lockedWeeks: [],
    lockedMonths: [],
  };
  saveClassInfo(newClassInfo, id);
  saveRules(INITIAL_RULES, id);
  saveStudents([], id);
  saveAttendance([], id);
  saveLogs([], id);
  saveFeedbacks([], id);

  return newClass;
};

export const deleteClass = (classId: string): boolean => {
  const classes = getStoredClasses();
  if (classes.length <= 1) return false; // Giữ lại ít nhất 1 lớp
  const remaining = classes.filter((c) => c.id !== classId);
  saveStoredClasses(remaining);

  // Dọn dẹp storage của lớp bị xóa
  try {
    localStorage.removeItem(`${STORAGE_KEYS.CLASS_INFO}_${classId}`);
    localStorage.removeItem(`${STORAGE_KEYS.STUDENTS}_${classId}`);
    localStorage.removeItem(`${STORAGE_KEYS.RULES}_${classId}`);
    localStorage.removeItem(`${STORAGE_KEYS.ATTENDANCE}_${classId}`);
    localStorage.removeItem(`${STORAGE_KEYS.LOGS}_${classId}`);
    localStorage.removeItem(`${STORAGE_KEYS.FEEDBACKS}_${classId}`);
  } catch (e) {}

  if (getActiveClassId() === classId) {
    setActiveClassId(remaining[0].id);
  }
  return true;
};

// ==========================================
// 2. TRẠNG THÁI ĐĂNG NHẬP (AUTH STATUS)
// ==========================================

export const getIsAuthenticated = (): boolean => {
  try {
    const auth = localStorage.getItem(STORAGE_KEYS.IS_AUTH);
    return auth === 'true';
  } catch (e) {}
  return false;
};

export const setIsAuthenticated = (status: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.IS_AUTH, status ? 'true' : 'false');
  } catch (e) {}
};

// ==========================================
// 3. PHIÊN LÀM VIỆC (CURRENT SESSION)
// ==========================================

export const getStoredSession = (classId?: string): CurrentUserSession => {
  try {
    const classInfo = getStoredClassInfo(classId);
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (data) {
      const session = JSON.parse(data) as CurrentUserSession;
      if (session.role === 'admin') {
        return {
          ...session,
          displayName: `${classInfo.teacherName} (GVCN - Admin)`,
        };
      }
      return session;
    }
    return {
      role: 'admin',
      displayName: `${classInfo.teacherName} (GVCN - Admin)`,
      canEditPoints: true,
      canTakeAttendance: true,
      canInputLogs: true,
      isReadOnly: false,
    };
  } catch (e) {
    console.error('Failed to load session from localStorage', e);
    const classInfo = getStoredClassInfo(classId);
    return {
      role: 'admin',
      displayName: `${classInfo.teacherName} (GVCN - Admin)`,
      canEditPoints: true,
    };
  }
};

export const saveStoredSession = (session: CurrentUserSession): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session', e);
  }
};

export const getStoredThemeConfig = (): AppThemeConfig => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.THEME);
    if (data) {
      return { ...DEFAULT_THEME_CONFIG, ...JSON.parse(data) };
    }
    return DEFAULT_THEME_CONFIG;
  } catch (e) {
    console.error('Failed to load theme config from localStorage', e);
    return DEFAULT_THEME_CONFIG;
  }
};

export const saveStoredThemeConfig = (config: AppThemeConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(config));
    applyThemeToDocument(config);
  } catch (e) {
    console.error('Failed to save theme config', e);
  }
};

// ==========================================
// 4. DỮ LIỆU HỌC SINH (STUDENTS PER CLASS)
// ==========================================

export const getStoredStudents = (classId?: string): Student[] => {
  const targetClassId = classId || getActiveClassId();
  try {
    // 1. Kiểm tra key riêng của lớp
    const classSpecificData = localStorage.getItem(`${STORAGE_KEYS.STUDENTS}_${targetClassId}`);
    if (classSpecificData) {
      return JSON.parse(classSpecificData);
    }
    // 2. Nếu là class-10A1: kiểm tra key legacy
    if (targetClassId === 'class-10A1') {
      const legacyData = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (legacyData) return JSON.parse(legacyData);
      return INITIAL_STUDENTS;
    }
    // 3. Nếu là class-10A2
    if (targetClassId === 'class-10A2') {
      return INITIAL_STUDENTS_10A2;
    }
    return [];
  } catch (e) {
    console.error('Failed to load students from localStorage', e);
    return targetClassId === 'class-10A2' ? INITIAL_STUDENTS_10A2 : INITIAL_STUDENTS;
  }
};

export const saveStudents = (students: Student[], classId?: string): void => {
  const targetClassId = classId || getActiveClassId();
  try {
    const json = JSON.stringify(students);
    localStorage.setItem(`${STORAGE_KEYS.STUDENTS}_${targetClassId}`, json);
    if (targetClassId === 'class-10A1') {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, json);
    }
    // Cập nhật sĩ số vào danh sách lớp
    const classes = getStoredClasses();
    const updatedClasses = classes.map((c) =>
      c.id === targetClassId ? { ...c, studentCount: students.length } : c
    );
    saveStoredClasses(updatedClasses);
  } catch (e) {
    console.error('Failed to save students', e);
  }
};

// ==========================================
// 5. NỘI QUY (RULES PER CLASS)
// ==========================================

export const getStoredRules = (classId?: string): Rule[] => {
  const targetClassId = classId || getActiveClassId();
  try {
    const classSpecificData = localStorage.getItem(`${STORAGE_KEYS.RULES}_${targetClassId}`);
    if (classSpecificData) return JSON.parse(classSpecificData);
    if (targetClassId === 'class-10A1') {
      const legacyData = localStorage.getItem(STORAGE_KEYS.RULES);
      if (legacyData) return JSON.parse(legacyData);
    }
    return INITIAL_RULES;
  } catch (e) {
    console.error('Failed to load rules from localStorage', e);
    return INITIAL_RULES;
  }
};

export const saveRules = (rules: Rule[], classId?: string): void => {
  const targetClassId = classId || getActiveClassId();
  try {
    const json = JSON.stringify(rules);
    localStorage.setItem(`${STORAGE_KEYS.RULES}_${targetClassId}`, json);
    if (targetClassId === 'class-10A1') {
      localStorage.setItem(STORAGE_KEYS.RULES, json);
    }
  } catch (e) {
    console.error('Failed to save rules', e);
  }
};

// ==========================================
// 6. ĐIỂM DANH (ATTENDANCE PER CLASS)
// ==========================================

export const getStoredAttendance = (classId?: string): AttendanceRecord[] => {
  const targetClassId = classId || getActiveClassId();
  try {
    const classSpecificData = localStorage.getItem(`${STORAGE_KEYS.ATTENDANCE}_${targetClassId}`);
    if (classSpecificData) return JSON.parse(classSpecificData);
    if (targetClassId === 'class-10A1') {
      const legacyData = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (legacyData) return JSON.parse(legacyData);
      return INITIAL_ATTENDANCE;
    }
    return [];
  } catch (e) {
    console.error('Failed to load attendance from localStorage', e);
    return targetClassId === 'class-10A1' ? INITIAL_ATTENDANCE : [];
  }
};

export const saveAttendance = (records: AttendanceRecord[], classId?: string): void => {
  const targetClassId = classId || getActiveClassId();
  try {
    const json = JSON.stringify(records);
    localStorage.setItem(`${STORAGE_KEYS.ATTENDANCE}_${targetClassId}`, json);
    if (targetClassId === 'class-10A1') {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, json);
    }
  } catch (e) {
    console.error('Failed to save attendance', e);
  }
};

// ==========================================
// 7. NHẬT KÝ HÀNH VI (LOGS PER CLASS)
// ==========================================

export const getStoredLogs = (classId?: string): BehaviorLog[] => {
  const targetClassId = classId || getActiveClassId();
  try {
    const classSpecificData = localStorage.getItem(`${STORAGE_KEYS.LOGS}_${targetClassId}`);
    if (classSpecificData) return JSON.parse(classSpecificData);
    if (targetClassId === 'class-10A1') {
      const legacyData = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (legacyData) return JSON.parse(legacyData);
      return INITIAL_BEHAVIOR_LOGS;
    }
    return [];
  } catch (e) {
    console.error('Failed to load logs from localStorage', e);
    return targetClassId === 'class-10A1' ? INITIAL_BEHAVIOR_LOGS : [];
  }
};

export const saveLogs = (logs: BehaviorLog[], classId?: string): void => {
  const targetClassId = classId || getActiveClassId();
  try {
    const json = JSON.stringify(logs);
    localStorage.setItem(`${STORAGE_KEYS.LOGS}_${targetClassId}`, json);
    if (targetClassId === 'class-10A1') {
      localStorage.setItem(STORAGE_KEYS.LOGS, json);
    }
  } catch (e) {
    console.error('Failed to save logs', e);
  }
};

// ==========================================
// 8. THÔNG TIN LỚP HỌC (CLASS INFO PER CLASS)
// ==========================================

export const getStoredClassInfo = (classId?: string): ClassInfo => {
  const targetClassId = classId || getActiveClassId();
  try {
    const classSpecificData = localStorage.getItem(`${STORAGE_KEYS.CLASS_INFO}_${targetClassId}`);
    if (classSpecificData) {
      const parsed = JSON.parse(classSpecificData);
      return normalizeClassInfo(parsed, targetClassId);
    }

    if (targetClassId === 'class-10A1') {
      const legacyData = localStorage.getItem(STORAGE_KEYS.CLASS_INFO);
      if (legacyData) {
        const parsed = JSON.parse(legacyData);
        return normalizeClassInfo(parsed, 'class-10A1');
      }
      return INITIAL_CLASS_INFO;
    }

    if (targetClassId === 'class-10A2') {
      return INITIAL_CLASS_INFO_10A2;
    }

    // Lớp tùy biến do người dùng tạo
    const classes = getStoredClasses();
    const found = classes.find((c) => c.id === targetClassId);
    if (found) {
      return {
        schoolName: found.schoolName,
        className: found.className,
        teacherName: found.teacherName,
        academicYear: found.academicYear,
        semester: found.semester || '',
        location: found.location || 'Phước Sơn',
        weekNumber: 24,
        weekStartDate: '2025-02-24',
        weekEndDate: '2025-02-28',
        adminPin: found.adminPin || '123456',
        officerAssignments: [],
        lockedWeeks: [],
        lockedMonths: [],
      };
    }

    return INITIAL_CLASS_INFO;
  } catch (e) {
    console.error('Failed to load class info', e);
    return targetClassId === 'class-10A2' ? INITIAL_CLASS_INFO_10A2 : INITIAL_CLASS_INFO;
  }
};

const normalizeClassInfo = (parsed: any, targetClassId: string): ClassInfo => {
  const base = targetClassId === 'class-10A2' ? INITIAL_CLASS_INFO_10A2 : INITIAL_CLASS_INFO;
  if (
    !parsed.schoolName ||
    parsed.schoolName === 'TRƯỜNG THPT CHUYÊN NGUYỄN DU' ||
    parsed.schoolName === 'THCS Lê Quý Đôn'
  ) {
    parsed.schoolName = base.schoolName;
  }
  if (
    !parsed.teacherName ||
    parsed.teacherName === 'Thầy Hoàng Minh Tuấn' ||
    parsed.teacherName === 'Nguyễn Văn An'
  ) {
    parsed.teacherName = base.teacherName;
  }
  if (!parsed.location || parsed.location === 'Hà Nội') {
    parsed.location = base.location;
  }
  return { ...base, ...parsed };
};

export const saveClassInfo = (info: ClassInfo, classId?: string): void => {
  const targetClassId = classId || getActiveClassId();
  try {
    const json = JSON.stringify(info);
    localStorage.setItem(`${STORAGE_KEYS.CLASS_INFO}_${targetClassId}`, json);
    if (targetClassId === 'class-10A1') {
      localStorage.setItem(STORAGE_KEYS.CLASS_INFO, json);
    }
    // Tự động đồng bộ tên giáo viên mới vào session admin nếu đang là admin
    const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (sessionData) {
      const session = JSON.parse(sessionData) as CurrentUserSession;
      if (session.role === 'admin') {
        session.displayName = `${info.teacherName} (GVCN - Admin)`;
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      }
    }
    // Cập nhật thông tin trong danh sách lớp
    const classes = getStoredClasses();
    const updated = classes.map((c) =>
      c.id === targetClassId
        ? {
            ...c,
            className: info.className,
            teacherName: info.teacherName,
            schoolName: info.schoolName,
            academicYear: info.academicYear,
            location: info.location,
            adminPin: info.adminPin,
          }
        : c
    );
    saveStoredClasses(updated);
  } catch (e) {
    console.error('Failed to save class info', e);
  }
};

// ==========================================
// 9. PHẢN HỒI & Ý KIẾN (FEEDBACKS PER CLASS)
// ==========================================

export const getStoredFeedbacks = (classId?: string): StudentFeedback[] => {
  const targetClassId = classId || getActiveClassId();
  try {
    const classSpecificData = localStorage.getItem(`${STORAGE_KEYS.FEEDBACKS}_${targetClassId}`);
    if (classSpecificData) return JSON.parse(classSpecificData);
    if (targetClassId === 'class-10A1') {
      const legacyData = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      if (legacyData) return JSON.parse(legacyData);
      return INITIAL_FEEDBACKS;
    }
    return [];
  } catch (e) {
    console.error('Failed to load feedbacks from localStorage', e);
    return targetClassId === 'class-10A1' ? INITIAL_FEEDBACKS : [];
  }
};

export const saveFeedbacks = (feedbacks: StudentFeedback[], classId?: string): void => {
  const targetClassId = classId || getActiveClassId();
  try {
    const json = JSON.stringify(feedbacks);
    localStorage.setItem(`${STORAGE_KEYS.FEEDBACKS}_${targetClassId}`, json);
    if (targetClassId === 'class-10A1') {
      localStorage.setItem(STORAGE_KEYS.FEEDBACKS, json);
    }
  } catch (e) {
    console.error('Failed to save feedbacks', e);
  }
};

// ==========================================
// 10. KHÓA SỔ THI ĐUA (TUẦN & THÁNG)
// ==========================================

export const isWeekLocked = (weekNumber: number, classInfo: ClassInfo): boolean => {
  return !!(classInfo.lockedWeeks && classInfo.lockedWeeks.includes(weekNumber));
};

export const isMonthLocked = (month: number, classInfo: ClassInfo): boolean => {
  return !!(classInfo.lockedMonths && classInfo.lockedMonths.includes(month));
};

export const isPeriodLocked = (period: EvaluationPeriod, classInfo: ClassInfo): boolean => {
  if (period.type === 'week') {
    return isWeekLocked(period.weekNumber, classInfo);
  }
  if (period.type === 'month') {
    return isMonthLocked(period.month, classInfo);
  }
  return false;
};

export const toggleLockPeriod = (
  type: 'week' | 'month',
  periodNumber: number,
  classInfo: ClassInfo
): ClassInfo => {
  if (type === 'week') {
    const current = classInfo.lockedWeeks || [];
    const lockedWeeks = current.includes(periodNumber)
      ? current.filter((w) => w !== periodNumber)
      : [...current, periodNumber];
    return { ...classInfo, lockedWeeks };
  } else {
    const current = classInfo.lockedMonths || [];
    const lockedMonths = current.includes(periodNumber)
      ? current.filter((m) => m !== periodNumber)
      : [...current, periodNumber];
    return { ...classInfo, lockedMonths };
  }
};

export const lockMultipleWeeks = (weeks: number[], lock: boolean, classInfo: ClassInfo): ClassInfo => {
  const current = new Set(classInfo.lockedWeeks || []);
  weeks.forEach((w) => {
    if (lock) current.add(w);
    else current.delete(w);
  });
  return { ...classInfo, lockedWeeks: Array.from(current).sort((a, b) => a - b) };
};

export const lockMultipleMonths = (months: number[], lock: boolean, classInfo: ClassInfo): ClassInfo => {
  const current = new Set(classInfo.lockedMonths || []);
  months.forEach((m) => {
    if (lock) current.add(m);
    else current.delete(m);
  });
  return { ...classInfo, lockedMonths: Array.from(current).sort((a, b) => a - b) };
};

// ==========================================
// 11. KHÔI PHỤC DỮ LIỆU GỐC
// ==========================================

export const resetAllToMockData = (classId?: string): void => {
  const targetClassId = classId || getActiveClassId();
  if (targetClassId === 'class-10A2') {
    saveStudents(INITIAL_STUDENTS_10A2, 'class-10A2');
    saveClassInfo(INITIAL_CLASS_INFO_10A2, 'class-10A2');
    saveRules(INITIAL_RULES, 'class-10A2');
    saveAttendance([], 'class-10A2');
    saveLogs([], 'class-10A2');
    saveFeedbacks([], 'class-10A2');
  } else {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(INITIAL_RULES));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_BEHAVIOR_LOGS));
    localStorage.setItem(STORAGE_KEYS.CLASS_INFO, JSON.stringify(INITIAL_CLASS_INFO));
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(INITIAL_FEEDBACKS));
    saveStudents(INITIAL_STUDENTS, 'class-10A1');
    saveClassInfo(INITIAL_CLASS_INFO, 'class-10A1');
    saveRules(INITIAL_RULES, 'class-10A1');
    saveAttendance(INITIAL_ATTENDANCE, 'class-10A1');
    saveLogs(INITIAL_BEHAVIOR_LOGS, 'class-10A1');
    saveFeedbacks(INITIAL_FEEDBACKS, 'class-10A1');
  }

  saveStoredSession({
    role: 'admin',
    displayName: `${INITIAL_CLASS_INFO.teacherName} (GVCN - Admin)`,
    canEditPoints: true,
    canTakeAttendance: true,
    canInputLogs: true,
    isReadOnly: false,
    isLoggedIn: true,
  });
};

export const getRankCategory = (score: number): RankCategory => {
  if (score >= 100) return 'Xuất sắc';
  if (score >= 90) return 'Tốt';
  if (score >= 80) return 'Đạt';
  return 'Cần rèn luyện';
};

/**
 * Lọc điểm danh và nhật ký theo kỳ thi đua (Tuần, Tháng hoặc Cả Năm)
 */
export const filterRecordsByPeriod = (
  attendance: AttendanceRecord[],
  logs: BehaviorLog[],
  period?: EvaluationPeriod
): { filteredAttendance: AttendanceRecord[]; filteredLogs: BehaviorLog[] } => {
  if (!period || period.type === 'year') {
    return { filteredAttendance: attendance, filteredLogs: logs };
  }

  if (period.type === 'week') {
    const filteredAttendance = attendance.filter((a) => a.weekNumber === period.weekNumber);
    const filteredLogs = logs.filter((l) => l.weekNumber === period.weekNumber);
    return { filteredAttendance, filteredLogs };
  }

  if (period.type === 'month') {
    const filteredAttendance = attendance.filter((a) => {
      if (!a.date) return false;
      const m = parseInt(a.date.split('-')[1], 10);
      return m === period.month;
    });
    const filteredLogs = logs.filter((l) => {
      if (!l.date) return false;
      const m = parseInt(l.date.split('-')[1], 10);
      return m === period.month;
    });
    return { filteredAttendance, filteredLogs };
  }

  return { filteredAttendance: attendance, filteredLogs: logs };
};

/**
 * Tính toán bảng điểm học sinh:
 * Điểm gốc: 100
 * + Tổng điểm cộng từ BehaviorLog
 * - Tổng điểm trừ từ BehaviorLog
 * - Điểm trừ từ Điểm danh (Không phép: -5, Đi trễ: -2)
 */
export const calculateStudentScores = (
  students: Student[],
  attendance: AttendanceRecord[],
  logs: BehaviorLog[],
  period?: EvaluationPeriod
): StudentScoreSummary[] => {
  const { filteredAttendance, filteredLogs } = filterRecordsByPeriod(attendance, logs, period);

  const summaries: StudentScoreSummary[] = students.map((student) => {
    // 1. Thống kê điểm danh
    const studentAttendance = filteredAttendance.filter((a) => a.studentId === student.id);
    const attendanceStats = {
      present: studentAttendance.filter((a) => a.status === 'present').length,
      late: studentAttendance.filter((a) => a.status === 'late').length,
      excused: studentAttendance.filter((a) => a.status === 'excused').length,
      unexcused: studentAttendance.filter((a) => a.status === 'unexcused').length,
    };

    // Điểm trừ điểm danh
    const attendancePenalty =
      attendanceStats.unexcused * ATTENDANCE_PENALTY_CONFIG.unexcused +
      attendanceStats.late * ATTENDANCE_PENALTY_CONFIG.late;

    // 2. Thống kê từ nhật ký vi phạm/khen thưởng
    const studentLogs = filteredLogs.filter((l) => l.studentId === student.id);
    const behaviorBonus = studentLogs
      .filter((l) => l.type === 'bonus')
      .reduce((sum, l) => sum + l.points, 0);
    const behaviorPenalty = studentLogs
      .filter((l) => l.type === 'penalty')
      .reduce((sum, l) => sum + l.points, 0);

    const totalBonus = behaviorBonus;
    const totalPenalty = behaviorPenalty + attendancePenalty;
    const totalScore = 100 + totalBonus - totalPenalty;

    return {
      student,
      baseScore: 100,
      totalBonus,
      totalPenalty,
      totalScore,
      rank: 1, // tính sau
      category: getRankCategory(totalScore),
      attendanceStats,
    };
  });

  // Sắp xếp giảm dần theo totalScore
  summaries.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // Ưu tiên người có ít điểm trừ hơn
    if (a.totalPenalty !== b.totalPenalty) {
      return a.totalPenalty - b.totalPenalty;
    }
    return a.student.name.localeCompare(b.student.name, 'vi');
  });

  // Gán thứ hạng (hỗ trợ đồng hạng)
  let currentRank = 1;
  for (let i = 0; i < summaries.length; i++) {
    if (i > 0 && summaries[i].totalScore === summaries[i - 1].totalScore) {
      summaries[i].rank = summaries[i - 1].rank;
    } else {
      summaries[i].rank = currentRank;
    }
    currentRank++;
  }

  return summaries;
};

export const calculateTeamScores = (
  studentSummaries: StudentScoreSummary[]
): TeamScoreSummary[] => {
  const teams = [1, 2, 3, 4];
  const teamSummaries: TeamScoreSummary[] = teams.map((teamNum) => {
    const members = studentSummaries.filter((s) => s.student.team === teamNum);
    const memberCount = members.length;
    const totalScoreSum = members.reduce((sum, m) => sum + m.totalScore, 0);
    const totalBonus = members.reduce((sum, m) => sum + m.totalBonus, 0);
    const totalPenalty = members.reduce((sum, m) => sum + m.totalPenalty, 0);
    const averageScore = memberCount > 0 ? parseFloat((totalScoreSum / memberCount).toFixed(2)) : 0;

    return {
      team: teamNum,
      memberCount,
      averageScore,
      totalBonus,
      totalPenalty,
      rank: 1,
    };
  });

  // Xếp hạng tổ theo điểm trung bình giảm dần
  teamSummaries.sort((a, b) => b.averageScore - a.averageScore);
  teamSummaries.forEach((t, index) => {
    t.rank = index + 1;
  });

  return teamSummaries;
};

// ==========================================
// 8. QUẢN LÝ CẤU HÌNH GIẤY MỜI HỌP PHỤ HUYNH
// ==========================================

export const getDefaultMeetingInvitationConfig = (
  classInfo: ClassInfo
): ParentMeetingInvitationConfig => {
  const nextSunday = new Date();
  const day = nextSunday.getDay();
  const diff = (7 - day) % 7 || 7; // Ngày chủ nhật tiếp theo
  nextSunday.setDate(nextSunday.getDate() + diff);

  const formattedDate = `${nextSunday.getFullYear()}-${String(nextSunday.getMonth() + 1).padStart(2, '0')}-${String(nextSunday.getDate()).padStart(2, '0')}`;

  return {
    occasion: 'cuoi_ky_1',
    documentNumber: `03/GM-${classInfo.className || '10A1'}`,
    meetingDate: formattedDate,
    meetingTime: '08:00',
    meetingDayOfWeek: 'Chủ nhật',
    locationDetail: `Phòng học Lớp ${classInfo.className} (Tầng 2, Dãy B) — ${classInfo.schoolName}`,
    schoolDepartmentName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
    teacherPhone: classInfo.teacherPhone || '0912.345.678',
    meetingContentSummary:
      'Báo cáo sơ kết tình hình rèn luyện nề nếp thi đua, đạo đức và học tập của học sinh; đồng thời thống nhất phương hướng và các giải pháp giáo dục trọng tâm thời gian tới.',
    agendaItems: [
      'Báo cáo tóm tắt kế hoạch hoạt động chung của nhà trường và nề nếp thi đua của tập thể lớp.',
      'Đánh giá chi tiết kết quả rèn luyện hạnh kiểm, đạo đức, chuyên cần và điểm thi đua của từng học sinh.',
      'Thống nhất các giải pháp phối hợp chặt chẽ giữa Gia đình và Giáo viên chủ nhiệm.',
      'Lắng nghe ý kiến thảo luận, đóng góp của Ban đại diện và quý bậc cha mẹ học sinh.',
    ],
    notesForParents:
      'Vì sự tiến bộ của học sinh, kính mong quý Phụ huynh sắp xếp thời gian tham dự đông đủ, đúng giờ. Trường hợp bận việc đột xuất không thể đến dự, kính đề nghị quý Phụ huynh liên hệ trước với GVCN qua số điện thoại trên để được hỗ trợ.',
    includeStudentScoreSummary: true,
    layoutMode: 'two_per_page',
    signatureType: 'electronic_stylized',
    signerTitle: 'GIÁO VIÊN CHỦ NHIỆM',
    signerName: classInfo.teacherName || 'Nguyễn Văn Thắng',
    issuePlace: classInfo.location || 'Phước Sơn',
    issueDate: getTodayLocalDateString(),
    recipientMode: 'all_students',
    generalRecipientTitle: `Toàn thể Quý bậc Cha mẹ Học sinh Lớp ${classInfo.className || '10A1'}`,
    classGeneralNote:
      'Kính đề nghị Quý Phụ huynh có mặt đúng giờ quy định, gửi xe theo hướng dẫn của đội trật tự nhà trường và mang theo sổ liên lạc (nếu có). Buổi họp sẽ có phần biểu quyết các nội dung quan trọng của năm học.',
    includeClassStatisticsInGeneral: true,
  };
};

export const getStoredMeetingInvitationConfig = (
  classId: string,
  classInfo: ClassInfo
): ParentMeetingInvitationConfig => {
  try {
    const data = localStorage.getItem(`${STORAGE_KEYS.PARENT_MEETING}_${classId}`);
    if (data) {
      const parsed = JSON.parse(data) as Partial<ParentMeetingInvitationConfig>;
      const defaults = getDefaultMeetingInvitationConfig(classInfo);
      return {
        ...defaults,
        ...parsed,
        signerName: parsed.signerName || classInfo.teacherName,
        issuePlace: parsed.issuePlace || classInfo.location || 'Phước Sơn',
      };
    }
  } catch (e) {
    console.error('Failed to load parent meeting invitation config', e);
  }
  return getDefaultMeetingInvitationConfig(classInfo);
};

export const saveStoredMeetingInvitationConfig = (
  classId: string,
  config: ParentMeetingInvitationConfig
): void => {
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.PARENT_MEETING}_${classId}`,
      JSON.stringify(config)
    );
  } catch (e) {
    console.error('Failed to save parent meeting invitation config', e);
  }
};
