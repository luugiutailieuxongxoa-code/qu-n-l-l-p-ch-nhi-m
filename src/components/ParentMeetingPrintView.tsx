import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  CheckCircle,
  Scissors,
  Settings2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Building2,
  Users,
  Copy,
  Check,
  Share2,
  LayoutTemplate,
} from 'lucide-react';
import {
  ClassInfo,
  Student,
  StudentScoreSummary,
  ParentMeetingInvitationConfig,
  OCCASION_PRESETS,
} from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface ParentMeetingPrintViewProps {
  classInfo: ClassInfo;
  students: Student[];
  studentSummaries: StudentScoreSummary[];
  config: ParentMeetingInvitationConfig;
  targetStudentIds: string[];
  onClose: () => void;
  onOpenSettings: () => void;
}

export const ParentMeetingPrintView: React.FC<ParentMeetingPrintViewProps> = ({
  classInfo,
  students,
  studentSummaries,
  config,
  targetStudentIds,
  onClose,
  onOpenSettings,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportedMsg, setExportedMsg] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [viewMode, setViewMode] = useState<'class_general' | 'individual'>(
    config.recipientMode === 'class_general' ? 'class_general' : 'individual'
  );
  const [currentLayoutMode, setCurrentLayoutMode] = useState<
    'single_full' | 'two_per_page' | 'a5_landscape'
  >(config.layoutMode || 'two_per_page');

  // Lọc danh sách học sinh cần in (cho chế độ in từng em)
  const targetStudents = students.filter((s) => targetStudentIds.includes(s.id));
  const activeStudents = targetStudents.length > 0 ? targetStudents : students;

  const boysCount = students.filter((s) => s.gender === 'Nam').length;
  const girlsCount = students.filter((s) => s.gender === 'Nữ').length;

  const handlePrint = () => {
    window.print();
  };

  // Phân tích ngày họp
  const parseMeetingDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return { day, month, year };
      }
    } catch (e) {}
    const now = new Date();
    return {
      day: String(now.getDate()).padStart(2, '0'),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      year: String(now.getFullYear()),
    };
  };

  const meetingDateParsed = parseMeetingDate(config.meetingDate);
  const issueDateParsed = parseMeetingDate(
    config.issueDate || new Date().toISOString().slice(0, 10)
  );

  const occasionInfo = OCCASION_PRESETS[config.occasion] || OCCASION_PRESETS.cuoi_ky_1;

  // Sao chép tin nhắn Zalo gửi phụ huynh cả lớp
  const handleCopyZaloMessage = () => {
    const text = `📢 THÔNG BÁO: GIẤY MỜI HỌP PHỤ HUYNH HỌC SINH
LỚP: ${classInfo.className} — TRƯỜNG: ${classInfo.schoolName}
Năm học: ${classInfo.academicYear}

Kính gửi: ${config.generalRecipientTitle || `Toàn thể Quý bậc Cha mẹ Học sinh Lớp ${classInfo.className}`}

Thực hiện kế hoạch năm học của nhà trường, Giáo viên chủ nhiệm Lớp ${classInfo.className} trân trọng kính mời toàn thể Quý bậc Cha mẹ học sinh tới tham dự buổi Họp Cha Mẹ Học sinh định kỳ:

⏰ Thời gian: ${config.meetingTime} (${config.meetingDayOfWeek || 'Chủ nhật'}), ngày ${meetingDateParsed.day}/${meetingDateParsed.month}/${meetingDateParsed.year}
📍 Địa điểm: ${config.locationDetail}
👨‍🏫 Chủ trì: Thầy/Cô ${config.signerName} (GVCN Lớp ${classInfo.className})
📞 Điện thoại liên hệ: ${config.teacherPhone}
👥 Sĩ số lớp: ${students.length} học sinh (${boysCount} Nam, ${girlsCount} Nữ)

📋 NỘI DUNG CHƯƠNG TRÌNH HỌP:
${config.agendaItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

📌 LƯU Ý DÀNH CHO QUÝ PHỤ HUYNH:
${config.classGeneralNote || config.notesForParents || 'Kính mong Quý Phụ huynh sắp xếp thời gian tham dự đúng giờ và đông đủ.'}

Trân trọng kính mời và rất mong được đón tiếp Quý Phụ huynh!
Giáo viên chủ nhiệm: ${config.signerName}`;

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportProgress('Đang chuẩn bị trang in...');
    try {
      const element = document.getElementById('parent-meeting-printable-area');
      if (!element) {
        alert('Không tìm thấy vùng dữ liệu in!');
        return;
      }

      const isA5Landscape = currentLayoutMode === 'a5_landscape';

      // Thu thập từng trang in độc lập để đảm bảo chia trang chuẩn xác
      const rawPages = Array.from(element.children) as HTMLElement[];
      const pagesToRender = rawPages.length > 0 ? rawPages : [element];

      const pdf = new jsPDF({
        orientation: isA5Landscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: isA5Landscape ? 'a5' : 'a4',
        compress: true,
      });

      const pdfWidth = 210; // Chiều rộng 210mm cho cả A4 đứng và A5 ngang
      const pdfHeight = isA5Landscape ? 148.5 : 297; // A5 ngang: 148.5mm, A4 đứng: 297mm

      for (let i = 0; i < pagesToRender.length; i++) {
        if (i > 0) {
          pdf.addPage(isA5Landscape ? 'a5' : 'a4', isA5Landscape ? 'landscape' : 'portrait');
        }
        setExportProgress(`Đang tạo trang ${i + 1}/${pagesToRender.length}...`);

        const pageEl = pagesToRender[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: isA5Landscape ? 1150 : 1024,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const canvasRatio = canvas.width / canvas.height;

        let printWidth = pdfWidth;
        let printHeight = printWidth / canvasRatio;

        if (printHeight > pdfHeight) {
          printHeight = pdfHeight;
          printWidth = printHeight * canvasRatio;
        }

        const marginX = (pdfWidth - printWidth) / 2;
        const marginY = (pdfHeight - printHeight) / 2;

        pdf.addImage(imgData, 'JPEG', marginX, marginY, printWidth, printHeight, undefined, 'FAST');
      }

      const filename =
        viewMode === 'class_general'
          ? `Giay_Moi_Hop_PH_Chung_Lop_${classInfo.className || '10A1'}${isA5Landscape ? '_A5_Ngang' : ''}.pdf`
          : `Giay_Moi_Hop_PH_Tung_Em_Lop_${classInfo.className || '10A1'}${isA5Landscape ? '_A5_Ngang' : ''}.pdf`;
      pdf.save(filename);

      setExportedMsg(true);
      setTimeout(() => setExportedMsg(false), 3500);
    } catch (err) {
      console.error('PDF export error:', err);
      alert(
        'Không thể tạo file PDF tự động. Quý Thầy/Cô vui lòng dùng nút "Lệnh In Ngay" và chọn "Lưu dưới dạng PDF" (Save as PDF) của trình duyệt.'
      );
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  // =========================================================================
  // 1. RENDER GIẤY MỜI PHỤ HUYNH CHUNG CHO CẢ LỚP (TẬP THỂ / THÔNG TRI)
  // =========================================================================
  const renderGeneralInvitation = (layout: 'single_full' | 'two_per_page' | 'a5_landscape') => {
    const isA5 = layout === 'a5_landscape';
    const isCompact = layout === 'two_per_page';

    return (
      <div
        className={`bg-white text-slate-900 mx-auto font-serif ${
          isA5
            ? 'p-4 sm:p-5 border border-slate-300 rounded-xl print:rounded-none print:border-none print:shadow-none print:p-4 text-[10px] sm:text-[10.5px] leading-snug relative w-full max-w-[210mm] min-h-[142mm] max-h-[148mm] flex flex-col justify-between shadow-sm box-border'
            : isCompact
            ? 'p-6 sm:p-7 border border-slate-300 rounded-none text-[11px] leading-relaxed relative min-h-[138mm]'
            : 'p-8 sm:p-12 border border-slate-300 rounded-xl text-xs sm:text-[13px] leading-relaxed shadow-sm min-h-[265mm] flex flex-col justify-between'
        }`}
        style={{
          fontFamily: `'Times New Roman', Times, 'Liberation Serif', serif`,
        }}
      >
        {/* PHẦN ĐẦU: CƠ QUAN BAN HÀNH & QUỐC HIỆU TIÊU NGỮ (NGHỊ ĐỊNH 30/2020/NĐ-CP) */}
        <div>
          <div className={`grid grid-cols-2 gap-4 ${isA5 ? 'pb-1' : 'pb-2'}`}>
            {/* Cột trái: Cơ quan & Số hiệu */}
            <div className="text-center flex flex-col items-center">
              <p className={`uppercase tracking-wider font-semibold text-slate-700 ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[10px] sm:text-[11px]'}`}>
                {config.schoolDepartmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}
              </p>
              <p className={`uppercase font-bold text-[#1E3A8A] ${isA5 ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'}`}>
                {classInfo.schoolName}
              </p>
              <p className={`font-bold text-slate-800 ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
                LỚP: {classInfo.className}
              </p>
              <div className={`${isA5 ? 'w-16 h-[1px] my-0.5' : 'w-20 sm:w-24 h-[1px] my-1'} bg-slate-800`}></div>
              <p className={`italic text-slate-600 ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[10px] sm:text-[11px]'}`}>
                Số: {config.documentNumber || `01/GM-${classInfo.className}`}
              </p>
            </div>

            {/* Cột phải: Quốc hiệu, Tiêu ngữ, Ngày tháng */}
            <div className="text-center flex flex-col items-center">
              <p className={`uppercase font-bold text-slate-900 tracking-wider ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[10px] sm:text-[11px]'}`}>
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>
              <p className={`font-bold text-slate-900 ${isA5 ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'}`}>
                Độc lập - Tự do - Hạnh phúc
              </p>
              <div className={`${isA5 ? 'w-24 h-[1px] my-0.5' : 'w-28 sm:w-32 h-[1px] my-1'} bg-slate-900`}></div>
              <p className={`italic text-slate-600 ${isA5 ? 'text-[9px] sm:text-[9.5px] mt-0.5' : 'text-[10px] sm:text-[11px] mt-0.5'}`}>
                {config.issuePlace || classInfo.location || 'Phước Sơn'}, ngày {issueDateParsed.day} tháng{' '}
                {issueDateParsed.month} năm {issueDateParsed.year}
              </p>
            </div>
          </div>

          {/* TIÊU ĐỀ GIẤY MỜI CHUNG */}
          <div className={`text-center ${isA5 ? 'my-1 sm:my-1.5' : 'my-3 sm:my-4'}`}>
            <h2 className={`uppercase font-extrabold tracking-wider text-slate-900 ${isA5 ? 'text-sm sm:text-[15px]' : 'text-base sm:text-lg'}`}>
              GIẤY MỜI HỌP PHỤ HUYNH HỌC SINH
            </h2>
            <p className={`font-bold uppercase text-[#1E3A8A] mt-0.5 tracking-wide ${isA5 ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-xs'}`}>
              (TOÀN THỂ PHỤ HUYNH LỚP {classInfo.className})
            </p>
            <p className={`font-medium italic text-slate-700 mt-0.5 ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
              Về việc tham dự phiên Họp Cha Mẹ Học Sinh định kỳ ({occasionInfo.label}, Năm học {classInfo.academicYear})
            </p>
          </div>

          {/* KÍNH GỬI CHUNG TOÀN LỚP */}
          <div className={`bg-blue-50/50 rounded-lg border border-blue-200/70 ${isA5 ? 'p-1.5 sm:p-2 mb-1.5' : 'p-2.5 sm:p-3 mb-3 sm:mb-4'}`}>
            <div className="flex items-start justify-between">
              <p className="text-justify leading-relaxed">
                <strong>Kính gửi:</strong>{' '}
                <strong className={`uppercase text-[#1E3A8A] underline decoration-blue-400 underline-offset-2 ${isA5 ? 'text-xs' : 'text-sm'}`}>
                  {config.generalRecipientTitle || `Toàn thể Quý bậc Cha mẹ Học sinh Lớp ${classInfo.className}`}
                </strong>
              </p>
            </div>
            <p className={`text-slate-700 mt-0.5 ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
              Trường: <strong>{classInfo.schoolName}</strong> — Niên khóa: <strong>{classInfo.academicYear}</strong>
            </p>
          </div>

          {/* LỜI DẪN & NỘI DUNG CHÍNH */}
          <div className={`${isA5 ? 'space-y-1 sm:space-y-1.5' : 'space-y-2 sm:space-y-2.5'} text-justify`}>
            <p className={`${isA5 ? 'leading-tight' : ''}`}>
              Thực hiện kế hoạch năm học của Ban Giám hiệu nhà trường và kế hoạch hoạt động của lớp chủ nhiệm, nhằm tăng cường sự phối hợp đồng bộ giữa Gia đình và Nhà trường trong công tác giáo dục toàn diện học sinh; Giáo viên chủ nhiệm Lớp <strong>{classInfo.className}</strong> trân trọng kính mời toàn thể Quý bậc Cha mẹ học sinh tới tham dự buổi Họp Cha Mẹ Học sinh định kỳ của tập thể lớp với các nội dung cụ thể như sau:
            </p>

            {/* I. THÔNG TIN CHUNG TẬP THỂ LỚP */}
            {config.includeClassStatisticsInGeneral !== false && (
              <div className={`border-l-2 border-emerald-600 pl-2.5 py-0.5 bg-emerald-50/30 rounded-r-md ${isA5 ? 'space-y-0.5' : 'space-y-1'}`}>
                <p className={`font-bold text-slate-900 uppercase tracking-wide flex items-center justify-between ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
                  <span>I. Thông tin chung về tập thể Lớp {classInfo.className}:</span>
                  <span className={`text-emerald-800 font-semibold normal-case ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[10px] sm:text-[11px]'}`}>
                    Sĩ số: <strong>{students.length} học sinh</strong> (Nam: {boysCount}, Nữ: {girlsCount})
                  </span>
                </p>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-800 ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[11px] sm:text-xs'}`}>
                  <div>
                    • <strong>Giáo viên chủ nhiệm:</strong> Thầy/Cô {config.signerName || classInfo.teacherName}
                  </div>
                  <div>
                    • <strong>Điện thoại liên hệ:</strong>{' '}
                    <span className="font-bold text-blue-900">{config.teacherPhone}</span>
                  </div>
                  <div>
                    • <strong>Năm học:</strong> {classInfo.academicYear}
                  </div>
                  <div>
                    • <strong>Ban cán sự:</strong> Đón tiếp và hỗ trợ phụ huynh tại phòng học
                  </div>
                </div>
              </div>
            )}

            {/* II. THỜI GIAN & ĐỊA ĐIỂM */}
            <div className={`border-l-2 border-[#1E3A8A] pl-2.5 py-0.5 bg-blue-50/40 rounded-r-md ${isA5 ? 'space-y-0.5' : 'space-y-1'}`}>
              <p className={`font-bold text-slate-900 uppercase tracking-wide ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
                II. Thời gian và Địa điểm tổ chức:
              </p>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-800 ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[11px] sm:text-xs'}`}>
                <div>
                  • <strong>Thời gian:</strong> {config.meetingTime} ({config.meetingDayOfWeek || 'Chủ nhật'}), ngày{' '}
                  <strong>
                    {meetingDateParsed.day}/{meetingDateParsed.month}/{meetingDateParsed.year}
                  </strong>
                </div>
                <div>
                  • <strong>Địa điểm:</strong> {config.locationDetail}
                </div>
                <div>
                  • <strong>Chủ trì phiên họp:</strong> Thầy/Cô {config.signerName} (GVCN Lớp {classInfo.className})
                </div>
                <div>
                  • <strong>Thành phần tham dự:</strong> Toàn thể Quý cha mẹ học sinh và Ban đại diện CMHS lớp
                </div>
              </div>
            </div>

            {/* III. CHƯƠNG TRÌNH PHIÊN HỌP */}
            <div className={`${isA5 ? 'space-y-0.5 pt-0.5' : 'space-y-1 pt-1'}`}>
              <p className={`font-bold text-slate-900 uppercase tracking-wide ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
                III. Nội dung và Chương trình làm việc:
              </p>
              <ol className={`list-decimal list-inside pl-1 text-slate-800 ${isA5 ? 'space-y-0.5 text-[9px] sm:text-[9.5px] leading-tight' : 'space-y-0.5 text-slate-800 leading-snug'}`}>
                {config.agendaItems.map((item, idx) => (
                  <li key={idx}>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* IV. LƯU Ý CHUNG CHO PHỤ HUYNH */}
            <div className={`text-slate-700 bg-slate-50 rounded border border-slate-200/80 ${isA5 ? 'p-1.5 text-[8.5px] sm:text-[9px] leading-tight' : 'p-2 text-[10px] sm:text-[11px] pt-1'}`}>
              <p>
                * <strong>Lưu ý dành cho Quý phụ huynh:</strong>{' '}
                {config.classGeneralNote ||
                  config.notesForParents ||
                  'Kính mong Quý Phụ huynh sắp xếp thời gian tham dự đông đủ, đúng giờ, mang theo sổ liên lạc/ghi chép và gửi xe theo hướng dẫn của nhà trường. Sự hiện diện và đóng góp ý kiến của Quý Phụ huynh là nguồn động viên to lớn giúp tập thể lớp hoàn thành xuất sắc nhiệm vụ năm học.'}
              </p>
            </div>
          </div>
        </div>

        {/* PHẦN KÝ TÊN GVCN & NƠI NHẬN */}
        <div className={`${isA5 ? 'pt-2 mt-1' : 'pt-4 sm:pt-6 mt-3'} border-t border-slate-200/60`}>
          <div className="grid grid-cols-2 gap-4">
            {/* Cột trái: Nơi nhận */}
            <div className={`text-slate-600 space-y-0.5 self-end pb-1 ${isA5 ? 'text-[8.5px] sm:text-[9px]' : 'text-[10px] sm:text-[11px]'}`}>
              <p className="font-bold text-slate-800 italic">Nơi nhận:</p>
              <p>- Như kính gửi;</p>
              <p>- Ban Giám hiệu (để báo cáo);</p>
              <p>- Ban đại diện CMHS lớp;</p>
              <p>- Dán bảng tin lớp học;</p>
              <p>- Lưu: Hồ sơ lớp chủ nhiệm.</p>
            </div>

            {/* Cột phải: Chữ ký Giáo viên chủ nhiệm */}
            <div className="text-center flex flex-col items-center">
              <p className={`uppercase font-extrabold text-slate-900 tracking-wider ${isA5 ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-xs'}`}>
                {config.signerTitle || 'GIÁO VIÊN CHỦ NHIỆM'}
              </p>
              <p className={`italic text-slate-500 ${isA5 ? 'text-[8.5px] sm:text-[9px]' : 'text-[10px] sm:text-[11px]'}`}>
                (Ký và ghi rõ họ tên)
              </p>

              {/* KHU VỰC HIỂN THỊ CHỮ KÝ */}
              <div className={`w-full flex flex-col items-center justify-center my-0.5 relative ${isA5 ? 'h-11 sm:h-13' : 'h-16 sm:h-20 my-1'}`}>
                {config.signatureType === 'electronic_stylized' && (
                  <div className="flex flex-col items-center justify-center">
                    <span
                      className={`italic tracking-wider text-[#1E3A8A] font-medium ${isA5 ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}
                      style={{
                        fontFamily: `'Dancing Script', 'Brush Script MT', cursive, serif`,
                      }}
                    >
                      {config.signerName}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-sans font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center space-x-1 mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Xác thực số: {classInfo.className}</span>
                    </span>
                  </div>
                )}

                {(config.signatureType === 'canvas_drawn' ||
                  config.signatureType === 'uploaded_image') &&
                  config.signatureDataUrl && (
                    <img
                      src={config.signatureDataUrl}
                      alt="Chữ ký GVCN"
                      className={`object-contain mix-blend-multiply drop-shadow-2xs select-none ${isA5 ? 'max-h-11 sm:max-h-13 max-w-[150px]' : 'max-h-16 sm:max-h-20 max-w-[190px]'}`}
                    />
                  )}

                {config.signatureType === 'blank_for_pen' && (
                  <div className="h-full"></div>
                )}
              </div>

              {/* Họ tên GVCN */}
              <p className={`font-bold text-slate-900 uppercase ${isA5 ? 'text-xs sm:text-[12.5px]' : 'text-xs sm:text-sm'}`}>
                {config.signerName || classInfo.teacherName}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 2. RENDER GIẤY MỜI RIÊNG TỪNG HỌC SINH (CÁ NHÂN HÓA)
  // =========================================================================
  const renderSingleInvitation = (
    student: Student,
    layout: 'single_full' | 'two_per_page' | 'a5_landscape'
  ) => {
    const isA5 = layout === 'a5_landscape';
    const isCompact = layout === 'two_per_page';
    const summary = studentSummaries.find((s) => s.student.id === student.id);

    return (
      <div
        key={student.id}
        className={`bg-white text-slate-900 mx-auto font-serif ${
          isA5
            ? 'p-4 sm:p-5 border border-slate-300 rounded-xl print:rounded-none print:border-none print:shadow-none print:p-4 text-[10px] sm:text-[10.5px] leading-snug relative w-full max-w-[210mm] min-h-[142mm] max-h-[148mm] flex flex-col justify-between shadow-sm box-border'
            : isCompact
            ? 'p-6 sm:p-7 border border-slate-300 rounded-none text-[11px] leading-relaxed relative min-h-[138mm]'
            : 'p-8 sm:p-12 border border-slate-300 rounded-xl text-xs sm:text-[13px] leading-relaxed shadow-sm min-h-[265mm] flex flex-col justify-between'
        }`}
        style={{
          fontFamily: `'Times New Roman', Times, 'Liberation Serif', serif`,
        }}
      >
        {/* PHẦN ĐẦU: CƠ QUAN BAN HÀNH & QUỐC HIỆU TIÊU NGỮ */}
        <div>
          <div className={`grid grid-cols-2 gap-4 ${isA5 ? 'pb-1' : 'pb-2'}`}>
            {/* Cột trái: Cơ quan & Số hiệu */}
            <div className="text-center flex flex-col items-center">
              <p className={`uppercase tracking-wider font-semibold text-slate-700 ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[10px] sm:text-[11px]'}`}>
                {config.schoolDepartmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}
              </p>
              <p className={`uppercase font-bold text-[#1E3A8A] ${isA5 ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'}`}>
                {classInfo.schoolName}
              </p>
              <p className={`font-bold text-slate-800 ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
                LỚP: {classInfo.className}
              </p>
              <div className={`${isA5 ? 'w-16 h-[1px] my-0.5' : 'w-20 sm:w-24 h-[1px] my-1'} bg-slate-800`}></div>
              <p className={`italic text-slate-600 ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[10px] sm:text-[11px]'}`}>
                Số: {config.documentNumber || `01/GM-${classInfo.className}`}
              </p>
            </div>

            {/* Cột phải: Quốc hiệu, Tiêu ngữ, Ngày tháng */}
            <div className="text-center flex flex-col items-center">
              <p className={`uppercase font-bold text-slate-900 tracking-wider ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[10px] sm:text-[11px]'}`}>
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </p>
              <p className={`font-bold text-slate-900 ${isA5 ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'}`}>
                Độc lập - Tự do - Hạnh phúc
              </p>
              <div className={`${isA5 ? 'w-24 h-[1px] my-0.5' : 'w-28 sm:w-32 h-[1px] my-1'} bg-slate-900`}></div>
              <p className={`italic text-slate-600 ${isA5 ? 'text-[9px] sm:text-[9.5px] mt-0.5' : 'text-[10px] sm:text-[11px] mt-0.5'}`}>
                {config.issuePlace || classInfo.location || 'Phước Sơn'}, ngày {issueDateParsed.day} tháng{' '}
                {issueDateParsed.month} năm {issueDateParsed.year}
              </p>
            </div>
          </div>

          {/* TIÊU ĐỀ GIẤY MỜI */}
          <div className={`text-center ${isA5 ? 'my-1 sm:my-1.5' : 'my-3 sm:my-4'}`}>
            <h2 className={`uppercase font-extrabold tracking-wider text-slate-900 ${isA5 ? 'text-sm sm:text-[15px]' : 'text-base sm:text-lg'}`}>
              GIẤY MỜI HỌP PHỤ HUYNH HỌC SINH
            </h2>
            <p className={`font-bold italic text-slate-800 mt-0.5 ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-xs sm:text-sm'}`}>
              Về việc tham dự phiên Họp Cha Mẹ Học sinh định kỳ ({occasionInfo.label}, Năm học {classInfo.academicYear})
            </p>
          </div>

          {/* KÍNH GỬI PHỤ HUYNH */}
          <div className={`bg-slate-50/70 rounded-lg border border-slate-200/80 ${isA5 ? 'p-1.5 sm:p-2 mb-1.5' : 'p-2.5 sm:p-3 mb-3 sm:mb-4'}`}>
            <p className="text-justify leading-relaxed">
              <strong>Kính gửi:</strong> Ông/Bà là Cha, Mẹ (hoặc Người giám hộ) của em:{' '}
              <strong className={`uppercase text-[#1E3A8A] underline decoration-slate-400 underline-offset-2 ${isA5 ? 'text-xs sm:text-[12.5px]' : 'text-sm'}`}>
                {student.name}
              </strong>
            </p>
            <p className={`text-slate-700 mt-0.5 ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
              Học sinh Lớp: <strong>{classInfo.className}</strong> — Tổ: <strong>Tổ {student.team}</strong> — Trường: <strong>{classInfo.schoolName}</strong>
            </p>
          </div>

          {/* LỜI DẪN & NỘI DUNG CHÍNH */}
          <div className={`${isA5 ? 'space-y-1 sm:space-y-1.5' : 'space-y-2 sm:space-y-2.5'} text-justify`}>
            <p className={`${isA5 ? 'leading-tight' : ''}`}>
              Thực hiện kế hoạch năm học của nhà trường và để tăng cường mối liên hệ phối hợp giáo dục giữa Gia đình và Nhà trường, Giáo viên chủ nhiệm Lớp <strong>{classInfo.className}</strong> trân trọng kính mời Ông/Bà tới tham dự buổi Họp Cha Mẹ Học sinh định kỳ với các nội dung cụ thể như sau:
            </p>

            {/* I. THỜI GIAN & ĐỊA ĐIỂM */}
            <div className={`border-l-2 border-[#1E3A8A] pl-2.5 py-0.5 bg-blue-50/30 rounded-r-md ${isA5 ? 'space-y-0.5' : 'space-y-1'}`}>
              <p className={`font-bold text-slate-900 uppercase tracking-wide ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
                I. Thời gian và Địa điểm tổ chức:
              </p>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-800 ${isA5 ? 'text-[9px] sm:text-[9.5px]' : 'text-[11px] sm:text-xs'}`}>
                <div>
                  • <strong>Thời gian:</strong> {config.meetingTime} ({config.meetingDayOfWeek || 'Chủ nhật'}), ngày{' '}
                  <strong>
                    {meetingDateParsed.day}/{meetingDateParsed.month}/{meetingDateParsed.year}
                  </strong>
                </div>
                <div>
                  • <strong>Địa điểm:</strong> {config.locationDetail}
                </div>
                <div>
                  • <strong>Chủ trì phiên họp:</strong> Thầy/Cô {config.signerName} (GVCN)
                </div>
                <div>
                  • <strong>Điện thoại liên hệ:</strong>{' '}
                  <span className="font-bold text-blue-900">{config.teacherPhone}</span>
                </div>
              </div>
            </div>

            {/* II. CHƯƠNG TRÌNH PHIÊN HỌP */}
            <div className={`${isA5 ? 'space-y-0.5 pt-0.5' : 'space-y-1 pt-1'}`}>
              <p className={`font-bold text-slate-900 uppercase tracking-wide ${isA5 ? 'text-[9.5px] sm:text-[10px]' : 'text-[11px] sm:text-xs'}`}>
                II. Nội dung và Chương trình làm việc:
              </p>
              <ol className={`list-decimal list-inside pl-1 text-slate-800 ${isA5 ? 'space-y-0.5 text-[9px] sm:text-[9.5px] leading-tight' : 'space-y-0.5 leading-snug'}`}>
                {config.agendaItems.map((item, idx) => (
                  <li key={idx}>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* III. (TÙY CHỌN) TÓM TẮT KẾT QUẢ CỦA HỌC SINH */}
            {config.includeStudentScoreSummary && summary && (
              <div className={`bg-slate-50 border border-slate-200 rounded ${isA5 ? 'p-1.5 text-[8.5px] sm:text-[9px] space-y-0.5' : 'mt-2 p-2 text-[10px] sm:text-[11px] space-y-1'}`}>
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>* Tóm tắt nề nếp rèn luyện của học sinh {student.name}:</span>
                  <span className="font-mono text-blue-800">
                    Điểm thi đua: <strong>{summary.totalScore}đ</strong> (Xếp hạng: #{summary.rank}/{studentSummaries.length} — Loại: {summary.category})
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <span>
                    • Chuyên cần: Nghỉ {summary.attendanceStats.unexcused + summary.attendanceStats.excused} buổi (Có phép: {summary.attendanceStats.excused}, Không phép: {summary.attendanceStats.unexcused}), Trễ: {summary.attendanceStats.late} lần.
                  </span>
                  {student.notes && (
                    <span className="italic">• Ghi chú: {student.notes}</span>
                  )}
                </div>
              </div>
            )}

            {/* IV. LƯU Ý PHỤ HUYNH */}
            <p className={`italic text-slate-700 ${isA5 ? 'pt-0.5 text-[8.5px] sm:text-[9px]' : 'pt-1 text-[10px] sm:text-[11px]'}`}>
              * <strong>Lưu ý:</strong> {config.notesForParents}
            </p>
          </div>
        </div>

        {/* PHẦN KÝ TÊN GVCN & NƠI NHẬN */}
        <div className={`${isA5 ? 'pt-2 mt-1' : 'pt-4 sm:pt-6 mt-3'} border-t border-slate-200/60`}>
          <div className="grid grid-cols-2 gap-4">
            {/* Cột trái: Nơi nhận */}
            <div className={`text-slate-600 space-y-0.5 self-end pb-1 ${isA5 ? 'text-[8.5px] sm:text-[9px]' : 'text-[10px] sm:text-[11px]'}`}>
              <p className="font-bold text-slate-800 italic">Nơi nhận:</p>
              <p>- Như kính gửi;</p>
              <p>- Ban Giám hiệu (để báo cáo);</p>
              <p>- Lưu: Hồ sơ lớp chủ nhiệm.</p>
            </div>

            {/* Cột phải: Chữ ký Giáo viên chủ nhiệm */}
            <div className="text-center flex flex-col items-center">
              <p className={`uppercase font-extrabold text-slate-900 tracking-wider ${isA5 ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-xs'}`}>
                {config.signerTitle || 'GIÁO VIÊN CHỦ NHIỆM'}
              </p>
              <p className={`italic text-slate-500 ${isA5 ? 'text-[8.5px] sm:text-[9px]' : 'text-[10px] sm:text-[11px]'}`}>
                (Ký và ghi rõ họ tên)
              </p>

              {/* KHU VỰC HIỂN THỊ CHỮ KÝ */}
              <div className={`w-full flex flex-col items-center justify-center my-0.5 relative ${isA5 ? 'h-11 sm:h-13' : 'h-16 sm:h-20 my-1'}`}>
                {config.signatureType === 'electronic_stylized' && (
                  <div className="flex flex-col items-center justify-center">
                    <span
                      className={`italic tracking-wider text-[#1E3A8A] font-medium ${isA5 ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}
                      style={{
                        fontFamily: `'Dancing Script', 'Brush Script MT', cursive, serif`,
                      }}
                    >
                      {config.signerName}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-sans font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center space-x-1 mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Xác thực số: {classInfo.className}</span>
                    </span>
                  </div>
                )}

                {(config.signatureType === 'canvas_drawn' ||
                  config.signatureType === 'uploaded_image') &&
                  config.signatureDataUrl && (
                    <img
                      src={config.signatureDataUrl}
                      alt="Chữ ký GVCN"
                      className={`object-contain mix-blend-multiply drop-shadow-2xs select-none ${isA5 ? 'max-h-11 sm:max-h-13 max-w-[150px]' : 'max-h-16 sm:max-h-20 max-w-[190px]'}`}
                    />
                  )}

                {config.signatureType === 'blank_for_pen' && (
                  <div className="h-full"></div>
                )}
              </div>

              {/* Họ tên GVCN */}
              <p className={`font-bold text-slate-900 uppercase ${isA5 ? 'text-xs sm:text-[12.5px]' : 'text-xs sm:text-sm'}`}>
                {config.signerName || classInfo.teacherName}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs overflow-y-auto p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      <style>
        {currentLayoutMode === 'a5_landscape'
          ? `@page { size: A5 landscape; margin: 8mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`
          : `@page { size: A4 portrait; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}
      </style>

      {/* THANH CÔNG CỤ ĐIỀU KHIỂN XEM TRƯỚC VÀ IN (ẨN KHI IN) */}
      <div className="max-w-5xl mx-auto mb-4 bg-white p-3 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 print:hidden border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-[#1E3A8A] flex items-center space-x-2">
              <span>Xem Trước Bản In Giấy Mời Họp Phụ Huynh</span>
              {viewMode === 'class_general' ? (
                <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  Bản Chung Cả Lớp
                </span>
              ) : (
                <span className="text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                  Bản Từng Em ({activeStudents.length})
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Lớp {classInfo.className} • {classInfo.schoolName} • Thể thức văn bản chuẩn Nghị định 30/2020/NĐ-CP
            </p>
          </div>
        </div>

        {/* Lựa chọn chế độ & Nút bấm */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chuyển đổi giữa Bản Chung Cả Lớp và Bản Từng Học Sinh */}
          <div className="flex items-center bg-blue-50/90 p-1 rounded-xl border border-blue-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('class_general')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'class_general'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-blue-900 hover:bg-blue-100/70'
              }`}
              title="Xem và in Giấy mời phụ huynh chung cho toàn thể lớp"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bản Chung Cả Lớp</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'individual'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-blue-900 hover:bg-blue-100/70'
              }`}
              title="Xem và in Giấy mời riêng từng học sinh"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bản Từng Em ({activeStudents.length})</span>
            </button>
          </div>

          {/* Chuyển đổi bố cục in: 2 bản/A4, A5 ngang, 1 bản/A4 */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCurrentLayoutMode('two_per_page')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                currentLayoutMode === 'two_per_page'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="In 2 giấy mời trên 1 tờ A4 (tiết kiệm giấy)"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>2 Bản/A4</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentLayoutMode('a5_landscape')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                currentLayoutMode === 'a5_landscape'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Bản in trang A5 in ngang (khổ 210 x 148 mm)"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Trang A5 Ngang</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentLayoutMode('single_full')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                currentLayoutMode === 'single_full'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="In 1 giấy mời đầy đủ trên 1 tờ A4"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1 Bản/A4</span>
            </button>
          </div>

          {/* Nút sao chép tin nhắn Zalo gửi phụ huynh */}
          <button
            type="button"
            onClick={handleCopyZaloMessage}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-200"
            title="Sao chép nội dung tin nhắn đã định dạng sẵn để dán vào nhóm Zalo phụ huynh"
          >
            {copiedZalo ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã Chép Zalo!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Chép Tin Zalo</span>
              </>
            )}
          </button>

          {/* Nút sửa mẫu & chữ ký */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Sửa Mẫu & Chữ Ký</span>
          </button>

          {exportedMsg && (
            <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Đã tải PDF!</span>
            </span>
          )}

          {/* Tải PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isExporting ? (exportProgress || 'Đang xuất PDF...') : 'Tải File PDF'}</span>
          </button>

          {/* Lệnh In Ngay */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Lệnh In Ngay (Ctrl+P)</span>
          </button>

          {/* Đóng */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* VÙNG CHỨA NỘI DUNG IN CHUẨN A4 / A5 */}
      <div
        id="parent-meeting-printable-area"
        className={`${currentLayoutMode === 'a5_landscape' ? 'max-w-[210mm]' : 'max-w-4xl'} mx-auto print:max-w-none print:w-full space-y-8 print:space-y-0`}
      >
        {viewMode === 'class_general' ? (
          // ==========================================
          // A. CHẾ ĐỘ GIẤY MỜI CHUNG TOÀN THỂ LỚP
          // ==========================================
          currentLayoutMode === 'a5_landscape' ? (
            // 1 Bản A5 in ngang chuẩn khổ A5
            <div
              className="bg-white rounded-2xl shadow-xl print:shadow-none border border-slate-200 print:border-none p-4 print:p-0 print:break-after-page print:page-break-after-always"
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              {renderGeneralInvitation('a5_landscape')}
            </div>
          ) : currentLayoutMode === 'single_full' ? (
            // 1 Bản A4 to đẹp đầy đủ
            <div
              className="print:break-after-page print:page-break-after-always"
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              {renderGeneralInvitation('single_full')}
            </div>
          ) : (
            // 2 Bản trên 1 trang A4 (kèm đường cắt)
            <div
              className="bg-white rounded-2xl shadow-xl print:shadow-none border border-slate-200 print:border-none p-4 sm:p-6 print:p-0 print:break-after-page print:page-break-after-always"
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              {renderGeneralInvitation('two_per_page')}

              {/* Đường nét đứt cắt kéo ở giữa trang A4 */}
              <div className="my-4 sm:my-5 flex items-center justify-center relative select-none">
                <div className="w-full border-b-2 border-dashed border-slate-400"></div>
                <div className="absolute bg-white px-3 text-[10px] font-bold text-slate-500 flex items-center space-x-1.5 uppercase tracking-wider border border-slate-200 rounded-full py-0.5">
                  <Scissors className="w-3 h-3 text-slate-600" />
                  <span>Đường cắt chia đôi trang A4 (1 Bản Dán Bảng Tin • 1 Bản Lưu Hồ Sơ)</span>
                </div>
              </div>

              {renderGeneralInvitation('two_per_page')}
            </div>
          )
        ) : (
          // ==========================================
          // B. CHẾ ĐỘ GIẤY MỜI RIÊNG TỪNG HỌC SINH
          // ==========================================
          currentLayoutMode === 'a5_landscape' ? (
            // Mỗi trang là 1 bản A5 in ngang riêng cho từng học sinh
            activeStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl shadow-xl print:shadow-none border border-slate-200 print:border-none p-4 print:p-0 print:break-after-page print:page-break-after-always"
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                {renderSingleInvitation(student, 'a5_landscape')}
              </div>
            ))
          ) : currentLayoutMode === 'single_full' ? (
            // Mỗi trang A4 là 1 bản giấy mời riêng
            activeStudents.map((student) => (
              <div
                key={student.id}
                className="print:break-after-page print:page-break-after-always"
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                {renderSingleInvitation(student, 'single_full')}
              </div>
            ))
          ) : (
            // 2 bản giấy mời riêng trên 1 trang A4
            Array.from({ length: Math.ceil(activeStudents.length / 2) }).map(
              (_, pageIdx) => {
                const student1 = activeStudents[pageIdx * 2];
                const student2 = activeStudents[pageIdx * 2 + 1];

                return (
                  <div
                    key={pageIdx}
                    className="bg-white rounded-2xl shadow-xl print:shadow-none border border-slate-200 print:border-none p-4 sm:p-6 print:p-0 print:break-after-page print:page-break-after-always"
                    style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
                  >
                    {/* Giấy mời 1 */}
                    {student1 && renderSingleInvitation(student1, 'two_per_page')}

                    {/* Đường nét đứt cắt kéo ở giữa trang A4 */}
                    <div className="my-4 sm:my-5 flex items-center justify-center relative select-none">
                      <div className="w-full border-b-2 border-dashed border-slate-400"></div>
                      <div className="absolute bg-white px-3 text-[10px] font-bold text-slate-500 flex items-center space-x-1.5 uppercase tracking-wider border border-slate-200 rounded-full py-0.5">
                        <Scissors className="w-3 h-3 text-slate-600" />
                        <span>Đường cắt chia đôi trang A4</span>
                      </div>
                    </div>

                    {/* Giấy mời 2 (nếu có) */}
                    {student2 ? (
                      renderSingleInvitation(student2, 'two_per_page')
                    ) : (
                      <div className="min-h-[120mm] border border-dashed border-slate-200 rounded p-6 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                        (Phần giấy trống - Có thể dùng làm phiếu phản hồi hoặc lưu trữ)
                      </div>
                    )}
                  </div>
                );
              }
            )
          )
        )}
      </div>
    </div>
  );
};
