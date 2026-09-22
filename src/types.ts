export type AttendanceStatus = 'present' | 'late' | 'excused' | 'unexcused';

export interface Student {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  team: number; // Tổ 1, 2, 3, 4
  phone?: string;
  parentPhone?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weekNumber?: number;
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  timestamp: string;
  recordedBy?: string;
}

export type RuleCategory = 'tac_phong' | 'hoc_tap' | 'ky_luat';
export type RuleType = 'bonus' | 'penalty';

export interface Rule {
  id: string;
  name: string;
  category: RuleCategory;
  type: RuleType;
  points: number; // positive number (e.g. 2, 5, 10)
  description?: string;
}

export interface BehaviorLog {
  id: string;
  studentId: string;
  ruleId?: string;
  actionName: string;
  category: RuleCategory | 'diem_danh';
  type: RuleType;
  points: number; // positive number (e.g. 5)
  date: string; // YYYY-MM-DD
  weekNumber?: number;
  timestamp: string;
  note?: string;
  source?: 'rule' | 'attendance' | 'manual';
  recordedBy?: string; // Tên người ghi nhận (GVCN, Lớp phó, Tổ trưởng...)
}

export type RankCategory = 'Xuất sắc' | 'Tốt' | 'Đạt' | 'Cần rèn luyện';

export interface StudentScoreSummary {
  student: Student;
  baseScore: number; // 100
  totalBonus: number;
  totalPenalty: number;
  totalScore: number;
  rank: number;
  category: RankCategory;
  attendanceStats: {
    present: number;
    late: number;
    excused: number;
    unexcused: number;
  };
}

export interface TeamScoreSummary {
  team: number;
  memberCount: number;
  averageScore: number;
  totalBonus: number;
  totalPenalty: number;
  rank: number;
}

export type OfficerRoleType =
  | 'lop_truong'
  | 'lop_pho_hoc_tap'
  | 'lop_pho_lao_dong'
  | 'to_truong_1'
  | 'to_truong_2'
  | 'to_truong_3'
  | 'to_truong_4';

export interface OfficerAssignment {
  roleType: OfficerRoleType;
  title: string; // "Lớp trưởng", "Lớp phó học tập", "Tổ trưởng Tổ 1"...
  studentId?: string;
  studentName?: string;
  assignedCategories: RuleCategory[]; // Phân loại nội quy được phép nhập
  assignedTeams: number[]; // Tổ được phép chấm ([1,2,3,4] hoặc chỉ 1 tổ)
  canEditPoints: boolean; // Có được quyền tùy chỉnh số điểm không
  canTakeAttendance: boolean; // Có quyền điểm danh không
}

export interface ClassItem {
  id: string; // e.g. 'class-10A1', 'class-10A2'
  className: string; // '10A1'
  schoolName: string; // 'THPT Thống Nhất B'
  teacherName: string; // 'Nguyễn Văn Thắng'
  academicYear: string; // '2024 - 2025'
  semester?: string;
  location?: string; // 'Phước Sơn'
  adminPin?: string; // e.g. '123456'
  studentCount?: number;
  createdAt?: string;
}

export type UserRole = 'admin' | 'officer' | 'student';

export interface CurrentUserSession {
  role: UserRole;
  studentId?: string;
  officerRoleType?: OfficerRoleType;
  displayName: string;
  classId?: string;
  assignedCategories?: RuleCategory[];
  assignedTeams?: number[];
  canEditPoints?: boolean;
  canTakeAttendance?: boolean;
  canInputLogs?: boolean;
  isReadOnly?: boolean;
  isLoggedIn?: boolean;
}

export type FeedbackType =
  | 'khieu_nai_vi_pham'
  | 'khieu_nai_diem_danh'
  | 'de_xuat_khen_thuong'
  | 'dong_gop_y_kien'
  | 'khac';

export type FeedbackStatus = 'pending' | 'approved' | 'rejected';

export interface StudentFeedback {
  id: string;
  studentId: string;
  studentName: string;
  team: number;
  type: FeedbackType;
  title: string;
  content: string;
  relatedLogId?: string;
  relatedLogTitle?: string;
  weekNumber: number;
  createdAt: string; // YYYY-MM-DD HH:mm
  status: FeedbackStatus;
  teacherReply?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adjustedPoints?: number;
}

export type EvaluationPeriodType = 'week' | 'month' | 'year';

export interface EvaluationPeriod {
  type: EvaluationPeriodType;
  weekNumber: number; // 1 - 35
  month: number; // 1 - 12 (thường 9, 10, 11, 12, 1, 2, 3, 4, 5)
  academicYear: string;
}

