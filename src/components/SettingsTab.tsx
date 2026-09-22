import React, { useState } from 'react';
import {
  School,
  UserCheck,
  Calendar,
  MapPin,
  Phone,
  Save,
  RotateCcw,
  Download,
  Upload,
  UserPlus,
  Users,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  KeyRound,
  Shield,
  ShieldAlert,
  Lock,
  Plus,
  ArrowRightLeft,
  Palette,
  Sparkles,
  Sun,
  Moon,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Type,
  Layers,
  Check,
  Shuffle,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Building2,
  X,
  Mail,
  Printer,
  FileText,
} from 'lucide-react';
import {
  ClassInfo,
  Student,
  OfficerAssignment,
  OfficerRoleType,
  CurrentUserSession,
  RuleCategory,
  AppThemeConfig,
  ThemeColorId,
  DisplayDensity,
  CardStyle,
  FontScale,
  ThemeMode,
  ClassItem,
} from '../types';
import { DEFAULT_OFFICER_ASSIGNMENTS } from '../data/mockData';
import { THEME_COLOR_PALETTES, DEFAULT_THEME_CONFIG, getThemePalette } from '../utils/theme';
import { ExcelStudentImportModal } from './ExcelStudentImportModal';
import { downloadStandardStudentExcelTemplate, exportCurrentStudentsToExcel } from '../utils/excelStudentParser';
import { TeamDivisionModal } from './TeamDivisionModal';

