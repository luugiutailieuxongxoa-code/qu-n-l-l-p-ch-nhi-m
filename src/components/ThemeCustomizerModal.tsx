import React from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Sun,
  Moon,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Type,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { AppThemeConfig, ThemeColorId, DisplayDensity, CardStyle, FontScale, ThemeMode } from '../types';
import { THEME_COLOR_PALETTES, DEFAULT_THEME_CONFIG, getThemePalette } from '../utils/theme';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: AppThemeConfig;
  onUpdateThemeConfig: (config: AppThemeConfig) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  onUpdateThemeConfig,
}) => {
  if (!isOpen) return null;

  const currentPalette = getThemePalette(themeConfig.colorId);

  const handleSelectColor = (colorId: ThemeColorId) => {
    onUpdateThemeConfig({
      ...themeConfig,
      colorId,
    });
  };

  const handleSelectDensity = (density: DisplayDensity) => {
    onUpdateThemeConfig({
      ...themeConfig,
      density,
    });
  };

  const handleSelectCardStyle = (cardStyle: CardStyle) => {
    onUpdateThemeConfig({
      ...themeConfig,
      cardStyle,
    });
  };

  const handleSelectFontScale = (fontScale: FontScale) => {
    onUpdateThemeConfig({
      ...themeConfig,
      fontScale,
    });
  };

  const handleSelectMode = (mode: ThemeMode) => {
    onUpdateThemeConfig({
      ...themeConfig,
      mode,
    });
  };

  const handleReset = () => {
    onUpdateThemeConfig(DEFAULT_THEME_CONFIG);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header với màu chủ đạo đang chọn */}
        <div
          className="text-white px-6 py-4 flex items-center justify-between transition-colors duration-300"
          style={{ backgroundColor: currentPalette.primary }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Palette className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Tùy Biến Giao Diện Chính
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {currentPalette.name}
                </span>
              </h3>
              <p className="text-xs text-white/80">
                Tùy chỉnh màu sắc chủ đạo, kiểu hiển thị, kích cỡ chữ và chế độ xem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* 1. BẢNG MÀU CHỦ ĐẠO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                1. Màu Sắc Chủ Đạo ({THEME_COLOR_PALETTES.length} Bảng Màu)
              </label>
              <span className="text-[11px] text-slate-500 italic">
                Áp dụng tức thì cho thanh điều hướng, nút bấm và báo cáo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {THEME_COLOR_PALETTES.map((p) => {
                const isSelected = themeConfig.colorId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectColor(p.id)}
                    className={`relative p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-2 shadow-sm scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    style={{
                      borderColor: isSelected ? p.primary : undefined,
                    }}
                  >
                    <div>
                      {/* Swatch preview */}
                      <div className="flex items-center space-x-1.5 mb-2">
                        <div
                          className="w-5 h-5 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: p.primary }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.primaryDark }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0"
                          style={{ backgroundColor: p.primaryLight }}
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {p.tagline}
                      </p>
                    </div>

                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: p.primary }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CHẾ ĐỘ NỀN SÁNG / TỐI */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              {themeConfig.mode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
              2. Chế Độ Nền (Sáng / Tối Dịu Mắt)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSelectMode('light')}
                className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.mode === 'light'
                    ? 'border-2 shadow-xs bg-amber-50/60 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor: themeConfig.mode === 'light' ? currentPalette.primary : undefined,
                }}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Nền Sáng Tinh Khôi (Tiêu chuẩn)</span>
              </button>
              <button
                onClick={() => handleSelectMode('dark')}
                className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  themeConfig.mode === 'dark'
                    ? 'border-2 shadow-xs bg-slate-900 text-white'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
                style={{
                  borderColor: themeConfig.mode === 'dark' ? currentPalette.primary : undefined,
                }}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Nền Tối Dịu Mắt (Làm việc đêm)</span>
              </button>
            </div>
          </div>

          {/* 3. MẬT ĐỘ HIỂN THỊ (DENSITY) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
              3. Mật Độ Hiển Thị Danh Sách & Bảng Biểu
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSelectDensity('comfortable')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  themeConfig.density === 'comfortable'
                    ? 'border-2 shadow-xs bg-blue-50/40'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                style={{
                  borderColor:
                    themeConfig.density === 'comfortable' ? currentPalette.primary : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                    Thoáng Đãng (Mặc định)
                  </span>
                  {themeConfig.density === 'comfortable' && (
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: currentPalette.primary }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Khoảng cách rộng rãi, bố cục dễ nhìn, phù hợp cho màn hình máy tính bảng và cảm ứng.
                </p>
              </button>

              <button
                onClick={() => handleSelectDensity('compact')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  themeConfig.density === 'compact'
                    ? 'border-2 shadow-xs bg-blue-50/40'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                style={{
                  borderColor:
                    themeConfig.density === 'compact' ? currentPalette.primary : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                    Gọn Gàng (Tối ưu PC)
                  </span>
                  {themeConfig.density === 'compact' && (
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: currentPalette.primary }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Thu hẹp chiều cao các hàng, hiển thị tối đa danh sách 40+ học sinh mà không phải cuộn nhiều.
                </p>
              </button>
            </div>
          </div>

          {/* 4. KIỂU THẺ NỘI DUNG (CARD STYLE) & CỠ CHỮ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Kiểu thẻ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                4. Kiểu Thẻ Nội Dung
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rounded', label: 'Bo Tròn', desc: 'Bo góc 16px' },
                  { id: 'flat', label: 'Phẳng Tối Giản', desc: 'Viền sắc nét' },
                  { id: 'elevated', label: 'Đổ Bóng Nổi', desc: 'Có chiều sâu' },
                ].map((c) => {
                  const isSelected = themeConfig.cardStyle === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCardStyle(c.id as CardStyle)}
                      className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 shadow-xs bg-slate-50 text-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                      style={{
                        borderColor: isSelected ? currentPalette.primary : undefined,
                      }}
                    >
                      <span>{c.label}</span>
                      <p className="text-[10px] text-slate-400 font-normal">{c.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cỡ chữ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-4 h-4 text-purple-600" />
                5. Cỡ Chữ Toàn Bộ Ứng Dụng
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectFontScale('normal')}
                  className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    themeConfig.fontScale === 'normal'
                      ? 'border-2 shadow-xs bg-slate-50 text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                  style={{
                    borderColor:
                      themeConfig.fontScale === 'normal' ? currentPalette.primary : undefined,
                  }}
                >
                  <span className="text-xs">Tiêu Chuẩn (100%)</span>
                  <p className="text-[10px] text-slate-400 font-normal">Sắc nét, vừa mắt PC</p>
                </button>
                <button
                  onClick={() => handleSelectFontScale('large')}
                  className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                    themeConfig.fontScale === 'large'
                      ? 'border-2 shadow-xs bg-slate-50 text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                  style={{
                    borderColor:
                      themeConfig.fontScale === 'large' ? currentPalette.primary : undefined,
                  }}
                >
                  <span className="text-sm">Lớn Hơn (+10%)</span>
                  <p className="text-[10px] text-slate-400 font-normal">Trình chiếu & dễ đọc</p>
                </button>
              </div>
            </div>
          </div>

          {/* MẪU XEM TRƯỚC TRỰC TIẾP (LIVE PREVIEW) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Xem Trước Trực Quan (Live Preview):</span>
              <span
                className="px-2 py-0.5 rounded text-[11px] text-white font-bold"
                style={{ backgroundColor: currentPalette.primary }}
              >
                {currentPalette.name}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                className="px-4 py-2 rounded-lg text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                style={{ backgroundColor: currentPalette.primary }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Nút Bấm Chính
              </button>
              <div
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
                style={{
                  backgroundColor: currentPalette.primaryLight,
                  borderColor: currentPalette.borderLight,
                  color: currentPalette.primary,
                }}
              >
                Huy hiệu điểm: 100đ (Xuất sắc)
              </div>
              <div className="text-xs text-slate-600">
                Chế độ: <strong className="text-slate-900">{themeConfig.mode === 'light' ? 'Sáng' : 'Tối'}</strong> •{' '}
                Mật độ: <strong className="text-slate-900">{themeConfig.density === 'comfortable' ? 'Thoáng đãng' : 'Gọn gàng'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            style={{ backgroundColor: currentPalette.primary }}
          >
            Hoàn Tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
