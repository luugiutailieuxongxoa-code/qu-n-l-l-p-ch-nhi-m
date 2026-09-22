import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  Users,
  Award,
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  CalendarDays,
} from 'lucide-react';
import {
  StudentScoreSummary,
  TeamScoreSummary,
  RankCategory,
  BehaviorLog,
  AttendanceRecord,
  EvaluationPeriod,
  ClassInfo,
  CurrentUserSession,
} from '../types';
import { PeriodSelector } from './PeriodSelector';

interface LeaderboardTabProps {
  studentSummaries: StudentScoreSummary[];
  teamSummaries: TeamScoreSummary[];
  logs: BehaviorLog[];
  attendance: AttendanceRecord[];
  currentPeriod: EvaluationPeriod;
  onChangePeriod: (period: EvaluationPeriod) => void;
  classInfo: ClassInfo;
  currentSession: CurrentUserSession;
  onToggleLockPeriod?: (period: EvaluationPeriod, lock: boolean) => void;
  onOpenPeriodLockModal?: () => void;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  studentSummaries,
  teamSummaries,
  logs,
  attendance,
  currentPeriod,
  onChangePeriod,
  classInfo,
  currentSession,
  onToggleLockPeriod,
  onOpenPeriodLockModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'team'>('individual');
  const [filterCategory, setFilterCategory] = useState<RankCategory | 'all'>('all');
  const [filterTeam, setFilterTeam] = useState<number | 'all'>('all');
  const [selectedStudentForDetail, setSelectedStudentForDetail] =
    useState<StudentScoreSummary | null>(null);

  // Lọc học sinh
  const filteredStudents = studentSummaries.filter((s) => {
    const matchCat = filterCategory === 'all' || s.category === filterCategory;
    const matchTeam = filterTeam === 'all' || s.student.team === filterTeam;
    return matchCat && matchTeam;
  });

  // Top 3 học sinh
  const top3 = studentSummaries.slice(0, 3);

