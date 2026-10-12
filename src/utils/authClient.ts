import type { CurrentUserSession } from '../types';

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/auth', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Không thể xác thực tài khoản.');
  return data as T;
}
export async function loginWithPin(input: { role: 'admin' | 'teacher' | 'student'; classId: string; pin?: string; password?: string; username?: string; studentId?: string; displayName?: string }) {
  return post<{ ok: true; session: CurrentUserSession }>({ action: 'login', ...input, password: input.password ?? input.pin });
}
export async function logoutServer() { return post<{ ok: true }>({ action: 'logout' }); }
export async function setStudentPin(input: { classId: string; studentId: string; displayName: string; pin: string; role: 'student' | 'officer'; permissions?: Record<string, unknown> }) {
  return post<{ ok: true; message: string }>({ action: 'set-pin', ...input });
}
export async function revokeStudentPin(classId: string, studentId: string) { return post<{ ok: true }>({ action: 'revoke-pin', classId, studentId }); }
export async function changeOwnPassword(oldPassword: string, newPassword: string) { return post<{ ok: true; message: string }>({ action: 'change-password', oldPassword, newPassword }); }
export async function listTeacherAccounts() { return post<{ ok: true; teachers: Array<{ username: string; classId: string; displayName: string; active: boolean; updatedAt: string }> }>({ action: 'list-teachers' }); }
export async function saveTeacherAccount(input: { username: string; classId: string; displayName: string; password?: string }) { return post<{ ok: true; message: string }>({ action: 'manage-teacher', ...input }); }
export async function setTeacherAccountActive(username: string, active: boolean) { return post<{ ok: true }>({ action: 'lock-teacher', username, active }); }