export interface ClassInfo {
  schoolName: string;
  className: string;
  teacherName: string;
  teacherPhone?: string;
  academicYear: string;
  semester: string;
  location: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  teacherComment?: string;
  adminPin?: string; // Mật khẩu PIN của GVCN (mặc định 123456)
  officerAssignments?: OfficerAssignment[]; // Danh sách phân công ban cán sự
  lockedWeeks?: number[]; // Danh sách các tuần đã khóa sổ tổng kết
  lockedMonths?: number[]; // Danh sách các tháng đã khóa sổ tổng kết
}

export type ThemeColorId = 'navy' | 'emerald' | 'indigo' | 'crimson' | 'teal' | 'slate' | 'violet';

export type DisplayDensity = 'comfortable' | 'compact';

export type CardStyle = 'rounded' | 'flat' | 'elevated';

export type FontScale = 'normal' | 'large';

export type ThemeMode = 'light' | 'dark';

export interface AppThemeConfig {
  colorId: ThemeColorId;
  density: DisplayDensity;
  cardStyle: CardStyle;
  fontScale: FontScale;
  mode: ThemeMode;
}

export type MeetingOccasion =
  | 'dau_nam'
  | 'giua_ky_1'
  | 'cuoi_ky_1'
  | 'giua_ky_2'
  | 'tong_ket_nam'
  | 'dot_xuat';

export type SignatureType =
  | 'electronic_stylized' // Chữ ký thư pháp điện tử trang trọng
  | 'canvas_drawn' // Vẽ tay bằng cảm ứng / chuột
  | 'uploaded_image' // Ảnh chữ ký tải lên
  | 'blank_for_pen'; // Khoảng trống ký bút mực sau khi in

export type InvitationRecipientMode =
  | 'class_general' // Giấy mời chung cho toàn thể phụ huynh cả lớp
  | 'all_students' // Giấy mời riêng từng em (toàn bộ lớp)
  | 'single_student'; // Giấy mời riêng cho 1 học sinh cụ thể

export interface ParentMeetingInvitationConfig {
  occasion: MeetingOccasion;
  customTitle?: string;
  documentNumber: string; // ví dụ: "03/GM-10A1"
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // ví dụ: "08:00"
  meetingDayOfWeek: string; // ví dụ: "Chủ nhật"
  locationDetail: string; // ví dụ: "Phòng học Lớp 10A1 (Tầng 2, Dãy B)"
  schoolDepartmentName: string; // ví dụ: "SỞ GIÁO DỤC VÀ ĐÀO TẠO"
  teacherPhone: string;
  meetingContentSummary: string;
  agendaItems: string[];
  notesForParents: string;
  includeStudentScoreSummary: boolean;
  layoutMode: 'single_full' | 'two_per_page' | 'a5_landscape'; // 1 giấy mời / 1 trang A4, 2 giấy mời / 1 trang A4, hoặc 1 giấy mời / 1 trang A5 in ngang
  signatureType: SignatureType;
  signatureDataUrl?: string; // base64 ảnh chữ ký vẽ hoặc upload
  signerTitle: string; // "GIÁO VIÊN CHỦ NHIỆM"
  signerName: string;
  issuePlace: string; // "Phước Sơn"
  issueDate?: string; // YYYY-MM-DD
  recipientMode?: InvitationRecipientMode;
  generalRecipientTitle?: string; // Tiêu đề gửi chung, ví dụ: "Toàn thể Quý bậc Cha mẹ Học sinh Lớp 10A1"
  classGeneralNote?: string; // Lưu ý chung dành cho toàn thể phụ huynh lớp
  includeClassStatisticsInGeneral?: boolean; // Hiển thị thông số tổng quan lớp (sĩ số, nam, nữ, ban cán sự)
}

export const OCCASION_PRESETS: Record<
  MeetingOccasion,
  { label: string; summary: string; agenda: string[] }
