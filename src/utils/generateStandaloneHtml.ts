import {
  ClassInfo,
  Student,
  Rule,
  AttendanceRecord,
  BehaviorLog,
  StudentFeedback,
  AppThemeConfig,
  CurrentUserSession
} from '../types';
import { getStandaloneHtmlMarkup } from './standalone/templateHtml';
import { getStandaloneJsEngine } from './standalone/templateJs';

export const downloadStandaloneHtmlFile = (
  classInfo: ClassInfo,
  students: Student[],
  rules: Rule[],
  attendance: AttendanceRecord[],
  logs: BehaviorLog[],
  feedbacks?: StudentFeedback[],
  themeConfig?: AppThemeConfig,
  currentSession?: CurrentUserSession
): void => {
  const initialDataJson = JSON.stringify({
    classInfo,
    students,
    rules,
    attendance,
    logs,
    feedbacks: feedbacks || [],
    themeConfig: themeConfig || { colorId: 'navy' },
    currentSession: currentSession || {
      role: 'admin',
      displayName: 'GVCN (Admin)',
      canEditPoints: true,
      canTakeAttendance: true,
      canInputLogs: true,
      isReadOnly: false,
    },
  });

  const jsEngineCode = getStandaloneJsEngine();
  const htmlContent = getStandaloneHtmlMarkup(initialDataJson, jsEngineCode);

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `SmartClass_${classInfo.className || '9A1'}_Offline_FullPro.html`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
