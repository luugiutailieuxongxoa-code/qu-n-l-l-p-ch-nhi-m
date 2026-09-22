import React, { useState } from 'react';
import {
  ClipboardCheck,
  Award,
  Trophy,
  History,
  FileSpreadsheet,
  RotateCcw,
  GraduationCap,
  Menu,
  X,
  Printer,
  Download,
  Settings,
  Shield,
  Users,
  ChevronDown,
  Palette,
  MessageSquareText,
  LogOut,
  Layers,
  School,
  Mail,
} from 'lucide-react';
import { ClassInfo, CurrentUserSession, AppThemeConfig, ClassItem } from '../types';
import { getThemePalette } from '../utils/theme';

export type TabType = 'attendance' | 'rules' | 'leaderboard' | 'logs' | 'reports' | 'feedback' | 'settings';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  classInfo: ClassInfo;
  onResetData: () => void;
  onOpenPrint: () => void;
  onDownloadStandalone: () => void;
  currentSession: CurrentUserSession;
  onOpenRoleSwitcher: () => void;
  themeConfig: AppThemeConfig;
  onOpenThemeCustomizer: () => void;
  pendingFeedbackCount?: number;
  classes?: ClassItem[];
  activeClassId?: string;
  onSelectClass?: (classId: string) => void;
  onLogout?: () => void;
  onOpenParentMeeting?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  classInfo,
  onResetData,
  onOpenPrint,
  onDownloadStandalone,
  currentSession,
  onOpenRoleSwitcher,
  themeConfig,
  onOpenThemeCustomizer,
  pendingFeedbackCount = 0,
  classes = [],
  activeClassId,
  onSelectClass,
  onLogout,
  onOpenParentMeeting,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const currentPalette = getThemePalette(themeConfig.colorId);

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'attendance', label: 'Điểm danh', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'rules', label: 'Nội quy & Nhập điểm', icon: <Award className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Bảng xếp hạng thi đua', icon: <Trophy className="w-4 h-4" /> },
    { id: 'logs', label: 'Nhật ký lớp', icon: <History className="w-4 h-4" /> },
    { id: 'reports', label: 'Xuất báo cáo', icon: <FileSpreadsheet className="w-4 h-4" /> },
    {
      id: 'feedback',
      label: 'Phản hồi & Khiếu nại',
      icon: <MessageSquareText className="w-4 h-4" />,
      badge: pendingFeedbackCount,
    },
    { id: 'settings', label: 'Cài đặt & Phân quyền', icon: <Settings className="w-4 h-4" /> },
  ];

  const isAdmin = currentSession.role === 'admin';

  return (
    <header
      className="text-white shadow-lg sticky top-0 z-40 print:hidden transition-colors duration-300"
      style={{ backgroundColor: currentPalette.primary }}
    >
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-white/20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-white">SmartClass</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 font-medium">
                  {currentPalette.name}
                </span>
              </div>
              <p className="text-xs text-white/80 hidden sm:block">
                Quản Lý Lớp Chủ Nhiệm Chuyên Nghiệp • {classInfo.schoolName}
              </p>
            </div>
          </div>

          {/* Center Class Switcher Badge */}
          <div className="hidden md:flex items-center space-x-2 relative">
            {classes.length > 0 && onSelectClass ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className="flex items-center space-x-2 bg-black/25 hover:bg-black/35 px-3 py-1.5 rounded-xl border border-white/25 text-xs text-white transition-all cursor-pointer shadow-xs"
                >
                  <School className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-extrabold text-white">Lớp {classInfo.className}</span>
                  <span className="text-white/60">|</span>
                  <span className="text-amber-200">T.{classInfo.weekNumber}</span>
                  <ChevronDown className="w-3 h-3 text-white/70" />
                </button>

                {isClassDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 text-xs text-slate-200 animate-in fade-in">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                      Chuyển đổi lớp chủ nhiệm:
                    </div>
                    {classes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectClass(c.id);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                          c.id === activeClassId ? 'bg-blue-950/70 text-blue-300 font-bold' : ''
                        }`}
                      >
                        <div>
                          <p className="font-bold">Lớp {c.className}</p>
                          <p className="text-[10px] text-slate-400">GVCN: {c.teacherName}</p>
                        </div>
                        {c.id === activeClassId && <span className="text-xs text-emerald-400 font-bold">✓</span>}
                      </button>
                    ))}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsClassDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 border-t border-slate-800 text-amber-300 hover:bg-slate-800 flex items-center space-x-2 font-bold cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Về Cổng Đăng Nhập / Đổi Lớp</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3 bg-black/20 px-3 py-1.5 rounded-lg border border-white/20 text-xs">
                <span className="font-semibold text-white">Lớp: {classInfo.className}</span>
                <span className="text-white/60">|</span>
                <span className="text-amber-300">Tuần {classInfo.weekNumber}</span>
              </div>
            )}

            <div className="text-xs text-white/90 bg-black/15 px-2.5 py-1.5 rounded-xl border border-white/15 hidden lg:block">
              GVCN: <span className="font-medium text-white">{classInfo.teacherName}</span>
              {classInfo.location && (
                <span className="text-white/70 ml-1">({classInfo.location})</span>
              )}
            </div>
          </div>

          {/* Right Role Switcher & Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* NÚT TÙY BIẾN GIAO DIỆN CHÍNH */}
            <button
              onClick={onOpenThemeCustomizer}
              title="Tùy biến màu sắc, mật độ và kiểu hiển thị giao diện"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-all border border-white/25 cursor-pointer shadow-xs"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Giao diện</span>
            </button>

            {/* NÚT VAI TRÒ / PHÂN QUYỀN HEADER */}
            <button
              onClick={onOpenRoleSwitcher}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border cursor-pointer ${
                isAdmin
                  ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
              }`}
              title="Nhấn để đổi vai trò (GVCN hoặc Ban Cán Sự Lớp)"
            >
              {isAdmin ? <Shield className="w-3.5 h-3.5 text-slate-950" /> : <Users className="w-3.5 h-3.5" />}
              <span className="max-w-[130px] truncate">{currentSession.displayName}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* NÚT ĐĂNG XUẤT / VỀ CỔNG ĐĂNG NHẬP */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Đăng xuất và quay lại cổng chọn lớp / vai trò"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-bold text-white border border-rose-400/40 transition-colors shadow-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Đăng xuất</span>
              </button>
            )}

            {onOpenParentMeeting && (
              <button
                onClick={onOpenParentMeeting}
                title="Tạo giấy mời họp phụ huynh định kỳ chuẩn văn bản Việt Nam"
                className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold text-white border border-white/25 transition-colors shadow-xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                <span>Giấy mời họp PH</span>
              </button>
            )}

            <button
              onClick={onOpenPrint}
              title="In phiếu A4 chuẩn Bộ GD&ĐT"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-medium text-white border border-white/20 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-200" />
              <span>In A4</span>
            </button>

            <button
              onClick={onDownloadStandalone}
              title="Tải file HTML chạy offline độc lập không cần mạng"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-medium text-white transition-colors shadow-sm cursor-pointer border border-emerald-500/50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Offline</span>
            </button>

            <button
              onClick={onResetData}
              title="Khôi phục dữ liệu mẫu ban đầu"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-rose-900/60 text-xs font-medium text-white/90 hover:text-white transition-colors border border-white/20 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Khôi phục mẫu</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex space-x-1 py-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={isActive ? { color: currentPalette.primary } : undefined}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white shadow-md font-extrabold'
                    : 'text-white/90 hover:bg-white/15 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-white/20 px-4 pt-2 pb-4 space-y-1 transition-colors"
          style={{ backgroundColor: currentPalette.primaryDark }}
        >
          <div className="py-2 px-3 mb-2 bg-black/20 rounded-lg text-xs text-white/90 space-y-1">
            <div className="flex justify-between items-center">
              <span>
                Lớp: <strong className="text-white">{classInfo.className}</strong> (Tuần{' '}
                {classInfo.weekNumber})
              </span>
              <span>
                GVCN: <strong className="text-white">{classInfo.teacherName}</strong>
              </span>
            </div>
            <div className="text-[11px] text-white/80">
              Đang hoạt động: <strong className="text-amber-300">{currentSession.displayName}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRoleSwitcher();
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs"
            >
              <Shield className="w-4 h-4" />
              <span>Đổi Vai Trò</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenThemeCustomizer();
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-white/20 text-white font-bold text-xs border border-white/30"
            >
              <Palette className="w-4 h-4 text-amber-300" />
              <span>Tùy Biến Giao Diện</span>
            </button>
          </div>

          {onOpenParentMeeting && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenParentMeeting();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-indigo-600/60 hover:bg-indigo-600 text-white border border-indigo-300/40 text-xs font-bold transition-all"
            >
              <Mail className="w-4 h-4 text-amber-300" />
              <span>Tạo Giấy Mời Họp Phụ Huynh</span>
            </button>
          )}

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={isActive ? { color: currentPalette.primary } : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white shadow-xs'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {onLogout && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-400/40 text-xs font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng Xuất / Đổi Lớp Chủ Nhiệm</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
