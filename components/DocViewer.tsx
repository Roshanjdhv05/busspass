"use client";
import { FileText, ImageOff, X } from "lucide-react";
import { motion } from "framer-motion";
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

// Full-screen document viewer modal
export function DocViewer({ fileKey, label, onClose }: { fileKey: string; label: string; onClose: () => void }) {
  const { url, type, name } = useFileUrl(fileKey);
  const isImg = type?.startsWith("image/");
  const isPdf = type === "application/pdf";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/60">{label}</div>
          {name && <div className="text-sm font-semibold text-white">{name}</div>}
        </div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        {isImg && url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
        )}
        {isPdf && url && (
          <iframe src={url} title={label} className="h-full w-full rounded-xl bg-white" style={{ minHeight: "70vh" }} />
        )}
        {!url && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <FileText size={48} />
            <div className="text-sm">Document not available</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
