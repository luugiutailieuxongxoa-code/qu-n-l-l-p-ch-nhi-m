export const getStandaloneJsEngine = (): string => {
  return `
// SMARTCLASS OFFLINE FULL-FEATURED ENGINE
(function() {
  const STORAGE_KEY = 'smartclass_offline_v2_data';

  // Helper date functions
  function getTodayString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getWeekFromDate(dateStr) {
    return appState.classInfo.weekNumber || 1;
  }

  // Initial State Loading
  let savedData = null;
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (item) savedData = JSON.parse(item);
  } catch (e) {
    console.error(e);
  }

  const initial = window.__INITIAL_DATA__ || {};
  window.appState = {
    classInfo: (() => {
      let ci = (savedData && savedData.classInfo) || initial.classInfo || {};
      if (!ci.schoolName || ci.schoolName === 'THCS Lê Quý Đôn' || ci.schoolName === 'TRƯỜNG THPT CHUYÊN NGUYỄN DU') {
        ci.schoolName = 'THPT Thống Nhất B';
      }
      if (!ci.teacherName || ci.teacherName === 'Nguyễn Văn An' || ci.teacherName === 'Thầy Hoàng Minh Tuấn') {
        ci.teacherName = 'Nguyễn Văn Thắng';
      }
      if (!ci.location || ci.location === 'Hà Nội') {
        ci.location = 'Phước Sơn';
      }
      if (!ci.className) ci.className = '10A1';
      if (!ci.academicYear) ci.academicYear = '2024-2025';
      if (!ci.semester) ci.semester = 'Học kỳ 1';
      if (!ci.adminPin) ci.adminPin = '1234';
      if (!ci.lockedWeeks) ci.lockedWeeks = [];
      if (!ci.lockedMonths) ci.lockedMonths = [];
      return ci;
    })(),
    students: (savedData && savedData.students) || initial.students || [],
    rules: (savedData && savedData.rules) || initial.rules || [],
    attendance: (savedData && savedData.attendance) || initial.attendance || [],
    logs: (savedData && savedData.logs) || initial.logs || [],
    feedbacks: (savedData && savedData.feedbacks) || initial.feedbacks || [],
    themeConfig: (savedData && savedData.themeConfig) || initial.themeConfig || {
      colorId: 'navy'
    },
    currentSession: (savedData && savedData.currentSession) || initial.currentSession || {
      role: 'admin',
      displayName: 'GVCN (Admin)',
      canEditPoints: true,
      canTakeAttendance: true,
      canInputLogs: true,
      isReadOnly: false
    },
    currentPeriod: {
      type: 'week',
      weekNumber: 1,
      month: 9,
      academicYear: '2024-2025'
    },
    activeTab: 'attendance',
    attendanceDate: getTodayString(),
    filters: {
      attendanceTeam: 'all',
      attendanceSearch: '',
      rulesCategory: 'all',
      rulesSearch: '',
      leaderboardTeam: 'all',
      leaderboardSearch: '',
      logsType: 'all',
      logsStudent: 'all',
      logsOnlyMe: false,
      feedbackStatus: 'all'
    }
  };

  if (!appState.classInfo.lockedWeeks) appState.classInfo.lockedWeeks = [];
  if (!appState.classInfo.lockedMonths) appState.classInfo.lockedMonths = [];
  appState.currentPeriod.weekNumber = appState.classInfo.weekNumber || 1;

  window.saveState = function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        classInfo: appState.classInfo,
        students: appState.students,
        rules: appState.rules,
        attendance: appState.attendance,
        logs: appState.logs,
        feedbacks: appState.feedbacks,
        themeConfig: appState.themeConfig,
        currentSession: appState.currentSession
      }));
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  // THEME COLORS
  const THEME_PALETTES = {
    navy: { primary: '#1E3A8A', light: '#3B82F6', text: 'text-[#1E3A8A]', bg: 'bg-[#1E3A8A]' },
    emerald: { primary: '#065F46', light: '#10B981', text: 'text-emerald-800', bg: 'bg-emerald-800' },
    indigo: { primary: '#3730A3', light: '#6366F1', text: 'text-indigo-800', bg: 'bg-indigo-800' },
    crimson: { primary: '#881337', light: '#F43F5E', text: 'text-rose-900', bg: 'bg-rose-900' },
    slate: { primary: '#0F172A', light: '#475569', text: 'text-slate-900', bg: 'bg-slate-900' },
    violet: { primary: '#581C87', light: '#8B5CF6', text: 'text-purple-900', bg: 'bg-purple-900' }
  };

  window.applyTheme = function() {
    const palette = THEME_PALETTES[appState.themeConfig.colorId] || THEME_PALETTES.navy;
    const header = document.getElementById('main-header');
    if (header) {
      header.style.backgroundColor = palette.primary;
    }
  };

  // EVALUATION & LOCKING LOGIC
  window.isPeriodLocked = function() {
    const cp = appState.currentPeriod;
    if (cp.type === 'week') {
      return (appState.classInfo.lockedWeeks || []).includes(cp.weekNumber);
    }
    if (cp.type === 'month') {
      return (appState.classInfo.lockedMonths || []).includes(cp.month);
    }
    return false;
  };

  window.togglePeriodLock = function() {
    if (appState.currentSession.role !== 'admin') {
      alert('Chỉ Giáo viên chủ nhiệm mới có quyền khóa/mở khóa kỳ thi đua.');
      return;
    }
    const cp = appState.currentPeriod;
    if (cp.type === 'year') {
      alert('Không thể khóa cả năm học. Vui lòng chọn theo Tuần hoặc Tháng.');
      return;
    }
    if (cp.type === 'week') {
      const list = appState.classInfo.lockedWeeks || [];
      if (list.includes(cp.weekNumber)) {
        appState.classInfo.lockedWeeks = list.filter(w => w !== cp.weekNumber);
      } else {
        appState.classInfo.lockedWeeks.push(cp.weekNumber);
      }
    } else if (cp.type === 'month') {
      const list = appState.classInfo.lockedMonths || [];
      if (list.includes(cp.month)) {
        appState.classInfo.lockedMonths = list.filter(m => m !== cp.month);
      } else {
        appState.classInfo.lockedMonths.push(cp.month);
      }
    }
    saveState();
    renderPeriodBar();
    renderCurrentTab();
  };

  window.setPeriodType = function(type) {
    appState.currentPeriod.type = type;
    renderPeriodBar();
    renderCurrentTab();
  };

  window.handlePeriodSubChange = function(val) {
    const num = parseInt(val, 10);
    if (appState.currentPeriod.type === 'week') {
      appState.currentPeriod.weekNumber = num;
    } else if (appState.currentPeriod.type === 'month') {
      appState.currentPeriod.month = num;
    }
    renderPeriodBar();
    renderCurrentTab();
  };

  function renderPeriodBar() {
    const cp = appState.currentPeriod;
    const btnW = document.getElementById('period-btn-week');
    const btnM = document.getElementById('period-btn-month');
    const btnY = document.getElementById('period-btn-year');
    const subSelect = document.getElementById('period-sub-select');

    btnW.className = 'px-2.5 py-1 rounded-md text-xs font-semibold ' + (cp.type === 'week' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900');
    btnM.className = 'px-2.5 py-1 rounded-md text-xs font-semibold ' + (cp.type === 'month' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900');
    btnY.className = 'px-2.5 py-1 rounded-md text-xs font-semibold ' + (cp.type === 'year' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900');

    if (cp.type === 'week') {
      subSelect.classList.remove('hidden');
      let optHtml = '';
      for (let w = 1; w <= 35; w++) {
        const isLocked = (appState.classInfo.lockedWeeks || []).includes(w);
        optHtml += '<option value="' + w + '" ' + (w === cp.weekNumber ? 'selected' : '') + '>Tuần ' + w + (isLocked ? ' (🔒 Đã khóa)' : '') + '</option>';
      }
      subSelect.innerHTML = optHtml;
    } else if (cp.type === 'month') {
      subSelect.classList.remove('hidden');
      const months = [9, 10, 11, 12, 1, 2, 3, 4, 5];
      let optHtml = '';
      months.forEach(m => {
        const isLocked = (appState.classInfo.lockedMonths || []).includes(m);
        optHtml += '<option value="' + m + '" ' + (m === cp.month ? 'selected' : '') + '>Tháng ' + m + (isLocked ? ' (🔒 Đã khóa)' : '') + '</option>';
      });
      subSelect.innerHTML = optHtml;
    } else {
      subSelect.classList.add('hidden');
    }

    const locked = isPeriodLocked();
    const ind = document.getElementById('period-lock-indicator');
    const btnLock = document.getElementById('btn-toggle-lock');
    if (locked) {
      ind.className = 'inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800 border border-rose-300';
      ind.innerHTML = '<i class="fa-solid fa-lock text-rose-600 mr-1"></i>Đã Khóa Sổ';
      btnLock.innerHTML = '<i class="fa-solid fa-lock-open mr-1"></i>Mở Khóa';
      btnLock.className = 'px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-2xs transition-all cursor-pointer';
    } else {
      ind.className = 'inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300';
      ind.innerHTML = '<i class="fa-solid fa-lock-open text-emerald-600 mr-1"></i>Đang Mở Sổ';
      btnLock.innerHTML = '<i class="fa-solid fa-lock mr-1"></i>Khóa Sổ';
      btnLock.className = 'px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-2xs transition-all cursor-pointer';
    }
  }

  // SCORES CALCULATION ENGINE
  window.filterRecordsByCurrentPeriod = function() {
    const cp = appState.currentPeriod;
    let fAtt = appState.attendance;
    let fLogs = appState.logs;

    if (cp.type === 'week') {
      fAtt = fAtt.filter(a => a.weekNumber === cp.weekNumber);
      fLogs = fLogs.filter(l => l.weekNumber === cp.weekNumber);
    } else if (cp.type === 'month') {
      fAtt = fAtt.filter(a => {
        if (!a.date) return false;
        const m = parseInt(a.date.split('-')[1], 10);
        return m === cp.month;
      });
      fLogs = fLogs.filter(l => {
        if (!l.date) return false;
        const m = parseInt(l.date.split('-')[1], 10);
        return m === cp.month;
      });
    }
    return { filteredAttendance: fAtt, filteredLogs: fLogs };
  };

  window.calcStudentScores = function() {
    const { filteredAttendance, filteredLogs } = filterRecordsByCurrentPeriod();

    const summaries = appState.students.map(s => {
      const sAtt = filteredAttendance.filter(a => a.studentId === s.id);
      const late = sAtt.filter(a => a.status === 'late').length;
      const unexcused = sAtt.filter(a => a.status === 'unexcused').length;
      const excused = sAtt.filter(a => a.status === 'excused').length;
      const present = sAtt.filter(a => a.status === 'present').length;

      const attPenalty = unexcused * 5 + late * 2;
      const sLogs = filteredLogs.filter(l => l.studentId === s.id);
      const bonus = sLogs.filter(l => l.type === 'bonus').reduce((acc, l) => acc + l.points, 0);
      const penalty = sLogs.filter(l => l.type === 'penalty').reduce((acc, l) => acc + l.points, 0) + attPenalty;
      const total = 100 + bonus - penalty;

      let cat = 'Cần rèn luyện';
      if (total >= 100) cat = 'Xuất sắc';
      else if (total >= 90) cat = 'Tốt';
      else if (total >= 80) cat = 'Đạt';

      return {
        student: s,
        baseScore: 100,
        totalBonus: bonus,
        totalPenalty: penalty,
        totalScore: total,
        rank: 1,
        category: cat,
        attendanceStats: { present, late, excused, unexcused }
      };
    });

    summaries.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (a.totalPenalty !== b.totalPenalty) return a.totalPenalty - b.totalPenalty;
      return a.student.name.localeCompare(b.student.name, 'vi');
    });

    let currentRank = 1;
    for (let i = 0; i < summaries.length; i++) {
      if (i > 0 && summaries[i].totalScore === summaries[i - 1].totalScore) {
        summaries[i].rank = summaries[i - 1].rank;
      } else {
        summaries[i].rank = currentRank;
      }
      currentRank++;
    }

    return summaries;
  };

  window.calcTeamScores = function(studentSummaries) {
    return [1, 2, 3, 4].map(teamNum => {
      const members = studentSummaries.filter(s => s.student.team === teamNum);
      const count = members.length;
      const totalScoreSum = members.reduce((sum, m) => sum + m.totalScore, 0);
      const totalBonus = members.reduce((sum, m) => sum + m.totalBonus, 0);
      const totalPenalty = members.reduce((sum, m) => sum + m.totalPenalty, 0);
      const avg = count > 0 ? parseFloat((totalScoreSum / count).toFixed(2)) : 0;
      return {
        team: teamNum,
        memberCount: count,
        averageScore: avg,
        totalBonus,
        totalPenalty,
        rank: 1
      };
    }).sort((a, b) => b.averageScore - a.averageScore).map((t, idx) => ({ ...t, rank: idx + 1 }));
  };

  // TAB SWITCHING
  window.switchTab = function(tabName) {
    appState.activeTab = tabName;
    const tabs = ['attendance', 'rules', 'leaderboard', 'logs', 'feedback', 'reports', 'settings'];
    tabs.forEach(t => {
      const view = document.getElementById('view-' + t);
      const btn = document.getElementById('tab-btn-' + t);
      if (t === tabName) {
        if (view) view.classList.remove('hidden');
        if (btn) btn.className = 'px-3.5 py-1.5 rounded-xl whitespace-nowrap bg-white text-[#1E3A8A] font-bold shadow-xs';
      } else {
        if (view) view.classList.add('hidden');
        if (btn) btn.className = 'px-3.5 py-1.5 rounded-xl whitespace-nowrap text-white/80 hover:bg-white/10 hover:text-white font-medium';
      }
    });
    renderCurrentTab();
  };

  function renderCurrentTab() {
    updateFeedbackBadge();
    switch (appState.activeTab) {
      case 'attendance': renderAttendanceView(); break;
      case 'rules': renderRulesView(); break;
      case 'leaderboard': renderLeaderboardView(); break;
      case 'logs': renderLogsView(); break;
      case 'feedback': renderFeedbackView(); break;
      case 'reports': renderReportsView(); break;
      case 'settings': renderSettingsView(); break;
    }
  }

  function updateFeedbackBadge() {
    const badge = document.getElementById('feedback-badge');
    if (!badge) return;
    const pendingCount = (appState.feedbacks || []).filter(f => f.status === 'pending').length;
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // TAB 1: ATTENDANCE RENDERING
  function renderAttendanceView() {
    const container = document.getElementById('view-attendance');
    const locked = isPeriodLocked();
    const isAdmin = appState.currentSession.role === 'admin';
    const isStudent = appState.currentSession.role === 'student' || appState.currentSession.isReadOnly;
    const canTakeAttendance = isAdmin || (appState.currentSession.canTakeAttendance && !locked);

    const dateVal = appState.attendanceDate || getTodayString();
    const dayRecords = appState.attendance.filter(a => a.date === dateVal);
    const totalStudents = appState.students.length;
    const presentCount = appState.students.filter(s => {
      const r = dayRecords.find(a => a.studentId === s.id);
      return r && r.status === 'present';
    }).length;
    const lateCount = appState.students.filter(s => {
      const r = dayRecords.find(a => a.studentId === s.id);
      return r && r.status === 'late';
    }).length;
    const excusedCount = appState.students.filter(s => {
      const r = dayRecords.find(a => a.studentId === s.id);
      return r && r.status === 'excused';
    }).length;
    const unexcusedCount = appState.students.filter(s => {
      const r = dayRecords.find(a => a.studentId === s.id);
      return r && r.status === 'unexcused';
    }).length;

    let html = '';

    // Locked alert
    if (locked) {
      html += \`
        <div class="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-900 shadow-xs">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-lock text-rose-600 text-base"></i>
            <span><strong>Kỳ thi đua này đã được GVCN khóa sổ tổng kết.</strong> Điểm danh đang ở chế độ xem.</span>
          </div>
          \${isAdmin ? '<button onclick="togglePeriodLock()" class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer">Mở khóa</button>' : ''}
        </div>
      \`;
    }

    // Top Card
    html += \`
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-calendar-day"></i>
            </div>
            <div>
              <span class="block text-[11px] font-bold text-slate-500 uppercase">Ngày điểm danh</span>
              <div class="flex items-center space-x-2 mt-0.5">
                <input type="date" value="\${dateVal}" onchange="changeAttendanceDate(this.value)" class="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50">
                <button onclick="changeAttendanceDate('\${getTodayString()}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer">Hôm nay</button>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            \${canTakeAttendance ? \`
              <button onclick="markAllPresent()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
                <i class="fa-solid fa-check-double mr-1.5"></i>Điểm danh nhanh Cả Lớp Có Mặt
              </button>
            \` : \`
              <div class="text-xs text-slate-500 italic bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Chỉ xem điểm danh
              </div>
            \`}
          </div>
        </div>

        <!-- Metric stats -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs font-medium">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-slate-500 block text-[11px]">Sĩ số</span>
            <span class="text-lg font-black text-slate-900">\${totalStudents}</span>
          </div>
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <span class="text-emerald-700 block text-[11px]">Có mặt</span>
            <span class="text-lg font-black text-emerald-800">\${presentCount}</span>
          </div>
          <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <span class="text-amber-700 block text-[11px]">Đi trễ (-2đ)</span>
            <span class="text-lg font-black text-amber-800">\${lateCount}</span>
          </div>
          <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
            <span class="text-blue-700 block text-[11px]">Có phép</span>
            <span class="text-lg font-black text-blue-800">\${excusedCount}</span>
          </div>
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
            <span class="text-rose-700 block text-[11px]">Không phép (-5đ)</span>
            <span class="text-lg font-black text-rose-800">\${unexcusedCount}</span>
          </div>
        </div>
      </div>
    \`;

    // Filter controls
    html += \`
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-600">Lọc Tổ:</span>
          <select onchange="appState.filters.attendanceTeam = this.value; renderAttendanceView();" class="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold bg-slate-50">
            <option value="all" \${appState.filters.attendanceTeam === 'all' ? 'selected' : ''}>Tất cả các tổ</option>
            <option value="1" \${appState.filters.attendanceTeam === '1' ? 'selected' : ''}>Tổ 1</option>
            <option value="2" \${appState.filters.attendanceTeam === '2' ? 'selected' : ''}>Tổ 2</option>
            <option value="3" \${appState.filters.attendanceTeam === '3' ? 'selected' : ''}>Tổ 3</option>
            <option value="4" \${appState.filters.attendanceTeam === '4' ? 'selected' : ''}>Tổ 4</option>
          </select>
        </div>
        <div class="w-full sm:w-64">
          <input type="text" placeholder="Tìm tên học sinh..." value="\${appState.filters.attendanceSearch || ''}" oninput="appState.filters.attendanceSearch = this.value; renderAttendanceView();" class="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs">
        </div>
      </div>
    \`;

    // Student Grouped Lists by Team
    const teams = [1, 2, 3, 4];
    teams.forEach(teamNum => {
      if (appState.filters.attendanceTeam !== 'all' && String(teamNum) !== appState.filters.attendanceTeam) {
        return;
      }
      let teamStudents = appState.students.filter(s => s.team === teamNum);
      if (appState.filters.attendanceSearch) {
        const q = appState.filters.attendanceSearch.toLowerCase().trim();
        teamStudents = teamStudents.filter(s => s.name.toLowerCase().includes(q));
      }
      if (teamStudents.length === 0) return;

      html += \`
        <div class="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div class="bg-slate-50 px-4 py-2.5 font-bold text-xs uppercase text-slate-700 border-b border-slate-200 flex justify-between items-center">
            <span><i class="fa-solid fa-users text-blue-600 mr-2"></i>Tổ \${teamNum} (\${teamStudents.length} học sinh)</span>
          </div>
          <div class="divide-y divide-slate-100">
      \`;

      teamStudents.forEach(student => {
        const rec = dayRecords.find(a => a.studentId === student.id);
        const status = rec ? rec.status : 'present';

        html += \`
          <div class="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors">
            <div class="flex items-center space-x-3">
              <div class="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                \${student.gender === 'Nữ' ? '♀' : '♂'}
              </div>
              <div>
                <span class="font-bold text-xs sm:text-sm text-slate-900">\${student.name}</span>
                <span class="text-[11px] text-slate-400 ml-1">(\${student.gender})</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-1.5 text-xs">
              <button onclick="setStudentAttendance('\${student.id}', 'present')" \${!canTakeAttendance ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer \${status === 'present' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                Có mặt
              </button>
              <button onclick="setStudentAttendance('\${student.id}', 'late')" \${!canTakeAttendance ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer \${status === 'late' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                Đi trễ (-2đ)
              </button>
              <button onclick="setStudentAttendance('\${student.id}', 'excused')" \${!canTakeAttendance ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer \${status === 'excused' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                Có phép
              </button>
              <button onclick="setStudentAttendance('\${student.id}', 'unexcused')" \${!canTakeAttendance ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer \${status === 'unexcused' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                Không phép (-5đ)
              </button>
            </div>
          </div>
        \`;
      });

      html += '</div></div>';
    });

    container.innerHTML = html;
  }

  window.changeAttendanceDate = function(newDate) {
    appState.attendanceDate = newDate;
    renderAttendanceView();
  };

  window.setStudentAttendance = function(studentId, status) {
    const locked = isPeriodLocked();
    const isAdmin = appState.currentSession.role === 'admin';
    if (locked && !isAdmin) {
      alert('Kỳ thi đua đã bị khóa sổ tổng kết.');
      return;
    }

    const dateVal = appState.attendanceDate || getTodayString();
    const weekNum = appState.classInfo.weekNumber || 1;
    const existingIndex = appState.attendance.findIndex(a => a.date === dateVal && a.studentId === studentId);

    if (existingIndex >= 0) {
      appState.attendance[existingIndex].status = status;
      appState.attendance[existingIndex].timestamp = dateVal + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else {
      appState.attendance.push({
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        date: dateVal,
        weekNumber: weekNum,
        studentId: studentId,
        status: status,
        timestamp: dateVal + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        recordedBy: appState.currentSession.displayName
      });
    }
    saveState();
    renderAttendanceView();
  };

  window.markAllPresent = function() {
    const locked = isPeriodLocked();
    const isAdmin = appState.currentSession.role === 'admin';
    if (locked && !isAdmin) {
      alert('Kỳ thi đua đã bị khóa sổ tổng kết.');
      return;
    }

    const dateVal = appState.attendanceDate || getTodayString();
    const weekNum = appState.classInfo.weekNumber || 1;
    const nowTime = dateVal + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    appState.attendance = appState.attendance.filter(a => a.date !== dateVal);
    appState.students.forEach(s => {
      appState.attendance.push({
        id: 'att-' + Date.now() + '-' + s.id,
        date: dateVal,
        weekNumber: weekNum,
        studentId: s.id,
        status: 'present',
        timestamp: nowTime,
        recordedBy: appState.currentSession.displayName
      });
    });
    saveState();
    renderAttendanceView();
  };

  // TAB 2: RULES & LOGGING
  function renderRulesView() {
    const container = document.getElementById('view-rules');
    const locked = isPeriodLocked();
    const isAdmin = appState.currentSession.role === 'admin';
    const isStudent = appState.currentSession.role === 'student' || appState.currentSession.isReadOnly;
    const canLog = !isStudent && (isAdmin || (!locked && appState.currentSession.canInputLogs));

    let html = '';

    // Fast Logging Form
    html += \`
      <div class="bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div>
              <h2 class="font-bold text-sm sm:text-base">Ghi Nhận Thưởng / Phạt Nhanh</h2>
              <p class="text-xs text-blue-200">Cộng hoặc trừ điểm thi đua cho học sinh theo nội quy</p>
            </div>
          </div>
          \${locked ? '<span class="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold"><i class="fa-solid fa-lock mr-1"></i>Sổ Đang Khóa</span>' : ''}
        </div>

        \${canLog ? \`
          <form onsubmit="handleSaveQuickLog(event)" class="space-y-3.5 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <!-- Loại hình: Thưởng hay Phạt -->
              <div class="sm:col-span-3">
                <label class="block text-blue-200 font-semibold mb-1">1. Hình thức</label>
                <div class="grid grid-cols-2 gap-1.5 bg-blue-950/60 p-1 rounded-xl border border-blue-800">
                  <button type="button" onclick="setQuickLogType('bonus')" id="btn-quick-bonus" class="py-1.5 rounded-lg font-bold transition-all bg-emerald-600 text-white">
                    <i class="fa-solid fa-plus mr-1"></i>Thưởng
                  </button>
                  <button type="button" onclick="setQuickLogType('penalty')" id="btn-quick-penalty" class="py-1.5 rounded-lg font-medium text-blue-200 hover:text-white">
                    <i class="fa-solid fa-minus mr-1"></i>Vi phạm
                  </button>
                </div>
              </div>

              <!-- Chọn Nội quy -->
              <div class="sm:col-span-5">
                <label class="block text-blue-200 font-semibold mb-1">2. Chọn hành vi / nội quy</label>
                <select id="quick-log-rule" class="w-full bg-blue-950 border border-blue-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none">
                </select>
              </div>

              <!-- Chọn Học sinh -->
              <div class="sm:col-span-4">
                <label class="block text-blue-200 font-semibold mb-1">3. Đối tượng áp dụng</label>
                <select id="quick-log-student" class="w-full bg-blue-950 border border-blue-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none">
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div class="sm:col-span-9">
                <input type="text" id="quick-log-note" placeholder="Ghi chú thêm (VD: Tiết Toán, minh chứng, chi tiết việc tốt...)" class="w-full bg-blue-950 border border-blue-700 rounded-xl px-3 py-2 text-white placeholder-blue-300 focus:outline-none">
              </div>
              <div class="sm:col-span-3 flex justify-end">
                <button type="submit" class="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-xs transition-all cursor-pointer">
                  <i class="fa-solid fa-check mr-1.5"></i>Lưu Điểm Ngay
                </button>
              </div>
            </div>
          </form>
        \` : \`
          <div class="p-4 bg-white/10 rounded-xl text-center text-xs text-blue-100">
            \${isStudent ? 'Tài khoản học sinh chỉ có quyền xem nội quy và điểm số.' : 'Kỳ thi đua hiện tại đã được khóa sổ, không thể ghi nhận thêm điểm.'}
          </div>
        \`}
      </div>
    \`;

    // Catalog of Rules
    html += \`
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-bold text-slate-900 text-sm sm:text-base"><i class="fa-solid fa-book-bookmark text-blue-600 mr-2"></i>Bảng Danh Mục Nội Quy & Thang Điểm</h3>
            <p class="text-xs text-slate-500">Quy định điểm chuẩn thi đua nề nếp lớp học</p>
          </div>
          <div class="flex items-center space-x-2">
            <input type="text" placeholder="Tìm kiếm nội quy..." value="\${appState.filters.rulesSearch || ''}" oninput="appState.filters.rulesSearch = this.value; renderRulesView();" class="border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    \`;

    let filteredRules = appState.rules;
    if (appState.filters.rulesSearch) {
      const q = appState.filters.rulesSearch.toLowerCase().trim();
      filteredRules = filteredRules.filter(r => r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
    }

    filteredRules.forEach(r => {
      const isBonus = r.type === 'bonus';
      html += \`
        <div class="p-3.5 rounded-xl border \${isBonus ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'} flex items-center justify-between gap-2 transition-all hover:shadow-xs">
          <div class="space-y-0.5">
            <span class="font-bold text-xs text-slate-900 block">\${r.name}</span>
            <span class="text-[10px] text-slate-500 uppercase font-semibold">\${r.category}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-black \${isBonus ? 'text-emerald-700' : 'text-rose-700'}">
              \${isBonus ? '+' : '-'}\${r.points}đ
            </span>
            \${canLog ? \`
              <button onclick="quickPickRule('\${r.id}')" title="Chọn ghi nhận nhanh" class="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200 text-slate-700 hover:text-blue-600 cursor-pointer">
                <i class="fa-solid fa-plus text-xs"></i>
              </button>
            \` : ''}
          </div>
        </div>
      \`;
    });

    html += '</div></div>';
    container.innerHTML = html;

    // Populate selects
    if (canLog) {
      updateQuickLogSelects();
    }
  }

  let quickLogCurrentType = 'bonus';
  window.setQuickLogType = function(type) {
    quickLogCurrentType = type;
    const btnB = document.getElementById('btn-quick-bonus');
    const btnP = document.getElementById('btn-quick-penalty');
    if (!btnB || !btnP) return;
    if (type === 'bonus') {
      btnB.className = 'py-1.5 rounded-lg font-bold transition-all bg-emerald-600 text-white';
      btnP.className = 'py-1.5 rounded-lg font-medium text-blue-200 hover:text-white';
    } else {
      btnB.className = 'py-1.5 rounded-lg font-medium text-blue-200 hover:text-white';
      btnP.className = 'py-1.5 rounded-lg font-bold transition-all bg-rose-600 text-white';
    }
    updateQuickLogSelects();
  };

  function updateQuickLogSelects() {
    const selRule = document.getElementById('quick-log-rule');
    const selStudent = document.getElementById('quick-log-student');
    if (!selRule || !selStudent) return;

    const rules = appState.rules.filter(r => r.type === quickLogCurrentType);
    selRule.innerHTML = rules.map(r => \`<option value="\${r.id}">[\${r.type === 'bonus' ? '+' : '-'}\${r.points}đ] \${r.name}</option>\`).join('');

    let studentOpt = '<option value="all_class">-- Cả Lớp (\${appState.students.length} học sinh) --</option>';
    [1, 2, 3, 4].forEach(t => {
      studentOpt += \`<option value="team_\${t}">-- Cả Tổ \${t} --</option>\`;
    });
    studentOpt += '<optgroup label="Từng học sinh">';
    appState.students.forEach(s => {
      studentOpt += \`<option value="\${s.id}">Tổ \${s.team} - \${s.name}</option>\`;
    });
    studentOpt += '</optgroup>';
    selStudent.innerHTML = studentOpt;
  }

  window.quickPickRule = function(ruleId) {
    const rule = appState.rules.find(r => r.id === ruleId);
    if (!rule) return;
    setQuickLogType(rule.type);
    const sel = document.getElementById('quick-log-rule');
    if (sel) sel.value = ruleId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.handleSaveQuickLog = function(e) {
    e.preventDefault();
    const locked = isPeriodLocked();
    const isAdmin = appState.currentSession.role === 'admin';
    if (locked && !isAdmin) {
      alert('Kỳ thi đua đã bị khóa sổ.');
      return;
    }

    const ruleId = document.getElementById('quick-log-rule').value;
    const targetVal = document.getElementById('quick-log-student').value;
    const note = document.getElementById('quick-log-note').value;
    const rule = appState.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const todayStr = getTodayString();
    const weekNum = appState.classInfo.weekNumber || 1;
    const timestampStr = todayStr + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    let targetStudentIds = [];
    if (targetVal === 'all_class') {
      targetStudentIds = appState.students.map(s => s.id);
    } else if (targetVal.startsWith('team_')) {
      const tNum = parseInt(targetVal.replace('team_', ''), 10);
      targetStudentIds = appState.students.filter(s => s.team === tNum).map(s => s.id);
    } else {
      targetStudentIds = [targetVal];
    }

    targetStudentIds.forEach(sId => {
      appState.logs.unshift({
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        studentId: sId,
        ruleId: rule.id,
        actionName: rule.name,
        category: rule.category,
        type: rule.type,
        points: rule.points,
        date: todayStr,
        weekNumber: weekNum,
        timestamp: timestampStr,
        note: note || undefined,
        source: 'rule',
        recordedBy: appState.currentSession.displayName
      });
    });

    saveState();
    document.getElementById('quick-log-note').value = '';
    alert('Đã ghi nhận điểm thành công cho ' + targetStudentIds.length + ' học sinh!');
    renderRulesView();
  };

  // TAB 3: LEADERBOARD RENDERING
  function renderLeaderboardView() {
    const container = document.getElementById('view-leaderboard');
    const studentSummaries = calcStudentScores();
    const teamSummaries = calcTeamScores(studentSummaries);

    const totalStudents = studentSummaries.length;
    const avgScore = totalStudents > 0 ? (studentSummaries.reduce((a, b) => a + b.totalScore, 0) / totalStudents).toFixed(1) : 0;
    const countExcellent = studentSummaries.filter(s => s.category === 'Xuất sắc').length;
    const countGood = studentSummaries.filter(s => s.category === 'Tốt').length;
    const countFair = studentSummaries.filter(s => s.category === 'Đạt').length;
    const countNeedsImprovement = studentSummaries.filter(s => s.category === 'Cần rèn luyện').length;

    let html = '';

    // Summary Metric Cards
    html += \`
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span class="text-xs text-slate-500 font-semibold block">Điểm Trung Bình Lớp</span>
          <div class="flex items-baseline space-x-2 mt-1">
            <span class="text-2xl font-black text-[#1E3A8A]">\${avgScore}</span>
            <span class="text-xs text-slate-400">/ 100 điểm</span>
          </div>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span class="text-xs text-amber-700 font-semibold block">Xuất Sắc (>=100đ)</span>
          <div class="flex items-baseline space-x-2 mt-1">
            <span class="text-2xl font-black text-amber-600">\${countExcellent}</span>
            <span class="text-xs text-slate-400">học sinh</span>
          </div>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span class="text-xs text-emerald-700 font-semibold block">Tốt (90 - 99đ)</span>
          <div class="flex items-baseline space-x-2 mt-1">
            <span class="text-2xl font-black text-emerald-600">\${countGood}</span>
            <span class="text-xs text-slate-400">học sinh</span>
          </div>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
          <span class="text-xs text-rose-700 font-semibold block">Cần Rèn Luyện (<80đ)</span>
          <div class="flex items-baseline space-x-2 mt-1">
            <span class="text-2xl font-black text-rose-600">\${countNeedsImprovement}</span>
            <span class="text-xs text-slate-400">học sinh</span>
          </div>
        </div>
      </div>
    \`;

    // 4 Teams Ranking Cards
    html += \`
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-3">
        <h3 class="font-bold text-sm text-slate-900"><i class="fa-solid fa-flag text-blue-600 mr-2"></i>Bảng Thi Đua 4 Tổ</h3>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
    \`;

    teamSummaries.forEach(t => {
      const isTop = t.rank === 1;
      html += \`
        <div class="p-4 rounded-xl border \${isTop ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between space-y-2">
          <div class="flex justify-between items-start">
            <span class="font-bold text-xs uppercase text-slate-800">Tổ \${t.team}</span>
            <span class="w-6 h-6 rounded-full \${isTop ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'} flex items-center justify-center font-bold text-xs">
              #\${t.rank}
            </span>
          </div>
          <div>
            <span class="text-xl font-black text-[#1E3A8A]">\${t.averageScore}</span>
            <span class="text-[11px] text-slate-500 block">Điểm TB (\${t.memberCount} HS)</span>
          </div>
          <div class="flex justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5">
            <span class="text-emerald-700 font-bold">+\${t.totalBonus}đ</span>
            <span class="text-rose-700 font-bold">-\${t.totalPenalty}đ</span>
          </div>
        </div>
      \`;
    });

    html += '</div></div>';

    // Individual Student Table
    html += \`
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center space-x-2">
            <h3 class="font-bold text-sm text-slate-900"><i class="fa-solid fa-ranking-star text-amber-500 mr-2"></i>Xếp Hạng Cá Nhân Học Sinh</h3>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <select onchange="appState.filters.leaderboardTeam = this.value; renderLeaderboardView();" class="border border-slate-300 rounded-lg px-2.5 py-1 font-medium bg-slate-50">
              <option value="all" \${appState.filters.leaderboardTeam === 'all' ? 'selected' : ''}>Tất cả các tổ</option>
              <option value="1" \${appState.filters.leaderboardTeam === '1' ? 'selected' : ''}>Tổ 1</option>
              <option value="2" \${appState.filters.leaderboardTeam === '2' ? 'selected' : ''}>Tổ 2</option>
              <option value="3" \${appState.filters.leaderboardTeam === '3' ? 'selected' : ''}>Tổ 3</option>
              <option value="4" \${appState.filters.leaderboardTeam === '4' ? 'selected' : ''}>Tổ 4</option>
            </select>
            <input type="text" placeholder="Tìm tên học sinh..." value="\${appState.filters.leaderboardSearch || ''}" oninput="appState.filters.leaderboardSearch = this.value; renderLeaderboardView();" class="border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="p-3 text-center">Hạng</th>
                <th class="p-3">Họ và tên</th>
                <th class="p-3 text-center">Tổ</th>
                <th class="p-3 text-center">Chuyên cần</th>
                <th class="p-3 text-center text-emerald-700">+Thưởng</th>
                <th class="p-3 text-center text-rose-700">-Phạt</th>
                <th class="p-3 text-center font-black text-[#1E3A8A]">Tổng điểm</th>
                <th class="p-3 text-center">Danh hiệu</th>
                <th class="p-3 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
    \`;

    let filteredList = studentSummaries;
    if (appState.filters.leaderboardTeam !== 'all') {
      filteredList = filteredList.filter(s => String(s.student.team) === appState.filters.leaderboardTeam);
    }
    if (appState.filters.leaderboardSearch) {
      const q = appState.filters.leaderboardSearch.toLowerCase().trim();
      filteredList = filteredList.filter(s => s.student.name.toLowerCase().includes(q));
    }

    filteredList.forEach(item => {
      let badgeStyle = 'bg-slate-100 text-slate-700';
      if (item.category === 'Xuất sắc') badgeStyle = 'bg-amber-100 text-amber-900 border border-amber-300';
      else if (item.category === 'Tốt') badgeStyle = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      else if (item.category === 'Đạt') badgeStyle = 'bg-blue-100 text-blue-900 border border-blue-300';
      else if (item.category === 'Cần rèn luyện') badgeStyle = 'bg-rose-100 text-rose-900 border border-rose-300';

      html += \`
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-3 text-center font-bold">
            <span class="w-6 h-6 inline-flex items-center justify-center rounded-full \${item.rank <= 3 ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-600'}">
              #\${item.rank}
            </span>
          </td>
          <td class="p-3 font-semibold text-slate-900">\${item.student.name}</td>
          <td class="p-3 text-center">Tổ \${item.student.team}</td>
          <td class="p-3 text-center text-slate-500">
            \${item.attendanceStats.unexcused > 0 ? '<span class="text-rose-600 font-bold">' + item.attendanceStats.unexcused + ' KP</span> ' : ''}
            \${item.attendanceStats.late > 0 ? '<span class="text-amber-600 font-bold">' + item.attendanceStats.late + ' Trễ</span>' : 'Đủ'}
          </td>
          <td class="p-3 text-center text-emerald-600 font-bold">+\${item.totalBonus}</td>
          <td class="p-3 text-center text-rose-600 font-bold">-\${item.totalPenalty}</td>
          <td class="p-3 text-center font-black text-sm text-[#1E3A8A]">\${item.totalScore}</td>
          <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] \${badgeStyle}">\${item.category}</span></td>
          <td class="p-3 text-center">
            <button onclick="openStudentDetailModal('\${item.student.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer">
              Hồ sơ
            </button>
          </td>
        </tr>
      \`;
    });

    html += '</tbody></table></div></div>';
    container.innerHTML = html;
  }

  // TAB 4: ACTIVITY LOGS
  function renderLogsView() {
    const container = document.getElementById('view-logs');
    const isAdmin = appState.currentSession.role === 'admin';
    const isStudent = appState.currentSession.role === 'student';
    const myStudentId = appState.currentSession.studentId;

    let html = '';

    html += \`
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-bold text-sm sm:text-base text-slate-900"><i class="fa-solid fa-timeline text-blue-600 mr-2"></i>Nhật Ký Thi Đua & Hoạt Động Lớp</h3>
            <p class="text-xs text-slate-500">Ghi chép minh bạch tất cả các lần thưởng, phạt và chuyên cần</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            \${isStudent ? \`
              <button onclick="appState.filters.logsOnlyMe = !appState.filters.logsOnlyMe; renderLogsView();" class="px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all \${appState.filters.logsOnlyMe ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <i class="fa-solid fa-user-check mr-1.5"></i>Chỉ xem của em
              </button>
            \` : ''}
            <select onchange="appState.filters.logsType = this.value; renderLogsView();" class="border border-slate-300 rounded-lg px-2.5 py-1 bg-slate-50">
              <option value="all" \${appState.filters.logsType === 'all' ? 'selected' : ''}>Tất cả loại</option>
              <option value="bonus" \${appState.filters.logsType === 'bonus' ? 'selected' : ''}>Khen thưởng (+)</option>
              <option value="penalty" \${appState.filters.logsType === 'penalty' ? 'selected' : ''}>Vi phạm (-)</option>
            </select>
          </div>
        </div>

        <div class="divide-y divide-slate-100">
    \`;

    let logsList = appState.logs;
    if (appState.filters.logsOnlyMe && myStudentId) {
      logsList = logsList.filter(l => l.studentId === myStudentId);
    }
    if (appState.filters.logsType !== 'all') {
      logsList = logsList.filter(l => l.type === appState.filters.logsType);
    }

    if (logsList.length === 0) {
      html += '<div class="p-8 text-center text-xs text-slate-400">Không tìm thấy bản ghi nhật ký phù hợp.</div>';
    } else {
      logsList.forEach(log => {
        const student = appState.students.find(s => s.id === log.studentId);
        const isBonus = log.type === 'bonus';
        const isMyLog = myStudentId && log.studentId === myStudentId;

        html += \`
          <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors px-2 rounded-xl">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 rounded-full \${isBonus ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} flex items-center justify-center shrink-0 mt-0.5">
                <i class="fa-solid \${isBonus ? 'fa-award' : 'fa-triangle-exclamation'} text-xs"></i>
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-bold text-xs sm:text-sm text-slate-900">\${student ? student.name : 'Học sinh'}</span>
                  \${student ? '<span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">Tổ ' + student.team + '</span>' : ''}
                  <span class="text-xs font-semibold text-slate-700">• \${log.actionName}</span>
                </div>
                \${log.note ? '<p class="text-xs text-slate-500 mt-0.5 italic">"' + log.note + '"</p>' : ''}
                <div class="flex items-center space-x-3 text-[10px] text-slate-400 mt-1">
                  <span><i class="fa-regular fa-clock mr-1"></i>\${log.timestamp}</span>
                  \${log.recordedBy ? '<span><i class="fa-regular fa-user mr-1"></i>' + log.recordedBy + '</span>' : ''}
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2 self-end sm:self-center">
              <span class="font-black px-2.5 py-1 rounded-full text-xs \${isBonus ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                \${isBonus ? '+' : '-'}\${log.points}đ
              </span>

              \${isStudent && !isBonus ? \`
                <button onclick="openSubmitFeedbackModal('\${log.id}')" title="Khiếu nại lỗi phạt này" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer">
                  Khiếu nại
                </button>
              \` : ''}

              \${isAdmin ? \`
                <button onclick="deleteLogRecord('\${log.id}')" title="Xóa bản ghi này" class="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              \` : ''}
            </div>
          </div>
        \`;
      });
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  window.deleteLogRecord = function(logId) {
    if (!confirm('Xóa bản ghi này? Điểm của học sinh sẽ được hoàn lại tự động.')) return;
    appState.logs = appState.logs.filter(l => l.id !== logId);
    saveState();
    renderLogsView();
  };

  // TAB 5: FEEDBACK RENDERING
  function renderFeedbackView() {
    const container = document.getElementById('view-feedback');
    const isAdmin = appState.currentSession.role === 'admin';
    const isStudent = appState.currentSession.role === 'student';

    let html = '';

    html += \`
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-bold text-sm sm:text-base text-slate-900"><i class="fa-solid fa-comments text-blue-600 mr-2"></i>Hòm Thư Phản Hồi & Giải Quyết Khiếu Nại</h3>
            <p class="text-xs text-slate-500">Cầu nối trao đổi dân chủ giữa học sinh và Giáo viên chủ nhiệm</p>
          </div>
          <button onclick="openSubmitFeedbackModal()" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
            <i class="fa-solid fa-paper-plane mr-1.5"></i>Gửi Ý Kiến / Khiếu Nại Mới
          </button>
        </div>

        <div class="space-y-3">
    \`;

    const feedbacks = appState.feedbacks || [];
    if (feedbacks.length === 0) {
      html += '<div class="p-8 text-center text-xs text-slate-400">Hiện chưa có phản hồi nào được gửi.</div>';
    } else {
      feedbacks.forEach(fb => {
        let statusBadge = 'bg-amber-100 text-amber-900 border border-amber-300';
        let statusText = 'Chờ GVCN duyệt';
        if (fb.status === 'approved') {
          statusBadge = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
          statusText = 'Đã duyệt';
        } else if (fb.status === 'rejected') {
          statusBadge = 'bg-rose-100 text-rose-900 border border-rose-300';
          statusText = 'Đã từ chối';
        }

        html += \`
          <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-xs sm:text-sm text-slate-900">\${fb.studentName}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">Tổ \${fb.team}</span>
                <span class="text-xs font-semibold text-blue-700">• \${fb.title}</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold \${statusBadge}">\${statusText}</span>
                <span class="text-[10px] text-slate-400">\${fb.createdAt}</span>
              </div>
            </div>

            <p class="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">\${fb.content}</p>

            \${fb.teacherReply ? \`
              <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                <div class="font-bold flex items-center space-x-1.5">
                  <i class="fa-solid fa-chalkboard-user text-blue-700"></i>
                  <span>Ý kiến phản hồi từ GVCN:</span>
                </div>
                <p class="text-blue-900">\${fb.teacherReply}</p>
                <div class="text-[10px] text-blue-500 text-right">\${fb.resolvedAt || ''}</div>
              </div>
            \` : ''}

            \${isAdmin && fb.status === 'pending' ? \`
              <div class="flex justify-end space-x-2 pt-1 border-t border-slate-200">
                <button onclick="resolveFeedback('\${fb.id}', 'rejected')" class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer">
                  Từ chối
                </button>
                <button onclick="resolveFeedback('\${fb.id}', 'approved')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                  Duyệt chấp thuận
                </button>
              </div>
            \` : ''}
          </div>
        \`;
      });
    }

    html += '</div></div>';
    container.innerHTML = html;
  }

  window.resolveFeedback = function(fbId, status) {
    const fb = appState.feedbacks.find(f => f.id === fbId);
    if (!fb) return;

    const reply = prompt('Nhập lời nhắn gửi đến học sinh (tùy chọn):', status === 'approved' ? 'Cô/Thầy đã xem xét và đồng ý điều chỉnh.' : 'Không đủ căn cứ để điều chỉnh.');
    if (reply === null) return;

    let deleteLog = false;
    if (status === 'approved' && fb.relatedLogId) {
      deleteLog = confirm('Bạn có muốn tự động XÓA bản ghi vi phạm bị khiếu nại để hoàn lại điểm cho học sinh không?');
    }

    if (deleteLog && fb.relatedLogId) {
      appState.logs = appState.logs.filter(l => l.id !== fb.relatedLogId);
    }

    fb.status = status;
    fb.teacherReply = reply;
    fb.resolvedAt = getTodayString() + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    fb.resolvedBy = appState.currentSession.displayName;

    saveState();
    renderFeedbackView();
  };

  // TAB 6: REPORTS RENDERING
  function renderReportsView() {
    const container = document.getElementById('view-reports');
    const studentSummaries = calcStudentScores();

    let html = '';

    html += \`
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-sm sm:text-base text-slate-900"><i class="fa-solid fa-file-invoice text-blue-600 mr-2"></i>Xuất Báo Cáo & In Phiếu Thi Đua</h3>
            <p class="text-xs text-slate-500">Tổng kết kết quả tuần/tháng/kỳ theo chuẩn Bộ GD&ĐT</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="exportExcelFile()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
              <i class="fa-solid fa-file-excel mr-1.5"></i>Xuất Excel (.xlsx)
            </button>
            <button onclick="exportPdfFile()" class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
              <i class="fa-solid fa-file-pdf mr-1.5"></i>Xuất PDF (.pdf)
            </button>
            <button onclick="openPrintModal()" class="px-3.5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
              <i class="fa-solid fa-print mr-1.5"></i>In Chuẩn Khổ Giấy A4
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border border-slate-200">
            <thead class="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th class="p-2.5 border-r border-slate-200 text-center">STT</th>
                <th class="p-2.5 border-r border-slate-200">Họ và tên</th>
                <th class="p-2.5 border-r border-slate-200 text-center">Tổ</th>
                <th class="p-2.5 border-r border-slate-200 text-center">Vắng KP</th>
                <th class="p-2.5 border-r border-slate-200 text-center">Đi trễ</th>
                <th class="p-2.5 border-r border-slate-200 text-center text-emerald-700">+Thưởng</th>
                <th class="p-2.5 border-r border-slate-200 text-center text-rose-700">-Phạt</th>
                <th class="p-2.5 border-r border-slate-200 text-center font-bold text-[#1E3A8A]">Tổng điểm</th>
                <th class="p-2.5 text-center">Xếp loại</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
    \`;

    studentSummaries.forEach((item, idx) => {
      html += \`
        <tr>
          <td class="p-2 border-r border-slate-200 text-center font-bold">\${idx + 1}</td>
          <td class="p-2 border-r border-slate-200 font-medium text-slate-900">\${item.student.name}</td>
          <td class="p-2 border-r border-slate-200 text-center">Tổ \${item.student.team}</td>
          <td class="p-2 border-r border-slate-200 text-center">\${item.attendanceStats.unexcused}</td>
          <td class="p-2 border-r border-slate-200 text-center">\${item.attendanceStats.late}</td>
          <td class="p-2 border-r border-slate-200 text-center text-emerald-700 font-bold">+\${item.totalBonus}</td>
          <td class="p-2 border-r border-slate-200 text-center text-rose-700 font-bold">-\${item.totalPenalty}</td>
          <td class="p-2 border-r border-slate-200 text-center font-black text-[#1E3A8A]">\${item.totalScore}</td>
          <td class="p-2 text-center font-bold">\${item.category}</td>
        </tr>
      \`;
    });

    html += '</tbody></table></div></div>';
    container.innerHTML = html;
  }

  window.exportExcelFile = function() {
    const scores = calcStudentScores();
    const rows = [
      [appState.classInfo.schoolName, '', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
      ['', '', '', '', 'Độc lập - Tự do - Hạnh phúc'],
      ['BÁO CÁO THI ĐUA NỀ NẾP LỚP ' + appState.classInfo.className + ' - NĂM HỌC ' + appState.classInfo.academicYear],
      ['Giáo viên chủ nhiệm: ' + appState.classInfo.teacherName],
      ['STT', 'Họ và tên', 'Tổ', 'Vắng KP (-5đ)', 'Đi trễ (-2đ)', 'Điểm cộng', 'Điểm trừ', 'Tổng điểm', 'Xếp loại']
    ];
    scores.forEach((s, idx) => {
      rows.push([idx + 1, s.student.name, 'Tổ ' + s.student.team, s.attendanceStats.unexcused, s.attendanceStats.late, s.totalBonus, s.totalPenalty, s.totalScore, s.category]);
    });

    if (window.XLSX) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ThiDua');
      XLSX.writeFile(wb, 'SmartClass_BaoCao_' + appState.classInfo.className + '.xlsx');
    } else {
      alert('Không tìm thấy thư viện XLSX, vui lòng in trang hoặc kiểm tra kết nối.');
    }
  };

  window.exportPdfFile = function() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.print();
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('BAO CAO THI DUA LOP ' + appState.classInfo.className + ' - GVCN: ' + appState.classInfo.teacherName, 14, 15);
    const scores = calcStudentScores();
    const body = scores.map((s, idx) => [idx + 1, s.student.name, 'To ' + s.student.team, s.attendanceStats.unexcused, s.attendanceStats.late, '+' + s.totalBonus, '-' + s.totalPenalty, s.totalScore, s.category]);
    if (doc.autoTable) {
      doc.autoTable({
        head: [['STT', 'Ho ten', 'To', 'Vang KP', 'Di tre', 'Cong', 'Tru', 'Tong', 'Xep loai']],
        body: body,
        startY: 25,
        theme: 'grid'
      });
    }
    doc.save('SmartClass_BaoCao_' + appState.classInfo.className + '.pdf');
  };

  // TAB 7: SETTINGS RENDERING
  function renderSettingsView() {
    const container = document.getElementById('view-settings');
    const isAdmin = appState.currentSession.role === 'admin';

    let html = '';

    html += \`
      <div class="space-y-6">
        <!-- 1. School info Form -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <i class="fa-solid fa-school text-blue-600 text-lg"></i>
            <h3 class="font-bold text-sm sm:text-base text-slate-900">1. Thông Tin Trường Lớp & Quản Trị</h3>
          </div>

          <form onsubmit="handleSaveClassInfo(event)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Tên Trường</label>
              <input type="text" id="set-school-name" value="\${appState.classInfo.schoolName || ''}" \${!isAdmin ? 'disabled' : ''} class="w-full border border-slate-300 rounded-xl p-2 font-medium bg-slate-50">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Tên Lớp</label>
              <input type="text" id="set-class-name" value="\${appState.classInfo.className || ''}" \${!isAdmin ? 'disabled' : ''} class="w-full border border-slate-300 rounded-xl p-2 font-medium bg-slate-50">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Giáo Viên Chủ Nhiệm</label>
              <input type="text" id="set-teacher-name" value="\${appState.classInfo.teacherName || ''}" \${!isAdmin ? 'disabled' : ''} class="w-full border border-slate-300 rounded-xl p-2 font-medium bg-slate-50">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Năm Học</label>
              <input type="text" id="set-academic-year" value="\${appState.classInfo.academicYear || ''}" \${!isAdmin ? 'disabled' : ''} class="w-full border border-slate-300 rounded-xl p-2 font-medium bg-slate-50">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Học Kỳ</label>
              <input type="text" id="set-semester" value="\${appState.classInfo.semester || ''}" \${!isAdmin ? 'disabled' : ''} class="w-full border border-slate-300 rounded-xl p-2 font-medium bg-slate-50">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Mã PIN Admin GVCN</label>
              <input type="password" id="set-admin-pin" value="\${appState.classInfo.adminPin || '1234'}" \${!isAdmin ? 'disabled' : ''} class="w-full border border-slate-300 rounded-xl p-2 font-medium bg-slate-50">
            </div>

            \${isAdmin ? \`
              <div class="sm:col-span-2 lg:col-span-3 flex justify-end">
                <button type="submit" class="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                  Lưu Thông Tin
                </button>
              </div>
            \` : ''}
          </form>
        </div>

        <!-- 2. Student Management -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center space-x-2">
              <i class="fa-solid fa-users-gear text-blue-600 text-lg"></i>
              <h3 class="font-bold text-sm sm:text-base text-slate-900">2. Danh Sách Học Sinh (\${appState.students.length} em)</h3>
            </div>
            \${isAdmin ? \`
              <button onclick="openAddStudentModal()" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                <i class="fa-solid fa-user-plus mr-1.5"></i>Thêm Học Sinh
              </button>
            \` : ''}
          </div>

          <div class="overflow-x-auto max-h-80 overflow-y-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  <th class="p-2.5 text-center">STT</th>
                  <th class="p-2.5">Họ và tên</th>
                  <th class="p-2.5 text-center">Giới tính</th>
                  <th class="p-2.5 text-center">Tổ</th>
                  <th class="p-2.5 text-center">SĐT Phụ huynh</th>
                  \${isAdmin ? '<th class="p-2.5 text-center">Thao tác</th>' : ''}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
      \`;

      appState.students.forEach((s, idx) => {
        html += \`
          <tr class="hover:bg-slate-50">
            <td class="p-2.5 text-center font-bold">\${idx + 1}</td>
            <td class="p-2.5 font-semibold text-slate-900">\${s.name}</td>
            <td class="p-2.5 text-center">\${s.gender}</td>
            <td class="p-2.5 text-center">Tổ \${s.team}</td>
            <td class="p-2.5 text-center text-slate-500">\${s.parentPhone || '--'}</td>
            \${isAdmin ? \`
              <td class="p-2.5 text-center space-x-1.5">
                <button onclick="openEditStudentModal('\${s.id}')" class="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteStudent('\${s.id}')" class="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>
              </td>
            \` : ''}
          </tr>
        \`;
      });

      html += \`
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Backup & Reset -->
        <div class="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div class="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <i class="fa-solid fa-database text-blue-600 text-lg"></i>
            <h3 class="font-bold text-sm sm:text-base text-slate-900">3. Sao Lưu & Phục Hồi Dữ Liệu</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 class="font-bold text-slate-900">Xuất File JSON</h4>
              <p class="text-[11px] text-slate-500">Tải toàn bộ cơ sở dữ liệu lớp học ra file .json máy tính.</p>
              <button onclick="exportBackupJson()" class="w-full py-2 bg-white border border-slate-300 rounded-lg font-bold hover:bg-slate-100 cursor-pointer">
                Tải File Sao Lưu
              </button>
            </div>

            <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 class="font-bold text-slate-900">Phục Hồi JSON</h4>
              <p class="text-[11px] text-slate-500">Nạp lại file sao lưu .json đã lưu trước đó.</p>
              \${isAdmin ? \`
                <label class="block w-full py-2 bg-blue-800 hover:bg-blue-900 text-white text-center rounded-lg font-bold cursor-pointer">
                  <input type="file" accept=".json" onchange="importBackupJson(event)" class="hidden">
                  Chọn File Phục Hồi
                </label>
              \` : '<div class="text-[11px] text-slate-400 italic">Chỉ GVCN có quyền nạp sao lưu.</div>'}
            </div>

            <div class="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
              <h4 class="font-bold text-rose-900">Khôi Phục Gốc</h4>
              <p class="text-[11px] text-rose-700">Xóa dữ liệu hiện tại và nạp lại dữ liệu mẫu gốc.</p>
              \${isAdmin ? \`
                <button onclick="confirmResetMockData()" class="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer">
                  Khôi Phục Mẫu Ban Đầu
                </button>
              \` : '<div class="text-[11px] text-slate-400 italic">Chỉ GVCN có quyền đặt lại.</div>'}
            </div>
          </div>
        </div>
      </div>
    \`;

    container.innerHTML = html;
  }

  window.handleSaveClassInfo = function(e) {
    e.preventDefault();
    appState.classInfo.schoolName = document.getElementById('set-school-name').value;
    appState.classInfo.className = document.getElementById('set-class-name').value;
    appState.classInfo.teacherName = document.getElementById('set-teacher-name').value;
    appState.classInfo.academicYear = document.getElementById('set-academic-year').value;
    appState.classInfo.semester = document.getElementById('set-semester').value;
    appState.classInfo.adminPin = document.getElementById('set-admin-pin').value;
    saveState();
    updateHeaderLabels();
    alert('Đã lưu cấu hình trường lớp thành công!');
  };

  window.exportBackupJson = function() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'SmartClass_Backup_' + appState.classInfo.className + '_' + getTodayString() + '.json');
    dlAnchor.click();
  };

  window.importBackupJson = function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.students && parsed.rules) {
          appState.classInfo = parsed.classInfo || appState.classInfo;
          appState.students = parsed.students || appState.students;
          appState.rules = parsed.rules || appState.rules;
          appState.attendance = parsed.attendance || [];
          appState.logs = parsed.logs || [];
          appState.feedbacks = parsed.feedbacks || [];
          saveState();
          updateHeaderLabels();
          renderCurrentTab();
          alert('Phục hồi dữ liệu thành công!');
        } else {
          alert('Định dạng file không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi đọc file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  window.confirmResetMockData = function() {
    if (!confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu? Mọi chỉnh sửa của phiên làm việc hiện tại sẽ được đặt lại.')) return;
    const initial = window.__INITIAL_DATA__ || {};
    appState.classInfo = JSON.parse(JSON.stringify(initial.classInfo || appState.classInfo));
    appState.students = JSON.parse(JSON.stringify(initial.students || []));
    appState.rules = JSON.parse(JSON.stringify(initial.rules || []));
    appState.attendance = JSON.parse(JSON.stringify(initial.attendance || []));
    appState.logs = JSON.parse(JSON.stringify(initial.logs || []));
    appState.feedbacks = JSON.parse(JSON.stringify(initial.feedbacks || []));
    saveState();
    updateHeaderLabels();
    renderPeriodBar();
    renderCurrentTab();
    alert('Đã khôi phục dữ liệu ban đầu!');
  };

  // ROLE SWITCHER MODAL
  window.openRoleModal = function() {
    const root = document.getElementById('modals-root');
    let studentOpts = appState.students.map(s => '<option value="' + s.id + '">Tổ ' + s.team + ' - ' + s.name + '</option>').join('');

    root.innerHTML = \`
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-900"><i class="fa-solid fa-users text-blue-600 mr-2"></i>Đổi Vai Trò & Phân Quyền</h3>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
          </div>

          <div class="space-y-3">
            <!-- 1. GVCN Admin -->
            <div class="p-3.5 rounded-xl border border-amber-300 bg-amber-50/60 space-y-2">
              <div class="flex items-center justify-between font-bold text-amber-900">
                <span>1. Giáo Viên Chủ Nhiệm (Admin)</span>
                <i class="fa-solid fa-shield-halved text-amber-600"></i>
              </div>
              <p class="text-[11px] text-amber-800">Toàn quyền sửa nội quy, chốt sổ thi đua và phân công cán sự.</p>
              <div class="flex space-x-2">
                <input type="password" id="modal-pin-input" placeholder="Nhập PIN GVCN (mặc định 1234)" class="flex-1 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs">
                <button onclick="submitSwitchToAdmin()" class="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg cursor-pointer">
                  Xác nhận
                </button>
              </div>
            </div>

            <!-- 2. Ban Cán Sự Lớp -->
            <div class="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
              <div class="flex items-center justify-between font-bold text-blue-900">
                <span>2. Ban Cán Sự Lớp</span>
                <i class="fa-solid fa-id-badge text-blue-600"></i>
              </div>
              <select id="modal-officer-select" class="w-full bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs">
                <option value="Lớp Trưởng">Lớp Trưởng (Chấm điểm & Điểm danh)</option>
                <option value="Lớp Phó Học Tập">Lớp Phó Học Tập (Nội quy học tập)</option>
                <option value="Lớp Phó Lao Động">Lớp Phó Lao Động (Vệ sinh, tác phong)</option>
                <option value="Cờ Đỏ Lớp">Đội Cờ Đỏ (Chấm điểm nề nếp)</option>
              </select>
              <button onclick="submitSwitchToOfficer()" class="w-full py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg cursor-pointer">
                Đăng Nhập Ban Cán Sự
              </button>
            </div>

            <!-- 3. Học sinh -->
            <div class="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div class="flex items-center justify-between font-bold text-emerald-900">
                <span>3. Học Sinh Lớp</span>
                <i class="fa-solid fa-graduation-cap text-emerald-600"></i>
              </div>
              <p class="text-[11px] text-emerald-800">Tra cứu điểm cá nhân, thứ hạng tổ và gửi khiếu nại.</p>
              <select id="modal-student-select" class="w-full bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs">
                \${studentOpts}
              </select>
              <button onclick="submitSwitchToStudent()" class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer">
                Xem Với Tư Cách Học Sinh
              </button>
            </div>
          </div>
        </div>
      </div>
    \`;
  };

  window.closeModal = function() {
    document.getElementById('modals-root').innerHTML = '';
  };

  window.submitSwitchToAdmin = function() {
    const pin = document.getElementById('modal-pin-input').value;
    const correctPin = appState.classInfo.adminPin || '1234';
    if (pin === correctPin) {
      appState.currentSession = {
        role: 'admin',
        displayName: 'GVCN (Admin)',
        canEditPoints: true,
        canTakeAttendance: true,
        canInputLogs: true,
        isReadOnly: false
      };
      saveState();
      closeModal();
      updateHeaderLabels();
      renderCurrentTab();
    } else {
      alert('Mã PIN không chính xác! (Mặc định: 1234)');
    }
  };

  window.submitSwitchToOfficer = function() {
    const roleTitle = document.getElementById('modal-officer-select').value;
    appState.currentSession = {
      role: 'officer',
      displayName: roleTitle,
      canEditPoints: false,
      canTakeAttendance: true,
      canInputLogs: true,
      isReadOnly: false
    };
    saveState();
    closeModal();
    updateHeaderLabels();
    renderCurrentTab();
  };

  window.submitSwitchToStudent = function() {
    const studentId = document.getElementById('modal-student-select').value;
    const student = appState.students.find(s => s.id === studentId);
    appState.currentSession = {
      role: 'student',
      studentId: studentId,
      displayName: student ? student.name : 'Học sinh',
      canEditPoints: false,
      canTakeAttendance: false,
      canInputLogs: false,
      isReadOnly: true
    };
    saveState();
    closeModal();
    updateHeaderLabels();
    renderCurrentTab();
  };

  // THEME MODAL
  window.openThemeModal = function() {
    const root = document.getElementById('modals-root');
    const palettes = [
      { id: 'navy', name: 'Xanh Dương Học Đường', color: '#1E3A8A' },
      { id: 'emerald', name: 'Xanh Lục Bảo', color: '#065F46' },
      { id: 'indigo', name: 'Tím Indigo Sâu Lắng', color: '#3730A3' },
      { id: 'crimson', name: 'Đỏ Ruby Quý Phái', color: '#881337' },
      { id: 'slate', name: 'Xám Tối Giản', color: '#0F172A' },
      { id: 'violet', name: 'Tím Hoàng Gia', color: '#581C87' }
    ];

    let optHtml = palettes.map(p => \`
      <button onclick="pickThemeColor('\${p.id}')" class="p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all \${appState.themeConfig.colorId === p.id ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500' : 'border-slate-200 bg-white hover:bg-slate-50'}">
        <span class="w-6 h-6 rounded-full" style="background-color: \${p.color}"></span>
        <span class="font-bold text-xs text-slate-800">\${p.name}</span>
      </button>
    \`).join('');

    root.innerHTML = \`
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-900"><i class="fa-solid fa-palette text-amber-500 mr-2"></i>Đổi Màu Sắc Giao Diện</h3>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
          </div>
          <div class="grid grid-cols-1 gap-2.5">
            \${optHtml}
          </div>
        </div>
      </div>
    \`;
  };

  window.pickThemeColor = function(colorId) {
    appState.themeConfig.colorId = colorId;
    saveState();
    applyTheme();
    closeModal();
  };

  // PRINT MODAL & VIEW
  window.openPrintModal = function() {
    const scores = calcStudentScores();
    const sheet = document.getElementById('print-sheet-container');
    if (!sheet) return;

    sheet.innerHTML = \`
      <div class="max-w-4xl mx-auto p-4 space-y-6 text-slate-900">
        <div class="flex justify-between items-start border-b pb-4">
          <div>
            <h4 class="font-bold uppercase text-sm">\${appState.classInfo.schoolName}</h4>
            <h5 class="text-xs font-semibold">LỚP: \${appState.classInfo.className}</h5>
            <p class="text-xs text-slate-500">GVCN: \${appState.classInfo.teacherName}</p>
          </div>
          <div class="text-right">
            <h4 class="font-bold uppercase text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
            <p class="text-xs italic">Độc lập - Tự do - Hạnh phúc</p>
            <p class="text-xs text-slate-500 mt-1">Ngày in: \${getTodayString()}</p>
          </div>
        </div>

        <div class="text-center space-y-1">
          <h2 class="text-xl font-bold uppercase tracking-wide">BẢNG TỔNG KẾT THI ĐUA NỀ NẾP LỚP HỌC</h2>
          <p class="text-xs italic text-slate-600">Năm học: \${appState.classInfo.academicYear} • \${appState.classInfo.semester}</p>
        </div>

        <table class="w-full text-xs text-left border-collapse border border-slate-400">
          <thead>
            <tr class="bg-slate-100">
              <th class="border border-slate-400 p-2 text-center">STT</th>
              <th class="border border-slate-400 p-2">Họ và tên</th>
              <th class="border border-slate-400 p-2 text-center">Tổ</th>
              <th class="border border-slate-400 p-2 text-center">Vắng KP</th>
              <th class="border border-slate-400 p-2 text-center">Đi trễ</th>
              <th class="border border-slate-400 p-2 text-center">+Thưởng</th>
              <th class="border border-slate-400 p-2 text-center">-Phạt</th>
              <th class="border border-slate-400 p-2 text-center font-bold">Tổng điểm</th>
              <th class="border border-slate-400 p-2 text-center">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            \${scores.map((s, idx) => \`
              <tr>
                <td class="border border-slate-400 p-2 text-center font-bold">\${idx + 1}</td>
                <td class="border border-slate-400 p-2 font-medium">\${s.student.name}</td>
                <td class="border border-slate-400 p-2 text-center">Tổ \${s.student.team}</td>
                <td class="border border-slate-400 p-2 text-center">\${s.attendanceStats.unexcused}</td>
                <td class="border border-slate-400 p-2 text-center">\${s.attendanceStats.late}</td>
                <td class="border border-slate-400 p-2 text-center font-bold">+\${s.totalBonus}</td>
                <td class="border border-slate-400 p-2 text-center font-bold">-\${s.totalPenalty}</td>
                <td class="border border-slate-400 p-2 text-center font-black">\${s.totalScore}</td>
                <td class="border border-slate-400 p-2 text-center font-bold">\${s.category}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>

        <div class="grid grid-cols-3 gap-4 text-center text-xs pt-8">
          <div>
            <p class="font-bold">LỚP TRƯỞNG</p>
            <p class="italic text-slate-500 mt-12">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p class="font-bold">BAN GIÁM HIỆU</p>
            <p class="italic text-slate-500 mt-12">(Ký và đóng dấu)</p>
          </div>
          <div>
            <p class="italic text-slate-500 mb-1">\${appState.classInfo.location || 'Phước Sơn'}, ngày \${new Date().getDate()} tháng \${new Date().getMonth() + 1} năm \${new Date().getFullYear()}</p>
            <p class="font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
            <p class="italic text-slate-700 font-semibold mt-12">\${appState.classInfo.teacherName}</p>
          </div>
        </div>
      </div>
    \`;

    window.print();
  };

  // STUDENT DETAIL MODAL
  window.openStudentDetailModal = function(studentId) {
    const student = appState.students.find(s => s.id === studentId);
    if (!student) return;

    const studentLogs = appState.logs.filter(l => l.studentId === studentId);
    const root = document.getElementById('modals-root');

    root.innerHTML = \`
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-base text-slate-900">\${student.name}</h3>
              <p class="text-xs text-slate-500">Tổ \${student.team} • \${student.gender} • SĐT: \${student.parentPhone || 'Chưa cập nhật'}</p>
            </div>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
          </div>

          <div>
            <h4 class="font-bold text-xs text-slate-800 mb-2">Lịch Sử Ghi Nhận Thi Đua (\${studentLogs.length} lần)</h4>
            <div class="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              \${studentLogs.length === 0 ? '<div class="p-4 text-center text-slate-400">Chưa có vi phạm hoặc khen thưởng nào.</div>' : studentLogs.map(l => \`
                <div class="p-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span class="font-bold text-slate-900">\${l.actionName}</span>
                    \${l.note ? '<span class="italic text-slate-400 ml-1">(' + l.note + ')</span>' : ''}
                    <div class="text-[10px] text-slate-400">\${l.timestamp}</div>
                  </div>
                  <span class="font-bold \${l.type === 'bonus' ? 'text-emerald-600' : 'text-rose-600'}">
                    \${l.type === 'bonus' ? '+' : '-'}\${l.points}đ
                  </span>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>
      </div>
    \`;
  };

  // FEEDBACK SUBMIT MODAL
  window.openSubmitFeedbackModal = function(relatedLogId) {
    const root = document.getElementById('modals-root');
    const myStudentId = appState.currentSession.studentId;
    const log = relatedLogId ? appState.logs.find(l => l.id === relatedLogId) : null;

    let studentOpts = appState.students.map(s => \`<option value="\${s.id}" \${myStudentId === s.id ? 'selected' : ''}>Tổ \${s.team} - \${s.name}</option>\`).join('');

    root.innerHTML = \`
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-base text-slate-900">Gửi Phản Hồi / Khiếu Nại</h3>
              <p class="text-xs text-slate-500">GVCN sẽ trực tiếp xem xét và phản hồi cho em</p>
            </div>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
          </div>

          <form onsubmit="handleSendFeedback(event)" class="space-y-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Học sinh gửi</label>
              <select id="fb-student-id" class="w-full border border-slate-300 rounded-xl p-2 font-medium bg-slate-50">
                \${studentOpts}
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Tiêu đề ý kiến</label>
              <input type="text" id="fb-title" required value="\${log ? 'Khiếu nại lỗi: ' + log.actionName : ''}" placeholder="VD: Khiếu nại trừ điểm nhầm tiết Toán..." class="w-full border border-slate-300 rounded-xl p-2 font-medium">
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nội dung giải trình / ý kiến chi tiết</label>
              <textarea id="fb-content" rows="4" required placeholder="Trình bày lý do, sự việc cụ thể..." class="w-full border border-slate-300 rounded-xl p-2 font-medium"></textarea>
            </div>

            <input type="hidden" id="fb-related-log-id" value="\${relatedLogId || ''}">

            <div class="flex justify-end space-x-2 pt-2">
              <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
                Hủy
              </button>
              <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer">
                Gửi Đi Ngay
              </button>
            </div>
          </form>
        </div>
      </div>
    \`;
  };

  window.handleSendFeedback = function(e) {
    e.preventDefault();
    const sId = document.getElementById('fb-student-id').value;
    const title = document.getElementById('fb-title').value;
    const content = document.getElementById('fb-content').value;
    const relatedLogId = document.getElementById('fb-related-log-id').value;
    const student = appState.students.find(s => s.id === sId);

    appState.feedbacks.unshift({
      id: 'fb-' + Date.now(),
      studentId: sId,
      studentName: student ? student.name : 'Học sinh',
      team: student ? student.team : 1,
      type: relatedLogId ? 'khieu_nai_vi_pham' : 'dong_gop_y_kien',
      title: title,
      content: content,
      relatedLogId: relatedLogId || undefined,
      weekNumber: appState.classInfo.weekNumber || 1,
      createdAt: getTodayString() + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    });

    saveState();
    closeModal();
    alert('Ý kiến của em đã được gửi đến GVCN thành công!');
    switchTab('feedback');
  };

  // STUDENT ADD & EDIT MODALS
  window.openAddStudentModal = function() {
    const root = document.getElementById('modals-root');
    root.innerHTML = \`
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-900">Thêm Học Sinh Mới</h3>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
          </div>
          <form onsubmit="handleSaveNewStudent(event)" class="space-y-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Họ và tên</label>
              <input type="text" id="add-student-name" required placeholder="VD: Trần Văn B" class="w-full border border-slate-300 rounded-xl p-2">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Giới tính</label>
                <select id="add-student-gender" class="w-full border border-slate-300 rounded-xl p-2 bg-slate-50">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Phân Tổ (1-4)</label>
                <select id="add-student-team" class="w-full border border-slate-300 rounded-xl p-2 bg-slate-50">
                  <option value="1">Tổ 1</option>
                  <option value="2">Tổ 2</option>
                  <option value="3">Tổ 3</option>
                  <option value="4">Tổ 4</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">SĐT Phụ huynh</label>
              <input type="text" id="add-student-phone" placeholder="0901234567" class="w-full border border-slate-300 rounded-xl p-2">
            </div>
            <div class="flex justify-end space-x-2 pt-2">
              <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Hủy</button>
              <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">Thêm Vào Lớp</button>
            </div>
          </form>
        </div>
      </div>
    \`;
  };

  window.handleSaveNewStudent = function(e) {
    e.preventDefault();
    const name = document.getElementById('add-student-name').value;
    const gender = document.getElementById('add-student-gender').value;
    const team = parseInt(document.getElementById('add-student-team').value, 10);
    const phone = document.getElementById('add-student-phone').value;

    appState.students.push({
      id: 'hs-' + Date.now(),
      name: name,
      gender: gender,
      dob: '2010-01-01',
      team: team,
      parentPhone: phone || undefined
    });

    saveState();
    closeModal();
    renderSettingsView();
  };

  window.openEditStudentModal = function(studentId) {
    const student = appState.students.find(s => s.id === studentId);
    if (!student) return;
    const root = document.getElementById('modals-root');

    root.innerHTML = \`
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="font-bold text-base text-slate-900">Sửa Học Sinh</h3>
            <button onclick="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
          </div>
          <form onsubmit="handleSaveEditStudent(event, '\${studentId}')" class="space-y-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Họ và tên</label>
              <input type="text" id="edit-student-name" required value="\${student.name}" class="w-full border border-slate-300 rounded-xl p-2">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Giới tính</label>
                <select id="edit-student-gender" class="w-full border border-slate-300 rounded-xl p-2 bg-slate-50">
                  <option value="Nam" \${student.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                  <option value="Nữ" \${student.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Phân Tổ (1-4)</label>
                <select id="edit-student-team" class="w-full border border-slate-300 rounded-xl p-2 bg-slate-50">
                  <option value="1" \${student.team === 1 ? 'selected' : ''}>Tổ 1</option>
                  <option value="2" \${student.team === 2 ? 'selected' : ''}>Tổ 2</option>
                  <option value="3" \${student.team === 3 ? 'selected' : ''}>Tổ 3</option>
                  <option value="4" \${student.team === 4 ? 'selected' : ''}>Tổ 4</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">SĐT Phụ huynh</label>
              <input type="text" id="edit-student-phone" value="\${student.parentPhone || ''}" class="w-full border border-slate-300 rounded-xl p-2">
            </div>
            <div class="flex justify-end space-x-2 pt-2">
              <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Hủy</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer">Lưu Thay Đổi</button>
            </div>
          </form>
        </div>
      </div>
    \`;
  };

  window.handleSaveEditStudent = function(e, studentId) {
    e.preventDefault();
    const student = appState.students.find(s => s.id === studentId);
    if (!student) return;
    student.name = document.getElementById('edit-student-name').value;
    student.gender = document.getElementById('edit-student-gender').value;
    student.team = parseInt(document.getElementById('edit-student-team').value, 10);
    student.parentPhone = document.getElementById('edit-student-phone').value || undefined;
    saveState();
    closeModal();
    renderSettingsView();
  };

  window.deleteStudent = function(studentId) {
    if (!confirm('Xóa học sinh này khỏi danh sách lớp?')) return;
    appState.students = appState.students.filter(s => s.id !== studentId);
    saveState();
    renderSettingsView();
  };

  function updateHeaderLabels() {
    const cName = document.getElementById('header-class-name');
    const tName = document.getElementById('header-teacher-name');
    const aYear = document.getElementById('header-academic-year');
    const rName = document.getElementById('role-display-name');
    const rBtn = document.getElementById('btn-current-role');

    if (cName) cName.textContent = appState.classInfo.className;
    if (tName) tName.textContent = appState.classInfo.teacherName;
    if (aYear) aYear.textContent = appState.classInfo.academicYear;
    if (rName) rName.textContent = appState.currentSession.displayName;

    if (rBtn) {
      if (appState.currentSession.role === 'admin') {
        rBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300 cursor-pointer';
      } else if (appState.currentSession.role === 'student') {
        rBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400 cursor-pointer';
      } else {
        rBtn.className = 'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border bg-white/20 text-white border-white/30 hover:bg-white/30 cursor-pointer';
      }
    }
  }

  // INITIAL BOOTSTRAP
  updateHeaderLabels();
  applyTheme();
  renderPeriodBar();
  switchTab('attendance');
})();
`;
};
