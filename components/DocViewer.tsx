"use client";
import { FileText, ImageOff } from "lucide-react";
import { useFileUrl } from "@/hooks/useData";

export function DocThumb({ label, fileKey }: { label: string; fileKey?: string }) {
  const { url, type, name, loading } = useFileUrl(fileKey);
  const img = type?.startsWith("image/");
  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs font-semibold text-ink-mute">{label}</div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-forest-100 bg-forest-50" aria-label={`Open ${label}`}>
          {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={label} className="h-28 w-full object-cover transition group-hover:scale-105" />
            : <div className="flex h-28 flex-col items-center justify-center gap-1 text-forest-600"><FileText size={28} /><span className="max-w-full truncate px-2 text-xs">{name}</span></div>}
        </a>
      ) : (
        <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-forest-100 bg-cream text-xs text-ink-mute">
          <ImageOff size={20} />{loading ? "Loading…" : fileKey ? "File unavailable" : "Not provided (demo record)"}
        </div>
      )}
    </div>
  );
}
