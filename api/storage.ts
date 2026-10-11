import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client/web';

function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  return createClient({ url, authToken });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const client = db();
    await client.execute(`CREATE TABLE IF NOT EXISTS app_storage (
      storage_key TEXT PRIMARY KEY,
      storage_value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    if (req.method === 'GET') {
      const result = await client.execute('SELECT storage_key, storage_value, updated_at FROM app_storage');
      return res.status(200).json({ items: result.rows.map((row) => ({ key: String(row.storage_key), value: String(row.storage_value), updatedAt: String(row.updated_at) })) });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body.key !== 'string' || !body.key.startsWith('smartclass_') || typeof body.value !== 'string') {
      return res.status(400).json({ error: 'Invalid storage payload' });
    }
    if (body.key === 'smartclass_is_authenticated_v1' || body.key === 'smartclass_current_session_v1') {
      return res.status(400).json({ error: 'Session and authentication keys are local only' });
    }
    await client.execute({
      sql: `INSERT INTO app_storage (storage_key, storage_value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(storage_key) DO UPDATE SET storage_value = excluded.storage_value, updated_at = datetime('now')`,
      args: [body.key, body.value],
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Turso storage API error', error);
    return res.status(500).json({ error: 'Storage service unavailable' });
  }
}
