"use client";
import { useEffect, useState } from "react";
import { CHANGE_EVENT, Collection } from "@/lib/storage";
import { getFile } from "@/lib/idb";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** Reactive view of a collection; re-renders whenever any data changes (same tab or other tabs). */
export function useCollection<T extends { id: string }>(c: Collection<T>): T[] {
  const [items, setItems] = useState<T[]>(() => c.all());
  useEffect(() => {
    const sync = () => setItems(c.all());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [c]);
  return items;
}

/** Resolves an IndexedDB file key OR a Supabase Storage / data URL to a usable URL.
 *  - If key starts with "https://", "http://", or "data:", it is used directly.
 *  - Otherwise looks up key in IndexedDB.
 *  - If not found in IndexedDB, queries Supabase Storage for the uploaded file.
 */
export function useFileUrl(key?: string): { url?: string; type?: string; name?: string; loading: boolean } {
  const [state, setState] = useState<{ url?: string; type?: string; name?: string; loading: boolean }>({
    loading: !!key,
  });

  useEffect(() => {
    let revoked = false;
    let obj: string | undefined;

    if (!key) {
      setState({ loading: false });
      return;
    }

    // Direct HTTP, HTTPS, or Data URLs
    if (key.startsWith("https://") || key.startsWith("http://") || key.startsWith("data:")) {
      const isData = key.startsWith("data:");
      const ext = key.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
      const type = isData
        ? key.slice(5, key.indexOf(";"))
        : ext === "pdf"
        ? "application/pdf"
        : ext === "png"
        ? "image/png"
        : "image/jpeg";
      const name = isData
        ? "document"
        : decodeURIComponent(key.split("/").pop()?.split("?")[0] ?? "document");
      setState({ url: key, type, name, loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    // 1. Check IndexedDB
    getFile(key).then(async (f) => {
      if (revoked) return;
      if (f) {
        obj = URL.createObjectURL(f.blob);
        setState({ url: obj, type: f.type, name: f.name, loading: false });
        return;
      }

      // 2. Fallback to Supabase Storage lookup if not found in local IDB
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: list } = await supabase.storage.from("documents").list("uploads", { search: key });
          const match = list?.find((item) => item.name.includes(key));
          if (match && !revoked) {
            const { data } = supabase.storage.from("documents").getPublicUrl(`uploads/${match.name}`);
            if (data?.publicUrl) {
              const ext = match.name.split(".").pop()?.toLowerCase() ?? "";
              const type = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
              setState({
                url: data.publicUrl,
                type,
                name: match.name,
                loading: false,
              });
              return;
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (!revoked) {
        setState({ loading: false });
      }
    });

    return () => {
      revoked = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [key]);

  return state;
}