> = {
  dau_nam: {
    label: 'Họp Phụ Huynh Đầu Năm Học',
    summary:
      'Triển khai phương hướng nhiệm vụ năm học mới, thông qua quy chế rèn luyện nề nếp thi đua của lớp và kiện toàn Ban đại diện Cha mẹ học sinh.',
    agenda: [
      'Báo cáo phương hướng, nhiệm vụ trọng tâm của nhà trường và lớp chủ nhiệm trong năm học mới.',
      'Thảo luận và thống nhất nội quy học sinh, thang điểm rèn luyện thi đua nề nếp và đạo đức.',
      'Bầu Ban đại diện Cha mẹ học sinh của lớp cho năm học mới.',
      'Ý kiến phát biểu của quý phụ huynh và thống nhất các khoản vận động tài trợ (nếu có) theo đúng quy định.',
    ],
  },
  giua_ky_1: {
    label: 'Họp Phụ Huynh Định Kỳ Giữa Kỳ I',
    summary:
      'Sơ kết tình hình học tập và rèn luyện nề nếp thi đua nửa đầu Học kỳ I; chấn chỉnh các biểu hiện chưa chuẩn mực và đề ra biện pháp bồi dưỡng học sinh.',
    agenda: [
      'Báo cáo kết quả rèn luyện nề nếp thi đua, chuyên cần và học lực nửa đầu Học kỳ I.',
      'Tuyên dương các học sinh gương mẫu và trao đổi riêng về các em còn vi phạm nội quy nhiều lần.',
      'Triển khai kế hoạch ôn tập và kiểm tra định kỳ cuối Học kỳ I.',
      'Phụ huynh trao đổi, thảo luận với GVCN về giải pháp quản lý con em tại gia đình.',
    ],
  },
  cuoi_ky_1: {
    label: 'Họp Phụ Huynh Sơ Kết Học Kỳ I',
    summary:
      'Báo cáo tổng kết toàn diện kết quả học tập và rèn luyện của học sinh trong Học kỳ I; triển khai kế hoạch giáo dục trọng tâm thời gian tới.',
    agenda: [
      'Báo cáo tổng kết hoạt động dạy và học, kết quả xếp loại rèn luyện thi đua Học kỳ I.',
      'Công bố chi tiết bảng điểm rèn luyện, xếp hạng của từng học sinh và khen thưởng các tổ xuất sắc.',
      'Phương hướng, nhiệm vụ và các giải pháp giáo dục nâng cao chất lượng giai đoạn tiếp theo.',
      'Thảo luận, trao đổi giữa GVCN và các bậc phụ huynh.',
    ],
  },
  giua_ky_2: {
    label: 'Họp Phụ Huynh Định Kỳ Giữa Kỳ II',
    summary:
      'Đánh giá chặng đường giữa Học kỳ II, đôn đốc tinh thần học tập, chuẩn bị cho kỳ kiểm tra cuối năm và định hướng rèn luyện hè.',
    agenda: [
      'Sơ kết nề nếp, kết quả thi đua và học tập đợt thi đua giữa Học kỳ II.',
      'Nhắc nhở học sinh tập trung ôn luyện, hạn chế sa đà vào thiết bị điện tử ngoài giờ học.',
      'Kế hoạch ôn thi kiểm tra cuối năm học và đánh giá toàn diện năm học.',
      'Ý kiến đóng góp và thống nhất biện pháp hỗ trợ học sinh tại nhà.',
    ],
  },
  tong_ket_nam: {
    label: 'Họp Phụ Huynh Tổng Kết Cuối Năm Học',
    summary:
      'Tổng kết toàn diện kết quả học tập, rèn luyện hạnh kiểm cả năm học; khen thưởng học sinh xuất sắc và bàn giao học sinh về sinh hoạt hè tại địa phương.',
    agenda: [
      'Báo cáo tổng kết thi đua, kết quả xếp loại học tập và rèn luyện cả năm học của lớp.',
      'Tuyên dương và khen thưởng học sinh đạt danh hiệu cao trong học tập và nề nếp.',
      'Bàn giao học sinh về sinh hoạt hè tại địa phương và căn dặn an toàn trong dịp hè.',
      'Ban đại diện CMHS báo cáo thu chi hoạt động và lắng nghe ý kiến bế mạc năm học.',
    ],
  },
  dot_xuat: {
    label: 'Họp Phụ Huynh Chuyên Đề / Đột Xuất',
    summary:
      'Trao đổi trực tiếp các vấn đề phát sinh cấp bách về nề nếp, đạo đức, an toàn học đường hoặc định hướng quan trọng của tập thể lớp.',
    agenda: [
      'Thông báo lý do triệu tập phiên họp chuyên đề của lớp.',
      'Đánh giá thực trạng nề nếp, kỷ luật hoặc các vấn đề cần chấn chỉnh cấp bách.',
      'Thảo luận và thống nhất cam kết phối hợp giữa cha mẹ học sinh và nhà trường.',
      'Kết luận và ký biên bản phiên họp.',
    ],
  },
};

