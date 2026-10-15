import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, getSession } from '../lib/auth.js';

const KEY = 'smartclass_classes_list_v1';
const isClass = (value: any) => value && typeof value.id === 'string' && typeof value.className === 'string' && value.id.length <= 120 && value.className.trim().length > 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const client = db();
    await client.execute(`CREATE TABLE IF NOT EXISTS app_storage (storage_key TEXT PRIMARY KEY, storage_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`);
    if (req.method === 'GET') {
      const result = await client.execute({ sql: 'SELECT storage_value FROM app_storage WHERE storage_key=?', args: [KEY] });
      let classes: unknown[] = [];
      if (result.rows[0]?.storage_value) {
        try { const parsed = JSON.parse(String(result.rows[0].storage_value)); if (Array.isArray(parsed)) classes = parsed.filter(isClass); } catch { /* ignore corrupt list */ }
      }
      return res.status(200).json({ ok: true, classes });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
    const session = await getSession(req);
    if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin được quản lý danh sách lớp.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!Array.isArray(body?.classes) || !body.classes.every(isClass)) return res.status(400).json({ error: 'Danh sách lớp không hợp lệ.' });
    const ids = body.classes.map((c: any) => c.id);
    if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Mã lớp bị trùng.' });
    const previousResult = await client.execute({ sql: 'SELECT storage_value FROM app_storage WHERE storage_key=?', args: [KEY] });
    let previous: any[] = [];
    try { const parsed = JSON.parse(String(previousResult.rows[0]?.storage_value || '[]')); if (Array.isArray(parsed)) previous = parsed; } catch { previous = []; }
    const retainedIds = new Set(body.classes.map((c: any) => c.id));
    const deletedIds = previous.map((c: any) => String(c.id)).filter((id: string) => !retainedIds.has(id));
    for (const deletedId of deletedIds) {
      await client.execute({ sql: 'DELETE FROM smartclass_sessions WHERE class_id=?', args: [deletedId] });
      await client.execute({ sql: 'DELETE FROM smartclass_credentials WHERE class_id=?', args: [deletedId] });
      await client.execute({ sql: 'DELETE FROM app_storage WHERE storage_key LIKE ?', args: [`class:${deletedId}:smartclass_%`] });
      await client.execute({ sql: 'DELETE FROM smartclass_teacher_accounts WHERE class_id=?', args: [deletedId] });
    }
    await client.execute({ sql: `INSERT INTO app_storage(storage_key,storage_value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(storage_key) DO UPDATE SET storage_value=excluded.storage_value,updated_at=datetime('now')`, args: [KEY, JSON.stringify(body.classes)] });
    return res.status(200).json({ ok: true, classes: body.classes });
  } catch (error) {
    console.error('Class list API error', error);
    return res.status(500).json({ error: 'Không thể tải hoặc lưu danh sách lớp.' });
  }
}

