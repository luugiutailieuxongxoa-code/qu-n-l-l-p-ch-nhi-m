/**
 * Local-first migration bridge. Existing localStorage remains the immediate source
 * for the UI; this module imports shared values once and mirrors subsequent writes.
 * Authentication/session keys are deliberately never synced.
 */
const PREFIX = 'smartclass_';
const LOCAL_ONLY = new Set(['smartclass_is_authenticated_v1', 'smartclass_current_session_v1']);
const marker = '__smartclass_turso_bridge_installed__';

type RemoteItem = { key: string; value: string };

export async function initializeTursoSync(): Promise<void> {
  if (typeof window === 'undefined' || (window as any)[marker]) return;
  (window as any)[marker] = true;

  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  let ready = false;
  let queue = Promise.resolve();

  const syncKey = (key: string, value: string) => {
    if (!ready || !key.startsWith(PREFIX) || LOCAL_ONLY.has(key)) return;
    queue = queue.then(() => fetch('/api/storage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }),
    })).then(async (response) => {
      if (!response.ok) throw new Error(`Turso sync failed (${response.status})`);
    }).catch((error) => console.warn('Không đồng bộ được Turso; dữ liệu vẫn còn trên trình duyệt này.', error));
  };

  Storage.prototype.setItem = function(key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (this === window.localStorage) syncKey(String(key), String(value));
  };
  Storage.prototype.removeItem = function(key: string) {
    originalRemoveItem.call(this, key);
    // Deletions are intentionally not propagated in this first migration version.
  };

  try {
    const response = await fetch('/api/storage', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Turso unavailable (${response.status})`);
    const data = await response.json() as { items?: RemoteItem[] };
    const remoteItems = Array.isArray(data.items) ? data.items : [];
    const remoteKeys = new Set(remoteItems.map((item) => item.key));

    // Remote values win for keys already present remotely. Local-only values are
    // uploaded to Turso, preserving existing browser data during first migration.
    for (const item of remoteItems) {
      if (item.key.startsWith(PREFIX) && !LOCAL_ONLY.has(item.key)) originalSetItem.call(window.localStorage, item.key, item.value);
    }
    const localPairs: Array<[string, string]> = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(PREFIX) || LOCAL_ONLY.has(key)) continue;
      const value = window.localStorage.getItem(key);
      if (value !== null && !remoteKeys.has(key)) localPairs.push([key, value]);
    }
    ready = true;
    for (const [key, value] of localPairs) syncKey(key, value);
  } catch (error) {
    ready = true;
    console.warn('Turso chưa kết nối được. Ứng dụng tiếp tục dùng dữ liệu localStorage.', error);
  }
}