  const getPeriodHeading = () => {
    if (currentPeriod.type === 'month') {
      return `Tổng Kết Thi Đua & Xếp Hạng Tháng ${currentPeriod.month}`;
    }
    if (currentPeriod.type === 'year') {
      return `Bảng Vàng Thi Đua Chung Cuộc Cả Năm Học ${classInfo.academicYear}`;
    }
    return `Bảng Xếp Hạng Thi Đua Tuần ${currentPeriod.weekNumber}`;
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>Hạng 1</span>
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs">
            <Medal className="w-3.5 h-3.5 text-slate-600 fill-slate-400" />
            <span>Hạng 2</span>
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
            <Medal className="w-3.5 h-3.5 text-amber-700 fill-amber-600" />
            <span>Hạng 3</span>
          </span>
        );
      default:
        return (
          <span className="text-xs font-bold text-slate-600 px-2 py-0.5 rounded bg-slate-100">
            #{rank}
          </span>
        );
    }
  };

  const getCategoryTag = (category: RankCategory) => {
    switch (category) {
      case 'Xuất sắc':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Xuất sắc</span>
          </span>
        );
      case 'Tốt':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Tốt</span>
          </span>
        );
      case 'Đạt':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span>Đạt</span>
          </span>
        );
      case 'Cần rèn luyện':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span>Cần rèn luyện</span>
          </span>
        );
    }
  };

  // Thống kê nhanh theo kỳ
  const totalBonusPoints = studentSummaries.reduce((sum, s) => sum + s.totalBonus, 0);
  const totalPenaltyPoints = studentSummaries.reduce((sum, s) => sum + s.totalPenalty, 0);
  const avgClassScore = (
    studentSummaries.reduce((sum, s) => sum + s.totalScore, 0) / (studentSummaries.length || 1)
  ).toFixed(2);

  return (
    <div className="space-y-6">
      {/* BỘ CHỌN KỲ THI ĐUA: TUẦN / THÁNG / CẢ NĂM HỌC */}
      <PeriodSelector
        currentPeriod={currentPeriod}
        onChangePeriod={onChangePeriod}
        academicYear={classInfo.academicYear}
        defaultWeek={classInfo.weekNumber}
        classInfo={classInfo}
        currentSession={currentSession}
        onToggleLockPeriod={onToggleLockPeriod}
        onOpenPeriodLockModal={onOpenPeriodLockModal}
      />

      {/* TOP BANNER TỔNG KẾT & PODIUM */}
      <div className="bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-indigo-950 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[11px] font-black uppercase tracking-wider">
                  {currentPeriod.type === 'year'
                    ? 'Chung cuộc cả năm'
                    : currentPeriod.type === 'month'
                    ? `Tháng ${currentPeriod.month}`
                    : `Tuần ${currentPeriod.weekNumber}`}
                </span>
                <span className="text-xs text-blue-200">
                  Lớp {classInfo.className} • Năm học {classInfo.academicYear}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
                {getPeriodHeading()}
              </h2>
            </div>

            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/15">
              <div className="text-right">
                <p className="text-[11px] text-blue-200">Điểm Trung Bình Lớp</p>
                <p className="text-lg font-black text-amber-300">{avgClassScore} / 100</p>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <div>
                <p className="text-[11px] text-blue-200">Điểm Thưởng / Phạt</p>
                <p className="text-xs font-bold text-emerald-300">
                  +{totalBonusPoints}đ{' '}
                  <span className="text-rose-300 font-semibold">(-{totalPenaltyPoints}đ)</span>
                </p>
              </div>
            </div>
          </div>

          {/* PODIUM TOP 3 */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto pt-2 pb-1 items-end">
              {/* Hạng 2 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm sm:text-base border-2 border-white shadow-md">
                  🥈
                </div>
                <div className="mt-2 text-center">
                  <p className="font-bold text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[140px]">
                    {top3[1].student.name}
                  </p>
                  <p className="text-[11px] text-blue-200">Tổ {top3[1].student.team}</p>
                  <div className="mt-1 bg-white/20 rounded-lg py-1 px-2">
                    <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                      {top3[1].totalScore}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Hạng 1 */}
              <div className="flex flex-col items-center -translate-y-2">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-base sm:text-xl border-4 border-amber-300 shadow-xl ring-4 ring-amber-400/30">
                    👑
                  </div>
                  <Trophy className="w-5 h-5 text-amber-300 absolute -top-3 -right-1" />
                </div>
                <div className="mt-2 text-center">
                  <p className="font-black text-xs sm:text-base truncate max-w-[110px] sm:max-w-[160px] text-amber-300">
                    {top3[0].student.name}
                  </p>
                  <p className="text-xs text-blue-200">Tổ {top3[0].student.team}</p>
                  <div className="mt-1 bg-amber-400/90 text-slate-950 rounded-lg py-1 px-3 shadow-md">
                    <span className="text-xs sm:text-base font-black">
                      {top3[0].totalScore}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Hạng 3 */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-700/80 text-amber-100 flex items-center justify-center font-bold text-sm sm:text-base border-2 border-white shadow-md">
                  🥉
                </div>
                <div className="mt-2 text-center">
                  <p className="font-bold text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[140px]">
                    {top3[2].student.name}
                  </p>
                  <p className="text-[11px] text-blue-200">Tổ {top3[2].student.team}</p>
                  <div className="mt-1 bg-white/20 rounded-lg py-1 px-2">
                    <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                      {top3[2].totalScore}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHUYỂN ĐỔI BẢNG CÁ NHÂN / BẢNG TỔ */}
      <div className="flex items-center justify-between">
        <div className="flex p-1 bg-slate-200/80 rounded-xl">
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'individual'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Xếp Hạng Cá Nhân ({studentSummaries.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('team')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'team'
                ? 'bg-white text-[#1E3A8A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Thi Đua Theo Tổ (4 Tổ)</span>
          </button>
        </div>
      </div>

      {/* NỘI DUNG 1: BẢNG XẾP HẠNG CÁ NHÂN */}
      {activeSubTab === 'individual' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          {/* Bộ lọc nhanh theo Xếp loại và Tổ */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-500">Xếp loại:</span>
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({studentSummaries.length})
              </button>
              <button
                onClick={() => setFilterCategory('Xuất sắc')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === 'Xuất sắc'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Xuất sắc (≥100đ)
              </button>
              <button
                onClick={() => setFilterCategory('Tốt')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === 'Tốt'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Tốt (90 - 99đ)
              </button>
              <button
                onClick={() => setFilterCategory('Đạt')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === 'Đạt'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                Đạt (80 - 89đ)
              </button>
              <button
                onClick={() => setFilterCategory('Cần rèn luyện')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === 'Cần rèn luyện'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Cần rèn luyện (&lt;80đ)
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Lọc tổ:</span>
              <select
                value={filterTeam}
                onChange={(e) =>
                  setFilterTeam(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              >
                <option value="all">Tất cả các tổ</option>
                <option value={1}>Tổ 1</option>
                <option value={2}>Tổ 2</option>
                <option value={3}>Tổ 3</option>
                <option value={4}>Tổ 4</option>
              </select>
            </div>
          </div>

          {/* Bảng danh sách học sinh */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center">Hạng</th>
                  <th className="py-3 px-3">Học Sinh</th>
                  <th className="py-3 px-2 text-center">Tổ</th>
                  <th className="py-3 px-2 text-center">Gốc</th>
                  <th className="py-3 px-2 text-center text-emerald-700">+ Thưởng</th>
                  <th className="py-3 px-2 text-center text-rose-700">- Phạt</th>
                  <th className="py-3 px-2 text-center text-amber-700">- Chuyên cần</th>
                  <th className="py-3 px-3 text-center text-[#1E3A8A]">Tổng Điểm</th>
                  <th className="py-3 px-3 text-center">Danh Hiệu</th>
                  <th className="py-3 px-2 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((item) => {
                  const attPenalty =
                    item.attendanceStats.unexcused * 5 + item.attendanceStats.late * 2;
                  const rulePenalty = item.totalPenalty - attPenalty;

                  return (
                    <tr
                      key={item.student.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedStudentForDetail(item)}
                    >
                      <td className="py-3 px-3 text-center">{getRankBadge(item.rank)}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 group-hover:text-[#1E3A8A]">
                          {item.student.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.student.gender} • {item.student.notes || 'Không có ghi chú'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-slate-700">
                        Tổ {item.student.team}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-500">{item.baseScore}</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-600">
                        {item.totalBonus > 0 ? `+${item.totalBonus}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-rose-600">
                        {rulePenalty > 0 ? `-${rulePenalty}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-amber-700">
                        {attPenalty > 0 ? `-${attPenalty}` : '0'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-sm font-black px-2 py-0.5 rounded-lg ${
                            item.totalScore >= 100
                              ? 'bg-amber-100 text-amber-900'
                              : item.totalScore >= 90
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {item.totalScore}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">{getCategoryTag(item.category)}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          className="p-1.5 text-slate-400 hover:text-[#1E3A8A] rounded-lg hover:bg-slate-100 transition-colors"
                          title="Xem sổ ghi chép chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NỘI DUNG 2: BẢNG XẾP HẠNG THI ĐUA CÁC TỔ */}
      {activeSubTab === 'team' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamSummaries.map((team) => {
              const isWinner = team.rank === 1;

              return (
                <div
                  key={team.team}
                  className={`bg-white rounded-2xl p-5 border shadow-xs transition-all relative ${
                    isWinner
                      ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-50/30'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {isWinner && (
                    <div className="absolute -top-3 right-4 bg-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
                      <Trophy className="w-3 h-3" />
                      <span>Dẫn Đầu Kỳ Thi Đua</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-[#1E3A8A]">
                      Tổ {team.team}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isWinner
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Hạng {team.rank}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Sĩ số thành viên:</span>
                      <strong className="text-slate-900">{team.memberCount} học sinh</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Tổng điểm thưởng:</span>
                      <strong className="text-emerald-600 font-bold">+{team.totalBonus}đ</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Tổng điểm trừ:</span>
                      <strong className="text-rose-600 font-bold">-{team.totalPenalty}đ</strong>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Điểm Trung Bình:</span>
                      <span className="text-base font-black text-[#1E3A8A]">
                        {team.averageScore.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐIỂM HỌC SINH */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedStudentForDetail.student.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Tổ {selectedStudentForDetail.student.team} • Xếp hạng {selectedStudentForDetail.rank} ({selectedStudentForDetail.category})
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Thống kê điểm */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Điểm gốc</span>
                <strong className="text-sm text-slate-800">100</strong>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <span className="text-emerald-700 block text-[11px]">Thưởng</span>
                <strong className="text-sm text-emerald-700">
                  +{selectedStudentForDetail.totalBonus}
                </strong>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <span className="text-rose-700 block text-[11px]">Trừ</span>
                <strong className="text-sm text-rose-700">
                  -{selectedStudentForDetail.totalPenalty}
                </strong>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <span className="text-[#1E3A8A] block text-[11px]">Tổng kết</span>
                <strong className="text-base text-[#1E3A8A] font-black">
                  {selectedStudentForDetail.totalScore}
                </strong>
              </div>
            </div>

            {/* Thống kê chuyên cần */}
            <div className="text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5">
              <div className="font-bold text-slate-800">Thống kê chuyên cần trong kỳ:</div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>Có mặt: <strong>{selectedStudentForDetail.attendanceStats.present} buổi</strong></div>
                <div>Đi trễ: <strong className="text-amber-700">{selectedStudentForDetail.attendanceStats.late} buổi</strong></div>
                <div>Vắng không phép: <strong className="text-rose-700">{selectedStudentForDetail.attendanceStats.unexcused} buổi</strong></div>
              </div>
            </div>

            {/* Danh sách các lần ghi nhận trong kỳ */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Lịch sử hành vi đã ghi nhận ({logs.filter((l) => l.studentId === selectedStudentForDetail.student.id).length}):
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {logs
                  .filter((l) => l.studentId === selectedStudentForDetail.student.id)
                  .map((log) => (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        log.type === 'bonus'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{log.actionName}</span>
                        {log.note && <p className="text-[11px] text-slate-500">{log.note}</p>}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.date} {log.weekNumber ? `(Tuần ${log.weekNumber})` : ''} • Người ghi:{' '}
                          {log.recordedBy || 'GVCN'}
                        </div>
                      </div>
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded ${
                          log.type === 'bonus'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {log.type === 'bonus' ? `+${log.points}` : `-${log.points}`}đ
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
