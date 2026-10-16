import React, { useState } from 'react';
import { ClassInfo, Student, StudentScoreSummary, TeamScoreSummary, EvaluationPeriod } from '../types';
import { X, Printer, FileText, CheckCircle } from 'lucide-react';
import { exportToPdf } from '../utils/exportPdf';

interface PrintReportViewProps {
  classId: string;
  students: Student[];
  classInfo: ClassInfo;
  studentSummaries: StudentScoreSummary[];
  teamSummaries: TeamScoreSummary[];
  period?: EvaluationPeriod;
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  classId,
  students,
  classInfo,
  studentSummaries,
  teamSummaries,
  period,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedMsg, setExportedMsg] = useState(false);

  const handlePrint = () => {
    // In riêng vùng báo cáo, không in toàn bộ ứng dụng. Cách này tránh CSS/layout
    // của trang chính làm bản xem trước chỉ còn tiêu đề và chân trang trình duyệt.
    const report = document.getElementById('report-print-content');
    if (!report) {
      console.error('Không tìm thấy vùng nội dung báo cáo để in.');
      window.alert('Không tìm thấy nội dung báo cáo. Vui lòng đóng cửa sổ này và mở lại báo cáo.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=850');
    if (!printWindow) {
      window.alert('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép cửa sổ bật lên rồi thử lại.');
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('\\n');

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Báo cáo lớp ${String(classInfo.className || '').replace(/[<>&"]/g, '')} - ${String(classInfo.teacherName || '').replace(/[<>&"]/g, '')}</title>
          ${styles}
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            html, body { background: #fff !important; color: #111827 !important; margin: 0 !important; padding: 0 !important; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #report-print-content { display: block !important; visibility: visible !important; position: static !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: 0 !important; }
            #report-print-content * { visibility: visible !important; }
            .print\\:hidden, button { display: none !important; }
            table { border-collapse: collapse; max-width: 100%; }
            tr, img { break-inside: avoid; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div id="report-print-content">${report.innerHTML}</div>
          <script>
            window.addEventListener('load', function () {
              setTimeout(function () { window.focus(); window.print(); }, 400);
            });
            window.addEventListener('afterprint', function () { window.close(); });
          </script>
        </body>
      </html>`);
    printWindow.document.close();
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportToPdf(classInfo, studentSummaries, teamSummaries, period, classId);
      setExportedMsg(true);
      setTimeout(() => setExportedMsg(false), 3000);
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Ưu tiên sơ đồ đã lưu của đúng lớp; nếu chưa lưu/không đọc được thì dựng sơ đồ tạm
  // từ danh sách học sinh hiện tại để bản in không bị trắng.
  const seatingPlan = (() => {
    try {
      const raw = localStorage.getItem(`smartclass_seating_plan_v1_${classId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.seats) && parsed.seats.length) return parsed as { rows: number; columns: number; seats: Array<{ desk: number; studentIds: string[] }> };
      }
    } catch (error) { console.warn('Không đọc được sơ đồ đã lưu; sẽ dựng sơ đồ tạm.', error); }
    const perDesk = 2;
    const columns = 4;
    const count = Math.max(24, Math.ceil(students.length / perDesk));
    const seats = Array.from({ length: count }, (_, index) => ({
      desk: index + 1,
      studentIds: students.slice(index * perDesk, index * perDesk + perDesk).map(student => String(student.id))
    }));
    return { rows: Math.ceil(count / columns), columns, seats };
  })();
  const seatingStudentMap = new Map(students.map(student => [String(student.id), student]));

  const locationStr = classInfo.location?.trim() || 'Phước Sơn';

  const avgClassScore = (
    studentSummaries.reduce((sum, s) => sum + s.totalScore, 0) / (studentSummaries.length || 1)
  ).toFixed(2);

  const totalUnexcused = studentSummaries.reduce(
    (sum, s) => sum + s.attendanceStats.unexcused,
    0
  );
  const totalLate = studentSummaries.reduce((sum, s) => sum + s.attendanceStats.late, 0);

  const selectedWeek = period?.type === 'week' ? period.weekNumber : classInfo.weekNumber;
  let reportTitle = `BÁO CÁO ĐÁNH GIÁ NỀ NẾP & RÈN LUYỆN THI ĐUA TUẦN ${selectedWeek}`;
  let reportSubtitle = `(Thời gian theo dõi từ ngày ${classInfo.weekStartDate} đến ngày ${classInfo.weekEndDate} — ${classInfo.semester})`;

  if (period?.type === 'month') {
    reportTitle = `TỔNG KẾT THI ĐUA & XẾP HẠNG THÁNG ${period.month} — NĂM HỌC ${classInfo.academicYear}`;
    reportSubtitle = `(Bảng tổng kết thi đua tháng ${period.month} — Lớp ${classInfo.className})`;
  } else if (period?.type === 'year') {
    reportTitle = `BẢNG VÀNG DANH DỰ TỔNG KẾT THI ĐUA CẢ NĂM HỌC ${classInfo.academicYear}`;
    reportSubtitle = `(Bảng xếp hạng chung cuộc cả năm học — Lớp ${classInfo.className})`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Thanh công cụ khi xem trước (ẩn khi in) */}
      <div className="max-w-4xl mx-auto mb-4 bg-white p-3 rounded-xl shadow-lg flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#1E3A8A] text-sm">
            Xem Trước Bản In A4 Chuẩn Tiếng Việt
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            (Hỗ trợ in trực tiếp hoặc lưu PDF qua trình duyệt)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {exportedMsg && (
            <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 mr-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Đã xuất PDF!</span>
            </span>
          )}
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{isExporting ? 'Đang tạo PDF...' : 'Tải File PDF (.pdf)'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Lệnh In Ngay</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KHUNG A4 VĂN BẢN SƯ PHẠM */}
      <div id="report-print-content" className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-2xl rounded-xl print:shadow-none print:p-0 print:m-0 text-slate-900 border border-slate-200 print:border-none">
        {/* Phần đầu Quốc hiệu Tiêu ngữ & Tên Trường */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-300">
          <div className="text-center">
            <p className="text-xs uppercase font-bold text-slate-600 tracking-wider">
              SỞ GIÁO DỤC VÀ ĐÀO TẠO
            </p>
            <p className="text-sm uppercase font-extrabold text-[#1E3A8A]">
              {classInfo.schoolName}
            </p>
            <p className="text-xs font-semibold text-slate-700">
              LỚP: {classInfo.className} — NĂM HỌC: {classInfo.academicYear}
            </p>
            <div className="w-24 h-0.5 bg-slate-400 mx-auto mt-1"></div>
          </div>

          <div className="text-center">
            <p className="text-xs uppercase font-bold text-slate-900 tracking-wider">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-xs font-bold text-slate-900">
              Độc lập - Tự do - Hạnh phúc
            </p>
            <div className="w-32 h-0.5 bg-slate-900 mx-auto mt-1"></div>
            <p className="text-xs italic text-slate-500 mt-2">
              {locationStr}, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{' '}
              {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Tiêu đề chính */}
        <div className="text-center py-6">
          <h1 className="text-xl font-black text-[#1E3A8A] uppercase tracking-wide">
            {reportTitle}
          </h1>
          <p className="text-xs italic text-slate-600 mt-1">
            {reportSubtitle}
          </p>
          <div className="flex justify-center items-center space-x-6 text-xs font-semibold text-slate-700 mt-3">
            <span>GVCN: <strong>{classInfo.teacherName}</strong></span>
            <span>•</span>
            <span>Sĩ số: <strong>{studentSummaries.length}</strong></span>
            <span>•</span>
            <span>Điểm TB Lớp: <strong className="text-[#1E3A8A]">{avgClassScore}đ</strong></span>
          </div>
        </div>

        {/* 1. Kết quả thi đua theo Tổ */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-2">
            I. KẾT QUẢ THI ĐUA CÁC TỔ
          </h2>
          <table className="w-full text-xs text-center border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#1E3A8A] text-white">
                <th className="border border-slate-400 py-1.5 px-2">Xếp Hạng</th>
                <th className="border border-slate-400 py-1.5 px-2 text-left">Tên Tổ</th>
                <th className="border border-slate-400 py-1.5 px-2">Sĩ Số</th>
                <th className="border border-slate-400 py-1.5 px-2">Tổng Điểm Cộng</th>
                <th className="border border-slate-400 py-1.5 px-2">Tổng Điểm Trừ</th>
                <th className="border border-slate-400 py-1.5 px-2">Điểm Trung Bình</th>
                <th className="border border-slate-400 py-1.5 px-2">Đánh Giá</th>
              </tr>
            </thead>
            <tbody>
              {teamSummaries.map((t) => (
                <tr key={t.team} className="hover:bg-slate-50">
                  <td className="border border-slate-300 py-1 px-2 font-bold text-[#1E3A8A]">
                    {t.rank === 1 ? '★ Hạng 1' : `Hạng ${t.rank}`}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-left font-semibold">
                    Tổ {t.team}
                  </td>
                  <td className="border border-slate-300 py-1 px-2">{t.memberCount} học sinh</td>
                  <td className="border border-slate-300 py-1 px-2 text-emerald-700 font-bold">
                    +{t.totalBonus}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 text-rose-700 font-bold">
                    -{t.totalPenalty}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 font-extrabold text-[#1E3A8A]">
                    {t.averageScore.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 py-1 px-2 font-medium">
                    {t.rank === 1 ? 'Xuất sắc nhất' : t.averageScore >= 90 ? 'Tốt' : 'Khá'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. Bảng xếp hạng chi tiết học sinh */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-2">
            II. BẢNG CHI TIẾT ĐIỂM RÈN LUYỆN VÀ THỨ HẠNG HỌC SINH
          </h2>
          <table className="w-full text-xs text-center border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold">
                <th className="border border-slate-300 py-1 px-1">Hạng</th>
                <th className="border border-slate-300 py-1 px-2 text-left">Họ và Tên</th>
                <th className="border border-slate-300 py-1 px-1">Tổ</th>
                <th className="border border-slate-300 py-1 px-1">Điểm Gốc</th>
                <th className="border border-slate-300 py-1 px-1">+ Thưởng</th>
                <th className="border border-slate-300 py-1 px-1">- Phạt</th>
                <th className="border border-slate-300 py-1 px-1">- Chuyên Cần</th>
                <th className="border border-slate-300 py-1 px-1">Tổng Điểm</th>
                <th className="border border-slate-300 py-1 px-2">Xếp Loại</th>
                <th className="border border-slate-300 py-1 px-2 text-left">Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {studentSummaries.map((s) => {
                const attPenalty =
                  s.attendanceStats.unexcused * 5 + s.attendanceStats.late * 2;
                return (
                  <tr key={s.student.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1 px-1 font-bold">
                      {s.rank}
                    </td>
                    <td className="border border-slate-300 py-1 px-2 text-left font-semibold">
                      {s.student.name}
                    </td>
                    <td className="border border-slate-300 py-1 px-1">Tổ {s.student.team}</td>
                    <td className="border border-slate-300 py-1 px-1 text-slate-500">100</td>
                    <td className="border border-slate-300 py-1 px-1 text-emerald-700 font-bold">
                      {s.totalBonus > 0 ? `+${s.totalBonus}` : '0'}
                    </td>
                    <td className="border border-slate-300 py-1 px-1 text-rose-700 font-bold">
                      {s.totalPenalty - attPenalty > 0 ? `-${s.totalPenalty - attPenalty}` : '0'}
                    </td>
                    <td className="border border-slate-300 py-1 px-1 text-amber-700">
                      {attPenalty > 0 ? `-${attPenalty}` : '0'}
                    </td>
                    <td className="border border-slate-300 py-1 px-1 font-black text-[#1E3A8A]">
                      {s.totalScore}
                    </td>
                    <td className="border border-slate-300 py-1 px-2 font-bold">
                      {s.category}
                    </td>
                    <td className="border border-slate-300 py-1 px-2 text-left text-slate-600 text-[11px]">
                      {s.student.notes || (s.rank <= 3 ? 'Khen ngợi gương mẫu' : '')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 3. Nhận xét của GVCN */}
        <div className="border border-slate-300 bg-slate-50/50 p-4 rounded-lg mb-8">
          <p className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1">
            III. NHẬN XÉT & ĐÁNH GIÁ CỦA GIÁO VIÊN CHỦ NHIỆM
          </p>
          <p className="text-xs leading-relaxed text-slate-800 text-justify">
            {classInfo.teacherComment}
          </p>
        </div>

        {/* 4. Sơ đồ chỗ ngồi học sinh */}
        <section className="mt-8 break-before-page" aria-label="Sơ đồ chỗ ngồi học sinh">
          <h2 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-wide mb-3">IV. SƠ ĐỒ CHỖ NGỒI HỌC SINH</h2>
          <div className="border border-slate-300 rounded-lg p-3 bg-white">
            <div className="mx-auto mb-4 max-w-md rounded-md bg-slate-800 py-2 text-center text-sm font-bold text-white">BẢNG GIÁO VIÊN</div>
            {seatingPlan?.seats?.length ? (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(8, seatingPlan.columns || 4))}, minmax(0, 1fr))` }}>
                {seatingPlan.seats.map((seat) => (
                  <div key={seat.desk} className="min-h-[66px] rounded-md border border-slate-300 bg-slate-50 p-2 text-center">
                    <div className="mb-1 text-[10px] font-bold text-slate-500">BÀN {seat.desk}</div>
                    {(seat.studentIds || []).map((studentId, slot) => {
                      const student = seatingStudentMap.get(String(studentId));
                      return <div key={`${seat.desk}-${slot}`} className="truncate text-[10px] font-medium text-slate-800">{student?.name || (studentId ? 'Học sinh' : 'Trống')}</div>;
                    })}
                    {!(seat.studentIds || []).length && <div className="text-[10px] text-slate-400">Trống</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-slate-500">Chưa có sơ đồ chỗ ngồi được lưu trên thiết bị này. Vui lòng vào mục Sơ đồ lớp học và nhấn “Lưu sơ đồ”, sau đó mở lại báo cáo.</p>
            )}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">Lớp: {classInfo.className} · GVCN: {classInfo.teacherName} · Năm học: {classInfo.academicYear}</p>
        </section>

        {/* 5. Ký tên phê duyệt */}
        <div className="grid grid-cols-3 gap-4 text-center pt-2">
          <div>
            <p className="text-xs font-bold uppercase text-slate-700">
              ĐẠI DIỆN PHỤ HUYNH
            </p>
            <p className="text-[11px] italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-16"></div>
            <p className="text-xs text-slate-400">....................................</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-700">LỚP TRƯỞNG</p>
            <p className="text-[11px] italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-16"></div>
            <p className="text-xs font-bold text-slate-800">
              {classInfo.officerAssignments?.find((o) => o.roleType === 'lop_truong')?.studentName || 'Nguyễn Văn An'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-[#1E3A8A]">
              GIÁO VIÊN CHỦ NHIỆM
            </p>
            <p className="text-[11px] italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-16"></div>
            <p className="text-xs font-bold text-[#1E3A8A]">{classInfo.teacherName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