interface SettingsTabProps {
  classInfo: ClassInfo;
  onUpdateClassInfo: (info: ClassInfo) => void;
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onResetAllData: () => void;
  currentSession: CurrentUserSession;
  onOpenRoleSwitcher: () => void;
  themeConfig: AppThemeConfig;
  onUpdateThemeConfig: (config: AppThemeConfig) => void;
  onOpenThemeModal: () => void;
  onOpenPeriodLockModal?: () => void;
  classes?: ClassItem[];
  activeClassId?: string;
  onSelectClass?: (classId: string) => void;
  onAddNewClass?: (newClass: {
    className: string;
    teacherName: string;
    schoolName?: string;
    academicYear?: string;
    location?: string;
    adminPin?: string;
  }) => ClassItem;
  onDeleteClass?: (classId: string) => void;
  onOpenParentMeetingInvitation?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  classInfo,
  onUpdateClassInfo,
  students,
  onUpdateStudents,
  onResetAllData,
  currentSession,
  onOpenRoleSwitcher,
  themeConfig,
  onUpdateThemeConfig,
  onOpenThemeModal,
  onOpenPeriodLockModal,
  classes = [],
  activeClassId,
  onSelectClass,
  onAddNewClass,
  onDeleteClass,
  onOpenParentMeetingInvitation,
}) => {
  const isAdmin = currentSession.role === 'admin';
  const isStudent = currentSession.role === 'student' || !!currentSession.isReadOnly;

  // Form cài đặt thông tin trường lớp
  const [formData, setFormData] = useState<ClassInfo>(classInfo);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showAdminPin, setShowAdminPin] = useState(false);

  // Quản lý tạo lớp mới Modal
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState(classInfo.teacherName || '');
  const [newSchoolName, setNewSchoolName] = useState(classInfo.schoolName || '');
  const [newAcademicYear, setNewAcademicYear] = useState(classInfo.academicYear || '2024 - 2025');
  const [newLocation, setNewLocation] = useState(classInfo.location || 'Phước Sơn');
  const [newAdminPin, setNewAdminPin] = useState('123456');

  // Quản lý học sinh modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [stuName, setStuName] = useState('');
  const [stuGender, setStuGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [stuDob, setStuDob] = useState('2009-01-01');
  const [stuTeam, setStuTeam] = useState<number>(1);
  const [stuPhone, setStuPhone] = useState('');
  const [stuParentPhone, setStuParentPhone] = useState('');
  const [stuNotes, setStuNotes] = useState('');

  // Modal dán danh sách học sinh hàng loạt
  const [isBulkStudentOpen, setIsBulkStudentOpen] = useState(false);
  const [bulkStudentText, setBulkStudentText] = useState('');
  const [bulkTeamAssign, setBulkTeamAssign] = useState<number>(1);

  // Modal nhập danh sách học sinh từ file Excel chuẩn
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  // Modal phân chia tổ học sinh (Tự động thông minh & Thủ công kéo thả)
  const [isTeamDivisionOpen, setIsTeamDivisionOpen] = useState(false);

  // Danh sách ID học sinh đang được chọn (Checkbox thao tác nhanh)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modal chỉnh sửa phân công Ban Cán Sự Lớp
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<OfficerAssignment | null>(null);
  const [officerStudentId, setOfficerStudentId] = useState<string>('');
  const [officerCategories, setOfficerCategories] = useState<RuleCategory[]>([
    'hoc_tap',
    'tac_phong',
    'ky_luat',
  ]);
  const [officerTeams, setOfficerTeams] = useState<number[]>([1, 2, 3, 4]);
  const [officerCanEditPoints, setOfficerCanEditPoints] = useState<boolean>(false);
  const [officerCanTakeAttendance, setOfficerCanTakeAttendance] = useState<boolean>(true);

  // Cập nhật khi classInfo từ ngoài đổi
  React.useEffect(() => {
    setFormData(classInfo);
  }, [classInfo]);

  // Lưu thông tin trường lớp, gvcn, địa danh & mã PIN
  const handleSaveClassInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClassInfo(formData);
    setSaveSuccessMsg(`Đã lưu thành công! Giáo viên chủ nhiệm: ${formData.teacherName}`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Mở modal thêm học sinh
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStuName('');
    setStuGender('Nam');
    setStuDob('2009-01-01');
    setStuTeam(1);
    setStuPhone('');
    setStuParentPhone('');
    setStuNotes('');
    setIsStudentModalOpen(true);
  };

  // Mở modal sửa học sinh
  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStuName(student.name);
    setStuGender(student.gender);
    setStuDob(student.dob);
    setStuTeam(student.team);
    setStuPhone(student.phone || '');
    setStuParentPhone(student.parentPhone || '');
    setStuNotes(student.notes || '');
    setIsStudentModalOpen(true);
  };

  // Lưu học sinh (Thêm mới hoặc sửa)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuName.trim()) return;

    if (editingStudent) {
      const updated = students.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              name: stuName.trim(),
              gender: stuGender,
              dob: stuDob,
              team: Number(stuTeam),
              phone: stuPhone.trim() || undefined,
              parentPhone: stuParentPhone.trim() || undefined,
              notes: stuNotes.trim() || undefined,
            }
          : s
      );
      onUpdateStudents(updated);
    } else {
      const newStu: Student = {
        id: `hs-${Date.now()}`,
        name: stuName.trim(),
        gender: stuGender,
        dob: stuDob,
        team: Number(stuTeam),
        phone: stuPhone.trim() || undefined,
        parentPhone: stuParentPhone.trim() || undefined,
        notes: stuNotes.trim() || undefined,
      };
      onUpdateStudents([...students, newStu]);
    }
    setIsStudentModalOpen(false);
  };

  // Xóa học sinh
  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`Thầy/Cô có chắc muốn xóa học sinh "${name}" khỏi danh sách lớp?`)) {
      onUpdateStudents(students.filter((s) => s.id !== id));
    }
  };

  // Thêm danh sách hàng loạt (dán văn bản)
  const handleImportBulkStudents = () => {
    if (!bulkStudentText.trim()) return;
    const lines = bulkStudentText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newStudents: Student[] = lines.map((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[0];
      const gender: 'Nam' | 'Nữ' = parts[1] === 'Nữ' || parts[1] === 'Nu' ? 'Nữ' : 'Nam';
      const phone = parts[2] || undefined;
      const team = bulkTeamAssign === 0 ? (idx % 4) + 1 : bulkTeamAssign;

      return {
        id: `hs-bulk-${Date.now()}-${idx}`,
        name,
        gender,
        dob: '2009-01-01',
        team,
        parentPhone: phone,
      };
    });

    onUpdateStudents([...students, ...newStudents]);
    setIsBulkStudentOpen(false);
    setBulkStudentText('');
    setSaveSuccessMsg(`Đã thêm nhanh ${newStudents.length} học sinh vào lớp!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Nhập học sinh từ file Excel chuẩn (.xlsx, .xls, .csv)
  const handleImportExcelStudents = (newStudents: Student[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      onUpdateStudents(newStudents);
      setSaveSuccessMsg(`Đã thay thế toàn bộ danh sách lớp bằng ${newStudents.length} học sinh từ file Excel!`);
    } else {
      onUpdateStudents([...students, ...newStudents]);
      setSaveSuccessMsg(`Đã thêm thành công ${newStudents.length} học sinh từ file Excel vào lớp!`);
    }
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Lưu phân chia tổ từ TeamDivisionModal (tự động hoặc thủ công)
  const handleSaveDividedTeams = (updatedStudents: Student[]) => {
    onUpdateStudents(updatedStudents);
    setSaveSuccessMsg(`Đã lưu và áp dụng phân chia tổ thành công cho ${updatedStudents.length} học sinh!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Đổi tổ nhanh bằng tay trực tiếp trên bảng cho 1 học sinh
  const handleInlineChangeTeam = (studentId: string, newTeam: number) => {
    const updated = students.map((s) => (s.id === studentId ? { ...s, team: newTeam } : s));
    onUpdateStudents(updated);
    const stu = students.find((s) => s.id === studentId);
    setSaveSuccessMsg(`Đã chuyển em ${stu?.name || 'học sinh'} sang Tổ ${newTeam}!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  // Gán tổ bằng tay hàng loạt cho các học sinh đang được chọn (Checkbox)
  const handleBulkAssignTeam = (targetTeam: number) => {
    if (selectedStudentIds.length === 0) return;
    const updated = students.map((s) =>
      selectedStudentIds.includes(s.id) ? { ...s, team: targetTeam } : s
    );
    onUpdateStudents(updated);
    setSaveSuccessMsg(`Đã chuyển ${selectedStudentIds.length} học sinh sang Tổ ${targetTeam}!`);
    setSelectedStudentIds([]);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Chọn / Bỏ chọn tất cả học sinh
  const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  // Chọn / Bỏ chọn một học sinh
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Mở modal chỉnh sửa phân công ban cán sự
  const handleOpenEditOfficer = (officer: OfficerAssignment) => {
    setEditingOfficer(officer);
    setOfficerStudentId(officer.studentId || '');
    setOfficerCategories(officer.assignedCategories);
    setOfficerTeams(officer.assignedTeams);
    setOfficerCanEditPoints(officer.canEditPoints || false);
    setOfficerCanTakeAttendance(officer.canTakeAttendance !== false);
    setIsOfficerModalOpen(true);
  };

  // Lưu phân công cán sự
  const handleSaveOfficerAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;

    const assignedStudent = students.find((s) => s.id === officerStudentId);
    const studentName = assignedStudent ? assignedStudent.name : '';

    const currentOfficers = formData.officerAssignments || DEFAULT_OFFICER_ASSIGNMENTS;
    const updatedOfficers = currentOfficers.map((o) =>
      o.roleType === editingOfficer.roleType
        ? {
            ...o,
            studentId: officerStudentId || undefined,
            studentName,
            assignedCategories: officerCategories,
            assignedTeams: officerTeams,
            canEditPoints: officerCanEditPoints,
            canTakeAttendance: officerCanTakeAttendance,
          }
        : o
    );

    const updatedInfo: ClassInfo = {
      ...formData,
      officerAssignments: updatedOfficers,
    };

    setFormData(updatedInfo);
    onUpdateClassInfo(updatedInfo);
    setIsOfficerModalOpen(false);
    setSaveSuccessMsg(`Đã cập nhật phân công nhiệm vụ cho ${editingOfficer.title}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Khôi phục phân công ban cán sự mặc định
  const handleResetOfficers = () => {
    if (confirm('Thầy/Cô có muốn khôi phục phân công Ban Cán Sự Lớp về mặc định?')) {
      const updatedInfo = {
        ...formData,
        officerAssignments: DEFAULT_OFFICER_ASSIGNMENTS,
      };
      setFormData(updatedInfo);
      onUpdateClassInfo(updatedInfo);
      setSaveSuccessMsg('Đã khôi phục phân công Ban Cán Sự mặc định!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  // Sao lưu toàn bộ dữ liệu ra file JSON
  const handleExportBackup = () => {
    const backupData = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      classInfo,
      students,
      attendance: localStorage.getItem('smartclass_attendance_v1')
        ? JSON.parse(localStorage.getItem('smartclass_attendance_v1')!)
        : [],
      rules: localStorage.getItem('smartclass_rules_v1')
        ? JSON.parse(localStorage.getItem('smartclass_rules_v1')!)
        : [],
      logs: localStorage.getItem('smartclass_logs_v1')
        ? JSON.parse(localStorage.getItem('smartclass_logs_v1')!)
        : [],
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartClass_Backup_${classInfo.className}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Phục hồi dữ liệu từ file JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (data.classInfo) onUpdateClassInfo(data.classInfo);
        if (data.students) onUpdateStudents(data.students);
        if (data.attendance)
          localStorage.setItem('smartclass_attendance_v1', JSON.stringify(data.attendance));
        if (data.rules)
          localStorage.setItem('smartclass_rules_v1', JSON.stringify(data.rules));
        if (data.logs)
          localStorage.setItem('smartclass_logs_v1', JSON.stringify(data.logs));

        setSaveSuccessMsg('Đã phục hồi dữ liệu từ file sao lưu thành công!');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        alert('File sao lưu không hợp lệ hoặc bị hỏng.');
      }
    };
    reader.readAsText(file);
  };

  const officerList = formData.officerAssignments || DEFAULT_OFFICER_ASSIGNMENTS;

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {saveSuccessMsg && (
        <div className="bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 border border-emerald-500 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* BANNER PHÂN QUYỀN VAI TRÒ */}
      <div className="bg-white rounded-2xl shadow-xs border border-blue-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAdmin
                ? 'bg-amber-100 text-amber-700'
                : isStudent
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-[#1E3A8A]'
            }`}
          >
            {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">
                Vai trò quản trị: {currentSession.displayName}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isStudent
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {isAdmin
                  ? 'Quản Trị Viên (Admin)'
                  : isStudent
                  ? 'Học sinh (Chế độ xem)'
                  : 'Ban Cán Sự (Chỉ Xem Cài Đặt)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'GVCN có toàn quyền sửa thông tin trường lớp, đổi mã PIN admin và phân công nhiệm vụ cho ban cán sự.'
                : isStudent
                ? 'Bạn đang đăng nhập tài khoản học sinh. Cài đặt hệ thống và phân công chỉ do GVCN chỉnh sửa.'
                : 'Bạn đang đăng nhập vai trò Ban Cán Sự Lớp. Để thay đổi cấu hình hoặc phân công, hãy chuyển sang quyền GVCN.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onOpenPeriodLockModal && (
            <button
              type="button"
              onClick={onOpenPeriodLockModal}
              title="Quản lý khóa sổ các tuần học và tháng học để chốt điểm và chống sửa đổi"
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-300 transition-colors cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Khóa Sổ Tuần & Tháng</span>
            </button>
          )}

          <button
            onClick={onOpenRoleSwitcher}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-blue-50 text-[#1E3A8A] rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-300 transition-colors shrink-0 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Đổi Vai Trò' : 'Đăng Nhập GVCN (Admin)'}</span>
          </button>
        </div>
      </div>

      {/* TIỆN ÍCH HÀNH CHÍNH SƯ PHẠM: GIẤY MỜI HỌP PHỤ HUYNH CHUẨN VĂN BẢN */}
      {onOpenParentMeetingInvitation && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#1E3A8A] rounded-2xl shadow-md p-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  Chuẩn Nghị định 30/2020/NĐ-CP
                </span>
                <span className="text-xs text-blue-200">
                  Lớp {formData.className} • Năm học {formData.academicYear}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <Mail className="w-5 h-5 text-amber-300" />
                <span>Giấy Mời Họp Phụ Huynh Định Kỳ & Chữ Ký Sư Phạm GVCN</span>
              </h3>
              <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
                Tự động tạo mẫu giấy mời trang trọng theo thể thức hành chính Việt Nam (Quốc hiệu, Tiêu ngữ, Ngày ban hành, Chương trình họp, Chữ ký điện tử hoặc ký tay của GVCN). Hỗ trợ in 2 bản trên 1 trang A4 tiết kiệm giấy hoặc in riêng cho từng học sinh.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenParentMeetingInvitation}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Thiết Lập & In Giấy Mời</span>
            </button>
          </div>
        </div>
      )}

      {/* MỤC 1: PHÂN CÔNG BAN CÁN SỰ LỚP (GIAO VIỆC NHẬP NỘI QUY) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#1E3A8A]" />
              <h3 className="font-bold text-base text-slate-900">
                Phân Công Ban Cán Sự Lớp (Giao Việc Nhập Nội Quy)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              GVCN là Admin, phân quyền cho từng cán sự lớp chỉ được nhập nội quy theo chuyên trách (Học tập, Tác phong, Kỷ luật) và theo từng tổ.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleResetOfficers}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {officerList.map((officer) => (
            <div
              key={officer.roleType}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/40 hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#1E3A8A]">
                    {officer.title}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEditOfficer(officer)}
                      className="p-1 text-slate-400 hover:text-[#1E3A8A] rounded hover:bg-white transition-colors cursor-pointer"
                      title="Chỉnh sửa phân công"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-800">
                  {officer.studentName || (
                    <span className="text-slate-400 font-normal italic">Chưa gán học sinh</span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                  <div>
                    Lĩnh vực: <strong>{officer.assignedCategories.join(', ')}</strong>
                  </div>
                  <div>
                    Phạm vi:{' '}
                    <strong>
                      {officer.assignedTeams.length === 4
                        ? 'Cả lớp'
                        : `Tổ ${officer.assignedTeams.join(', ')}`}
                    </strong>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-600 pt-0.5">
                    {officer.canEditPoints ? (
                      <span className="text-emerald-700 font-semibold">• Tùy chỉnh điểm: Có</span>
                    ) : (
                      <span className="text-slate-400">• Điểm: Cố định</span>
                    )}
                    {officer.canTakeAttendance && (
                      <span className="text-blue-700 font-semibold">• Điểm danh: Có</span>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-2 mt-2 border-t border-slate-200/60 flex justify-end">
                  <button
                    onClick={() => handleOpenEditOfficer(officer)}
                    className="text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    Chỉnh sửa nhiệm vụ
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MỤC: QUẢN LÝ CÁC LỚP CHỦ NHIỆM (MỖI LỚP 1 GIAO DIỆN & DỮ LIỆU RIÊNG) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#1E3A8A]" />
              <h3 className="font-bold text-base text-slate-900">
                Danh Sách & Quản Lý Các Lớp Chủ Nhiệm ({classes.length} Lớp)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mỗi lớp học sở hữu giao diện và không gian dữ liệu riêng biệt hoàn toàn (danh sách học sinh, điểm danh, nội quy, nhật ký vi phạm, ban cán sự lớp).
            </p>
          </div>

          {isAdmin && onAddNewClass && (
            <button
              type="button"
              onClick={() => {
                setNewClassName('');
                setNewTeacherName(classInfo.teacherName || '');
                setNewSchoolName(classInfo.schoolName || '');
                setNewAcademicYear(classInfo.academicYear || '2024 - 2025');
                setNewLocation(classInfo.location || 'Phước Sơn');
                setNewAdminPin('123456');
                setIsAddClassModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Thêm Lớp Mới</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((c) => {
            const isCurrent = c.id === (activeClassId || classInfo.classId);
            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-[#1E3A8A] bg-blue-50/50 ring-2 ring-[#1E3A8A]/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-[#1E3A8A] tracking-tight">
                        Lớp {c.className}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#1E3A8A] text-white rounded-full">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    {isAdmin && classes.length > 1 && onDeleteClass && (
                      <button
                        type="button"
                        onClick={() => onDeleteClass(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={`Xóa dữ liệu lớp ${c.className}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="truncate">
                      Trường: <strong className="text-slate-800">{c.schoolName}</strong>
                    </div>
                    <div className="truncate">
                      GVCN: <strong className="text-slate-800">{c.teacherName}</strong>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-0.5">
                      <span>Năm học: {c.academicYear}</span>
                      {c.studentCount !== undefined && c.studentCount > 0 && (
                        <span>• {c.studentCount} HS</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                  {isCurrent ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Không gian đang mở</span>
                    </span>
                  ) : (
                    onSelectClass && (
                      <button
                        type="button"
                        onClick={() => onSelectClass(c.id)}
                        className="w-full text-center py-1.5 px-3 bg-white hover:bg-[#1E3A8A] text-[#1E3A8A] hover:text-white border border-slate-300 hover:border-[#1E3A8A] rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        Chuyển sang lớp này
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MỤC 2: CÀI ĐẶT THÔNG TIN TRƯỜNG LỚP & ĐỊA DANH */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <School className="w-5 h-5 text-[#1E3A8A]" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Thông Tin Trường Lớp, Niên Khóa & Giáo Viên Chủ Nhiệm
            </h3>
            <p className="text-xs text-slate-500">
              Tùy chỉnh thông tin để xuất hiện chuẩn xác trên báo cáo thi đua và bản in A4.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveClassInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên trường học *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên lớp chủ nhiệm *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full text-xs font-bold text-[#1E3A8A] px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa danh hành chính (In góc ngày tháng) *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ví dụ: Phước Sơn, Đồng Nai, TP. Hồ Chí Minh..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ tên Giáo viên chủ nhiệm *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ GVCN
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.teacherPhone}
                onChange={(e) => setFormData({ ...formData, teacherPhone: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Năm học *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mã PIN Quản Trị Viên (Admin PIN)
                </label>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowAdminPin(!showAdminPin)}
                    className="text-[11px] text-[#1E3A8A] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    {showAdminPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showAdminPin ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showAdminPin ? 'text' : 'password'}
                  disabled={!isAdmin}
                  value={formData.adminPin || '123456'}
                  onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                  placeholder="Mặc định: 123456"
                  className="w-full text-xs font-mono font-bold tracking-widest px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thông Tin Lớp Học & Mã PIN</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* MỤC 3: QUẢN LÝ DANH SÁCH HỌC SINH */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Danh Sách Học Sinh ({students.length} Học Sinh)
            </h3>
            <p className="text-xs text-slate-500">
              Thêm mới, sửa đổi thông tin, phân chia tổ thi đua hoặc dán danh sách học sinh hàng loạt.
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsTeamDivisionOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Mở bảng phân chia tổ: Chia tự động (cân bằng giới tính, ngẫu nhiên...) hoặc kéo thả bằng tay"
              >
                <Shuffle className="w-4 h-4 text-blue-200" />
                <span>Phân Chia Tổ (Tự Động / Bằng Tay)</span>
              </button>

              <button
                onClick={() => setIsExcelImportOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Nhập danh sách học sinh từ file Excel (.xlsx, .xls, .csv) chuẩn vnEdu, SMAS, CSDL"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>Nhập Từ Excel Chuẩn</span>
              </button>

              <button
                onClick={() => exportCurrentStudentsToExcel(students, formData.className, formData.schoolName)}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-2xs"
                title="Xuất toàn bộ danh sách học sinh hiện tại của lớp ra file Excel"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất Excel DS</span>
              </button>

              <button
                onClick={() => setIsBulkStudentOpen(true)}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Dán nhanh văn bản danh sách học sinh"
              >
                <span>Dán Nhanh DS</span>
              </button>

              <button
                onClick={handleOpenAddStudent}
                className="inline-flex items-center space-x-1 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Học Sinh</span>
              </button>
            </div>
          )}
        </div>

        {/* Thanh công cụ gán tổ nhanh khi chọn nhiều học sinh (Bulk actions) */}
        {selectedStudentIds.length > 0 && isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-fade-in shadow-2xs">
            <div className="flex items-center space-x-2 text-blue-900 font-bold">
              <CheckSquare className="w-4 h-4 text-blue-700" />
              <span>Đang chọn {selectedStudentIds.length}/{students.length} học sinh</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-600 text-[11px] font-medium mr-1">Chuyển sang bằng tay:</span>
              {[1, 2, 3, 4].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleBulkAssignTeam(t)}
                  className="px-2.5 py-1 bg-white hover:bg-[#1E3A8A] hover:text-white text-slate-800 font-bold rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  title={`Chuyển tất cả ${selectedStudentIds.length} học sinh được chọn sang Tổ ${t}`}
                >
                  Tổ {t}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 font-medium text-[11px] ml-1.5 cursor-pointer underline"
              >
                Bỏ chọn tất cả
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                {isAdmin && (
                  <th className="py-2.5 px-2 text-center w-8">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedStudentIds.length === students.length}
                      onChange={handleSelectAllStudents}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Chọn hoặc bỏ chọn tất cả học sinh"
                    />
                  </th>
                )}
                <th className="py-2.5 px-3">STT</th>
                <th className="py-2.5 px-3">Họ và Tên</th>
                <th className="py-2.5 px-2 text-center">Giới Tính</th>
                <th className="py-2.5 px-2 text-center">Tổ (Đổi Nhanh)</th>
                <th className="py-2.5 px-3">SĐT Phụ Huynh</th>
                <th className="py-2.5 px-3">Ghi Chú / Chức Vụ</th>
                {isAdmin && <th className="py-2.5 px-2 text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s, idx) => {
                const isSelected = selectedStudentIds.includes(s.id);

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {isAdmin && (
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(s.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          s.gender === 'Nữ'
                            ? 'bg-pink-50 text-pink-700 border border-pink-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {s.gender}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {isAdmin ? (
                        <select
                          value={s.team}
                          onChange={(e) =>
                            handleInlineChangeTeam(s.id, parseInt(e.target.value, 10))
                          }
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer transition-colors"
                          title="Nhấp để đổi tổ trực tiếp bằng tay cho học sinh này"
                        >
                          <option value="1">Tổ 1</option>
                          <option value="2">Tổ 2</option>
                          <option value="3">Tổ 3</option>
                          <option value="4">Tổ 4</option>
                        </select>
                      ) : (
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Tổ {s.team}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{s.parentPhone || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.notes || '—'}</td>
                    {isAdmin && (
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEditStudent(s)}
                            className="p-1 text-slate-400 hover:text-[#1E3A8A] rounded hover:bg-slate-100 cursor-pointer"
                            title="Chỉnh sửa thông tin chi tiết học sinh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="Xóa học sinh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MỤC 4: TÙY CHỌN GIAO DIỆN CHÍNH (MÀU SẮC & KIỂU HIỂN THỊ) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: getThemePalette(themeConfig.colorId).primary }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Tùy Chọn Giao Diện Chính (Màu Sắc & Kiểu Hiển Thị)
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getThemePalette(themeConfig.colorId).primary }}
                >
                  {getThemePalette(themeConfig.colorId).name}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Cá nhân hóa bảng màu chủ đạo, mật độ hiển thị danh sách, kiểu thẻ và kích thước chữ.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateThemeConfig(DEFAULT_THEME_CONFIG)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>
            <button
              onClick={onOpenThemeModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              style={{ backgroundColor: getThemePalette(themeConfig.colorId).primary }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mở Hộp Thoại Tùy Biến</span>
            </button>
          </div>
        </div>

        {/* 1. Chọn Bảng Màu Chủ Đạo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              1. Bảng Màu Sắc Chủ Đạo ({THEME_COLOR_PALETTES.length} Tùy Chọn Sư Phạm)
            </label>
            <span className="text-[11px] text-slate-500">
              Nhấn vào ô màu để đổi màu hệ thống ngay lập tức
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {THEME_COLOR_PALETTES.map((palette) => {
              const isSelected = themeConfig.colorId === palette.id;
              return (
                <button
                  key={palette.id}
                  onClick={() => onUpdateThemeConfig({ ...themeConfig, colorId: palette.id })}
                  className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-2 shadow-sm scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={{
                    borderColor: isSelected ? palette.primary : undefined,
                  }}
                >
                  <div>
                    <div className="flex items-center space-x-1.5 mb-2">
                      <div
                        className="w-5 h-5 rounded-full shadow-xs shrink-0"
                        style={{ backgroundColor: palette.primary }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: palette.primaryDark }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0"
                        style={{ backgroundColor: palette.primaryLight }}
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{palette.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                      {palette.tagline}
                    </p>
                  </div>

                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: palette.primary }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Cài Đặt Kiểu Hiển Thị (Mật Độ, Kiểu Thẻ, Cỡ Chữ, Chế Độ Sáng/Tối) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          {/* Mật độ hiển thị */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
              Mật Độ Hiển Thị
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateThemeConfig({ ...themeConfig, density: 'comfortable' })}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.density === 'comfortable'
                    ? 'border-2 shadow-xs bg-blue-50/50 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor:
                    themeConfig.density === 'comfortable'
                      ? getThemePalette(themeConfig.colorId).primary
                      : undefined,
                }}
              >
                <Maximize2 className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                <span>Thoáng Đãng</span>
                <p className="text-[10px] text-slate-400 font-normal">Khoảng cách rộng</p>
              </button>

              <button
                onClick={() => onUpdateThemeConfig({ ...themeConfig, density: 'compact' })}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.density === 'compact'
                    ? 'border-2 shadow-xs bg-blue-50/50 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor:
                    themeConfig.density === 'compact'
                      ? getThemePalette(themeConfig.colorId).primary
                      : undefined,
                }}
              >
                <Minimize2 className="w-3.5 h-3.5 mx-auto mb-1 text-slate-500" />
                <span>Gọn Gàng</span>
                <p className="text-[10px] text-slate-400 font-normal">Tối ưu nhiều HS</p>
              </button>
            </div>
          </div>

          {/* Kiểu thẻ nội dung */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Kiểu Thẻ Khối
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'rounded' as CardStyle, label: 'Bo Tròn' },
                { id: 'flat' as CardStyle, label: 'Phẳng Mịn' },
                { id: 'elevated' as CardStyle, label: 'Đổ Bóng' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => onUpdateThemeConfig({ ...themeConfig, cardStyle: style.id })}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                    themeConfig.cardStyle === style.id
                      ? 'border-2 shadow-xs bg-slate-50 text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                  style={{
                    borderColor:
                      themeConfig.cardStyle === style.id
                        ? getThemePalette(themeConfig.colorId).primary
                        : undefined,
                  }}
                >
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cỡ chữ */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-4 h-4 text-purple-600" />
              Cỡ Chữ Hệ Thống
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateThemeConfig({ ...themeConfig, fontScale: 'normal' })}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.fontScale === 'normal'
                    ? 'border-2 shadow-xs bg-slate-50 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor:
                    themeConfig.fontScale === 'normal'
                      ? getThemePalette(themeConfig.colorId).primary
                      : undefined,
                }}
              >
                <span>Chuẩn 100%</span>
                <p className="text-[10px] text-slate-400 font-normal">Sắc nét PC</p>
              </button>

              <button
                onClick={() => onUpdateThemeConfig({ ...themeConfig, fontScale: 'large' })}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.fontScale === 'large'
                    ? 'border-2 shadow-xs bg-slate-50 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor:
                    themeConfig.fontScale === 'large'
                      ? getThemePalette(themeConfig.colorId).primary
                      : undefined,
                }}
              >
                <span>Lớn (+10%)</span>
                <p className="text-[10px] text-slate-400 font-normal">Dễ nhìn máy chiếu</p>
              </button>
            </div>
          </div>

          {/* Chế độ Sáng / Tối */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              {themeConfig.mode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
              Chế Độ Nền
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateThemeConfig({ ...themeConfig, mode: 'light' })}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.mode === 'light'
                    ? 'border-2 shadow-xs bg-amber-50/50 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor:
                    themeConfig.mode === 'light'
                      ? getThemePalette(themeConfig.colorId).primary
                      : undefined,
                }}
              >
                <Sun className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
                <span>Nền Sáng</span>
              </button>

              <button
                onClick={() => onUpdateThemeConfig({ ...themeConfig, mode: 'dark' })}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.mode === 'dark'
                    ? 'border-2 shadow-xs bg-slate-900 text-white'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor:
                    themeConfig.mode === 'dark'
                      ? getThemePalette(themeConfig.colorId).primary
                      : undefined,
                }}
              >
                <Moon className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-400" />
                <span>Nền Tối</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MỤC 5: SAO LƯU & PHỤC HỒI TOÀN DIỆN */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Download className="w-5 h-5 text-[#1E3A8A]" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Sao Lưu & Phục Hồi Dữ Liệu Lớp Học (Offline-First)
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu được lưu trữ an toàn trong trình duyệt của thiết bị. Thầy/Cô nên tải file sao lưu định kỳ để bảo vệ dữ liệu.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="font-bold text-xs text-slate-800">1. Xuất Bản Sao Lưu (.json)</h4>
            <p className="text-[11px] text-slate-500">
              Tải toàn bộ học sinh, điểm danh, nhật ký và phân công cán sự ra file máy tính.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              Tải File Sao Lưu
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="font-bold text-xs text-slate-800">2. Phục Hồi Từ Bản Sao Lưu</h4>
            <p className="text-[11px] text-slate-500">
              Chọn file sao lưu .json đã lưu trước đó để khôi phục lại toàn bộ dữ liệu.
            </p>
            {isAdmin ? (
              <label className="block w-full py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white text-center rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-all">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
                Chọn File Phục Hồi
              </label>
            ) : (
              <div className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded border border-slate-200 text-center">
                Chỉ GVCN mới có quyền nạp file sao lưu.
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
            <h4 className="font-bold text-xs text-rose-900">3. Đặt Lại Dữ Liệu Mẫu Ban Đầu</h4>
            <p className="text-[11px] text-rose-700">
              Xóa sạch dữ liệu thử nghiệm và nạp lại 15 học sinh mẫu, 18 nội quy chuẩn.
            </p>
            {isAdmin ? (
              <button
                onClick={() => {
                  if (
                    confirm(
                      'CẢNH BÁO: Thao tác này sẽ xóa dữ liệu hiện có và đặt lại dữ liệu mẫu. Thầy/Cô có chắc muốn tiếp tục?'
                    )
                  ) {
                    onResetAllData();
                  }
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                Đặt Lại Mẫu Ban Đầu
              </button>
            ) : (
              <div className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded border border-rose-100 text-center">
                Chỉ GVCN (Admin) mới có quyền đặt lại dữ liệu.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PHÂN CÔNG BAN CÁN SỰ LỚP */}
      {isOfficerModalOpen && editingOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Phân Công: {editingOfficer.title}
                </h3>
                <p className="text-xs text-slate-500">Giao việc nhập nội quy & thẩm quyền</p>
              </div>
              <button
                onClick={() => setIsOfficerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOfficerAssignment} className="space-y-4 text-xs">
              {/* Chọn học sinh giữ vai trò */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Học sinh đảm nhận chức vụ:
                </label>
                <select
                  value={officerStudentId}
                  onChange={(e) => setOfficerStudentId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="">-- Chưa chỉ định học sinh --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Tổ {s.team})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân loại nội quy được giao việc */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Lĩnh vực nội quy được giao nhập:
                </label>
                <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {[
                    { id: 'hoc_tap' as RuleCategory, label: 'Học tập (Phát biểu, điểm miệng, BTVN...)' },
                    { id: 'tac_phong' as RuleCategory, label: 'Tác phong (Đồng phục, phù hiệu, dép...)' },
                    { id: 'ky_luat' as RuleCategory, label: 'Kỷ luật (Trực nhật, điện thoại, trật tự...)' },
                  ].map((cat) => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={officerCategories.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOfficerCategories([...officerCategories, cat.id]);
                          } else {
                            setOfficerCategories(officerCategories.filter((c) => c !== cat.id));
                          }
                        }}
                        className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                      />
                      <span>{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Phạm vi tổ được phân công */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Phạm vi tổ được theo dõi:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((t) => (
                    <label
                      key={t}
                      className={`flex items-center justify-center space-x-1 p-2 rounded-lg border cursor-pointer font-semibold ${
                        officerTeams.includes(t)
                          ? 'bg-blue-50 border-[#1E3A8A] text-[#1E3A8A]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={officerTeams.includes(t)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOfficerTeams([...officerTeams, t]);
                          } else {
                            setOfficerTeams(officerTeams.filter((item) => item !== t));
                          }
                        }}
                        className="hidden"
                      />
                      <span>Tổ {t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tùy chỉnh đặc quyền */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officerCanEditPoints}
                    onChange={(e) => setOfficerCanEditPoints(e.target.checked)}
                    className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                  <span>
                    <strong>Cho phép tùy chỉnh điểm số</strong> (Nếu không tick, chỉ áp dụng điểm mặc định của nội quy)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officerCanTakeAttendance}
                    onChange={(e) => setOfficerCanTakeAttendance(e.target.checked)}
                    className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                  <span>
                    <strong>Cho phép điểm danh chuyên cần</strong>
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOfficerModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Lưu Phân Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA HỌC SINH */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={stuName}
                  onChange={(e) => setStuName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={stuGender}
                    onChange={(e) => setStuGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân tổ
                  </label>
                  <select
                    value={stuTeam}
                    onChange={(e) => setStuTeam(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại Phụ huynh
                </label>
                <input
                  type="text"
                  value={stuParentPhone}
                  onChange={(e) => setStuParentPhone(e.target.value)}
                  placeholder="Ví dụ: 0987654321"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú / Chức vụ trong lớp
                </label>
                <input
                  type="text"
                  value={stuNotes}
                  onChange={(e) => setStuNotes(e.target.value)}
                  placeholder="Ví dụ: Lớp phó, Tổ trưởng, Ban văn nghệ..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg shadow-sm"
                >
                  {editingStudent ? 'Cập Nhật' : 'Thêm Vào Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÁN NHANH DANH SÁCH HỌC SINH */}
      {isBulkStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Nhập Nhanh Danh Sách Học Sinh Hàng Loạt
              </h3>
              <button
                onClick={() => setIsBulkStudentOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>Thầy/Cô có thể copy danh sách từ Excel/Word dán vào ô bên dưới, mỗi dòng một em.</p>
              <p className="text-slate-400 italic">
                Ví dụ: <br />
                Nguyễn Văn An <br />
                Trần Thị Bích Ngọc, Nữ, 0912345678
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quy tắc chia tổ:
              </label>
              <select
                value={bulkTeamAssign}
                onChange={(e) => setBulkTeamAssign(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              >
                <option value={0}>Tự động chia đều cho 4 Tổ (Tổ 1 -&gt; Tổ 4 xoay vòng)</option>
                <option value={1}>Gán toàn bộ vào Tổ 1</option>
                <option value={2}>Gán toàn bộ vào Tổ 2</option>
                <option value={3}>Gán toàn bộ vào Tổ 3</option>
                <option value={4}>Gán toàn bộ vào Tổ 4</option>
              </select>
            </div>

            <div>
              <textarea
                rows={7}
                value={bulkStudentText}
                onChange={(e) => setBulkStudentText(e.target.value)}
                placeholder="Dán danh sách học sinh vào đây..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkStudentOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportBulkStudents}
                disabled={!bulkStudentText.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm"
              >
                Nạp Danh Sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NHẬP DANH SÁCH HỌC SINH TỪ FILE EXCEL CHUẨN */}
      {isExcelImportOpen && (
        <ExcelStudentImportModal
          currentStudents={students}
          className={formData.className}
          schoolName={formData.schoolName}
          onImportStudents={handleImportExcelStudents}
          onClose={() => setIsExcelImportOpen(false)}
        />
      )}

      {/* MODAL QUẢN LÝ & PHÂN CHIA TỔ (TỰ ĐỘNG & BẰNG TAY) */}
      {isTeamDivisionOpen && (
        <TeamDivisionModal
          students={students}
          className={formData.className}
          onSaveTeams={handleSaveDividedTeams}
          onClose={() => setIsTeamDivisionOpen(false)}
        />
      )}

      {/* MODAL TẠO LỚP CHỦ NHIỆM MỚI (MULTI-CLASS) */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Tạo Thêm Lớp Chủ Nhiệm Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newClassName.trim()) {
                  alert('Vui lòng nhập tên lớp học!');
                  return;
                }
                if (onAddNewClass) {
                  const created = onAddNewClass({
                    className: newClassName.trim(),
                    teacherName: newTeacherName.trim() || 'Giáo viên Chủ nhiệm',
                    schoolName: newSchoolName.trim() || formData.schoolName,
                    academicYear: newAcademicYear.trim() || formData.academicYear,
                    location: newLocation.trim() || formData.location,
                    adminPin: newAdminPin.trim() || '123456',
                  });
                  setIsAddClassModalOpen(false);
                  setNewClassName('');
                  alert(`Đã khởi tạo thành công không gian dữ liệu riêng cho Lớp ${created.className}!`);
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-slate-600">
                Lớp mới sẽ được tạo không gian dữ liệu độc lập hoàn toàn để quản lý học sinh, nội quy, điểm danh, nhật ký và ban cán sự.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Lớp Học *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ví dụ: 10A2, 11B1, 12A3..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giáo Viên Chủ Nhiệm
                </label>
                <input
                  type="text"
                  placeholder="Họ và tên Thầy/Cô"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm học
                  </label>
                  <input
                    type="text"
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã PIN Admin
                  </label>
                  <input
                    type="text"
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    placeholder="123456"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trường học
                </label>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Tạo Không Gian Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
