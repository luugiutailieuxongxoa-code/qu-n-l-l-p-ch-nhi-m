import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  team: number;
  parentPhone?: string;
  notes?: string;
  originalRowNumber: number;
}

export interface ExcelParseResult {
  success: boolean;
  students: ParsedStudentRow[];
  totalRows: number;
  sheetNames: string[];
  selectedSheet: string;
  detectedHeaders: Record<string, string>;
  warnings: string[];
  error?: string;
}

/**
 * Chuẩn hóa chuỗi để so sánh tiêu đề cột
 */
const normalizeHeader = (header: unknown): string => {
  if (!header) return '';
  return String(header)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[^a-z0-9]/g, ''); // Bỏ ký tự đặc biệt
};

/**
 * Chuyển đổi ngày sinh từ nhiều định dạng Excel khác nhau về YYYY-MM-DD
 */
const parseDob = (rawVal: unknown): string => {
  if (!rawVal) return '2009-01-01';

  // Trường hợp là đối tượng Date
  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    const y = rawVal.getFullYear();
    const m = String(rawVal.getMonth() + 1).padStart(2, '0');
    const d = String(rawVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Trường hợp là số serial date của Excel (ví dụ 39814)
  if (typeof rawVal === 'number' && rawVal > 20000 && rawVal < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const dateObj = new Date(excelEpoch.getTime() + rawVal * 86400000);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(rawVal).trim();

  // Khớp định dạng DD/MM/YYYY hoặc DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Khớp định dạng YYYY/MM/DD hoặc YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Khớp năm sinh 4 chữ số
  const yMatch = str.match(/\b(19\d\d|20\d\d)\b/);
  if (yMatch) {
    return `${yMatch[1]}-01-01`;
  }

  return '2009-01-01';
};

/**
 * Nhận diện giới tính
 */
const parseGender = (rawGender: unknown, rawIsFemaleColumn?: unknown): 'Nam' | 'Nữ' => {
  if (rawIsFemaleColumn !== undefined && rawIsFemaleColumn !== null && String(rawIsFemaleColumn).trim() !== '') {
    const femaleVal = String(rawIsFemaleColumn).trim().toLowerCase();
    if (femaleVal === 'x' || femaleVal === '1' || femaleVal === 'v' || femaleVal === 'nu' || femaleVal === 'nữ') {
      return 'Nữ';
    }
  }

  if (!rawGender) return 'Nam';
  const gStr = String(rawGender).trim().toLowerCase();
  if (gStr.includes('nữ') || gStr.includes('nu') || gStr === 'f' || gStr === 'female' || gStr === 'gái') {
    return 'Nữ';
  }
  return 'Nam';
};

/**
 * Trích xuất số tổ (1, 2, 3, 4)
 */
const parseTeam = (rawTeam: unknown, defaultTeam: number): number => {
  if (!rawTeam) return defaultTeam;
  const match = String(rawTeam).match(/[1-4]/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return defaultTeam;
};

/**
 * Đọc và phân tích file Excel (hỗ trợ file từ vnEdu, SMAS, CSDL Ngành GD&ĐT, mẫu giáo viên)
 */
export const parseStudentExcelFile = async (
  file: File,
  targetSheetName?: string,
  bulkTeamAssignMethod: 'auto_mod_4' | 'fixed_team' | 'preserve_or_auto' = 'preserve_or_auto',
  fixedTeamNumber: number = 1
): Promise<ExcelParseResult> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: 'array',
      cellDates: true,
      cellText: false,
    });

    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return {
        success: false,
        students: [],
        totalRows: 0,
        sheetNames: [],
        selectedSheet: '',
        detectedHeaders: {},
        warnings: [],
        error: 'File Excel không có trang tính (Sheet) nào.',
      };
    }

    const selectedSheet = targetSheetName && sheetNames.includes(targetSheetName)
      ? targetSheetName
      : sheetNames[0];

    const worksheet = workbook.Sheets[selectedSheet];
    if (!worksheet) {
      return {
        success: false,
        students: [],
        totalRows: 0,
        sheetNames,
        selectedSheet,
        detectedHeaders: {},
        warnings: [],
        error: `Không thể đọc trang tính "${selectedSheet}".`,
      };
    }

    // Chuyển sheet thành mảng 2 chiều
    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
      defval: '',
    });

    if (rawRows.length === 0) {
      return {
        success: false,
        students: [],
        totalRows: 0,
        sheetNames,
        selectedSheet,
        detectedHeaders: {},
        warnings: [],
        error: 'Trang tính rỗng, không chứa dữ liệu.',
      };
    }

    // 1. TÌM DÒNG TIÊU ĐỀ (HEADER ROW)
    // Các file từ vnEdu/SMAS thường có tiêu đề trường ở dòng 1-4, danh sách học sinh bắt đầu từ dòng 4 hoặc 5
    let headerRowIdx = -1;
    let colIndices: {
      fullNameCol?: number;
      lastNameCol?: number; // Họ và đệm
      firstNameCol?: number; // Tên
      genderCol?: number;
      femaleOnlyCol?: number; // Cột "Nữ" đánh dấu x
      dobCol?: number;
      teamCol?: number;
      phoneCol?: number;
      notesCol?: number;
    } = {};

    // Quét 15 dòng đầu tiên để tìm dòng có chứa các từ khóa học sinh
    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      let hasNameKeyword = false;
      let hasOtherKeyword = false;

      row.forEach((cell, cIdx) => {
        const norm = normalizeHeader(cell);
        if (
          norm.includes('hovaten') ||
          norm.includes('hoten') ||
          norm.includes('tenhocsinh') ||
          norm.includes('hocsinh') ||
          norm === 'ten' ||
          norm === 'hotendem'
        ) {
          hasNameKeyword = true;
        }
        if (
          norm.includes('gioitinh') ||
          norm.includes('ngaysinh') ||
          norm.includes('namsinh') ||
          norm.includes('sdt') ||
          norm.includes('dienthoai') ||
          norm === 'nu' ||
          norm === 'nam' ||
          norm === 'to' ||
          norm === 'stt'
        ) {
          hasOtherKeyword = true;
        }
      });

      if (hasNameKeyword || (hasOtherKeyword && row.length >= 3)) {
        headerRowIdx = r;
        break;
      }
    }

    // Nếu không tìm thấy dòng tiêu đề rõ ràng, giả định là dòng 0
    if (headerRowIdx === -1) {
      headerRowIdx = 0;
    }

    const headerRow = rawRows[headerRowIdx] || [];
    const detectedHeaders: Record<string, string> = {};

    // 2. NHẬN DIỆN VỊ TRÍ TỪNG CỘT
    headerRow.forEach((cell, cIdx) => {
      const rawTitle = String(cell).trim();
      const norm = normalizeHeader(cell);
      if (!norm) return;

      // Cột Họ và tên đầy đủ
      if (
        (norm.includes('hovaten') || norm.includes('hoten') || norm.includes('tenhocsinh')) &&
        !norm.includes('phuhuynh') &&
        !norm.includes('cha') &&
        !norm.includes('me')
      ) {
        colIndices.fullNameCol = cIdx;
        detectedHeaders['Họ và Tên'] = rawTitle;
      }
      // Cột Họ lót / Họ và chữ đệm
      else if (norm.includes('hodem') || norm.includes('holot') || norm.includes('hova') || norm === 'ho') {
        colIndices.lastNameCol = cIdx;
        detectedHeaders['Họ Đệm'] = rawTitle;
      }
      // Cột Tên riêng (nếu file tách Họ và Tên)
      else if (norm === 'ten' || norm === 'tenhs') {
        colIndices.firstNameCol = cIdx;
        detectedHeaders['Tên'] = rawTitle;
      }
      // Cột Giới tính
      else if (norm.includes('gioitinh') || norm === 'gt') {
        colIndices.genderCol = cIdx;
        detectedHeaders['Giới Tính'] = rawTitle;
      }
      // Cột Nữ riêng (đánh dấu x)
      else if (norm === 'nu') {
        colIndices.femaleOnlyCol = cIdx;
        detectedHeaders['Nữ (x)'] = rawTitle;
      }
      // Cột Ngày sinh
      else if (
        norm.includes('ngaysinh') ||
        norm.includes('ngaythangnamsinh') ||
        norm.includes('namsinh') ||
        norm.includes('dob')
      ) {
        colIndices.dobCol = cIdx;
        detectedHeaders['Ngày Sinh'] = rawTitle;
      }
      // Cột Tổ
      else if (norm === 'to' || norm.includes('tothidua') || norm.includes('nhom')) {
        colIndices.teamCol = cIdx;
        detectedHeaders['Tổ'] = rawTitle;
      }
      // Cột SĐT phụ huynh
      else if (
        norm.includes('sdt') ||
        norm.includes('dienthoai') ||
        norm.includes('phuhuynh') ||
        norm.includes('lienhe') ||
        norm.includes('phone')
      ) {
        colIndices.phoneCol = cIdx;
        detectedHeaders['SĐT Phụ Huynh'] = rawTitle;
      }
      // Cột Ghi chú / Chức vụ
      else if (
        norm.includes('ghichu') ||
        norm.includes('chucvu') ||
        norm.includes('doandoi') ||
        norm.includes('nhiemvu') ||
        norm.includes('chucdanh')
      ) {
        colIndices.notesCol = cIdx;
        detectedHeaders['Ghi Chú/Chức Vụ'] = rawTitle;
      }
    });

    // Nếu không tìm thấy cột tên, dự phòng tìm cột có chữ dài nhất ở các dòng kế tiếp
    if (colIndices.fullNameCol === undefined && (colIndices.lastNameCol === undefined || colIndices.firstNameCol === undefined)) {
      // Thử tìm cột thứ 2 (STT là cột 1, họ tên là cột 2 thông dụng)
      if (headerRow.length >= 2) {
        colIndices.fullNameCol = 1;
        detectedHeaders['Họ và Tên (Dự đoán)'] = String(headerRow[1] || 'Cột 2');
      }
    }

    const students: ParsedStudentRow[] = [];
    const warnings: string[] = [];

    // 3. ĐỌC DỮ LIỆU CÁC DÒNG HỌC SINH
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      // Lấy họ tên
      let fullName = '';
      if (colIndices.fullNameCol !== undefined && row[colIndices.fullNameCol] !== undefined) {
        fullName = String(row[colIndices.fullNameCol]).trim();
      } else if (colIndices.lastNameCol !== undefined || colIndices.firstNameCol !== undefined) {
        const ho = colIndices.lastNameCol !== undefined ? String(row[colIndices.lastNameCol] || '').trim() : '';
        const ten = colIndices.firstNameCol !== undefined ? String(row[colIndices.firstNameCol] || '').trim() : '';
        fullName = `${ho} ${ten}`.trim();
      }

      // Kiểm tra xem dòng có phải là tổng kết/chữ ký cuối bảng không
      const firstCell = String(row[0] || '').trim().toLowerCase();
      if (
        firstCell.includes('tong so') ||
        firstCell.includes('tổng số') ||
        firstCell.includes('giao vien') ||
        firstCell.includes('hiệu trưởng') ||
        firstCell.includes('người lập')
      ) {
        continue;
      }

      // Nếu tên rỗng hoặc là số STT thuần túy, bỏ qua
      if (!fullName || fullName.length < 2 || !isNaN(Number(fullName))) {
        continue;
      }

      // Giới tính
      const rawGender = colIndices.genderCol !== undefined ? row[colIndices.genderCol] : undefined;
      const rawFemaleCol = colIndices.femaleOnlyCol !== undefined ? row[colIndices.femaleOnlyCol] : undefined;
      const gender = parseGender(rawGender, rawFemaleCol);

      // Ngày sinh
      const rawDob = colIndices.dobCol !== undefined ? row[colIndices.dobCol] : undefined;
      const dob = parseDob(rawDob);

      // Tổ
      let team = 1;
      const defaultTeamIdx = (students.length % 4) + 1;
      if (bulkTeamAssignMethod === 'fixed_team') {
        team = fixedTeamNumber;
      } else if (bulkTeamAssignMethod === 'auto_mod_4') {
        team = defaultTeamIdx;
      } else {
        // preserve_or_auto
        if (colIndices.teamCol !== undefined && row[colIndices.teamCol] !== undefined && String(row[colIndices.teamCol]).trim() !== '') {
          team = parseTeam(row[colIndices.teamCol], defaultTeamIdx);
        } else {
          team = defaultTeamIdx;
        }
      }

      // SĐT
      let parentPhone: string | undefined = undefined;
      if (colIndices.phoneCol !== undefined && row[colIndices.phoneCol] !== undefined) {
        const pStr = String(row[colIndices.phoneCol]).replace(/[^0-9+]/g, '').trim();
        if (pStr.length >= 7) {
          parentPhone = pStr;
        }
      }

      // Ghi chú / Chức vụ
      let notes: string | undefined = undefined;
      if (colIndices.notesCol !== undefined && row[colIndices.notesCol] !== undefined) {
        const nStr = String(row[colIndices.notesCol]).trim();
        if (nStr) {
          notes = nStr;
        }
      }

      students.push({
        name: fullName,
        gender,
        dob,
        team,
        parentPhone,
        notes,
        originalRowNumber: r + 1,
      });
    }

    if (students.length === 0) {
      warnings.push('Không tìm thấy học sinh nào hợp lệ trong trang tính. Vui lòng kiểm tra lại định dạng file hoặc tải file mẫu chuẩn.');
    }

    return {
      success: students.length > 0,
      students,
      totalRows: rawRows.length,
      sheetNames,
      selectedSheet,
      detectedHeaders,
      warnings,
      error: students.length === 0 ? 'Không tìm thấy dòng học sinh nào hợp lệ.' : undefined,
    };
  } catch (err: unknown) {
    console.error('Error parsing Excel file:', err);
    return {
      success: false,
      students: [],
      totalRows: 0,
      sheetNames: [],
      selectedSheet: '',
      detectedHeaders: {},
      warnings: [],
      error: err instanceof Error ? err.message : 'Không thể đọc nội dung file Excel.',
    };
  }
};

