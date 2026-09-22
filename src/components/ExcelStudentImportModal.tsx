import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  ArrowRight,
  RefreshCw,
  FileCheck,
  HelpCircle,
} from 'lucide-react';
import { Student } from '../types';
import {
  parseStudentExcelFile,
  downloadStandardStudentExcelTemplate,
  ParsedStudentRow,
  ExcelParseResult,
} from '../utils/excelStudentParser';

interface ExcelStudentImportModalProps {
  currentStudents: Student[];
  className: string;
  schoolName: string;
  onImportStudents: (newStudents: Student[], mode: 'append' | 'replace') => void;
  onClose: () => void;
}

export const ExcelStudentImportModal: React.FC<ExcelStudentImportModalProps> = ({
  currentStudents,
  className,
  schoolName,
  onImportStudents,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [teamAssignMethod, setTeamAssignMethod] = useState<'preserve_or_auto' | 'auto_mod_4' | 'fixed_team'>('preserve_or_auto');
  const [fixedTeamNumber, setFixedTeamNumber] = useState<number>(1);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi chọn file Excel
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsParsing(true);
    try {
      const res = await parseStudentExcelFile(file, undefined, teamAssignMethod, fixedTeamNumber);
      setParseResult(res);
      if (res.selectedSheet) {
        setSelectedSheet(res.selectedSheet);
      }
    } catch (err: unknown) {
      console.error('Lỗi khi đọc file Excel:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Đổi sheet hoặc đổi phương pháp chia tổ
  const handleReParse = async (
    targetSheet?: string,
    method?: 'preserve_or_auto' | 'auto_mod_4' | 'fixed_team',
    fixedTeam?: number
  ) => {
    if (!selectedFile) return;
    setIsParsing(true);
    const m = method || teamAssignMethod;
    const fTeam = fixedTeam !== undefined ? fixedTeam : fixedTeamNumber;
    const sheet = targetSheet || selectedSheet;

    try {
      const res = await parseStudentExcelFile(selectedFile, sheet, m, fTeam);
      setParseResult(res);
      if (targetSheet) {
        setSelectedSheet(targetSheet);
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
        handleFileChange(file);
      } else {
        alert('Vui lòng chọn file định dạng Excel (.xlsx, .xls) hoặc .csv');
      }
    }
  };

  // Xác nhận nhập học sinh
  const handleConfirmImport = () => {
    if (!parseResult || parseResult.students.length === 0) return;

    const formattedStudents: Student[] = parseResult.students.map((r, idx) => ({
      id: `hs-excel-${Date.now()}-${idx}`,
      name: r.name,
      gender: r.gender,
      dob: r.dob,
      team: r.team,
      parentPhone: r.parentPhone,
      notes: r.notes,
    }));

    onImportStudents(formattedStudents, importMode);
    onClose();
  };

  // Thống kê nhanh từ danh sách phân tích
  const totalParsed = parseResult?.students.length || 0;
  const maleCount = parseResult?.students.filter((s) => s.gender === 'Nam').length || 0;
  const femaleCount = parseResult?.students.filter((s) => s.gender === 'Nữ').length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  Nhập Danh Sách Học Sinh Từ File Excel Chuẩn
                </h3>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  vnEdu • SMAS • CSDL • Excel
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tương thích mọi file danh sách từ phần mềm quản lý trường học hoặc bảng Excel tự lập
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => downloadStandardStudentExcelTemplate(className, schoolName)}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="Tải file Excel mẫu chuẩn Bộ GD&ĐT có sẵn 10 học sinh mẫu"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tải File Mẫu Chuẩn (.xlsx)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Nút tải mẫu trên di động */}
          <div className="sm:hidden flex justify-end">
            <button
              onClick={() => downloadStandardStudentExcelTemplate(className, schoolName)}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải File Excel Mẫu Chuẩn (.xlsx)</span>
            </button>
          </div>

          {/* VÙNG CHỌN / KÉO THẢ FILE EXCEL */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800">
                  Nhấn để chọn file Excel hoặc kéo thả file vào đây
                </p>
                <p className="text-slate-500 mt-1">
                  Hỗ trợ định dạng <strong>.xlsx, .xls, .csv</strong> (tải từ vnEdu, SMAS, CSDL Ngành GD&ĐT)
                </p>
              </div>
              <div className="inline-flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <span>Tự động nhận diện cột: Họ tên, Giới tính, Ngày sinh, Tổ, SĐT</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Dung lượng: {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                      {parseResult?.sheetNames.length || 1} trang tính
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setParseResult(null);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Chọn file khác
                  </button>
                </div>
              </div>

              {/* Lựa chọn Sheet & Cấu hình chia tổ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Chọn Sheet nếu có nhiều hơn 1 sheet */}
                {parseResult && parseResult.sheetNames.length > 1 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Chọn Trang Tính (Sheet):
                    </label>
                    <select
                      value={selectedSheet}
                      onChange={(e) => {
                        setSelectedSheet(e.target.value);
                        handleReParse(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {parseResult.sheetNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Phương thức phân bổ Tổ */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phân Bổ Tổ Thi Đua:
                  </label>
                  <select
                    value={teamAssignMethod}
                    onChange={(e) => {
                      const m = e.target.value as 'preserve_or_auto' | 'auto_mod_4' | 'fixed_team';
                      setTeamAssignMethod(m);
                      handleReParse(undefined, m);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="preserve_or_auto">Theo cột "Tổ" từ file (nếu có)</option>
                    <option value="auto_mod_4">Tự động chia đều 4 tổ (1, 2, 3, 4)</option>
                    <option value="fixed_team">Gán toàn bộ vào 1 tổ cố định</option>
                  </select>
                </div>

                {/* Nếu chọn cố định 1 tổ */}
                {teamAssignMethod === 'fixed_team' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Chọn Tổ Cố Định:
                    </label>
                    <select
                      value={fixedTeamNumber}
                      onChange={(e) => {
                        const t = parseInt(e.target.value, 10);
                        setFixedTeamNumber(t);
                        handleReParse(undefined, undefined, t);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="1">Tổ 1</option>
                      <option value="2">Tổ 2</option>
                      <option value="3">Tổ 3</option>
                      <option value="4">Tổ 4</option>
                    </select>
                  </div>
                )}

                {/* Chế độ nhập */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hành Động Khi Nhập:
                  </label>
                  <div className="flex items-center space-x-3 pt-1">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-800">Thêm tiếp (+{totalParsed})</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="font-semibold text-rose-700">Thay thế toàn bộ</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Các cột đã tự động nhận diện */}
              {parseResult && parseResult.detectedHeaders && Object.keys(parseResult.detectedHeaders).length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-semibold mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cột đã nhận diện tự động từ file:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(parseResult.detectedHeaders).map(([field, raw]) => (
                      <span
                        key={field}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px]"
                      >
                        <strong className="text-emerald-700">{field}:</strong>
                        <span className="text-slate-500 italic">"{raw}"</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* THÔNG BÁO / CẢNH BÁO */}
          {parseResult?.warnings && parseResult.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {parseResult.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* BẢNG XEM TRƯỚC DỮ LIỆU ĐỌC ĐƯỢC */}
          {parseResult && parseResult.students.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-800 text-xs">
                    Xem Trước Danh Sách ({totalParsed} Học Sinh)
                  </span>
                  <span className="text-slate-500 font-normal">
                    (Nam: {maleCount} • Nữ: {femaleCount})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {importMode === 'append' ? (
                    <span>
                      Tổng số sau khi nhập: <strong>{currentStudents.length + totalParsed}</strong> học sinh
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">
                      Sẽ thay thế {currentStudents.length} học sinh hiện tại bằng {totalParsed} học sinh mới
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">STT</th>
                      <th className="py-2 px-3">Họ và Tên</th>
                      <th className="py-2 px-2 text-center">Giới Tính</th>
                      <th className="py-2 px-3">Ngày Sinh</th>
                      <th className="py-2 px-2 text-center">Tổ</th>
                      <th className="py-2 px-3">SĐT Phụ Huynh</th>
                      <th className="py-2 px-3">Chức Vụ / Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parseResult.students.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{s.name}</td>
                        <td className="py-1.5 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              s.gender === 'Nữ'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {s.gender}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 font-mono text-[11px]">{s.dob}</td>
                        <td className="py-1.5 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px]">
                            Tổ {s.team}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">{s.parentPhone || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-500 italic">{s.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KHUNG HƯỚNG DẪN ĐỊNH DẠNG FILE CHUẨN */}
          <div className="bg-blue-50/60 rounded-xl border border-blue-200/60 p-3 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[#1E3A8A] font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Gợi ý chuẩn bị file Excel để đạt kết quả tốt nhất:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 pl-1">
              <li>
                <strong>Cột họ tên:</strong> Có thể đặt tên cột là <em>"Họ và tên"</em> hoặc để 2 cột riêng <em>"Họ đệm"</em> và <em>"Tên"</em> (hệ thống sẽ tự động ghép).
              </li>
              <li>
                <strong>Cột giới tính:</strong> Chấp nhận <em>"Nam"</em>, <em>"Nữ"</em> hoặc cột <em>"Nữ"</em> riêng có đánh dấu <em>x</em>.
              </li>
              <li>
                <strong>Cột ngày sinh:</strong> Hỗ trợ định dạng Ngày/Tháng/Năm (15/05/2009) hoặc định dạng Date chuẩn của Excel.
              </li>
              <li>
                <strong>Cột Tổ:</strong> Nếu chưa phân tổ trong Excel, hệ thống có tùy chọn tự động chia đều học sinh vào 4 tổ.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-slate-500 text-[11px]">
            {parseResult?.students.length ? (
              <span>
                Đã sẵn sàng nạp <strong>{parseResult.students.length}</strong> học sinh vào lớp{' '}
                <strong>{className}</strong>
              </span>
            ) : (
              <span>Vui lòng chọn file Excel để bắt đầu nhập dữ liệu</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 font-bold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={!parseResult || parseResult.students.length === 0 || isParsing}
              className={`inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-white font-bold transition-all shadow-sm cursor-pointer ${
                !parseResult || parseResult.students.length === 0 || isParsing
                  ? 'bg-slate-300 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isParsing
                  ? 'Đang Xử Lý...'
                  : `Xác Nhận Nhập ${totalParsed ? `(${totalParsed} HS)` : ''}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
