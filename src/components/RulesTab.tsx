import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Search,
  FileSpreadsheet,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldAlert,
  Users,
  Shield,
  SlidersHorizontal,
  Lock,
  ArrowRightLeft,
  MessageSquareText,
} from 'lucide-react';
import {
  Student,
  Rule,
  RuleCategory,
  RuleType,
  BehaviorLog,
  CurrentUserSession,
  ClassInfo,
} from '../types';
import { INITIAL_RULES } from '../data/mockData';
import { getTodayLocalDateString, isWeekLocked } from '../utils/storage';

interface RulesTabProps {
  students: Student[];
  rules: Rule[];
  onUpdateRules: (rules: Rule[]) => void;
  onAddLog: (log: BehaviorLog) => void;
  currentSession: CurrentUserSession;
  classInfo: ClassInfo;
  onOpenRoleSwitcher: () => void;
  onNavigateFeedback?: () => void;
  onToggleLockPeriod?: (type: 'week' | 'month', periodNumber: number) => void;
}

export const RulesTab: React.FC<RulesTabProps> = ({
  students,
  rules,
  onUpdateRules,
  onAddLog,
  currentSession,
  classInfo,
  onOpenRoleSwitcher,
  onNavigateFeedback,
  onToggleLockPeriod,
}) => {
  const isAdmin = currentSession.role === 'admin';
  const isStudent = currentSession.role === 'student';
  const isLocked = isWeekLocked(classInfo.weekNumber, classInfo);
  const allowedCategories = currentSession.assignedCategories || ['hoc_tap', 'tac_phong', 'ky_luat'];
  const allowedTeams = currentSession.assignedTeams || [1, 2, 3, 4];
  const canEditPoints = currentSession.canEditPoints !== false;

  // Lọc học sinh và nội quy theo quyền hạn của Ban cán sự
  const availableStudents = isAdmin
    ? students
    : students.filter((s) => allowedTeams.includes(s.team));

  const availableRules = isAdmin
    ? rules
    : rules.filter((r) => allowedCategories.includes(r.category));

  // State Ghi nhận Nhanh
  const [selectedStudentId, setSelectedStudentId] = useState<string>(availableStudents[0]?.id || '');
  const [selectedRuleId, setSelectedRuleId] = useState<string>(availableRules[0]?.id || '');
  const [customPoints, setCustomPoints] = useState<number>(2);
  const [actionNote, setActionNote] = useState<string>('');
  const [logSuccessToast, setLogSuccessToast] = useState<string | null>(null);

  // Cập nhật học sinh / nội quy mặc định khi danh sách thay đổi hoặc đổi vai trò
  useEffect(() => {
    if (!availableStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(availableStudents[0]?.id || '');
    }
    if (!availableRules.some((r) => r.id === selectedRuleId)) {
      setSelectedRuleId(availableRules[0]?.id || '');
    }
  }, [availableStudents, availableRules, selectedStudentId, selectedRuleId]);

  // Cập nhật số điểm mặc định khi chọn nội quy mới
  useEffect(() => {
    const r = rules.find((item) => item.id === selectedRuleId);
    if (r) {
      setCustomPoints(r.points);
    }
  }, [selectedRuleId, rules]);

  // State Quản lý danh mục Nội quy
  const [filterCategory, setFilterCategory] = useState<RuleCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<RuleType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Bulk Selection for Delete
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  // Modal Thêm/Sửa nội quy
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<RuleCategory>('hoc_tap');
  const [formType, setFormType] = useState<RuleType>('bonus');
  const [formPoints, setFormPoints] = useState<number>(2);
  const [formDesc, setFormDesc] = useState('');

  // Modal Nhập nhanh hàng loạt
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRuleText, setBulkRuleText] = useState('');
  const [bulkDefaultType, setBulkDefaultType] = useState<RuleType>('bonus');
  const [bulkDefaultCategory, setBulkDefaultCategory] = useState<RuleCategory>('hoc_tap');
  const [bulkDefaultPoints, setBulkDefaultPoints] = useState<number>(2);

  // Xử lý ghi nhận nhanh
  const handleQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudent) {
      alert('Tài khoản học sinh chỉ có quyền xem nội dung và gửi phản hồi. Vui lòng chuyển sang mục Phản hồi & Khiếu nại.');
      return;
    }
    if (isLocked && !isAdmin) {
      alert(`Tuần ${classInfo.weekNumber} đã được Giáo viên chủ nhiệm khóa sổ tổng kết. Không thể ghi nhận thêm điểm thưởng hay vi phạm!`);
      return;
    }
    if (!selectedStudentId || !selectedRuleId) return;

    const student = students.find((s) => s.id === selectedStudentId);
    const rule = rules.find((r) => r.id === selectedRuleId);
    if (!student || !rule) return;

    const now = new Date();
    const dateStr = getTodayLocalDateString(now);
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const appliedPoints = canEditPoints ? Math.max(1, customPoints) : rule.points;

    const newLog: BehaviorLog = {
      id: `log-${Date.now()}`,
      studentId: student.id,
      ruleId: rule.id,
      actionName: rule.name,
      category: rule.category,
      type: rule.type,
      points: appliedPoints,
      date: dateStr,
      weekNumber: classInfo.weekNumber,
      timestamp: `${dateStr} ${timeStr}`,
      note: actionNote.trim() || undefined,
      source: 'rule',
      recordedBy: currentSession.displayName,
    };

    onAddLog(newLog);
    setActionNote('');

    // Toast thông báo
    setLogSuccessToast(
      `Đã ghi nhận ${rule.type === 'bonus' ? '+' : '-'}${appliedPoints}đ cho ${student.name} (${currentSession.displayName})`
    );
    setTimeout(() => setLogSuccessToast(null), 3500);
  };

  // Mở modal thêm nội quy đơn lẻ
  const handleOpenAddModal = () => {
    setEditingRule(null);
    setFormName('');
    setFormCategory('hoc_tap');
    setFormType('bonus');
    setFormPoints(2);
    setFormDesc('');
    setIsModalOpen(true);
  };

  // Mở modal sửa nội quy
  const handleOpenEditModal = (rule: Rule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormCategory(rule.category);
    setFormType(rule.type);
    setFormPoints(rule.points);
    setFormDesc(rule.description || '');
    setIsModalOpen(true);
  };

  // Lưu nội quy (Thêm mới hoặc sửa)
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingRule) {
      const updated = rules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              name: formName.trim(),
              category: formCategory,
              type: formType,
              points: Number(formPoints),
              description: formDesc.trim() || undefined,
            }
          : r
      );
      onUpdateRules(updated);
      setLogSuccessToast(`Đã cập nhật nội quy "${formName.trim()}"`);
    } else {
      const newRule: Rule = {
        id: `rule-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        type: formType,
        points: Number(formPoints),
        description: formDesc.trim() || undefined,
      };
      onUpdateRules([...rules, newRule]);
      setLogSuccessToast(`Đã thêm nội quy mới "${formName.trim()}"`);
    }
    setTimeout(() => setLogSuccessToast(null), 3000);
    setIsModalOpen(false);
  };

  // Xóa 1 nội quy
  const handleDeleteRule = (id: string, name: string) => {
    if (confirm(`Thầy/Cô có chắc chắn muốn xóa nội quy "${name}"?`)) {
      const remaining = rules.filter((r) => r.id !== id);
      onUpdateRules(remaining);
      setSelectedRuleIds((prev) => prev.filter((item) => item !== id));
      if (selectedRuleId === id && remaining.length > 0) {
        setSelectedRuleId(remaining[0].id);
      }
      setLogSuccessToast(`Đã xóa nội quy "${name}"`);
      setTimeout(() => setLogSuccessToast(null), 3000);
    }
  };

  // Chọn / bỏ chọn tất cả
  const handleToggleSelectAll = () => {
    if (selectedRuleIds.length === filteredRules.length) {
      setSelectedRuleIds([]);
    } else {
      setSelectedRuleIds(filteredRules.map((r) => r.id));
    }
  };

  // Chọn / bỏ chọn 1 rule
  const handleToggleSelectRule = (id: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Xóa các nội quy đã chọn hàng loạt
  const handleDeleteSelectedRules = () => {
    if (selectedRuleIds.length === 0) return;
    if (
      confirm(
        `Thầy/Cô có chắc chắn muốn xóa ${selectedRuleIds.length} nội quy đã chọn?`
      )
    ) {
      const remaining = rules.filter((r) => !selectedRuleIds.includes(r.id));
      onUpdateRules(remaining);
      setSelectedRuleIds([]);
      if (remaining.length > 0) setSelectedRuleId(remaining[0].id);
      setLogSuccessToast(`Đã xóa thành công ${selectedRuleIds.length} nội quy!`);
      setTimeout(() => setLogSuccessToast(null), 3000);
    }
  };

  // Xóa sạch tất cả nội quy
  const handleClearAllRules = () => {
    if (
      confirm(
        'CẢNH BÁO: Thao tác này sẽ xóa toàn bộ nội quy hiện có. Thầy/Cô có chắc chắn muốn xóa sạch để thiết lập danh mục mới?'
      )
    ) {
      onUpdateRules([]);
      setSelectedRuleIds([]);
      setLogSuccessToast('Đã xóa toàn bộ nội quy. Thầy/Cô có thể tạo mới!');
      setTimeout(() => setLogSuccessToast(null), 3000);
    }
  };

  // Khôi phục bộ nội quy mẫu 18 quy tắc chuẩn Bộ GD&ĐT
  const handleRestoreStandardRules = () => {
    if (
      confirm(
        'Thầy/Cô có muốn khôi phục lại bộ 18 Nội quy thi đua & nề nếp chuẩn của Bộ GD&ĐT?'
      )
    ) {
      onUpdateRules(INITIAL_RULES);
      setSelectedRuleIds([]);
      if (INITIAL_RULES.length > 0) setSelectedRuleId(INITIAL_RULES[0].id);
      setLogSuccessToast('Đã khôi phục thành công 18 nội quy chuẩn Bộ GD&ĐT!');
      setTimeout(() => setLogSuccessToast(null), 3000);
    }
  };

  // Nhập hàng loạt nội quy từ văn bản
  const handleBulkImportRules = () => {
    if (!bulkRuleText.trim()) return;
    const lines = bulkRuleText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newRules: Rule[] = lines.map((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[0];
      const type: RuleType =
        parts[1] === 'bonus' || parts[1] === 'thuong' || parts[1] === '+'
          ? 'bonus'
          : parts[1] === 'penalty' || parts[1] === 'phat' || parts[1] === '-'
          ? 'penalty'
          : bulkDefaultType;

      const points = parts[2] && !isNaN(Number(parts[2])) ? Math.abs(Number(parts[2])) : bulkDefaultPoints;

      const category: RuleCategory =
        parts[3] === 'tac_phong'
          ? 'tac_phong'
          : parts[3] === 'ky_luat'
          ? 'ky_luat'
          : bulkDefaultCategory;

      return {
        id: `rule-bulk-${Date.now()}-${idx}`,
        name,
        category,
        type,
        points,
      };
    });

    onUpdateRules([...rules, ...newRules]);
    setIsBulkModalOpen(false);
    setBulkRuleText('');
    setLogSuccessToast(`Đã thêm nhanh ${newRules.length} nội quy vào hệ thống!`);
    setTimeout(() => setLogSuccessToast(null), 3000);
  };

  // Lọc danh sách nội quy
  const filteredRules = rules.filter((r) => {
    const matchCat = filterCategory === 'all' || r.category === filterCategory;
    const matchType = filterType === 'all' || r.type === filterType;
    const matchSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchType && matchSearch;
  });

  const getCategoryBadge = (cat: RuleCategory) => {
    switch (cat) {
      case 'hoc_tap':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BookOpen className="w-3 h-3" />
            <span>Học tập</span>
          </span>
        );
      case 'tac_phong':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3 h-3" />
            <span>Tác phong</span>
          </span>
        );
      case 'ky_luat':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Kỷ luật</span>
          </span>
        );
    }
  };

  const selectedRule = rules.find((r) => r.id === selectedRuleId);

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {logSuccessToast && (
        <div className="bg-[#1E3A8A] text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 border border-blue-400 animate-fade-in">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium">{logSuccessToast}</span>
        </div>
      )}

      {/* BANNER THÔNG TIN VAI TRÒ & PHÂN QUYỀN HIỆN TẠI */}
      <div className="bg-white rounded-2xl shadow-xs border border-blue-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-[#1E3A8A]'
            }`}
          >
            {isAdmin ? <Shield className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">
                {currentSession.displayName}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {isAdmin ? 'Toàn quyền Admin' : 'Ban Cán Sự Lớp'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'GVCN có toàn quyền ghi nhận mọi tiêu chí, tùy chỉnh điểm số và quản trị danh mục nội quy.'
                : `Phân công nhiệm vụ: Chỉ ghi nhận nội quy [${allowedCategories.join(
                    ', '
                  )}] cho [${
                    allowedTeams.length === 4 ? 'Cả lớp' : `Tổ ${allowedTeams.join(', ')}`
                  }].`}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenRoleSwitcher}
          className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-blue-50 text-[#1E3A8A] rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-300 transition-colors shrink-0"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Đổi Vai Trò</span>
        </button>
      </div>

      {/* MÔ-ĐUN 1: GHI NHẬN HÀNH VI NHANH & TÙY CHỈNH ĐIỂM SỐ */}
      {isStudent ? (
        <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-900 rounded-2xl shadow-md p-6 text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Users className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Chế Độ Xem Dành Cho Học Sinh Lớp {classInfo.className}
                </h3>
                <p className="text-xs text-blue-200">
                  Tài khoản: <strong className="text-amber-300">{currentSession.displayName}</strong> • Quyền hạn: <span className="underline">Chỉ xem nội dung & Gửi phản hồi</span>
                </p>
              </div>
            </div>

            {onNavigateFeedback && (
              <button
                type="button"
                onClick={onNavigateFeedback}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Gửi Ý Kiến / Khiếu Nại</span>
              </button>
            )}
          </div>

          <div className="p-3.5 bg-blue-950/60 rounded-xl border border-blue-700/60 text-xs text-blue-100 leading-relaxed">
            Học sinh được quyền tra cứu công khai toàn bộ <strong>{rules.length} tiêu chuẩn thi đua</strong> và thang điểm thưởng/phạt ở danh mục bên dưới để phấn đấu rèn luyện.
            Nếu phát hiện điểm vi phạm bị ghi nhận sai sót hoặc cần giải trình lý do chính đáng, bạn hãy bấm nút <strong>Gửi Ý Kiến / Khiếu Nại</strong> để GVCN xem xét điều chỉnh.
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-900 rounded-2xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base tracking-wide">
                Ghi Nhận Điểm Thưởng / Vi Phạm
              </h3>
            </div>
            <span className="text-xs text-blue-200">
              Tuần thi đua số: <strong className="text-amber-300">{classInfo.weekNumber}</strong>
            </span>
          </div>

          {/* Cảnh báo nếu tuần hiện tại đã bị khóa */}
          {isLocked && (
            <div className="mb-3 p-3 bg-rose-500/25 border border-rose-400/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-rose-100 text-xs">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-rose-300 shrink-0" />
                <span>
                  <strong>Tuần {classInfo.weekNumber} đã được Giáo viên chủ nhiệm khóa sổ tổng kết.</strong>{' '}
                  {isAdmin
                    ? 'Thầy/Cô là Admin có thể mở khóa để tiếp tục nhập điểm nếu cần.'
                    : 'Sổ thi đua đã chốt, Ban cán sự tạm thời không thể ghi nhận thêm điểm.'}
                </span>
              </div>
              {isAdmin && onToggleLockPeriod && (
                <button
                  type="button"
                  onClick={() => onToggleLockPeriod('week', classInfo.weekNumber)}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  Mở khóa tuần {classInfo.weekNumber}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleQuickLog} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Chọn Học sinh */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-blue-200 mb-1">
                  1. Học Sinh Áp Dụng ({availableStudents.length} em)
                </label>
                <select
                  disabled={isLocked && !isAdmin}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-blue-950/80 border border-blue-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                >
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id} className="text-white bg-slate-900">
                      {s.name} (Tổ {s.team})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn Hành vi / Nội quy */}
              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-blue-200 mb-1">
                  2. Nội Quy Thi Đua ({availableRules.length} tiêu chuẩn)
                </label>
                <select
                  disabled={isLocked && !isAdmin}
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full bg-blue-950/80 border border-blue-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                >
                  <optgroup label="-- Khen thưởng (+ Điểm) --" className="bg-slate-900 text-emerald-400">
                    {availableRules
                      .filter((r) => r.type === 'bonus')
                      .map((r) => (
                        <option key={r.id} value={r.id} className="text-white">
                          [+{r.points}đ] {r.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="-- Vi phạm (- Điểm) --" className="bg-slate-900 text-rose-400">
                    {availableRules
                      .filter((r) => r.type === 'penalty')
                      .map((r) => (
                        <option key={r.id} value={r.id} className="text-white">
                          [-{r.points}đ] {r.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Tùy chỉnh Điểm số (Cộng/Trừ) */}
              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-blue-200">
                    3. Số Điểm ({selectedRule?.type === 'bonus' ? '+' : '-'})
                  </label>
                  {canEditPoints ? (
                    <span className="text-[10px] text-amber-300 font-medium">Tùy chỉnh được</span>
                  ) : (
                    <span className="text-[10px] text-blue-300 flex items-center space-x-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Cố định</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    disabled={!canEditPoints || (isLocked && !isAdmin)}
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Math.abs(parseInt(e.target.value) || 1))}
                    className="w-20 bg-blue-950/80 border border-blue-700 rounded-lg px-3 py-2 text-sm font-bold text-center text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                  />

                  {/* Quick buttons */}
                  {canEditPoints && !isLocked && (
                    <div className="flex items-center space-x-1">
                      {[1, 2, 5, 10].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCustomPoints(p)}
                          className={`px-1.5 py-1 text-[11px] font-bold rounded ${
                            customPoints === p
                              ? 'bg-amber-400 text-slate-900'
                              : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ghi chú chi tiết & Nút gửi */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  disabled={isLocked && !isAdmin}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Ghi chú thêm (VD: Tiết Toán bài tập nâng cao, kiểm tra 15p...)"
                  className="w-full bg-blue-950/80 border border-blue-700 rounded-lg px-3 py-2 text-sm text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    availableRules.length === 0 ||
                    availableStudents.length === 0 ||
                    (isLocked && !isAdmin)
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-900" />
                  <span>
                    {isLocked && !isAdmin
                      ? 'Tuần Này Đã Khóa Sổ'
                      : `Lưu ${selectedRule?.type === 'bonus' ? '+' : '-'}${
                          canEditPoints ? customPoints : selectedRule?.points || 0
                        }đ`}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MÔ-ĐUN 2: QUẢN LÝ DANH MỤC NỘI QUY (DÀNH CHO GVCN ADMIN) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Danh Mục Tiêu Chuẩn Nội Quy ({rules.length} Tiêu Chuẩn)
            </h3>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'GVCN có thể tự do thêm mới, sửa đổi mức điểm (cộng/trừ) hoặc xóa các nội quy.'
                : 'Chế độ xem: Ban cán sự xem nội quy chuẩn. Quyền thêm/sửa/xóa nội quy thuộc về GVCN (Admin).'}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Dán nhanh nhiều nội quy từ văn bản"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Dán Nội Quy Hàng Loạt</span>
              </button>

              <button
                onClick={handleRestoreStandardRules}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] rounded-xl text-xs font-bold transition-all border border-blue-200"
                title="Khôi phục lại 18 nội quy tiêu chuẩn"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Bộ 18 Nội Quy Chuẩn</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Nội Quy Mới</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Cần quyền GVCN để chỉnh sửa danh mục</span>
            </div>
          )}
        </div>

        {/* Thanh thao tác chọn xóa hàng loạt & Bộ lọc */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {isAdmin && (
              <>
                <button
                  onClick={handleToggleSelectAll}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  title="Chọn tất cả để xóa hàng loạt"
                >
                  {selectedRuleIds.length === filteredRules.length && filteredRules.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-900" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Chọn ({selectedRuleIds.length})</span>
                </button>

                {selectedRuleIds.length > 0 && (
                  <button
                    onClick={handleDeleteSelectedRules}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all animate-pulse"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa {selectedRuleIds.length} mục</span>
                  </button>
                )}

                <div className="h-4 w-px bg-slate-200 mx-1"></div>
              </>
            )}

            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterCategory('hoc_tap')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === 'hoc_tap'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Học tập
            </button>
            <button
              onClick={() => setFilterCategory('tac_phong')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === 'tac_phong'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Tác phong
            </button>
            <button
              onClick={() => setFilterCategory('ky_luat')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === 'ky_luat'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Kỷ luật
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={() => setFilterType(filterType === 'bonus' ? 'all' : 'bonus')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === 'bonus'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              + Thưởng
            </button>
            <button
              onClick={() => setFilterType(filterType === 'penalty' ? 'all' : 'penalty')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === 'penalty'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-rose-700 hover:bg-rose-50'
              }`}
            >
              - Phạt
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nội quy..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {/* Danh sách thẻ nội quy */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {filteredRules.map((rule) => {
            const isBonus = rule.type === 'bonus';
            const isSelected = selectedRuleIds.includes(rule.id);

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative ${
                  isSelected
                    ? 'ring-2 ring-[#1E3A8A] bg-blue-50/60 border-blue-300'
                    : isBonus
                    ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                    : 'bg-rose-50/30 border-rose-200/80 hover:border-rose-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleToggleSelectRule(rule.id)}
                          className="mt-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#1E3A8A]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <div className="space-y-1">
                        {getCategoryBadge(rule.category)}
                        <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                          {rule.name}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-extrabold px-2.5 py-1 rounded-lg shrink-0 ${
                        isBonus ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isBonus ? `+${rule.points}đ` : `-${rule.points}đ`}
                    </span>
                  </div>

                  {rule.description && (
                    <p className="text-xs text-slate-500 mt-2 pl-6 line-clamp-2">
                      {rule.description}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-end space-x-1.5 pt-3 mt-3 border-t border-slate-200/60">
                    <button
                      onClick={() => handleOpenEditModal(rule)}
                      className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-200/60 rounded-md transition-colors"
                      title="Chỉnh sửa nội quy & điểm số"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id, rule.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100/60 rounded-md transition-colors"
                      title="Xóa nội quy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Nút xóa sạch toàn bộ */}
        {isAdmin && rules.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Tổng cộng: <strong>{rules.length}</strong> nội quy
            </span>
            <button
              onClick={handleClearAllRules}
              className="text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
            >
              Xóa sạch toàn bộ nội quy để tạo mới từ đầu
            </button>
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA NỘI QUY ĐƠN LẺ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingRule ? 'Chỉnh Sửa Nội Quy & Điểm Số' : 'Thêm Nội Quy Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên nội quy / Hành vi *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Giúp đỡ bạn cùng tiến bộ..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân loại
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RuleCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="hoc_tap">Học tập</option>
                    <option value="tac_phong">Tác phong</option>
                    <option value="ky_luat">Kỷ luật</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hình thức điểm
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as RuleType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="bonus">+ Cộng điểm thưởng</option>
                    <option value="penalty">- Trừ điểm vi phạm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mức điểm quy chuẩn ({formType === 'bonus' ? '+' : '-'})
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formPoints}
                  onChange={(e) => setFormPoints(Math.abs(parseInt(e.target.value) || 1))}
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * Điểm này là mức chuẩn, khi ghi nhận vẫn có thể điều chỉnh linh hoạt nếu cần.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chi tiết / Hướng dẫn áp dụng (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ghi chú thêm về tiêu chuẩn hoặc căn cứ áp dụng..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-lg shadow-sm"
                >
                  {editingRule ? 'Lưu Thay Đổi' : 'Thêm Nội Quy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÁN NHANH HÀNG LOẠT NỘI QUY */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Nhập Nhanh Nội Quy Hàng Loạt
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>Thầy/Cô có thể dán danh sách nội quy, mỗi dòng một hành vi.</p>
              <p className="text-slate-400 italic">
                Ví dụ: <br />
                - Làm bài tập về nhà đầy đủ <br />
                - Giữ vệ sinh lớp học sạch sẽ <br />
                - Đạt giải phong trào văn nghệ, bonus, 10, hoc_tap
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Loại mặc định
                </label>
                <select
                  value={bulkDefaultType}
                  onChange={(e) => setBulkDefaultType(e.target.value as RuleType)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="bonus">+ Thưởng</option>
                  <option value="penalty">- Phạt</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Điểm mặc định
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={bulkDefaultPoints}
                  onChange={(e) => setBulkDefaultPoints(Math.abs(parseInt(e.target.value) || 1))}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mục mặc định
                </label>
                <select
                  value={bulkDefaultCategory}
                  onChange={(e) => setBulkDefaultCategory(e.target.value as RuleCategory)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="hoc_tap">Học tập</option>
                  <option value="tac_phong">Tác phong</option>
                  <option value="ky_luat">Kỷ luật</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                rows={6}
                value={bulkRuleText}
                onChange={(e) => setBulkRuleText(e.target.value)}
                placeholder="Dán danh sách các nội quy vào đây..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBulkImportRules}
                disabled={!bulkRuleText.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm"
              >
                Thêm Vào Danh Mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
