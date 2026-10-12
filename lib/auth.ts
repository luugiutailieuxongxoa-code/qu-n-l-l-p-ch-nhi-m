import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@libsql/client/web';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export type ServerRole = 'admin' | 'teacher' | 'officer' | 'student';
export type ServerSession = { id: string; classId: string; role: ServerRole; studentId?: string; username?: string; displayName: string; permissions: Record<string, unknown> };

export function db() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  return createClient({ url, authToken });
}
export async function ensureAuthTables(client = db()) {
  await client.execute(`CREATE TABLE IF NOT EXISTS smartclass_credentials (class_id TEXT NOT NULL, student_id TEXT NOT NULL, pin_hash TEXT NOT NULL, role TEXT NOT NULL, display_name TEXT NOT NULL, permissions TEXT NOT NULL DEFAULT '{}', active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY(class_id, student_id))`);
  await client.execute(`CREATE TABLE IF NOT EXISTS smartclass_sessions (token_hash TEXT PRIMARY KEY, class_id TEXT NOT NULL, role TEXT NOT NULL, student_id TEXT, display_name TEXT NOT NULL, permissions TEXT NOT NULL DEFAULT '{}', expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT datetime('now'))`);
  await client.execute(`CREATE TABLE IF NOT EXISTS smartclass_teacher_accounts (username TEXT PRIMARY KEY COLLATE NOCASE, class_id TEXT NOT NULL, password_hash TEXT NOT NULL, display_name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT datetime('now'))`);
}
export function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}
export function verifyPin(pin: string, stored: string) {
  const [salt, expectedHex] = String(stored || '').split(':');
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(pin, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function getCookie(req: VercelRequest, name: string): string | undefined {
  const header = req.headers.cookie || '';
  const match = header.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}
export async function getSession(req: VercelRequest): Promise<ServerSession | null> {
  const token = getCookie(req, 'smartclass_session');
  if (!token) return null;
  const client = db(); await ensureAuthTables(client);
  const result = await client.execute({ sql: 'SELECT class_id, role, student_id, display_name, permissions, expires_at FROM smartclass_sessions WHERE token_hash = ?', args: [tokenHash(token)] });
  const row = result.rows[0];
  if (!row || Number(row.expires_at) <= Date.now()) {
    if (row) await client.execute({ sql: 'DELETE FROM smartclass_sessions WHERE token_hash = ?', args: [tokenHash(token)] });
    return null;
  }
  const role = String(row.role) as ServerRole;
  if (!['admin', 'teacher', 'officer', 'student'].includes(role)) return null;
  return { id: tokenHash(token), classId: String(row.class_id), role, studentId: row.student_id ? String(row.student_id) : undefined, displayName: String(row.display_name), permissions: JSON.parse(String(row.permissions || '{}')) };
}
export function setSessionCookie(res: VercelResponse, token: string) {
  res.setHeader('Set-Cookie', `smartclass_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`);
}
export function clearSessionCookie(res: VercelResponse) {
  res.setHeader('Set-Cookie', 'smartclass_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
}
