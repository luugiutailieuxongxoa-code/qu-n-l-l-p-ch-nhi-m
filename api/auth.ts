import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { db, ensureAuthTables, getSession, hashPin, verifyPin, tokenHash, setSessionCookie, clearSessionCookie } from '../lib/auth.js';

function isStrongPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 64 && /[A-Za-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9\s]/.test(value);
}
function publicSession(session: { role: string; classId: string; studentId?: string; displayName: string; permissions: Record<string, unknown> }) {
  return { role: session.role, classId: session.classId, studentId: session.studentId, displayName: session.displayName, ...session.permissions, isLoggedIn: true, isReadOnly: session.role === 'student' };
}
function bodyOf(req: VercelRequest) { return typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    try { const session = await getSession(req); return res.status(session ? 200 : 401).json(session ? { ok: true, session: publicSession(session) } : { ok: false }); }
    catch { clearSessionCookie(res); return res.status(500).json({ error: 'Auth service unavailable' }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let body: Record<string, any>;
  try { body = bodyOf(req); } catch { return res.status(400).json({ error: 'Dữ liệu gửi lên không hợp lệ.' }); }
  const action = String(body.action || '');
  try {
    const client = db(); await ensureAuthTables(client);
    if (action === 'logout') {
      const current = await getSession(req);
      if (current) await client.execute({ sql: 'DELETE FROM smartclass_sessions WHERE token_hash = ?', args: [current.id] });
      clearSessionCookie(res); return res.status(200).json({ ok: true });
    }
    if (action === 'login') {
      const roleInput = String(body.role || '');
      const password = String(body.password ?? body.pin ?? '');
      const classId = String(body.classId || '').trim();
      let role: 'admin' | 'teacher' | 'officer' | 'student'; let studentId: string | undefined; let username: string | undefined; let displayName = ''; let permissions: Record<string, unknown> = {};
      if (roleInput === 'admin') {
        const configured = process.env.SMARTCLASS_ADMIN_PASSWORD;
        if (!configured || !isStrongPassword(configured)) return res.status(503).json({ error: 'Admin chưa được cấu hình SMARTCLASS_ADMIN_PASSWORD đủ mạnh trên Vercel.' });
        if (password !== configured) return res.status(401).json({ error: 'Tên tài khoản hoặc mật khẩu Admin không đúng.' });
        role = 'admin'; displayName = 'Quản trị viên hệ thống'; permissions = { managePins: true, manageTeachers: true, canInputLogs: true, canEditPoints: true, canTakeAttendance: true };
      } else if (roleInput === 'teacher') {
        username = String(body.username || '').trim();
        if (!username || !isStrongPassword(password)) return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu hợp lệ là bắt buộc.' });
        const found = await client.execute({ sql: 'SELECT class_id,password_hash,display_name FROM smartclass_teacher_accounts WHERE username=? COLLATE NOCASE AND active=1', args: [username] });
        const row = found.rows[0];
        if (!row || !verifyPin(password, String(row.password_hash))) return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu GVCN không đúng, hoặc tài khoản đã bị khóa.' });
        role = 'teacher';
        // Class assignment is authoritative on the server, never from the browser.
        const assignedClass = String(row.class_id); displayName = String(row.display_name);
        permissions = { managePins: true, canInputLogs: true, canEditPoints: true, canTakeAttendance: true };
        const token = randomBytes(32).toString('base64url'); const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
        await client.execute({ sql: 'INSERT INTO smartclass_sessions(token_hash,class_id,role,student_id,display_name,permissions,expires_at) VALUES(?,?,?,?,?,?,?)', args: [tokenHash(token), assignedClass, role, null, displayName, JSON.stringify({ ...permissions, username }), expiresAt] });
        setSessionCookie(res, token);
        return res.status(200).json({ ok: true, session: publicSession({ role, classId: assignedClass, displayName, permissions: { ...permissions, username } }) });
      } else {
        if (!classId || !isStrongPassword(password)) return res.status(400).json({ error: 'Mật khẩu phải dài 8–64 ký tự, gồm chữ cái, số và ký tự đặc biệt.' });
        studentId = String(body.studentId || '');
        const found = await client.execute({ sql: 'SELECT pin_hash, role, display_name, permissions FROM smartclass_credentials WHERE class_id = ? AND student_id = ? AND active = 1', args: [classId, studentId] });
        const row = found.rows[0];
        if (!row || !verifyPin(password, String(row.pin_hash))) return res.status(401).json({ error: 'Mật khẩu học sinh không đúng hoặc chưa được GVCN cấp.' });
        role = String(row.role) as 'officer' | 'student'; displayName = String(row.display_name); permissions = JSON.parse(String(row.permissions || '{}'));
      }
      const token = randomBytes(32).toString('base64url'); const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
      await client.execute({ sql: 'INSERT INTO smartclass_sessions(token_hash,class_id,role,student_id,display_name,permissions,expires_at) VALUES(?,?,?,?,?,?,?)', args: [tokenHash(token), classId, role, studentId || null, displayName, JSON.stringify(permissions), expiresAt] });
      setSessionCookie(res, token);
      return res.status(200).json({ ok: true, session: publicSession({ role, classId, studentId, displayName, permissions }) });
    }
    const session = await getSession(req);
    if (action === 'manage-teacher') {
      if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin hệ thống được quản lý tài khoản GVCN.' });
      const username = String(body.username || '').trim(); const classId = String(body.classId || '').trim(); const displayName = String(body.displayName || '').trim().slice(0, 120); const password = String(body.password || '');
      if (!/^[A-Za-z0-9._-]{3,40}$/.test(username) || !classId || !displayName) return res.status(400).json({ error: 'Tên đăng nhập (3–40 ký tự: chữ, số, dấu chấm, gạch dưới hoặc gạch ngang), lớp và họ tên là bắt buộc.' });
      if (password && !isStrongPassword(password)) return res.status(400).json({ error: 'Mật khẩu phải dài 8–64 ký tự, gồm chữ cái, số và ký tự đặc biệt.' });
      await client.execute(`CREATE TABLE IF NOT EXISTS app_storage (storage_key TEXT PRIMARY KEY, storage_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
      const classListResult = await client.execute({ sql: 'SELECT storage_value FROM app_storage WHERE storage_key=?', args: ['smartclass_classes_list_v1'] });
      let knownClasses: any[] = [];
      try { const parsed = JSON.parse(String(classListResult.rows[0]?.storage_value || '[]')); if (Array.isArray(parsed)) knownClasses = parsed; } catch { knownClasses = []; }
      if (!knownClasses.some((item: any) => String(item.id) === classId)) return res.status(400).json({ error: 'Phải tạo lớp trước khi cấp tài khoản GVCN.' });
      const old = await client.execute({ sql: 'SELECT username FROM smartclass_teacher_accounts WHERE username=? COLLATE NOCASE', args: [username] });
      if (!old.rows.length && !password) return res.status(400).json({ error: 'Tạo tài khoản mới cần mật khẩu ban đầu.' });
      if (password) await client.execute({ sql: `INSERT INTO smartclass_teacher_accounts(username,class_id,password_hash,display_name,active,updated_at) VALUES(?,?,?,?,1,datetime('now')) ON CONFLICT(username) DO UPDATE SET class_id=excluded.class_id,password_hash=excluded.password_hash,display_name=excluded.display_name,active=1,updated_at=datetime('now')`, args: [username, classId, hashPin(password), displayName] });
      else await client.execute({ sql: `UPDATE smartclass_teacher_accounts SET class_id=?,display_name=?,updated_at=datetime('now') WHERE username=? COLLATE NOCASE`, args: [classId, displayName, username] });
      await client.execute({ sql: "DELETE FROM smartclass_sessions WHERE role='teacher' AND json_extract(permissions,'$.username')=? COLLATE NOCASE", args: [username] });
      return res.status(200).json({ ok: true, message: 'Đã lưu tài khoản GVCN. GVCN cần đăng nhập lại.' });
    }
    if (action === 'list-teachers') {
      if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin hệ thống được xem danh sách tài khoản GVCN.' });
      const result = await client.execute('SELECT username,class_id,display_name,active,updated_at FROM smartclass_teacher_accounts ORDER BY class_id,username');
      return res.status(200).json({ ok: true, teachers: result.rows.map(r => ({ username: String(r.username), classId: String(r.class_id), displayName: String(r.display_name), active: Number(r.active) === 1, updatedAt: String(r.updated_at) })) });
    }
    if (action === 'delete-teacher') {
      if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin hệ thống được xóa tài khoản GVCN.' });
      const username = String(body.username || '').trim();
      if (!username) return res.status(400).json({ error: 'Thiếu tên đăng nhập GVCN.' });
      await client.execute({ sql: 'DELETE FROM smartclass_teacher_accounts WHERE username=? COLLATE NOCASE', args: [username] });
      await client.execute({ sql: "DELETE FROM smartclass_sessions WHERE role='teacher' AND json_extract(permissions,'$.username')=? COLLATE NOCASE", args: [username] });
      return res.status(200).json({ ok: true, message: 'Đã xóa tài khoản GVCN.' });
    }
    if (action === 'lock-teacher') {
      if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin hệ thống được khóa tài khoản GVCN.' });
      const username = String(body.username || '').trim();
      await client.execute({ sql: 'UPDATE smartclass_teacher_accounts SET active=?,updated_at=datetime(\'now\') WHERE username=? COLLATE NOCASE', args: [body.active === true ? 1 : 0, username] });
      if (body.active !== true) await client.execute({ sql: "DELETE FROM smartclass_sessions WHERE role='teacher' AND json_extract(permissions,'$.username')=? COLLATE NOCASE", args: [username] });
      return res.status(200).json({ ok: true });
    }
    if (action === 'change-password') {
      if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
      const oldPassword = String(body.oldPassword || ''); const newPassword = String(body.newPassword || '');
      if (!isStrongPassword(newPassword)) return res.status(400).json({ error: 'Mật khẩu mới phải dài 8–64 ký tự, gồm chữ cái, số và ký tự đặc biệt.' });
      if (session.role === 'teacher') {
        const username = String(session.permissions.username || '');
        const found = await client.execute({ sql: 'SELECT password_hash FROM smartclass_teacher_accounts WHERE username=? COLLATE NOCASE AND active=1', args: [username] });
        if (!found.rows[0] || !verifyPin(oldPassword, String(found.rows[0].password_hash))) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng.' });
        await client.execute({ sql: 'UPDATE smartclass_teacher_accounts SET password_hash=?,updated_at=datetime(\'now\') WHERE username=? COLLATE NOCASE', args: [hashPin(newPassword), username] });
      } else if (session.role === 'student' || session.role === 'officer') {
        const found = await client.execute({ sql: 'SELECT pin_hash FROM smartclass_credentials WHERE class_id=? AND student_id=? AND active=1', args: [session.classId, session.studentId || ''] });
        if (!found.rows[0] || !verifyPin(oldPassword, String(found.rows[0].pin_hash))) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng.' });
        await client.execute({ sql: 'UPDATE smartclass_credentials SET pin_hash=?,updated_at=datetime(\'now\') WHERE class_id=? AND student_id=?', args: [hashPin(newPassword), session.classId, session.studentId || ''] });
      } else return res.status(400).json({ error: 'Admin đổi mật khẩu bằng cấu hình SMARTCLASS_ADMIN_PASSWORD trên Vercel.' });
      return res.status(200).json({ ok: true, message: 'Đã đổi mật khẩu.' });
    }
    if (action === 'set-pin') {
      if (!session || !['admin', 'teacher'].includes(session.role)) return res.status(403).json({ error: 'Chỉ GVCN được cấp mật khẩu học sinh.' });
      const classId = String(body.classId || ''); const studentId = String(body.studentId || ''); const pin = String(body.pin || body.password || '');
      const role = body.role === 'officer' ? 'officer' : 'student';
      if (session.role === 'teacher' && classId !== session.classId) return res.status(403).json({ error: 'Không thể quản lý mật khẩu lớp khác.' });
      if (!studentId || !isStrongPassword(pin)) return res.status(400).json({ error: 'Chọn học sinh và nhập mật khẩu 8–64 ký tự, gồm chữ cái, số và ký tự đặc biệt.' });
      const permissions = role === 'officer' ? { canInputLogs: Boolean(body.permissions?.canInputLogs), canTakeAttendance: Boolean(body.permissions?.canTakeAttendance), canEditPoints: Boolean(body.permissions?.canEditPoints), assignedCategories: Array.isArray(body.permissions?.assignedCategories) ? body.permissions.assignedCategories : [], assignedTeams: Array.isArray(body.permissions?.assignedTeams) ? body.permissions.assignedTeams : [] } : { canInputLogs: false, canTakeAttendance: false, canEditPoints: false };
      const displayName = String(body.displayName || studentId).slice(0, 120);
      await client.execute({ sql: `INSERT INTO smartclass_credentials(class_id,student_id,pin_hash,role,display_name,permissions,active,updated_at) VALUES(?,?,?,?,?,?,1,datetime('now')) ON CONFLICT(class_id,student_id) DO UPDATE SET pin_hash=excluded.pin_hash,role=excluded.role,display_name=excluded.display_name,permissions=excluded.permissions,active=1,updated_at=datetime('now')`, args: [classId, studentId, hashPin(pin), role, displayName, JSON.stringify(permissions)] });
      return res.status(200).json({ ok: true, message: 'Đã lưu mật khẩu và quyền cho học sinh.' });
    }
    if (action === 'revoke-pin') {
      if (!session || !['admin', 'teacher'].includes(session.role) || (session.role === 'teacher' && String(body.classId || '') !== session.classId)) return res.status(403).json({ error: 'Không đủ quyền.' });
      const targetClassId = session.role === 'admin' ? String(body.classId || '') : session.classId;
      await client.execute({ sql: 'UPDATE smartclass_credentials SET active=0, updated_at=datetime(\'now\') WHERE class_id=? AND student_id=?', args: [targetClassId, String(body.studentId || '')] });
      await client.execute({ sql: 'DELETE FROM smartclass_sessions WHERE class_id=? AND student_id=?', args: [targetClassId, String(body.studentId || '')] });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) { console.error('Auth API error', error); return res.status(500).json({ error: 'Auth service unavailable' }); }
}