/**
 * Tải về File Excel Mẫu Chuẩn Bộ Giáo Dục & Đào Tạo (.xlsx)
 * Bao gồm dữ liệu mẫu 10 học sinh hoàn chỉnh và hướng dẫn chi tiết
 */
export const downloadStandardStudentExcelTemplate = (className: string = '10A1', schoolName: string = 'Trường THPT'): void => {
  const wb = XLSX.utils.book_new();

  // Dữ liệu mẫu chuẩn
  const data = [
    // Header phụ
    [`DANH SÁCH HỌC SINH LỚP ${className.toUpperCase()}`],
    [`${schoolName} - NĂM HỌC 2024 - 2025`],
    [],
    // Tiêu đề cột chuẩn
    [
      'STT',
      'Họ và Tên',
      'Giới Tính',
      'Ngày Sinh (DD/MM/YYYY)',
      'Tổ (1-4)',
      'SĐT Phụ Huynh',
      'Chức Vụ / Ghi Chú',
    ],
    // Dữ liệu mẫu
    [1, 'Nguyễn Văn An', 'Nam', '15/05/2009', 1, '0912345671', 'Lớp trưởng'],
    [2, 'Trần Thị Bích Ngọc', 'Nữ', '20/08/2009', 1, '0912345672', 'Lớp phó học tập'],
    [3, 'Lê Hoàng Cường', 'Nam', '10/02/2009', 1, '0912345673', 'Tổ trưởng Tổ 1'],
    [4, 'Phạm Hải Đăng', 'Nam', '05/11/2009', 2, '0912345674', 'Lớp phó kỷ luật'],
    [5, 'Hoàng Thùy Dung', 'Nữ', '14/03/2009', 2, '0912345675', 'Thủ quỹ'],
    [6, 'Vũ Đức Duy', 'Nam', '22/07/2009', 2, '0912345676', 'Tổ trưởng Tổ 2'],
    [7, 'Đỗ Gia Hân', 'Nữ', '30/09/2009', 3, '0912345677', 'Bí thư chi đoàn'],
    [8, 'Bùi Minh Khang', 'Nam', '18/04/2009', 3, '0912345678', 'Tổ trưởng Tổ 3'],
    [9, 'Ngô Bảo Linh', 'Nữ', '25/12/2009', 4, '0912345679', 'Phó bí thư'],
    [10, 'Đinh Quốc Nam', 'Nam', '08/06/2009', 4, '0912345680', 'Tổ trưởng Tổ 4'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Căn chỉnh độ rộng các cột
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 26 }, // Họ và Tên
    { wch: 12 }, // Giới Tính
    { wch: 22 }, // Ngày Sinh
    { wch: 10 }, // Tổ
    { wch: 18 }, // SĐT Phụ Huynh
    { wch: 25 }, // Ghi Chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');

  // Trang tính hướng dẫn
  const guideData = [
    ['HƯỚNG DẪN NHẬP DANH SÁCH HỌC SINH TỪ EXCEL CHO SMARTCLASS'],
    [],
    ['1. Các định dạng được hỗ trợ:', '.xlsx, .xls, .csv'],
    ['2. Nguồn file tương thích:', 'vnEdu, SMAS, CSDL Ngành GD&ĐT, Google Sheets hoặc file Excel tự lập'],
    ['3. Tự động nhận diện cột:', 'Hệ thống tự động tìm các cột "Họ và Tên", "Giới Tính", "Ngày Sinh", "Tổ", "SĐT"'],
    ['4. Tách cột Họ và Tên:', 'Nếu file có 2 cột riêng "Họ lót" và "Tên", hệ thống sẽ tự động ghép thành họ tên đầy đủ'],
    ['5. Cột Tổ:', 'Nếu không có cột Tổ, hệ thống sẽ tự động phân chia đều học sinh vào 4 tổ (1, 2, 3, 4)'],
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 30 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'HuongDanSuDung');

  const fileName = `Mau_Danh_Sach_Hoc_Sinh_${className.replace(/\s+/g, '_')}_Chuan_BoGD.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Xuất danh sách học sinh hiện tại của lớp ra file Excel chuẩn
 */
export const exportCurrentStudentsToExcel = (
  students: Student[],
  className: string = '10A1',
  schoolName: string = 'Trường THPT'
): void => {
  const wb = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    [`DANH SÁCH HỌC SINH LỚP ${className.toUpperCase()}`],
    [`${schoolName} - TỔNG SỐ: ${students.length} HỌC SINH`],
    [],
    [
      'STT',
      'Họ và Tên',
      'Giới Tính',
      'Ngày Sinh (DD/MM/YYYY)',
      'Tổ',
      'SĐT Phụ Huynh',
      'Chức Vụ / Ghi Chú',
    ],
  ];

  students.forEach((s, idx) => {
    // Format ngày sinh DD/MM/YYYY nếu có
    let formattedDob = s.dob;
    if (s.dob && s.dob.includes('-')) {
      const parts = s.dob.split('-');
      if (parts.length === 3) {
        formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    data.push([
      idx + 1,
      s.name,
      s.gender,
      formattedDob,
      `Tổ ${s.team}`,
      s.parentPhone || '',
      s.notes || '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 12 },
    { wch: 22 },
    { wch: 10 },
    { wch: 18 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Lop_${className.replace(/\s+/g, '_')}`);
  const fileName = `Danh_Sach_Hoc_Sinh_${className.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

