export const getStandaloneHtmlMarkup = (initialDataJson: string, jsEngineCode: string): string => {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartClass - Quản Lý Lớp Chủ Nhiệm (Offline)</title>
  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- FontAwesome via CDN -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- SheetJS via CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <!-- jsPDF & AutoTable via CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  <style>
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background: white !important; font-family: serif !important; }
    }
    .print-only { display: none; }
    /* Fallback and utility scroll */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col font-sans selection:bg-blue-200">
  <!-- HEADER -->
  <header id="main-header" class="bg-[#1E3A8A] text-white shadow-lg sticky top-0 z-40 no-print transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
      <div class="flex items-center space-x-3 cursor-pointer" onclick="switchTab('attendance')">
        <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
          <i class="fa-solid fa-graduation-cap text-xl text-amber-300"></i>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="font-bold text-lg leading-tight tracking-tight">SmartClass</h1>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">Offline Pro</span>
          </div>
          <p class="text-xs text-blue-200" id="header-subtitle">Lớp học thông minh • Đầy đủ tính năng trực tiếp</p>
        </div>
      </div>

      <!-- Quick Info Badge -->
      <div class="hidden md:flex items-center space-x-3 bg-black/20 px-3 py-1.5 rounded-xl border border-white/20 text-xs">
        <div>Lớp: <span id="header-class-name" class="font-bold text-white">--</span></div>
        <div class="text-white/40">|</div>
        <div>GVCN: <span id="header-teacher-name" class="font-medium text-white">--</span></div>
        <div class="text-white/40">|</div>
        <div>Năm học: <span id="header-academic-year" class="text-amber-200 font-semibold">--</span></div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2">
        <!-- Role Button -->
        <button onclick="openRoleModal()" id="btn-current-role" class="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300 cursor-pointer">
          <i class="fa-solid fa-shield-halved text-sm"></i>
          <span id="role-display-name">GVCN (Admin)</span>
          <i class="fa-solid fa-chevron-down text-[10px] opacity-70"></i>
        </button>

        <!-- Theme Button -->
        <button onclick="openThemeModal()" title="Đổi màu sắc giao diện" class="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white border border-white/20 transition-all cursor-pointer">
          <i class="fa-solid fa-palette text-amber-300 mr-1"></i>
          <span class="hidden sm:inline">Giao diện</span>
        </button>

        <!-- Print Button -->
        <button onclick="openPrintModal()" title="In báo cáo A4" class="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white border border-white/20 transition-all cursor-pointer">
          <i class="fa-solid fa-print text-blue-200 mr-1"></i>
          <span class="hidden sm:inline">In A4</span>
        </button>

        <!-- Reset Button -->
        <button onclick="confirmResetMockData()" title="Khôi phục dữ liệu gốc" class="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-rose-700/80 text-xs font-medium text-white border border-white/20 transition-all cursor-pointer">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </div>

    <!-- TABS NAVIGATION -->
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 overflow-x-auto pb-2 border-t border-white/15 pt-2 text-xs sm:text-sm font-medium">
      <button onclick="switchTab('attendance')" id="tab-btn-attendance" class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all">
        <i class="fa-solid fa-clipboard-user mr-1.5"></i>Điểm danh
      </button>
      <button onclick="switchTab('rules')" id="tab-btn-rules" class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all">
        <i class="fa-solid fa-scale-balanced mr-1.5"></i>Nội quy & Chấm điểm
      </button>
      <button onclick="switchTab('leaderboard')" id="tab-btn-leaderboard" class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all">
        <i class="fa-solid fa-trophy mr-1.5"></i>Bảng xếp hạng
      </button>
      <button onclick="switchTab('logs')" id="tab-btn-logs" class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all">
        <i class="fa-solid fa-clock-rotate-left mr-1.5"></i>Nhật ký lớp
      </button>
      <button onclick="switchTab('feedback')" id="tab-btn-feedback" class="relative px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all">
        <i class="fa-solid fa-comments mr-1.5"></i>Phản hồi
        <span id="feedback-badge" class="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold hidden">0</span>
      </button>
      <button onclick="switchTab('reports')" id="tab-btn-reports" class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all">
        <i class="fa-solid fa-file-excel mr-1.5"></i>Xuất báo cáo
      </button>
      <button onclick="switchTab('settings')" id="tab-btn-settings" class="px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all">
        <i class="fa-solid fa-sliders mr-1.5"></i>Cài đặt
      </button>
    </nav>
  </header>

  <!-- EVALUATION PERIOD BAR -->
  <div id="period-bar" class="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 shadow-2xs no-print">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center space-x-2">
        <span class="font-bold text-slate-500 uppercase tracking-wider text-[11px]"><i class="fa-solid fa-calendar-check text-blue-600 mr-1"></i>Kỳ thi đua:</span>
        <div class="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
          <button onclick="setPeriodType('week')" id="period-btn-week" class="px-2.5 py-1 rounded-md font-bold transition-all">Tuần</button>
          <button onclick="setPeriodType('month')" id="period-btn-month" class="px-2.5 py-1 rounded-md font-medium transition-all">Tháng</button>
          <button onclick="setPeriodType('year')" id="period-btn-year" class="px-2.5 py-1 rounded-md font-medium transition-all">Cả Năm</button>
        </div>
        <select id="period-sub-select" onchange="handlePeriodSubChange(this.value)" class="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800"></select>
      </div>

      <!-- Lock Status & Toggle -->
      <div class="flex items-center space-x-2">
        <span id="period-lock-indicator" class="inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
          <i class="fa-solid fa-lock-open mr-1"></i>Đang mở sổ thi đua
        </span>
        <button onclick="togglePeriodLock()" id="btn-toggle-lock" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer">
          <i class="fa-solid fa-lock mr-1"></i>Khóa Sổ
        </button>
      </div>
    </div>
  </div>

  <!-- MAIN VIEW CONTAINER -->
  <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 no-print">
    <!-- TAB 1: ATTENDANCE -->
    <div id="view-attendance" class="space-y-6"></div>

    <!-- TAB 2: RULES & LOGGING -->
    <div id="view-rules" class="space-y-6 hidden"></div>

    <!-- TAB 3: LEADERBOARD -->
    <div id="view-leaderboard" class="space-y-6 hidden"></div>

    <!-- TAB 4: ACTIVITY LOGS -->
    <div id="view-logs" class="space-y-6 hidden"></div>

    <!-- TAB 5: FEEDBACK -->
    <div id="view-feedback" class="space-y-6 hidden"></div>

    <!-- TAB 6: REPORTS -->
    <div id="view-reports" class="space-y-6 hidden"></div>

    <!-- TAB 7: SETTINGS -->
    <div id="view-settings" class="space-y-6 hidden"></div>
  </main>

  <!-- MODALS CONTAINER -->
  <div id="modals-root"></div>

  <!-- PRINT ONLY REPORT VIEW (Hidden on screen, visible on print) -->
  <div id="print-sheet-container" class="print-only p-8 text-black bg-white"></div>

  <!-- EMBEDDED DATA & JAVASCRIPT ENGINE -->
  <script>
    window.__INITIAL_DATA__ = ${initialDataJson};
  </script>
  <script>
    ${jsEngineCode}
  </script>
</body>
</html>`;
};
