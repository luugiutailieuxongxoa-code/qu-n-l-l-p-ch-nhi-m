import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, ensureAuthTables, getSession, type ServerSession } from '../lib/auth';

function sameClassKey(key: string, classId: string) {
  return key.endsWith(`_${classId}`) || key === `smartclass_class_info_v1_${classId}`;
}
function canRead(session: ServerSession, key: string) {
  if (session.role === 'admin') return true;
  if (key === 'smartclass_classes_list_v1') return true;
  if (key === 'smartclass_active_class_id_v1' || key === 'smartclass_theme_v1') return true;
  if (!sameClassKey(key, session.classId)) return false;
  return /smartclass_(students|rules|attendance|logs|class_info|feedbacks|parent_meeting_invitation)_v1_/.test(key);
}
function canWrite(session: ServerSession, key: string) {
  if (key === 'smartclass_is_authenticated_v1' || key === 'smartclass_current_session_v1') return false;
  if (session.role === 'admin') return true;
  if (!sameClassKey(key, session.classId)) return false;
  if (key.startsWith('smartclass_feedbacks_v1_')) return true;
  if (session.role === 'officer') {
    if (key.startsWith('smartclass_logs_v1_')) return Boolean(session.permissions.canInputLogs);
    if (key.startsWith('smartclass_attendance_v1_')) return Boolean(session.permissions.canTakeAttendance);
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: 'Cần đăng nhập bằng PIN hợp lệ.' });
    const client = db(); await ensureAuthTables(client);
    await client.execute(`CREATE TABLE IF NOT EXISTS app_storage (storage_key TEXT PRIMARY KEY, storage_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
    if (req.method === 'GET') {
      const result = await client.execute('SELECT storage_key, storage_value, updated_at FROM app_storage');
      const items = result.rows.filter(row => canRead(session, String(row.storage_key))).map(row => ({ key: String(row.storage_key), value: String(row.storage_value), updatedAt: String(row.updated_at) }));
      return res.status(200).json({ items, role: session.role });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body.key !== 'string' || !body.key.startsWith('smartclass_') || typeof body.value !== 'string') return res.status(400).json({ error: 'Invalid storage payload' });
    if (!canWrite(session, body.key)) return res.status(403).json({ error: 'Tài khoản không có quyền cập nhật mục dữ liệu này.' });
    // Students may only append their own new pending feedback; they cannot edit/delete others or approve feedback.
    if (session.role !== 'admin' && body.key.startsWith('smartclass_feedbacks_v1_')) {
      let incoming: any; try { incoming = JSON.parse(body.value); } catch { return res.status(400).json({ error: 'Dữ liệu phản hồi không hợp lệ.' }); }
      if (!Array.isArray(incoming) || incoming.length > 5000) return res.status(400).json({ error: 'Danh sách phản hồi không hợp lệ.' });
      const existingResult = await client.execute({ sql: 'SELECT storage_value FROM app_storage WHERE storage_key = ?', args: [body.key] });
      let existing: any[] = [];
      if (existingResult.rows[0]) { try { const parsed = JSON.parse(String(existingResult.rows[0].storage_value)); if (Array.isArray(parsed)) existing = parsed; } catch { existing = []; } }
      const oldById = new Map(existing.map((item: any) => [String(item.id), JSON.stringify(item)]));
      for (const old of existing) {
        const candidate = incoming.find((item: any) => String(item?.id) === String(old?.id));
        if (!candidate || JSON.stringify(candidate) !== oldById.get(String(old.id))) return res.status(403).json({ error: 'Không được sửa, xóa hoặc duyệt phản hồi đã tồn tại.' });
      }
      const existingIds = new Set(existing.map((item: any) => String(item.id)));
      for (const item of incoming) {
        if (existingIds.has(String(item?.id))) continue;
        if (!session.studentId || String(item?.studentId) !== session.studentId || item?.status !== 'pending') return res.status(403).json({ error: 'Chỉ được gửi phản hồi mới của chính tài khoản đang đăng nhập.' });
      }
    }
    await client.execute({ sql: `INSERT INTO app_storage(storage_key,storage_value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(storage_key) DO UPDATE SET storage_value=excluded.storage_value,updated_at=datetime('now')`, args: [body.key, body.value] });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Turso storage API error', error); return res.status(500).json({ error: 'Storage service unavailable' });
  }
}
