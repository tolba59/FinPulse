import { WatchlistItem } from '../types';

const STORAGE_KEY_SYNC_CODE = 'finpulse_sync_code';
const STORAGE_KEY_LAST_SYNCED = 'finpulse_last_synced_time';

export function getSavedSyncCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_SYNC_CODE);
  } catch {
    return null;
  }
}

export function saveSyncCode(code: string | null) {
  try {
    if (code) {
      localStorage.setItem(STORAGE_KEY_SYNC_CODE, code.toUpperCase().trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_SYNC_CODE);
      localStorage.removeItem(STORAGE_KEY_LAST_SYNCED);
    }
  } catch (err) {
    console.error('Failed to save sync code to localStorage:', err);
  }
}

export function getLastSyncedTime(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SYNCED);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function setLastSyncedTime(time: number) {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SYNCED, time.toString());
  } catch {
    // Ignore
  }
}

export function generateRandomSyncCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `EUR-${num}`;
}

export async function pushWatchlistToCloud(
  code: string,
  watchlist: WatchlistItem[]
): Promise<{ success: boolean; updatedAt?: number; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { success: false, error: 'Invalid sync code' };

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: cleanCode,
        watchlist,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const updatedAt = data.updatedAt || Date.now();
      saveSyncCode(cleanCode);
      setLastSyncedTime(updatedAt);
      return { success: true, updatedAt };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || `Upload failed with status ${res.status}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function pullWatchlistFromCloud(
  code: string
): Promise<{ success: boolean; watchlist?: WatchlistItem[]; updatedAt?: number; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return { success: false, error: 'Invalid sync code' };

  try {
    const res = await fetch(`/api/sync?code=${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.watchlist)) {
        saveSyncCode(cleanCode);
        if (data.updatedAt) setLastSyncedTime(data.updatedAt);
        return {
          success: true,
          watchlist: data.watchlist,
          updatedAt: data.updatedAt,
        };
      }
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || `No portfolio found for code "${cleanCode}"`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
