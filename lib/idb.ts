"use client";
// Minimal IndexedDB wrapper for binary files (photos, documents).
const DB_NAME = "bpms-files";
const STORE = "files";

export interface StoredFile { key: string; blob: Blob; name: string; type: string; size: number; savedAt: string }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then((d) => new Promise<T>((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    t.oncomplete = () => d.close();
  }));
}

export async function putFile(key: string, blob: Blob, name = "file"): Promise<void> {
  const rec: StoredFile = { key, blob, name, type: blob.type, size: blob.size, savedAt: new Date().toISOString() };
  await tx("readwrite", (s) => s.put(rec));
}
export async function getFile(key: string): Promise<StoredFile | undefined> {
  try { return (await tx<StoredFile | undefined>("readonly", (s) => s.get(key))) ?? undefined; } catch { return undefined; }
}
export async function deleteFile(key: string): Promise<void> {
  try { await tx("readwrite", (s) => s.delete(key)); } catch { /* ignore */ }
}
export async function clearFiles(): Promise<void> {
  try { await tx("readwrite", (s) => s.clear()); } catch { /* ignore */ }
}

/** Downscale an image to keep IndexedDB lean. PDFs/other files are returned untouched. */
export async function compressImage(file: File, max = 900, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b || file), "image/jpeg", quality));
  } catch {
    return file;
  }
}
