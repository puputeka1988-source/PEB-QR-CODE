import { writeBatch } from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null = null): void {
  if (isQuotaOrStreamError(error)) {
    setFirestoreDailyCooldown();
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Notice: ', JSON.stringify(errInfo));
}

// ---------------------------------------------------------------------------
// GLOBAL RESILIENT WRITE QUEUE & COOLDOWN CONTROLLER
// Prevents: "Write stream exhausted maximum allowed queued writes" & Quota limits
// ---------------------------------------------------------------------------
const COOLDOWN_KEY = 'qr_firestore_cooldown_until';

let globalCooldownUntil: number = (() => {
  try {
    const saved = localStorage.getItem(COOLDOWN_KEY);
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val > Date.now()) {
        return val;
      }
    }
  } catch (e) {}
  return 0;
})();

let pendingWriteCount = 0;
const MAX_CONCURRENT_PENDING = 3;

const isQuotaOrStreamError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err?.message || String(err)).toLowerCase();
  const code = (err?.code || '').toLowerCase();
  return (
    code.includes('resource-exhausted') ||
    code.includes('unavailable') ||
    code.includes('deadline-exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota') ||
    msg.includes('free daily write units') ||
    msg.includes('exhausted maximum allowed queued writes') ||
    msg.includes('maximum backoff delay') ||
    msg.includes('write stream') ||
    msg.includes('overloading the backend')
  );
};

export const isFirestoreThrottled = (): boolean => {
  return Date.now() < globalCooldownUntil;
};

export const setFirestoreCooldown = (minutes = 15): void => {
  globalCooldownUntil = Date.now() + minutes * 60 * 1000;
  try {
    localStorage.setItem(COOLDOWN_KEY, globalCooldownUntil.toString());
  } catch (e) {}
};

export const setFirestoreDailyCooldown = (): void => {
  // Set cooldown for 60 minutes minimum, or until next UTC midnight
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 5, 0));
  const diffMs = Math.max(60 * 60 * 1000, nextReset.getTime() - now.getTime());
  globalCooldownUntil = Date.now() + diffMs;
  try {
    localStorage.setItem(COOLDOWN_KEY, globalCooldownUntil.toString());
  } catch (e) {}
  console.info('[Firestore Storage] Kuota harian cloud tercapai. Sistem otomatis beroperasi penuh pada mode Penyimpanan Lokal Berkecepatan Tinggi (LocalStorage & Google Sheets).');
};

// Sequential queue promise chain to prevent parallel write floods
let queueChain: Promise<any> = Promise.resolve();

export async function safeFirestoreWrite(
  operation: () => Promise<any>,
  operationType: OperationType = OperationType.WRITE,
  path: string | null = null
): Promise<boolean> {
  // If Firestore is in backoff/quota cooldown, skip immediately and preserve locally
  if (isFirestoreThrottled()) {
    return false;
  }

  // Prevent overflowing internal SDK write stream queue
  if (pendingWriteCount >= MAX_CONCURRENT_PENDING) {
    return false;
  }

  pendingWriteCount++;

  return new Promise<boolean>((resolve) => {
    queueChain = queueChain
      .then(async () => {
        if (isFirestoreThrottled()) {
          resolve(false);
          return;
        }
        try {
          await operation();
          // Small breathing room between individual writes
          await new Promise(r => setTimeout(r, 80));
          resolve(true);
        } catch (err: any) {
          if (isQuotaOrStreamError(err)) {
            setFirestoreDailyCooldown();
          } else {
            handleFirestoreError(err, operationType, path);
          }
          resolve(false);
        }
      })
      .catch(() => {
        resolve(false);
      })
      .finally(() => {
        pendingWriteCount = Math.max(0, pendingWriteCount - 1);
      });
  });
}

export async function executeChunkedBatch<T>(
  items: T[],
  operation: (batch: ReturnType<typeof writeBatch>, item: T) => void,
  chunkSize = 30,
  path: string | null = null
): Promise<void> {
  if (!items || items.length === 0 || isFirestoreThrottled()) return;

  const total = items.length;
  for (let i = 0; i < total; i += chunkSize) {
    if (isFirestoreThrottled()) break;

    const chunk = items.slice(i, i + chunkSize);
    try {
      const batch = writeBatch(db);
      chunk.forEach(item => operation(batch, item));
      await batch.commit();
      
      // Pause between batches to allow WebChannel write stream to drain
      if (i + chunkSize < total) {
        await new Promise(r => setTimeout(r, 120));
      }
    } catch (err: any) {
      if (isQuotaOrStreamError(err)) {
        setFirestoreDailyCooldown();
        break;
      } else {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      break;
    }
  }
}
