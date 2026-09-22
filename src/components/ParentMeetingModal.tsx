import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Phone,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  PenTool,
  Upload,
  RotateCcw,
  Sparkles,
  Users,
  Settings,
  Scissors,
  Eye,
  Building2,
  Copy,
  Check,
  Share2,
  Wand2,
  SlidersHorizontal,
  LayoutTemplate,
} from 'lucide-react';
import {
  ClassInfo,
  Student,
  StudentScoreSummary,
  ParentMeetingInvitationConfig,
  MeetingOccasion,
  SignatureType,
  OCCASION_PRESETS,
} from '../types';
import {
  getDefaultMeetingInvitationConfig,
  saveStoredMeetingInvitationConfig,
} from '../utils/storage';
import {
  processSignatureImage,
  createSampleTeacherSignature,
} from '../utils/signatureProcessor';

interface ParentMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: ClassInfo;
  students: Student[];
  studentSummaries?: StudentScoreSummary[];
  initialConfig: ParentMeetingInvitationConfig;
  onSaveConfig: (config: ParentMeetingInvitationConfig) => void;
  onOpenPrintView: (
    config: ParentMeetingInvitationConfig,
    targetStudentIds: string[]
  ) => void;
}

export const ParentMeetingModal: React.FC<ParentMeetingModalProps> = ({
  isOpen,
  onClose,
  classInfo,
  students,
  studentSummaries,
  initialConfig,
  onSaveConfig,
  onOpenPrintView,
}) => {
  const [config, setConfig] = useState<ParentMeetingInvitationConfig>(initialConfig);
  const [selectedStudentScope, setSelectedStudentScope] = useState<
    'class_general' | 'all' | 'single'
  >(
    initialConfig.recipientMode === 'class_general'
      ? 'class_general'
      : initialConfig.recipientMode === 'single_student'
      ? 'single'
      : 'all'
  );
  const [selectedSingleStudentId, setSelectedSingleStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'info' | 'agenda' | 'signature' | 'options'>('info');
  const [copiedZalo, setCopiedZalo] = useState(false);

  const boysCount = students.filter((s) => s.gender === 'Nam').length;
  const girlsCount = students.filter((s) => s.gender === 'Nữ').length;

  // Canvas vẽ chữ ký
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasCanvasSignature, setHasCanvasSignature] = useState(false);

  // Xử lý ảnh chữ ký & tách nền tự động
  const [rawUploadedSignature, setRawUploadedSignature] = useState<string | null>(null);
  const [isAutoRemoveBg, setIsAutoRemoveBg] = useState<boolean>(true);
  const [bgThreshold, setBgThreshold] = useState<number>(215);
  const [inkColorMode, setInkColorMode] = useState<'original' | 'blue' | 'black'>('blue');
  const [autoCropSignature, setAutoCropSignature] = useState<boolean>(true);
  const [isProcessingSignature, setIsProcessingSignature] = useState<boolean>(false);

  useEffect(() => {
    setConfig(initialConfig);
    if (initialConfig.recipientMode === 'class_general') {
      setSelectedStudentScope('class_general');
    } else if (initialConfig.recipientMode === 'single_student') {
      setSelectedStudentScope('single');
    } else {
      setSelectedStudentScope('all');
    }
  }, [initialConfig, isOpen]);

  // Sao chép tin nhắn Zalo gửi phụ huynh cả lớp
  const handleCopyZaloMessage = () => {
    const meetingDateParts = config.meetingDate.split('-');
    const formattedDate =
      meetingDateParts.length === 3
        ? `${meetingDateParts[2]}/${meetingDateParts[1]}/${meetingDateParts[0]}`
        : config.meetingDate;

    const text = `📢 THÔNG BÁO: GIẤY MỜI HỌP PHỤ HUYNH HỌC SINH
LỚP: ${classInfo.className} — TRƯỜNG: ${classInfo.schoolName}
Năm học: ${classInfo.academicYear}

Kính gửi: ${config.generalRecipientTitle || `Toàn thể Quý bậc Cha mẹ Học sinh Lớp ${classInfo.className}`}

Thực hiện kế hoạch năm học của nhà trường, Giáo viên chủ nhiệm Lớp ${classInfo.className} trân trọng kính mời toàn thể Quý bậc Cha mẹ học sinh tới tham dự buổi Họp Cha Mẹ Học sinh định kỳ:

⏰ Thời gian: ${config.meetingTime} (${config.meetingDayOfWeek || 'Chủ nhật'}), ngày ${formattedDate}
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

  // Cập nhật mẫu khi chọn dịp họp
  const handleSelectOccasion = (occ: MeetingOccasion) => {
    const preset = OCCASION_PRESETS[occ];
    setConfig((prev) => ({
      ...prev,
      occasion: occ,
      meetingContentSummary: preset.summary,
      agendaItems: preset.agenda,
    }));
  };

  // Canvas handlers
  useEffect(() => {
    if (activeTab === 'signature' && config.signatureType === 'canvas_drawn' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Nếu đã có dataUrl trước đó thì vẽ lại
        if (config.signatureDataUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasCanvasSignature(true);
          };
          img.src = config.signatureDataUrl;
        }
      }
    }
  }, [activeTab, config.signatureType]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasCanvasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setConfig((prev) => ({ ...prev, signatureDataUrl: dataUrl }));
    }
  };

  const handleClearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasCanvasSignature(false);
        setConfig((prev) => ({ ...prev, signatureDataUrl: undefined }));
      }
    }
  };

  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        setRawUploadedSignature(result);
        setIsProcessingSignature(true);
        try {
          if (isAutoRemoveBg) {
            const processed = await processSignatureImage(result, {
              threshold: bgThreshold,
              inkColor: inkColorMode,
              autoCrop: autoCropSignature,
              enhanceContrast: true,
            });
            setConfig((prev) => ({
              ...prev,
              signatureType: 'uploaded_image',
              signatureDataUrl: processed,
            }));
          } else {
            setConfig((prev) => ({
              ...prev,
              signatureType: 'uploaded_image',
              signatureDataUrl: result,
            }));
          }
        } finally {
          setIsProcessingSignature(false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReapplyProcessing = async (
    newAutoRemove = isAutoRemoveBg,
    newThreshold = bgThreshold,
    newInkColor = inkColorMode,
    newAutoCrop = autoCropSignature
  ) => {
    if (!rawUploadedSignature) return;
    setIsProcessingSignature(true);
    try {
      if (newAutoRemove) {
        const processed = await processSignatureImage(rawUploadedSignature, {
          threshold: newThreshold,
          inkColor: newInkColor,
          autoCrop: newAutoCrop,
          enhanceContrast: true,
        });
        setConfig((prev) => ({
          ...prev,
          signatureType: 'uploaded_image',
          signatureDataUrl: processed,
        }));
      } else {
        setConfig((prev) => ({
          ...prev,
          signatureType: 'uploaded_image',
          signatureDataUrl: rawUploadedSignature,
        }));
      }
    } finally {
      setIsProcessingSignature(false);
    }
  };

  const handleUseSampleSignature = () => {
    const sample = createSampleTeacherSignature(config.signerName || classInfo.teacherName);
    setRawUploadedSignature(sample);
    setConfig((prev) => ({
      ...prev,
      signatureType: 'uploaded_image',
      signatureDataUrl: sample,
    }));
  };

  const handleSaveAndPrint = () => {
    const updatedConfig: ParentMeetingInvitationConfig = {
      ...config,
      recipientMode:
        selectedStudentScope === 'class_general'
          ? 'class_general'
          : selectedStudentScope === 'single'
          ? 'single_student'
          : 'all_students',
      generalRecipientTitle:
        config.generalRecipientTitle ||
        `Toàn thể Quý bậc Cha mẹ Học sinh Lớp ${classInfo.className}`,
    };
    onSaveConfig(updatedConfig);
    saveStoredMeetingInvitationConfig(classInfo.classId || 'class-10A1', updatedConfig);
    const targetIds =
      selectedStudentScope === 'single' && selectedSingleStudentId
        ? [selectedSingleStudentId]
        : students.map((s) => s.id);
    onOpenPrintView(updatedConfig, targetIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                Tạo Giấy Mời Họp Phụ Huynh Chuẩn Văn Bản Sư Phạm
              </h3>
              <p className="text-xs text-blue-200">
                Thể thức chuẩn Nghị định 30/2020/NĐ-CP • Quốc hiệu, tiêu ngữ, chữ ký GVCN • Hỗ trợ in hàng loạt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 pt-3 border-b border-slate-200 bg-slate-50/80 shrink-0 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Dịp Họp & Thời Gian, Địa Điểm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'agenda'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>2. Nội Dung & Chương Trình Họp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signature')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'signature'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>3. Chữ Ký Của GVCN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('options')}
            className={`pb-2.5 px-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'options'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>4. Phạm Vi & Bố Cục In</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: THỜI GIAN, ĐỊA ĐIỂM, DỊP HỌP */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Dịp Họp Phụ Huynh Định Kỳ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(OCCASION_PRESETS) as MeetingOccasion[]).map((occ) => {
                    const isSel = config.occasion === occ;
                    return (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => handleSelectOccasion(occ)}
                        className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSel
                            ? 'border-[#1E3A8A] bg-blue-50/80 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{OCCASION_PRESETS[occ].label}</span>
                          {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cơ quan cấp trên / Sở GD&ĐT
                  </label>
                  <input
                    type="text"
                    value={config.schoolDepartmentName}
                    onChange={(e) =>
                      setConfig({ ...config, schoolDepartmentName: e.target.value })
                    }
                    placeholder="SỞ GIÁO DỤC VÀ ĐÀO TẠO"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Hiệu Giấy Mời
                  </label>
                  <input
                    type="text"
                    value={config.documentNumber}
                    onChange={(e) => setConfig({ ...config, documentNumber: e.target.value })}
                    placeholder="03/GM-10A1"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày Tổ Chức Họp *
                  </label>
                  <input
                    type="date"
                    value={config.meetingDate}
                    onChange={(e) => setConfig({ ...config, meetingDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giờ Bắt Đầu *
                  </label>
                  <input
                    type="time"
                    value={config.meetingTime}
                    onChange={(e) => setConfig({ ...config, meetingTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thứ Trong Tuần
                  </label>
                  <input
                    type="text"
                    value={config.meetingDayOfWeek}
                    onChange={(e) => setConfig({ ...config, meetingDayOfWeek: e.target.value })}
                    placeholder="Chủ nhật, Thứ bảy..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa Điểm Tổ Chức Chi Tiết *
                </label>
                <input
                  type="text"
                  value={config.locationDetail}
                  onChange={(e) => setConfig({ ...config, locationDetail: e.target.value })}
                  placeholder="Phòng học Lớp 10A1 (Tầng 2, Dãy B) — Trường THPT Phước Sơn"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại Liên Hệ GVCN *
                  </label>
                  <input
                    type="text"
                    value={config.teacherPhone}
                    onChange={(e) => setConfig({ ...config, teacherPhone: e.target.value })}
                    placeholder="0912.345.678"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa Danh Ban Hành (Tỉnh / Huyện / Thị Xã)
                  </label>
                  <input
                    type="text"
                    value={config.issuePlace}
                    onChange={(e) => setConfig({ ...config, issuePlace: e.target.value })}
                    placeholder="Phước Sơn"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NỘI DUNG & CHƯƠNG TRÌNH HỌP */}
          {activeTab === 'agenda' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời Dẫn / Tóm Tắt Mục Đích Phiên Họp
                </label>
                <textarea
                  rows={3}
                  value={config.meetingContentSummary}
                  onChange={(e) =>
                    setConfig({ ...config, meetingContentSummary: e.target.value })
                  }
                  placeholder="Báo cáo tình hình học tập và rèn luyện của học sinh..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Chương Trình Làm Việc Chi Tiết ({config.agendaItems.length} mục)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        agendaItems: [
                          ...config.agendaItems,
                          `Mục ${config.agendaItems.length + 1}: Thảo luận bổ sung...`,
                        ],
                      })
                    }
                    className="text-[11px] text-[#1E3A8A] font-bold hover:underline cursor-pointer"
                  >
                    + Thêm mục chương trình
                  </button>
                </div>

                <div className="space-y-2">
                  {config.agendaItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500 w-6 text-center">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const updated = [...config.agendaItems];
                          updated[idx] = e.target.value;
                          setConfig({ ...config, agendaItems: updated });
                        }}
                        className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      />
                      {config.agendaItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = config.agendaItems.filter((_, i) => i !== idx);
                            setConfig({ ...config, agendaItems: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lưu Ý Dành Cho Phụ Huynh
                </label>
                <textarea
                  rows={2}
                  value={config.notesForParents}
                  onChange={(e) => setConfig({ ...config, notesForParents: e.target.value })}
                  placeholder="Kính mong quý Phụ huynh sắp xếp thời gian tham dự đông đủ, đúng giờ..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-900">
                    Đính Kèm Bảng Tóm Tắt Điểm Thi Đua & Nề Nếp Của Học Sinh
                  </span>
                  <p className="text-[11px] text-amber-700">
                    Tự động in điểm rèn luyện, xếp hạng lớp, số buổi nghỉ/trễ và nhận xét của GVCN trong giấy mời riêng của từng học sinh.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.includeStudentScoreSummary}
                  onChange={(e) =>
                    setConfig({ ...config, includeStudentScoreSummary: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CHỮ KÝ CỦA GVCN */}
          {activeTab === 'signature' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chức Danh Người Ký *
                  </label>
                  <input
                    type="text"
                    value={config.signerTitle}
                    onChange={(e) => setConfig({ ...config, signerTitle: e.target.value })}
                    placeholder="GIÁO VIÊN CHỦ NHIỆM"
                    className="w-full text-xs font-bold uppercase px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ Và Tên Người Ký (GVCN) *
                  </label>
                  <input
                    type="text"
                    value={config.signerName}
                    onChange={(e) => setConfig({ ...config, signerName: e.target.value })}
                    placeholder={classInfo.teacherName}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lựa Chọn Hình Thức Chữ Ký GVCN
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      type: 'electronic_stylized' as SignatureType,
                      title: 'Ký Mực Điện Tử',
                      desc: 'Mẫu chữ ký mực thư pháp thanh lịch tự động',
                    },
                    {
                      type: 'canvas_drawn' as SignatureType,
                      title: 'Vẽ Tay Trực Tiếp',
                      desc: 'Ký chữ ký tay bằng chuột hoặc cảm ứng',
                    },
                    {
                      type: 'uploaded_image' as SignatureType,
                      title: 'Tải Ảnh Chữ Ký',
                      desc: 'Dùng tệp ảnh scan chữ ký thực tế (PNG/JPG)',
                    },
                    {
                      type: 'blank_for_pen' as SignatureType,
                      title: 'Ký Bút Sau Khi In',
                      desc: 'Chừa khoảng trống chuẩn để ký tay sau',
                    },
                  ].map((item) => {
                    const isSel = config.signatureType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setConfig({ ...config, signatureType: item.type })}
                        className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? 'border-[#1E3A8A] bg-blue-50/80 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs">{item.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KHU VỰC THAO TÁC THEO HÌNH THỨC CHỮ KÝ */}
              {config.signatureType === 'electronic_stylized' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="text-xs text-slate-500 font-medium">
                    Xem trước chữ ký mực điện tử sư phạm:
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <span className="font-serif italic text-2xl text-[#1E3A8A] tracking-wider font-semibold select-none border-b border-blue-300/80 pb-1">
                      {config.signerName || 'Nguyễn Văn Thắng'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hệ thống sẽ render chữ ký trang trọng kèm họ tên GVCN trên giấy mời</span>
                  </p>
                </div>
              )}

              {config.signatureType === 'canvas_drawn' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Bảng Ký Trực Tiếp (Dùng chuột hoặc màn hình cảm ứng để ký):
                    </span>
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ký Lại / Xóa</span>
                    </button>
                  </div>

                  <div className="border border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair touch-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    {hasCanvasSignature
                      ? '✓ Đã ghi nhận chữ ký tay của Thầy/Cô. Chữ ký này sẽ được chèn vào văn bản in.'
                      : 'Ký vào khung trắng ở trên.'}
                  </p>
                </div>
              )}

              {config.signatureType === 'uploaded_image' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <Upload className="w-4 h-4 text-[#1E3A8A]" />
                        <span>Tải Lên Tệp Ảnh Chữ Ký Của GVCN</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Chụp ảnh chữ ký trên giấy bằng điện thoại hoặc tải file scan. Hệ thống tự động tách sạch nền giấy trắng!
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleUseSampleSignature}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                        title="Dùng mẫu chữ ký mực xanh sư phạm sẵn có để test nhanh"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dùng Mẫu Ký GVCN (Test Nhanh)</span>
                      </button>

                      <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{config.signatureDataUrl ? 'Đổi Ảnh Khác' : 'Chọn Ảnh Chữ Ký'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadSignature}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* KHU VỰC HIỂN THỊ ẢNH CHỮ KÝ ĐÃ TÁCH NỀN */}
                  {config.signatureDataUrl ? (
                    <div className="space-y-3">
                      {/* Hộp Preview với hoa văn caro để thấy rõ nền trong suốt */}
                      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Xem Trước Chữ Ký Tách Nền Trong Suốt</span>
                          </span>
                          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{isAutoRemoveBg ? 'Đã lọc sạch nền giấy trắng' : 'Ảnh gốc chưa lọc nền'}</span>
                          </span>
                        </div>

                        <div
                          className="p-4 flex items-center justify-center min-h-[110px] relative transition-all"
                          style={{
                            backgroundImage: `linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`,
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                          }}
                        >
                          {isProcessingSignature ? (
                            <div className="flex items-center space-x-2 text-slate-600 text-xs font-semibold bg-white/90 px-3 py-1.5 rounded-lg shadow-xs">
                              <RotateCcw className="w-3.5 h-3.5 animate-spin text-[#1E3A8A]" />
                              <span>Đang tách nền tự động...</span>
                            </div>
                          ) : (
                            <img
                              src={config.signatureDataUrl}
                              alt="Chữ ký đã tách nền"
                              className="max-h-24 max-w-[280px] object-contain drop-shadow-xs transition-all"
                            />
                          )}
                        </div>
                      </div>

                      {/* CÔNG CỤ TINH CHỈNH TÁCH NỀN CHỮ KÝ */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isAutoRemoveBg}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setIsAutoRemoveBg(val);
                                handleReapplyProcessing(val, bgThreshold, inkColorMode, autoCropSignature);
                              }}
                              className="w-4 h-4 text-[#1E3A8A] rounded border-slate-300 focus:ring-[#1E3A8A]"
                            />
                            <span>Tự động xóa nền giấy trắng (chỉ giữ lại nét chữ ký)</span>
                          </label>

                          <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={autoCropSignature}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setAutoCropSignature(val);
                                handleReapplyProcessing(isAutoRemoveBg, bgThreshold, inkColorMode, val);
                              }}
                              className="w-3.5 h-3.5 text-[#1E3A8A] rounded border-slate-300 focus:ring-[#1E3A8A]"
                            />
                            <span>Tự động cắt khoảng trắng thừa (Auto-crop)</span>
                          </label>
                        </div>

                        {isAutoRemoveBg && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Thanh trượt độ nhạy */}
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold text-slate-700 flex items-center space-x-1">
                                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Độ nhạy lọc giấy trắng ({bgThreshold})</span>
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {bgThreshold > 225 ? 'Lọc mạnh' : bgThreshold < 195 ? 'Lọc nhẹ' : 'Chuẩn'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={170}
                                max={240}
                                step={2}
                                value={bgThreshold}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setBgThreshold(val);
                                  handleReapplyProcessing(isAutoRemoveBg, val, inkColorMode, autoCropSignature);
                                }}
                                className="w-full accent-[#1E3A8A] cursor-pointer"
                              />
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Kéo sang phải nếu ảnh chụp bị tối hoặc có bóng mờ camera để lọc sạch hơn.
                              </p>
                            </div>

                            {/* Tùy chọn màu mực */}
                            <div>
                              <span className="block text-xs font-semibold text-slate-700 mb-1">
                                Hiệu chỉnh màu nét mực chữ ký:
                              </span>
                              <div className="grid grid-cols-3 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInkColorMode('blue');
                                    handleReapplyProcessing(isAutoRemoveBg, bgThreshold, 'blue', autoCropSignature);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                    inkColorMode === 'blue'
                                      ? 'bg-blue-50 border-[#1E3A8A] text-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  🔵 Mực Xanh
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInkColorMode('black');
                                    handleReapplyProcessing(isAutoRemoveBg, bgThreshold, 'black', autoCropSignature);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                    inkColorMode === 'black'
                                      ? 'bg-slate-100 border-slate-900 text-slate-900 ring-1 ring-slate-900'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  ⚫ Mực Đen
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInkColorMode('original');
                                    handleReapplyProcessing(isAutoRemoveBg, bgThreshold, 'original', autoCropSignature);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                    inkColorMode === 'original'
                                      ? 'bg-amber-50 border-amber-600 text-amber-900 ring-1 ring-amber-600'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  🖊️ Giữ Gốc
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center text-xs text-slate-500 bg-white">
                      <p className="font-semibold text-slate-700">Chưa có ảnh chữ ký nào được chọn.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Bấm nút &quot;Chọn Ảnh Chữ Ký&quot; để tải ảnh chụp từ điện thoại (hệ thống tự lọc sạch giấy trắng), hoặc bấm &quot;Dùng Mẫu Ký GVCN&quot; để test nhanh.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {config.signatureType === 'blank_for_pen' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-600 font-medium">
                    Văn bản giấy mời sẽ để trống khoảng trắng 60mm ở mục chữ ký để Thầy/Cô trực tiếp dùng bút mực ký sống và đóng dấu sau khi in ra giấy.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PHẠM VI HỌC SINH & BỐ CỤC IN */}
          {activeTab === 'options' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phạm Vi & Hình Thức Giấy Mời
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Lựa chọn 1: Giấy Mời Chung Cả Lớp */}
                  <button
                    type="button"
                    onClick={() => setSelectedStudentScope('class_general')}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedStudentScope === 'class_general'
                        ? 'border-[#1E3A8A] bg-blue-50/90 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="font-bold text-xs">
                        Giấy Mời Chung Cả Lớp
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Tạo 01 bản mời chung gửi Toàn thể Quý bậc Cha mẹ học sinh. Dùng dán bảng tin, báo cáo BGH, gửi nhóm Zalo lớp.
                    </p>
                  </button>

                  {/* Lựa chọn 2: Toàn bộ học sinh từng em */}
                  <button
                    type="button"
                    onClick={() => setSelectedStudentScope('all')}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedStudentScope === 'all'
                        ? 'border-[#1E3A8A] bg-blue-50/90 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="font-bold text-xs">
                        Riêng Từng Em ({students.length} Học Sinh)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Tự động sinh {students.length} giấy mời riêng biệt ứng với từng tên học sinh, tổ sinh hoạt và điểm thi đua.
                    </p>
                  </button>

                  {/* Lựa chọn 3: 1 học sinh cụ thể */}
                  <button
                    type="button"
                    onClick={() => setSelectedStudentScope('single')}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedStudentScope === 'single'
                        ? 'border-[#1E3A8A] bg-blue-50/90 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="font-bold text-xs">In Riêng Cho 1 Học Sinh</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Chỉ in duy nhất giấy mời cho một em học sinh được chọn để gửi riêng gia đình trao đổi cá biệt.
                    </p>
                  </button>
                </div>
              </div>

              {/* TÙY CHỌN DÀNH RIÊNG CHO GIẤY MỜI CHUNG CẢ LỚP */}
              {selectedStudentScope === 'class_general' && (
                <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
                    <span className="font-bold text-xs text-[#1E3A8A] flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-[#1E3A8A]" />
                      <span>Cấu Hình Chi Tiết Giấy Mời Chung Cả Lớp {classInfo.className}</span>
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                      Sĩ số: {students.length} học sinh
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu Đề Đối Tượng Kính Gửi (Dòng &quot;Kính gửi&quot;)
                    </label>
                    <input
                      type="text"
                      value={
                        config.generalRecipientTitle ||
                        `Toàn thể Quý bậc Cha mẹ Học sinh Lớp ${classInfo.className}`
                      }
                      onChange={(e) =>
                        setConfig({ ...config, generalRecipientTitle: e.target.value })
                      }
                      placeholder={`Toàn thể Quý bậc Cha mẹ Học sinh Lớp ${classInfo.className}`}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="includeClassStats"
                      checked={config.includeClassStatisticsInGeneral !== false}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          includeClassStatisticsInGeneral: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#1E3A8A] rounded border-slate-300 focus:ring-[#1E3A8A]"
                    />
                    <label
                      htmlFor="includeClassStats"
                      className="text-xs text-slate-700 font-medium cursor-pointer select-none"
                    >
                      Kèm khối thông tin sĩ số tổng quan (Sĩ số: {students.length} em • {boysCount} Nam, {girlsCount} Nữ • Ban cán sự đón tiếp)
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lưu Ý Chung Dành Cho Toàn Thể Phụ Huynh Lớp
                    </label>
                    <textarea
                      rows={2}
                      value={
                        config.classGeneralNote ??
                        config.notesForParents ??
                        'Kính mong Quý Phụ huynh sắp xếp thời gian tham dự đông đủ, đúng giờ, mang theo sổ liên lạc/ghi chép và gửi xe theo hướng dẫn của nhà trường.'
                      }
                      onChange={(e) =>
                        setConfig({ ...config, classGeneralNote: e.target.value })
                      }
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      placeholder="Lưu ý về giờ giấc, nơi gửi xe, trang phục hoặc vật dụng cần mang theo..."
                    />
                  </div>

                  {/* Tiện ích sao chép tin nhắn Zalo gửi phụ huynh cả lớp */}
                  <div className="mt-2 p-3 bg-white rounded-lg border border-blue-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-700" />
                        <span className="font-bold text-xs text-blue-900">
                          Tiện Ích Gửi Nhóm Zalo Phụ Huynh Lớp {classInfo.className}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Nội dung đã được tạo sẵn câu từ lịch thiệp, thời gian, địa điểm rõ ràng để thầy cô copy gửi ngay.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyZaloMessage}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                    >
                      {copiedZalo ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Đã Sao Chép Tin Nhắn!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao Chép Tin Nhắn Zalo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* CHỌN HỌC SINH CỤ THỂ (NẾU CHỌN SINGLE) */}
              {selectedStudentScope === 'single' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn Học Sinh Cụ Thể Nhận Giấy Mời
                  </label>
                  <select
                    value={selectedSingleStudentId}
                    onChange={(e) => setSelectedSingleStudentId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold"
                  >
                    {students.map((s, idx) => (
                      <option key={s.id} value={s.id}>
                        {idx + 1}. {s.name} — Tổ {s.team} ({s.gender})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* LỰA CHỌN BỐ CỤC TRANG IN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bố Cục Trang In Giấy Mời
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, layoutMode: 'a5_landscape' })}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      config.layoutMode === 'a5_landscape'
                        ? 'border-[#1E3A8A] bg-blue-50/80 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <LayoutTemplate className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-xs">
                        Bản In Trang A5 Ngang
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Khổ giấy chuẩn A5 nằm ngang (210 x 148 mm). In trực tiếp lên giấy A5 hoặc xuất PDF trang A5 ngang, nhỏ gọn, chuẩn phong bì thư.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, layoutMode: 'two_per_page' })}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      config.layoutMode === 'two_per_page'
                        ? 'border-[#1E3A8A] bg-blue-50/80 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Scissors className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs">
                        2 Giấy Mời / 1 Tờ A4 (Tiết Kiệm Giấy)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      In 2 bản trên 1 trang A4 kèm đường nét đứt cắt kéo ở giữa. Tiết kiệm 50% giấy in học đường.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, layoutMode: 'single_full' })}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      config.layoutMode === 'single_full'
                        ? 'border-[#1E3A8A] bg-blue-50/80 text-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#1E3A8A]" />
                      <span className="font-bold text-xs">1 Giấy Mời Đầy Đủ / 1 Tờ A4</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Khổ lớn trang trọng toàn trang A4 đứng, nhiều khoảng trống chi tiết, dán bảng tin hoặc lưu trữ hồ sơ.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {selectedStudentScope === 'class_general'
              ? `🏛️ Sẵn sàng tạo Giấy Mời Họp Phụ Huynh Chung cho toàn thể lớp ${classInfo.className}`
              : selectedStudentScope === 'all'
              ? `👨‍👩‍👧‍👦 Sẵn sàng tạo ${students.length} giấy mời riêng cho từng học sinh lớp ${classInfo.className}`
              : `👤 Tạo 1 giấy mời riêng cho học sinh được chọn`}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleSaveAndPrint}
              className="w-1/2 sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>
                {selectedStudentScope === 'class_general'
                  ? 'Xem Trước & In Giấy Mời Chung'
                  : 'Xem Trước & In Giấy Mời'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
