import * as XLSX from 'xlsx';
import { ClassInfo, StudentScoreSummary, TeamScoreSummary, EvaluationPeriod } from '../types';

export const exportToExcel = (
  classInfo: ClassInfo,
  studentSummaries: StudentScoreSummary[],
  teamSummaries: TeamScoreSummary[],
  period?: EvaluationPeriod
): void => {
  // Chuẩn bị dữ liệu mảng 2 chiều cho bảng tính
  const rows: any[][] = [];

  // Xác định tiêu đề báo cáo theo kỳ
  const selectedWeek = period?.type === 'week' ? period.weekNumber : classInfo.weekNumber;
  let reportMainTitle = `BÁO CÁO TỔNG KẾT THI ĐUA & NỀ NẾP HỌC SINH TUẦN ${selectedWeek}`;
  let periodSubtitle = `Tuần: ${selectedWeek} (${classInfo.weekStartDate} đến ${classInfo.weekEndDate}) - ${classInfo.semester}`;
  let filenameSuffix = `Tuan_${selectedWeek}`;

  if (period?.type === 'month') {
    reportMainTitle = `BÁO CÁO TỔNG KẾT THI ĐUA & XẾP HẠNG THÁNG ${period.month}`;
    periodSubtitle = `Kỳ thi đua tháng ${period.month} - Năm học ${classInfo.academicYear}`;
    filenameSuffix = `Thang_${period.month}`;
  } else if (period?.type === 'year') {
    reportMainTitle = `BẢNG VÀNG TỔNG KẾT THI ĐUA TOÀN DIỆN CẢ NĂM HỌC ${classInfo.academicYear}`;
    periodSubtitle = `Tổng kết cả năm học - Năm học ${classInfo.academicYear}`;
    filenameSuffix = `Ca_Nam_Hoc`;
  }

  // 1. Tiêu đề cơ quan & thông tin báo cáo
  rows.push([classInfo.schoolName.toUpperCase(), '', '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM']);
  rows.push([`LỚP: ${classInfo.className} - NĂM HỌC ${classInfo.academicYear}`, '', '', '', '', 'Độc lập - Tự do - Hạnh phúc']);
  rows.push([]);
  rows.push(['', '', reportMainTitle, '', '']);
  rows.push(['', '', periodSubtitle, '', '']);
  rows.push([
    `Giáo viên chủ nhiệm: ${classInfo.teacherName}`,
    '',
    `Sĩ số: ${studentSummaries.length} học sinh`,
    '',
    `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`,
  ]);
  rows.push([]);

  // 2. Tiêu đề cột học sinh
  rows.push([
    'STT',
    'Họ và tên',
    'Giới tính',
    'Tổ',
    'Vắng KP',
    'Vắng CP',
    'Đi trễ',
    'Điểm gốc',
    'Tổng điểm cộng',
    'Tổng điểm trừ',
    'Điểm tổng kết',
    'Thứ hạng',
    'Phân loại danh hiệu',
    'Ghi chú',
  ]);

  // 3. Dữ liệu học sinh (theo thứ hạng)
  studentSummaries.forEach((s, index) => {
    rows.push([
      index + 1,
      s.student.name,
      s.student.gender,
      `Tổ ${s.student.team}`,
      s.attendanceStats.unexcused,
      s.attendanceStats.excused,
      s.attendanceStats.late,
      s.baseScore,
      s.totalBonus > 0 ? `+${s.totalBonus}` : 0,
      s.totalPenalty > 0 ? `-${s.totalPenalty}` : 0,
      s.totalScore,
      `Hạng ${s.rank}`,
      s.category,
      s.student.notes || '',
    ]);
  });

  // Hàng thống kê tổng kết
  const avgClassScore = (
    studentSummaries.reduce((sum, s) => sum + s.totalScore, 0) / (studentSummaries.length || 1)
  ).toFixed(2);
  const totalUnexcused = studentSummaries.reduce((sum, s) => sum + s.attendanceStats.unexcused, 0);
  const totalLate = studentSummaries.reduce((sum, s) => sum + s.attendanceStats.late, 0);

  rows.push([]);
  rows.push([
    'TỔNG HỢP LỚP',
    '',
    '',
    '',
    totalUnexcused,
    '',
    totalLate,
    '',
    '',
    '',
    avgClassScore,
    'ĐTB',
    '',
    '',
  ]);
  rows.push([]);

  // 4. Bảng xếp hạng tổ
  rows.push(['BẢNG TỔNG KẾT THI ĐUA THEO TỔ']);
  rows.push(['Xếp hạng', 'Tổ', 'Sĩ số', 'Điểm cộng', 'Điểm trừ', 'Điểm trung bình tổ', 'Đánh giá']);
  teamSummaries.forEach((t) => {
    rows.push([
      `Hạng ${t.rank}`,
      `Tổ ${t.team}`,
      t.memberCount,
      `+${t.totalBonus}`,
      `-${t.totalPenalty}`,
      t.averageScore.toFixed(2),
      t.rank === 1 ? 'Xuất sắc nhất' : t.averageScore >= 90 ? 'Tốt' : 'Khá',
    ]);
  });

  rows.push([]);
  rows.push(['NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM:']);
  rows.push([classInfo.teacherComment]);
  rows.push([]);
  rows.push(['ĐẠI DIỆN PHỤ HUYNH', '', 'LỚP TRƯỞNG', '', '', 'GIÁO VIÊN CHỦ NHIỆM']);
  rows.push(['(Ký và ghi rõ họ tên)', '', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)']);
  rows.push(['', '', '', '', '', classInfo.teacherName]);

  // Tạo workbook và sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Căn chỉnh độ rộng các cột (Auto fit / Pre-set width)
  ws['!cols'] = [
    { wch: 6 }, // STT
    { wch: 24 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 10 }, // Tổ
    { wch: 10 }, // Vắng KP
    { wch: 10 }, // Vắng CP
    { wch: 10 }, // Đi trễ
    { wch: 10 }, // Điểm gốc
    { wch: 14 }, // Tổng điểm cộng
    { wch: 14 }, // Tổng điểm trừ
    { wch: 14 }, // Điểm tổng kết
    { wch: 12 }, // Thứ hạng
    { wch: 18 }, // Danh hiệu
    { wch: 25 }, // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BaoCao_ThiDua');

  // Tạo tên file
  const safeClassName = classInfo.className.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bao_Cao_${safeClassName}_${filenameSuffix}.xlsx`;

  // Lưu file
  XLSX.writeFile(wb, fileName);
};
