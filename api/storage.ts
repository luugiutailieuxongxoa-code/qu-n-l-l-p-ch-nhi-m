import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, ensureAuthTables, getSession } from '../lib/auth.js';

const PREFIX = 'smartclass_';
const LOCAL_ONLY = new Set(['smartclass_is_authenticated_v1', 'smartclass_current_session_v1', 'smartclass_active_class_id_v1']);
const CLASS_LIST = 'smartclass_classes_list_v1';
const STUDENT_ALLOWED = new Set(['smartclass_feedbacks_v1']);
const OFFICER_ALLOWED = new Set(['smartclass_feedbacks_v1', 'smartclass_attendance_v1', 'smartclass_logs_v1']);
function dbKey(classId: string, key: string) { return `class:${classId}:${key}`; }
function mayAccess(session: NonNullable<Awaited<ReturnType<typeof getSession>>>, key: string, write: boolean) {
  if (!key.startsWith(PREFIX) || LOCAL_ONLY.has(key)) return false;
  if (session.role === 'admin') return true;
  if (key === CLASS_LIST || key === 'smartclass_active_class_id_v1') return false;
  if (session.role === 'teacher') return true;
  if (!write) return session.role === 'student' || session.role === 'officer';
  if (session.role === 'student') return STUDENT_ALLOWED.has(key);
  if (session.role === 'officer') {
    if (OFFICER_ALLOWED.has(key)) {
      if (key === 'smartclass_attendance_v1' && !session.permissions.canTakeAttendance) return false;
      if (key === 'smartclass_logs_v1' && !session.permissions.canInputLogs) return false;
      return true;
    }
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    const client = db(); await ensureAuthTables(client);
    await client.execute(`CREATE TABLE IF NOT EXISTS app_storage (storage_key TEXT PRIMARY KEY, storage_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
    if (req.method === 'GET') {
      if (session.role === 'admin') {
        const requestedClass = String(req.query.classId || session.classId || '').trim();
        const result = await client.execute({ sql: "SELECT storage_key, storage_value, updated_at FROM app_storage WHERE storage_key LIKE ? OR storage_key NOT LIKE 'class:%'", args: [`class:${requestedClass}:smartclass_%`] });
        const mapped = result.rows.map(row => {
          const storedKey = String(row.storage_key);
          const match = storedKey.match(/^class:[^:]+:(smartclass_.*)$/);
          return { key: match ? match[1] : storedKey, value: String(row.storage_value), updatedAt: String(row.updated_at), scoped: Boolean(match) };
        }).filter(item => mayAccess(session, item.key, false));
        const preferred = new Map<string, typeof mapped[number]>();
        for (const item of mapped) { const old = preferred.get(item.key); if (!old || item.scoped || !old.scoped) preferred.set(item.key, item); }
        return res.status(200).json({ items: Array.from(preferred.values()).map(({ key, value, updatedAt }) => ({ key, value, updatedAt })) });
      }
      const result = await client.execute({ sql: 'SELECT storage_key, storage_value, updated_at FROM app_storage WHERE storage_key LIKE ?', args: [`class:${session.classId}:smartclass_%`] });
      const items = result.rows.map(row => ({ key: String(row.storage_key).slice(`class:${session.classId}:`.length), value: String(row.storage_value), updatedAt: String(row.updated_at) })).filter(item => mayAccess(session, item.key, false));
      return res.status(200).json({ items });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body.key !== 'string' || typeof body.value !== 'string' || !mayAccess(session, body.key, true)) {
      return res.status(403).json({ error: 'Không có quyền ghi dữ liệu này.' });
    }
    if (session.role !== 'admin' && body.key === CLASS_LIST) return res.status(403).json({ error: 'Chỉ Admin được sửa danh sách lớp.' });
    const requestedClass = session.role === 'admin' ? String(body.classId || session.classId).trim() : session.classId;
    if (!requestedClass || requestedClass.includes(':')) return res.status(400).json({ error: 'Lớp dữ liệu không hợp lệ.' });
    const key = session.role === 'admin' && body.key === CLASS_LIST ? CLASS_LIST : dbKey(requestedClass, body.key);
    await client.execute({ sql: `INSERT INTO app_storage (storage_key, storage_value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(storage_key) DO UPDATE SET storage_value = excluded.storage_value, updated_at = datetime('now')`, args: [key, body.value] });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Turso storage API error', error);
    return res.status(500).json({ error: 'Storage service unavailable' });
  }
}
