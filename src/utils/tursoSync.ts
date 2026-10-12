/** Sync SmartClass local data with the authenticated, role-filtered Turso API. */
const PREFIX = 'smartclass_';
const LOCAL_ONLY = new Set(['smartclass_is_authenticated_v1', 'smartclass_current_session_v1', 'smartclass_active_class_id_v1']);
const marker = '__smartclass_turso_bridge_installed__';
type RemoteItem = { key: string; value: string };

export async function initializeTursoSync(): Promise<void> {
  if (typeof window === 'undefined') return;
  const w = window as Window & { [marker]?: boolean; __smartclass_poll__?: number };
  if (w[marker]) return;
  w[marker] = true;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  let ready = false;
  let queue = Promise.resolve();
  const syncKey = (key: string, value: string) => {
    if (!ready || !key.startsWith(PREFIX) || LOCAL_ONLY.has(key)) return;
    queue = queue.then(() => fetch('/api/storage', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value, classId: window.localStorage.getItem('smartclass_active_class_id_v1') || undefined }) }))
      .then(async response => { if (!response.ok) throw new Error(`Turso sync denied (${response.status})`); })
      .catch(error => console.warn('Không đồng bộ được dữ liệu lên Turso.', error));
  };
  Storage.prototype.setItem = function(key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (this === window.localStorage) syncKey(String(key), String(value));
  };
  Storage.prototype.removeItem = function(key: string) { originalRemoveItem.call(this, key); };

  const pull = async (initial = false) => {
    const response = await fetch(`/api/storage?classId=${encodeURIComponent(window.localStorage.getItem('smartclass_active_class_id_v1') || '')}`, { cache: 'no-store', credentials: 'same-origin' });
    if (response.status === 401) { ready = false; return; }
    if (!response.ok) throw new Error(`Turso unavailable (${response.status})`);
    const data = await response.json() as { items?: RemoteItem[] };
    let changed = false;
    const remoteItems = Array.isArray(data.items) ? data.items : [];
    const remoteKeys = new Set(remoteItems.map(item => item.key));
    for (const item of remoteItems) {
      if (!item.key.startsWith(PREFIX) || LOCAL_ONLY.has(item.key)) continue;
      if (window.localStorage.getItem(item.key) !== item.value) { originalSetItem.call(window.localStorage, item.key, item.value); changed = true; }
    }
    if (initial) {
      const localPairs: Array<[string, string]> = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(PREFIX) || LOCAL_ONLY.has(key) || remoteKeys.has(key)) continue;
        const value = window.localStorage.getItem(key); if (value !== null) localPairs.push([key, value]);
      }
      ready = true;
      for (const [key, value] of localPairs) syncKey(key, value);
    }
    if (changed) window.dispatchEvent(new Event('smartclass-cloud-ready'));
  };
  try { await pull(true); } catch (error) { ready = true; console.warn('Turso chưa kết nối được; dữ liệu cục bộ vẫn được giữ.', error); }
  w.__smartclass_poll__ = window.setInterval(() => { void pull(false).catch(error => console.warn('Lỗi làm mới dữ liệu Turso', error)); }, 10000);
}
