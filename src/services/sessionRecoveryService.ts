import type { EditorObject } from '../types/editor';
import type { PageModel } from '../types/pdf';

export interface RecoverySession {
  id: string;
  title: string;
  timestamp: number;
  pages: PageModel[];
  objectsByPage: Record<string, EditorObject[]>;
  pdfBytes?: Uint8Array;
}

export interface RecoverySessionMeta {
  id: string;
  title: string;
  timestamp: number;
  pageCount: number;
  objectCount: number;
}

const DB_NAME = 'paperforge_recovery_db';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a session snapshot to IndexedDB.
 */
export async function saveRecoverySession(session: RecoverySession): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(session);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save recovery session to IndexedDB:', err);
  }
}

/**
 * Lists metadata of stored recovery sessions.
 */
export async function listRecoverySessions(): Promise<RecoverySessionMeta[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const sessions: RecoverySession[] = req.result || [];
        const metaList: RecoverySessionMeta[] = sessions
          .map((s) => ({
            id: s.id,
            title: s.title,
            timestamp: s.timestamp,
            pageCount: s.pages.length,
            objectCount: Object.values(s.objectsByPage).reduce((acc, arr) => acc + arr.length, 0),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        resolve(metaList);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Restores a specific session by ID.
 */
export async function restoreRecoverySession(id: string): Promise<RecoverySession | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Deletes a session by ID.
 */
export async function deleteRecoverySession(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete recovery session:', err);
  }
}

/**
 * Clears all stored recovery sessions.
 */
export async function clearAllRecoverySessions(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear recovery sessions:', err);
  }
}
