"use client";
import { useEffect, useState } from "react";
import { CHANGE_EVENT, Collection } from "@/lib/storage";
import { getFile } from "@/lib/idb";

/** Reactive view of a collection; re-renders whenever any data changes (same tab or other tabs). */
export function useCollection<T extends { id: string }>(c: Collection<T>): T[] {
  const [items, setItems] = useState<T[]>(() => c.all());
  useEffect(() => {
    const sync = () => setItems(c.all());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, [c]);
  return items;
}

/** Resolves an IndexedDB file key OR a Supabase Storage https:// URL to a usable URL.
 *  - If key starts with "https://" it is a Supabase Storage public URL → returned directly.
 *  - Otherwise treats key as an IndexedDB key and loads from IDB.
 */
export function useFileUrl(key?: string): { url?: string; type?: string; name?: string; loading: boolean } {
  const [state, setState] = useState<{ url?: string; type?: string; name?: string; loading: boolean }>({ loading: !!key });
  useEffect(() => {
    let revoked = false; let obj: string | undefined;
    if (!key) { setState({ loading: false }); return; }

    // Supabase Storage public URL — use directly, no IDB lookup needed
    if (key.startsWith("https://") || key.startsWith("http://")) {
      const ext = key.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
      const type = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
      const name = decodeURIComponent(key.split("/").pop()?.split("?")[0] ?? "document");
      setState({ url: key, type, name, loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));
    getFile(key).then((f) => {
      if (revoked) return;
      if (!f) { setState({ loading: false }); return; }
      obj = URL.createObjectURL(f.blob);
      setState({ url: obj, type: f.type, name: f.name, loading: false });
    });
    return () => { revoked = true; if (obj) URL.revokeObjectURL(obj); };
  }, [key]);
  return state;
}
