/**
 * Keeps the original book file in the browser (IndexedDB) so the learner can prepare more
 * vocabulary later without re-uploading. Nothing here ever leaves the device.
 */
const DB_NAME = "foreword-books";
const STORE_NAME = "files";
const DB_VERSION = 1;

interface StoredBookFile {
  contentHash: string;
  name: string;
  type: string;
  size: number;
  savedAt: number;
  blob: Blob;
}

function isAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

async function openDatabase(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "contentHash" });
      }
    };
    request.addEventListener("success", () => {
      resolve(request.result);
    });
    request.addEventListener("error", () => {
      reject(request.error ?? new Error("IndexedDB unavailable"));
    });
  });
}

/**
 * Run one request and settle only when its transaction does: a request "success" fires before
 * the commit, and quota failures for large files arrive later as a transaction abort.
 */
async function runTransaction<T>({
  mode,
  operation,
}: {
  mode: IDBTransactionMode;
  operation: (store: IDBObjectStore) => IDBRequest<T>;
}): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      transaction.addEventListener("complete", () => {
        resolve(request.result);
      });
      transaction.addEventListener("abort", () => {
        reject(transaction.error ?? request.error ?? new Error("IndexedDB transaction aborted"));
      });
      transaction.addEventListener("error", () => {
        reject(transaction.error ?? request.error ?? new Error("IndexedDB request failed"));
      });
    });
  } finally {
    db.close();
  }
}

export async function saveBookFile({
  contentHash,
  file,
}: {
  contentHash: string;
  file: File;
}): Promise<boolean> {
  if (!isAvailable()) {
    return false;
  }
  try {
    const record: StoredBookFile = {
      contentHash,
      name: file.name,
      type: file.type,
      size: file.size,
      savedAt: Date.now(),
      blob: file,
    };
    await runTransaction({ mode: "readwrite", operation: (store) => store.put(record) });
    return true;
  } catch {
    return false;
  }
}

export async function loadBookFile({ contentHash }: { contentHash: string }): Promise<File | null> {
  if (!isAvailable()) {
    return null;
  }
  try {
    const record = await runTransaction<StoredBookFile | undefined>({
      mode: "readonly",
      operation: (store) => store.get(contentHash) as IDBRequest<StoredBookFile | undefined>,
    });
    if (record == null) {
      return null;
    }
    return new File([record.blob], record.name, { type: record.type });
  } catch {
    return null;
  }
}

export async function hasBookFile({ contentHash }: { contentHash: string }): Promise<boolean> {
  if (!isAvailable()) {
    return false;
  }
  try {
    const count = await runTransaction<number>({
      mode: "readonly",
      operation: (store) => store.count(contentHash),
    });
    return count > 0;
  } catch {
    return false;
  }
}

export async function deleteBookFile({ contentHash }: { contentHash: string }): Promise<void> {
  if (!isAvailable()) {
    return;
  }
  try {
    await runTransaction({ mode: "readwrite", operation: (store) => store.delete(contentHash) });
  } catch {
    // Best effort; a stale cached file is harmless.
  }
}
