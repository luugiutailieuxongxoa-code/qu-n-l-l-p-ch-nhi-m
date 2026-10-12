import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'node:crypto';
import { db, ensureAuthTables, getSession, hashPin, verifyPin, tokenHash, setSessionCookie, clearSessionCookie } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    try { const session = await getSession(req); return res.status(session ? 200 : 401).json(session ? { ok: true, session: { role: session.role, classId: session.classId, studentId: session.studentId, displayName: session.displayName, ...session.permissions, isLoggedIn: true, isReadOnly: session.role === 'student' } } : { ok: false }); }
    catch { return res.status(500).json({ error: 'Auth service unavailable' }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const action = String(body.action || '');
  try {
    const client = db(); await ensureAuthTables(client);
    if (action === 'logout') {
      const current = await getSession(req);
      if (current) await client.execute({ sql: 'DELETE FROM smartclass_sessions WHERE token_hash = ?', args: [current.id] });
      clearSessionCookie(res); return res.status(200).json({ ok: true });
    }
    if (action === 'login') {
      const pin = String(body.pin || ''); const classId = String(body.classId || '');
      
if (
  pin.length < 8 ||
  pin.length > 64 ||
  !/[a-zA-Z]/.test(pin) ||
  !/[0-9]/.test(pin) ||
  !/[^a-zA-Z0-9]/.test(pin) ||
  !classId
) {
  return res.status(400).json({
    error: 'Mật khẩu phải dài 8–64 ký tự, gồm chữ cái, số và ký tự đặc biệt.'
  });
}

      let role: 'admin' | 'officer' | 'student'; let studentId: string | undefined; let displayName: string; let permissions: Record<string, unknown> = {};
      if (body.role === 'admin') {
        const bootstrap = process.env.SMARTCLASS_ADMIN_PIN;
        if (!bootstrap) return res.status(503).json({ error: 'Chưa cấu hình SMARTCLASS_ADMIN_PIN trên Vercel.' });
        if (pin !== bootstrap) return res.status(401).json({ error: 'Mã PIN giáo viên không đúng.' });
        role = 'admin'; displayName = String(body.displayName || 'Giáo viên chủ nhiệm'); permissions = { managePins: true, canInputLogs: true, canEditPoints: true, canTakeAttendance: true };
      } else {
        studentId = String(body.studentId || '');
        const found = await client.execute({ sql: 'SELECT pin_hash, role, display_name, permissions FROM smartclass_credentials WHERE class_id = ? AND student_id = ? AND active = 1', args: [classId, studentId] });
        const row = found.rows[0];
        if (!row || !verifyPin(pin, String(row.pin_hash))) return res.status(401).json({ error: 'Mã PIN học sinh không đúng hoặc chưa được GVCN cấp.' });
        role = String(row.role) as 'officer' | 'student'; displayName = String(row.display_name); permissions = JSON.parse(String(row.permissions || '{}'));
      }
      const token = randomBytes(32).toString('base64url'); const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
      await client.execute({ sql: 'INSERT INTO smartclass_sessions(token_hash,class_id,role,student_id,display_name,permissions,expires_at) VALUES(?,?,?,?,?,?,?)', args: [tokenHash(token), classId, role, studentId || null, displayName, JSON.stringify(permissions), expiresAt] });
      setSessionCookie(res, token);
      return res.status(200).json({ ok: true, session: { role, classId, studentId, displayName, ...permissions, isLoggedIn: true, isReadOnly: role === 'student' } });
    }
    if (action === 'set-pin') {
      const session = await getSession(req);
      if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Chỉ GVCN đã xác thực mới được cấp PIN.' });
      const classId = String(body.classId || ''); const studentId = String(body.studentId || ''); const pin = String(body.pin || '');
      const role = body.role === 'officer' ? 'officer' : 'student';
      if (classId !== session.classId) return res.status(403).json({ error: 'Không thể quản lý PIN lớp khác.' });
      if (!studentId || !/^\d{4,8}$/.test(pin)) return res.status(400).json({ error: 'Chọn học sinh và nhập PIN 4–8 chữ số.' });
      const permissions = role === 'officer' ? {
        canInputLogs: Boolean(body.permissions?.canInputLogs), canTakeAttendance: Boolean(body.permissions?.canTakeAttendance),
        canEditPoints: Boolean(body.permissions?.canEditPoints), assignedCategories: Array.isArray(body.permissions?.assignedCategories) ? body.permissions.assignedCategories : [],
        assignedTeams: Array.isArray(body.permissions?.assignedTeams) ? body.permissions.assignedTeams : [],
      } : { canInputLogs: false, canTakeAttendance: false, canEditPoints: false };
      const displayName = String(body.displayName || studentId).slice(0, 120);
      await client.execute({ sql: `INSERT INTO smartclass_credentials(class_id,student_id,pin_hash,role,display_name,permissions,active,updated_at) VALUES(?,?,?,?,?,?,1,datetime('now')) ON CONFLICT(class_id,student_id) DO UPDATE SET pin_hash=excluded.pin_hash,role=excluded.role,display_name=excluded.display_name,permissions=excluded.permissions,active=1,updated_at=datetime('now')`, args: [classId, studentId, hashPin(pin), role, displayName, JSON.stringify(permissions)] });
      return res.status(200).json({ ok: true, message: 'Đã lưu PIN và quyền cho học sinh.' });
    }
    if (action === 'revoke-pin') {
      const session = await getSession(req);
      if (!session || session.role !== 'admin' || String(body.classId || '') !== session.classId) return res.status(403).json({ error: 'Không đủ quyền.' });
      await client.execute({ sql: 'UPDATE smartclass_credentials SET active=0, updated_at=datetime(\'now\') WHERE class_id=? AND student_id=?', args: [session.classId, String(body.studentId || '')] });
      await client.execute({ sql: 'DELETE FROM smartclass_sessions WHERE class_id=? AND student_id=?', args: [session.classId, String(body.studentId || '')] });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) { console.error('Auth API error', error); return res.status(500).json({ error: 'Auth service unavailable' }); }
}
