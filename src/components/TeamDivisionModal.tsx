import React, { useState, useMemo } from 'react';
import {
  Users,
  Shuffle,
  Scale,
  RotateCcw,
  CheckCircle2,
  X,
  ArrowRightLeft,
  Search,
  Sparkles,
  LayoutGrid,
  Sliders,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Student } from '../types';
import {
  TeamDivisionAlgorithm,
  divideStudentsIntoTeams,
  calculateTeamStatistics,
  TeamStatistic,
} from '../utils/teamDivider';

interface TeamDivisionModalProps {
  students: Student[];
  className: string;
  onSaveTeams: (updatedStudents: Student[]) => void;
  onClose: () => void;
}

export const TeamDivisionModal: React.FC<TeamDivisionModalProps> = ({
  students,
  className,
  onSaveTeams,
  onClose,
}) => {
  // Bản nháp danh sách học sinh đang thao tác phân tổ
  const [draftStudents, setDraftStudents] = useState<Student[]>(() =>
    students.map((s) => ({ ...s }))
  );

  // Tab thao tác: 'auto' (Chia tự động) hoặc 'manual' (Chia thủ công / Kéo thả)
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');

  // Cấu hình chia tự động
  const [numberOfTeams, setNumberOfTeams] = useState<number>(4);
  const [algorithm, setAlgorithm] = useState<TeamDivisionAlgorithm>('gender_balance');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  // Trạng thái kéo thả (Drag & Drop)
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  // Tính toán thống kê từng tổ
  const teamStats: TeamStatistic[] = useMemo(() => {
    return calculateTeamStatistics(draftStudents, numberOfTeams);
  }, [draftStudents, numberOfTeams]);

  // Kiểm tra số lượng thay đổi so với ban đầu
  const changeCount = useMemo(() => {
    let count = 0;
    const originalMap = new Map<string, number>(students.map((s) => [s.id, s.team]));
    draftStudents.forEach((s) => {
      if (originalMap.get(s.id) !== s.team) {
        count++;
      }
    });
    return count;
  }, [draftStudents, students]);

  // Thực hiện chia tự động
  const handleExecuteAutoDivision = () => {
    const newStudents = divideStudentsIntoTeams(draftStudents, {
      numberOfTeams,
      algorithm,
    });
    setDraftStudents(newStudents);
    showNotice(
      `Đã phân chia ${newStudents.length} học sinh vào ${numberOfTeams} tổ theo thuật toán "${
        algorithm === 'gender_balance'
          ? 'Cân bằng Nam - Nữ'
          : algorithm === 'round_robin'
          ? 'Tuần tự vòng tròn'
          : algorithm === 'consecutive'
          ? 'Theo khối liên tục'
          : 'Ngẫu nhiên bốc thăm'
      }"!`
    );
  };

  // Chuyển tổ bằng tay cho một học sinh
  const handleMoveStudentToTeam = (studentId: string, targetTeam: number) => {
    setDraftStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, team: targetTeam } : s))
    );
  };

  // Khôi phục lại phân tổ ban đầu
  const handleResetToOriginal = () => {
    setDraftStudents(students.map((s) => ({ ...s })));
    showNotice('Đã khôi phục lại phân tổ ban đầu của lớp.');
  };

  // Lưu và áp dụng
  const handleConfirmSave = () => {
    onSaveTeams(draftStudents);
    onClose();
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Xử lý Drag and Drop
  const handleDragStart = (studentId: string) => {
    setDraggedStudentId(studentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToTeam = (targetTeam: number) => {
    if (draggedStudentId) {
      handleMoveStudentToTeam(draggedStudentId, targetTeam);
      setDraggedStudentId(null);
    }
  };

  // Lọc học sinh theo từ khóa tìm kiếm (trong tab thủ công)
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return draftStudents;
    const q = searchQuery.toLowerCase().trim();
    return draftStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    );
  }, [draftStudents, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 text-[#1E3A8A] rounded-xl shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  Phân Chia Tổ Học Sinh • Lớp {className}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Tổng {draftStudents.length} học sinh
                </span>
                {changeCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    Đã đổi tổ {changeCount} em
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Hỗ trợ phân tổ tự động thông minh (cân bằng giới tính) hoặc kéo thả thủ công linh hoạt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switching: Tự Động vs Thủ Công */}
        <div className="px-6 pt-3 pb-0 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('auto')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'auto'
                  ? 'bg-white border-[#1E3A8A] text-[#1E3A8A] shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>1. Chia Tổ Tự Động Thông Minh</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-white border-[#1E3A8A] text-[#1E3A8A] shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
              <span>2. Quản Lý & Chuyển Tổ Thủ Công</span>
            </button>
          </div>

          {/* Nút Khôi phục ban đầu */}
          {changeCount > 0 && (
            <button
              onClick={handleResetToOriginal}
              className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Ban Đầu</span>
            </button>
          )}
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-900 font-semibold animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: CHIA TỔ TỰ ĐỘNG */}
          {activeTab === 'auto' && (
            <div className="space-y-5">
              {/* Khung cấu hình tham số tự động */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-200 pb-2">
                  <Sliders className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Chọn Phương Pháp & Số Lượng Tổ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Lựa chọn số lượng tổ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Số Lượng Tổ Thi Đua:
                    </label>
                    <select
                      value={numberOfTeams}
                      onChange={(e) => setNumberOfTeams(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="2">2 Tổ (Mỗi tổ ~{Math.ceil(draftStudents.length / 2)} em)</option>
                      <option value="3">3 Tổ (Mỗi tổ ~{Math.ceil(draftStudents.length / 3)} em)</option>
                      <option value="4">4 Tổ chuẩn (Mỗi tổ ~{Math.ceil(draftStudents.length / 4)} em)</option>
                      <option value="5">5 Tổ (Mỗi tổ ~{Math.ceil(draftStudents.length / 5)} em)</option>
                      <option value="6">6 Tổ (Mỗi tổ ~{Math.ceil(draftStudents.length / 6)} em)</option>
                    </select>
                  </div>

                  {/* Lựa chọn thuật toán */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Thuật Toán Phân Bổ:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAlgorithm('gender_balance')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          algorithm === 'gender_balance'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs">
                          <Scale className="w-3.5 h-3.5 text-blue-600" />
                          <span>Cân Bằng Nam - Nữ</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Chuẩn sư phạm: Tỷ lệ Nam/Nữ đồng đều ở mọi tổ
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAlgorithm('round_robin')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          algorithm === 'round_robin'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Tuần Tự Vòng Tròn</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Học sinh 1-&gt;Tổ 1, 2-&gt;Tổ 2, 3-&gt;Tổ 3, 4-&gt;Tổ 4...
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAlgorithm('consecutive')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          algorithm === 'consecutive'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs">
                          <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Theo Khối Liền Kề</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Chia từng khoảng STT liên tiếp vào từng tổ
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAlgorithm('random_shuffle')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          algorithm === 'random_shuffle'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-bold text-xs">
                          <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ngẫu Nhiên Bốc Thăm</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Xáo trộn danh sách ngẫu nhiên công bằng
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Nút hành động chia */}
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={handleExecuteAutoDivision}
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Thực Hiện Chia Tự Động</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BẢNG TỔNG QUAN TỶ LỆ CÂN ĐỐI TỪNG TỔ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-[#1E3A8A]" />
                    Xem Trước Cân Bằng Từng Tổ ({numberOfTeams} Tổ)
                  </span>
                  <span>Tổng: {draftStudents.length} học sinh</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {teamStats.map((st) => (
                    <div
                      key={st.team}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-blue-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-sm text-[#1E3A8A]">
                          Tổ {st.team}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800">
                          {st.total} học sinh
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="text-slate-600">Nam:</span>
                          <strong className="text-blue-700">{st.maleCount}</strong>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                          <span className="text-slate-600">Nữ:</span>
                          <strong className="text-pink-700">{st.femaleCount}</strong>
                        </div>
                      </div>

                      {/* Thanh phân bố tỷ lệ nam nữ */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{
                            width: st.total > 0 ? `${(st.maleCount / st.total) * 100}%` : '50%',
                          }}
                        ></div>
                        <div
                          className="bg-pink-400 h-full transition-all"
                          style={{
                            width: st.total > 0 ? `${(st.femaleCount / st.total) * 100}%` : '50%',
                          }}
                        ></div>
                      </div>

                      {/* Danh sách tóm tắt tên các em trong tổ */}
                      <div className="pt-1 text-[11px] text-slate-500 line-clamp-2">
                        {st.students.map((s) => s.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ & CHUYỂN TỔ THỦ CÔNG (KANBAN COLUMNS) */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Hướng dẫn & Tìm kiếm học sinh */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50 rounded-xl p-3 border border-blue-200/60">
                <div className="flex items-center space-x-2 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Mẹo:</strong> Kéo thả thẻ học sinh vào cột tổ mong muốn, hoặc click vào nút
                    đổi tổ trên thẻ học sinh để chuyển nhanh.
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh học sinh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* BẢNG CÁC CỘT TỔ (KANBAN COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {teamStats.map((st) => {
                  const teamStudentsInColumn = filteredStudents.filter(
                    (s) => s.team === st.team
                  );

                  return (
                    <div
                      key={st.team}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropToTeam(st.team)}
                      className="bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200 p-3 flex flex-col min-h-[380px] max-h-[500px]"
                    >
                      {/* Header Cột Tổ */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#1E3A8A]">
                            Tổ {st.team}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span>Nam: <strong className="text-blue-600">{st.maleCount}</strong></span>
                            <span>•</span>
                            <span>Nữ: <strong className="text-pink-600">{st.femaleCount}</strong></span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                          {st.total} em
                        </span>
                      </div>

                      {/* Danh sách học sinh trong tổ */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {teamStudentsInColumn.length === 0 ? (
                          <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl p-3">
                            <ArrowRightLeft className="w-5 h-5 mb-1 text-slate-300" />
                            <span>Kéo thả học sinh vào đây</span>
                          </div>
                        ) : (
                          teamStudentsInColumn.map((s, idx) => (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={() => handleDragStart(s.id)}
                              className={`bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing hover:border-blue-400 select-none ${
                                draggedStudentId === s.id ? 'opacity-40 scale-95' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      #{idx + 1}
                                    </span>
                                    <span className="font-bold text-xs text-slate-900">
                                      {s.name}
                                    </span>
                                  </div>
                                  {s.notes && (
                                    <span className="inline-block text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                                      {s.notes}
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                    s.gender === 'Nữ'
                                      ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {s.gender}
                                </span>
                              </div>

                              {/* Thanh nút chuyển nhanh sang tổ khác */}
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 text-[10px]">Chuyển sang:</span>
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: numberOfTeams }, (_, i) => i + 1)
                                    .filter((tNum) => tNum !== st.team)
                                    .map((tNum) => (
                                      <button
                                        key={tNum}
                                        type="button"
                                        onClick={() => handleMoveStudentToTeam(s.id, tNum)}
                                        className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-[#1E3A8A] hover:text-white text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                                        title={`Chuyển em ${s.name} sang Tổ ${tNum}`}
                                      >
                                        T{tNum}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-slate-500 text-xs flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-[#1E3A8A]" />
            <span>
              {changeCount > 0 ? (
                <>
                  Có <strong>{changeCount}</strong> học sinh được thay đổi tổ so với danh sách cũ
                </>
              ) : (
                'Chưa có thay đổi nào'
              )}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              onClick={handleConfirmSave}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu & Áp Dụng Phân Chia Tổ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
