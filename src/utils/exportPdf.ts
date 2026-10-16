import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { ClassInfo, StudentScoreSummary, TeamScoreSummary, EvaluationPeriod } from '../types';

/**
 * Xuất file PDF Báo Cáo Chuẩn Tiếng Việt 100%
 * Hỗ trợ theo Tuần, Tháng hoặc Tổng kết Cả Năm Học
 * Sử dụng html2canvas để render nguyên vẹn font chữ Unicode tiếng Việt có dấu,
 * biểu tượng, viền kẻ và bố cục chuẩn văn bản hành chính sư phạm A4.
 */
export const exportToPdf = async (
  classInfo: ClassInfo,
  studentSummaries: StudentScoreSummary[],
  teamSummaries: TeamScoreSummary[],
  period?: EvaluationPeriod
): Promise<void> => {
  // Tạo container tạm thời để html2canvas vẽ lại
  const container = document.createElement('div');
  container.id = 'pdf-render-container';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1120px'; // Khổ A4 Landscape tương ứng với tỉ lệ màn hình
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
  container.style.padding = '36px 44px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  const location = classInfo.location?.trim() || 'Phước Sơn';

  const avgClassScore = (
    studentSummaries.reduce((sum, s) => sum + s.totalScore, 0) / (studentSummaries.length || 1)
  ).toFixed(2);

  // Xác định tiêu đề theo kỳ thi đua
  const selectedWeek = period?.type === 'week' ? period.weekNumber : classInfo.weekNumber;
  let reportTitle = `BÁO CÁO ĐÁNH GIÁ NỀ NẾP & RÈN LUYỆN THI ĐUA TUẦN ${selectedWeek}`;
  let reportSubtitle = `(Thời gian theo dõi từ ngày ${classInfo.weekStartDate} đến ngày ${classInfo.weekEndDate} — ${classInfo.semester})`;
  let filenameSuffix = `Tuan_${selectedWeek}`;

  if (period?.type === 'month') {
    reportTitle = `TỔNG KẾT THI ĐUA & XẾP HẠNG THÁNG ${period.month} — NĂM HỌC ${classInfo.academicYear}`;
    reportSubtitle = `(Bảng tổng kết thi đua tháng ${period.month} — Lớp ${classInfo.className})`;
    filenameSuffix = `Thang_${period.month}`;
  } else if (period?.type === 'year') {
    reportTitle = `BẢNG VÀNG DANH DỰ TỔNG KẾT THI ĐUA CẢ NĂM HỌC ${classInfo.academicYear}`;
    reportSubtitle = `(Bảng xếp hạng chung cuộc cả năm học — Lớp ${classInfo.className})`;
    filenameSuffix = `Ca_Nam_Hoc`;
  }

  // Xây dựng template HTML chuẩn A4 Tiếng Việt
  container.innerHTML = `
    <div style="width: 100%; box-sizing: border-box; font-size: 12px; line-height: 1.4; color: #1e293b;">
      
      <!-- PHẦN ĐẦU TRANG: TÊN TRƯỜNG & QUỐC HIỆU TIÊU NGỮ -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="width: 48%; vertical-align: top; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 600;">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
            <div style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1e3a8a; margin-top: 2px;">
              ${classInfo.schoolName}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #334155; margin-top: 3px;">
              LỚP: ${classInfo.className} — NĂM HỌC: ${classInfo.academicYear}
            </div>
            <div style="width: 120px; height: 1px; background-color: #94a3b8; margin: 4px auto 0 auto;"></div>
          </td>
          <td style="width: 4%;"></td>
          <td style="width: 48%; vertical-align: top; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div style="width: 160px; height: 1.5px; background-color: #0f172a; margin: 4px auto 0 auto;"></div>
            <div style="font-size: 11px; font-style: italic; color: #64748b; margin-top: 6px;">
              ${location}, ngày ${day} tháng ${month} năm ${year}
            </div>
          </td>
        </tr>
      </table>

      <!-- TIÊU ĐỀ BÁO CÁO -->
      <div style="text-align: center; margin: 18px 0 14px 0;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px;">
          ${reportTitle}
        </h1>
        <div style="font-size: 11px; font-style: italic; color: #475569; margin-top: 4px;">
          ${reportSubtitle}
        </div>
        <div style="display: inline-flex; gap: 24px; font-size: 11px; font-weight: 600; color: #1e293b; margin-top: 6px; padding: 4px 16px; background-color: #f1f5f9; border-radius: 6px; border: 1px solid #e2e8f0;">
          <span>Giáo viên chủ nhiệm: <strong>${classInfo.teacherName}</strong></span>
          <span>Sĩ số: <strong>${studentSummaries.length} học sinh</strong></span>
          <span>Điểm trung bình lớp: <strong style="color: #1e3a8a;">${avgClassScore} / 100đ</strong></span>
        </div>
      </div>

      <!-- BẢNG TỔNG KẾT CÁC TỔ -->
      <div style="margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px;">
          I. KẾT QUẢ THI ĐUA THEO TỔ
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1.5px solid #cbd5e1; font-size: 11px;">
          <thead>
            <tr style="background-color: #1e3a8a; color: #ffffff;">
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; width: 60px;">Xếp Hạng</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: left;">Tên Tổ</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; width: 90px;">Sĩ Số</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; width: 100px;">Tổng Điểm Cộng</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; width: 100px;">Tổng Điểm Trừ</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; width: 120px;">Điểm Trung Bình</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; width: 110px;">Đánh Giá</th>
            </tr>
          </thead>
          <tbody>
            ${teamSummaries
              .map(
                (t, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: ${
                  t.rank === 1 ? '#d97706' : '#1e293b'
                };">
                  ${t.rank === 1 ? '★ Hạng 1' : `Hạng ${t.rank}`}
                </td>
                <td style="padding: 6px 12px; border: 1px solid #cbd5e1; text-align: left; font-weight: 600;">
                  Tổ ${t.team}
                </td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${t.memberCount} học sinh</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; color: #15803d; font-weight: bold;">+${
                  t.totalBonus
                }</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; color: #b91c1c; font-weight: bold;">-${
                  t.totalPenalty
                }</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 800; font-size: 12px; color: #1e3a8a;">
                  ${t.averageScore.toFixed(2)}
                </td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 600;">
                  ${
                    t.rank === 1
                      ? '<span style="color: #b45309;">Xuất sắc nhất</span>'
                      : t.averageScore >= 90
                      ? '<span style="color: #15803d;">Tốt</span>'
                      : '<span style="color: #475569;">Khá</span>'
                  }
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- BẢNG ĐÁNH GIÁ CHI TIẾT TỪNG HỌC SINH -->
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px;">
          II. BẢNG CHI TIẾT ĐIỂM RÈN LUYỆN & XẾP HẠNG HỌC SINH
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1.5px solid #cbd5e1; font-size: 10.5px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #0f172a; font-weight: bold;">
              <th style="padding: 5px 4px; border: 1px solid #94a3b8; width: 45px;">Hạng</th>
              <th style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: left;">Họ và Tên</th>
              <th style="padding: 5px 4px; border: 1px solid #94a3b8; width: 45px;">Tổ</th>
              <th style="padding: 5px 4px; border: 1px solid #94a3b8; width: 55px;">Gốc</th>
              <th style="padding: 5px 4px; border: 1px solid #94a3b8; width: 60px;">+ Thưởng</th>
              <th style="padding: 5px 4px; border: 1px solid #94a3b8; width: 60px;">- Vi Phạm</th>
              <th style="padding: 5px 4px; border: 1px solid #94a3b8; width: 60px;">- Chuyên Cần</th>
              <th style="padding: 5px 6px; border: 1px solid #94a3b8; width: 65px;">Tổng Điểm</th>
              <th style="padding: 5px 6px; border: 1px solid #94a3b8; width: 85px;">Xếp Loại</th>
              <th style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: left; width: 160px;">Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            ${studentSummaries
              .map((s, idx) => {
                const attPenalty =
                  s.attendanceStats.unexcused * 5 + s.attendanceStats.late * 2;
                return `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: ${
                  s.rank === 1 ? '#d97706' : s.rank <= 3 ? '#2563eb' : '#334155'
                };">
                  ${s.rank}
                </td>
                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: left; font-weight: 600;">
                  ${s.student.name}
                </td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;">Tổ ${s.student.team}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; color: #64748b;">${s.baseScore}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; color: #15803d; font-weight: bold;">
                  ${s.totalBonus > 0 ? `+${s.totalBonus}` : '0'}
                </td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; color: #b91c1c; font-weight: bold;">
                  ${s.totalPenalty - attPenalty > 0 ? `-${s.totalPenalty - attPenalty}` : '0'}
                </td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; color: ${
                  attPenalty > 0 ? '#b91c1c' : '#64748b'
                };">
                  ${attPenalty > 0 ? `-${attPenalty}` : '0'}
                </td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: 800; font-size: 11px; color: ${
                  s.totalScore >= 100 ? '#15803d' : s.totalScore >= 90 ? '#1e3a8a' : '#b91c1c'
                };">
                  ${s.totalScore}
                </td>
                <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: 600;">
                  <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; ${
                    s.category === 'Xuất sắc'
                      ? 'background-color: #fef3c7; color: #92400e;'
                      : s.category === 'Tốt'
                      ? 'background-color: #dcfce7; color: #166534;'
                      : s.category === 'Đạt'
                      ? 'background-color: #f1f5f9; color: #334155;'
                      : 'background-color: #fee2e2; color: #991b1b;'
                  }">
                    ${s.category}
                  </span>
                </td>
                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: left; color: #64748b; font-size: 9.5px;">
                  ${s.student.notes || (s.rank <= 3 ? 'Khen ngợi gương mẫu' : '')}
                </td>
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM -->
      <div style="border: 1px solid #cbd5e1; background-color: #f8fafc; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px;">
        <div style="font-weight: bold; color: #1e3a8a; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">
          III. NHẬN XÉT & ĐÁNH GIÁ CỦA GIÁO VIÊN CHỦ NHIỆM
        </div>
        <div style="font-size: 11px; line-height: 1.5; color: #334155; text-align: justify;">
          ${classInfo.teacherComment}
        </div>
      </div>

      <!-- PHẦN CHỮ KÝ PHÊ DUYỆT -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: avoid;">
        <tr>
          <td style="width: 33%; text-align: center; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; color: #334155;">ĐẠI DIỆN BAN PHỤ HUYNH</div>
            <div style="font-size: 10px; font-style: italic; color: #64748b; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 65px;"></div>
            <div style="font-size: 11px; color: #94a3b8;">...................................................</div>
          </td>
          <td style="width: 33%; text-align: center; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; color: #334155;">LỚP TRƯỞNG</div>
            <div style="font-size: 10px; font-style: italic; color: #64748b; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 65px;"></div>
            <div style="font-weight: 600; font-size: 11px; color: #1e293b;">
              ${classInfo.officerAssignments?.find((o) => o.roleType === 'lop_truong')?.studentName || 'Lớp trưởng'}
            </div>
          </td>
          <td style="width: 33%; text-align: center; vertical-align: top;">
            <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; color: #1e3a8a;">GIÁO VIÊN CHỦ NHIỆM</div>
            <div style="font-size: 10px; font-style: italic; color: #64748b; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 65px;"></div>
            <div style="font-weight: bold; font-size: 12px; color: #1e3a8a;">
              ${classInfo.teacherName}
            </div>
          </td>
        </tr>
      </table>

    </div>
  `;

  document.body.appendChild(container);

  try {
    // Chụp container thành canvas với tỷ lệ scale 2x để chữ in cực kỳ sắc nét
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1120,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Tạo file jsPDF khổ A4 Landscape (ngang: 297mm x 210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Tính toán tỷ lệ vừa khít khổ A4
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    let printWidth = pdfWidth - 10; // Chừa margin 5mm mỗi bên
    let printHeight = printWidth / ratio;

    // Nếu chiều cao vượt quá A4, co lại theo chiều cao
    if (printHeight > pdfHeight - 10) {
      printHeight = pdfHeight - 10;
      printWidth = printHeight * ratio;
    }

    const marginX = (pdfWidth - printWidth) / 2;
    const marginY = 5;

    pdf.addImage(imgData, 'JPEG', marginX, marginY, printWidth, printHeight);

    const safeClassName = classInfo.className.replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`Bao_Cao_${safeClassName}_${filenameSuffix}.pdf`);
  } finally {
    // Luôn dọn dẹp node tạm thời khỏi DOM
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};
