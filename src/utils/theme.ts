import { AppThemeConfig, ThemeColorId } from '../types';

export interface ThemeColorDefinition {
  id: ThemeColorId;
  name: string;
  tagline: string;
  primary: string;
  primaryDark: string;
  primaryHover: string;
  primaryLight: string;
  borderLight: string;
  accent: string;
  gradient: string;
}

export const THEME_COLOR_PALETTES: ThemeColorDefinition[] = [
  {
    id: 'navy',
    name: 'Xanh Hải Quân',
    tagline: 'Chuẩn mực sư phạm truyền thống, thanh lịch và tin cậy',
    primary: '#1E3A8A',
    primaryDark: '#172554',
    primaryHover: '#1D4ED8',
    primaryLight: '#EFF6FF',
    borderLight: '#BFDBFE',
    accent: '#F59E0B',
    gradient: 'from-[#1E3A8A] to-blue-900',
  },
  {
    id: 'emerald',
    name: 'Xanh Ngọc Giáo Dục',
    tagline: 'Tươi sáng, năng động, tinh thần học tập tích cực',
    primary: '#065F46',
    primaryDark: '#064E3B',
    primaryHover: '#047857',
    primaryLight: '#ECFDF5',
    borderLight: '#A7F3D0',
    accent: '#F59E0B',
    gradient: 'from-[#065F46] to-emerald-900',
  },
  {
    id: 'indigo',
    name: 'Tím Chàm Hiện Đại',
    tagline: 'Công nghệ giáo dục hiện đại, sáng tạo và thanh thoát',
    primary: '#4338CA',
    primaryDark: '#312E81',
    primaryHover: '#3730A3',
    primaryLight: '#EEF2FF',
    borderLight: '#C7D2FE',
    accent: '#F59E0B',
    gradient: 'from-[#4338CA] to-indigo-900',
  },
  {
    id: 'crimson',
    name: 'Đỏ Đô Sư Phạm',
    tagline: 'Nhiệt huyết thi đua, nổi bật truyền thống nhà trường',
    primary: '#991B1B',
    primaryDark: '#7F1D1D',
    primaryHover: '#B91C1C',
    primaryLight: '#FEF2F2',
    borderLight: '#FECACA',
    accent: '#FBBF24',
    gradient: 'from-[#991B1B] to-rose-950',
  },
  {
    id: 'teal',
    name: 'Xanh Biển Dịu Mắt',
    tagline: 'Mát dịu, thư thái, chống mỏi mắt khi làm việc lâu',
    primary: '#0F766E',
    primaryDark: '#134E4A',
    primaryHover: '#0D9488',
    primaryLight: '#F0FDFA',
    borderLight: '#99F6E4',
    accent: '#F59E0B',
    gradient: 'from-[#0F766E] to-teal-950',
  },
  {
    id: 'slate',
    name: 'Xám Đen Tối Giản',
    tagline: 'Chuyên nghiệp, tối giản, tập trung hoàn toàn vào dữ liệu',
    primary: '#1E293B',
    primaryDark: '#0F172A',
    primaryHover: '#334155',
    primaryLight: '#F8FAFC',
    borderLight: '#CBD5E1',
    accent: '#38BDF8',
    gradient: 'from-[#1E293B] to-slate-950',
  },
  {
    id: 'violet',
    name: 'Tím Hoàng Gia',
    tagline: 'Quý phái, phong cách nghệ thuật và truyền cảm hứng',
    primary: '#6D28D9',
    primaryDark: '#4C1D95',
    primaryHover: '#7C3AED',
    primaryLight: '#F5F3FF',
    borderLight: '#DDD6FE',
    accent: '#F59E0B',
    gradient: 'from-[#6D28D9] to-purple-950',
  },
];

export const DEFAULT_THEME_CONFIG: AppThemeConfig = {
  colorId: 'navy',
  density: 'comfortable',
  cardStyle: 'rounded',
  fontScale: 'normal',
  mode: 'light',
};

export const getThemePalette = (colorId: ThemeColorId): ThemeColorDefinition => {
  const found = THEME_COLOR_PALETTES.find((p) => p.id === colorId);
  return found || THEME_COLOR_PALETTES[0];
};

export const applyThemeToDocument = (config: AppThemeConfig): void => {
  const palette = getThemePalette(config.colorId);
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty('--theme-primary', palette.primary);
  root.style.setProperty('--theme-primary-dark', palette.primaryDark);
  root.style.setProperty('--theme-primary-hover', palette.primaryHover);
  root.style.setProperty('--theme-primary-light', palette.primaryLight);
  root.style.setProperty('--theme-primary-border', palette.borderLight);
  root.style.setProperty('--theme-accent', palette.accent);

  // Set attributes for CSS styling
  root.setAttribute('data-theme-color', config.colorId);
  root.setAttribute('data-density', config.density);
  root.setAttribute('data-card-style', config.cardStyle);
  root.setAttribute('data-font-scale', config.fontScale);
  root.setAttribute('data-theme-mode', config.mode);

  if (config.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
