"use client";
import { useState } from "react";
import { Download, FileText, ImageOff, Maximize2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useFileUrl } from "@/hooks/useData";

export function DocThumb({
  label,
  fileKey,
}: {
  label: string;
  fileKey?: string;
}) {
  const { url, type, name, loading } = useFileUrl(fileKey);
  const [open, setOpen] = useState(false);
  const isImg = type?.startsWith("image/") || (url && !type?.includes("pdf"));

  return (
    <>
      <div className="min-w-0">
        <div className="mb-1 text-xs font-semibold text-ink-mute flex items-center justify-between">
          <span className="truncate">{label}</span>
          {url && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-forest-700 hover:text-forest-900"
              title="View Full"
            >
              <Maximize2 size={12} />
            </button>
          )}
        </div>
        {url ? (
          <div
            onClick={() => setOpen(true)}
            role="button"
            tabIndex={0}
            className="group relative block cursor-pointer overflow-hidden rounded-xl border border-forest-100 bg-forest-50 transition hover:shadow-md"
          >
            {isImg ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={url}
                alt={label}
                className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-28 flex-col items-center justify-center gap-1 text-forest-600">
                <FileText size={28} />
                <span className="max-w-full truncate px-2 text-xs">{name ?? label}</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-forest-950/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-forest-800">
                View
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-forest-100 bg-cream text-xs text-ink-mute">
            <ImageOff size={20} />
            {loading ? "Loading…" : fileKey ? "Document on file" : "Not provided"}
          </div>
        )}
      </div>

      {open && url && (
        <DocViewer
          fileKey={fileKey || ""}
          label={label}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Full-screen document viewer modal
export function DocViewer({
  fileKey,
  label,
  onClose,
}: {
  fileKey: string;
  label: string;
  onClose: () => void;
}) {
  const { url, type, name } = useFileUrl(fileKey);
  const isImg = type?.startsWith("image/") || (url && !type?.includes("pdf"));
  const isPdf = type === "application/pdf" || (url?.toLowerCase().endsWith(".pdf") ?? false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex flex-col bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/60">{label}</div>
          <div className="text-sm font-bold text-white">{name ?? label}</div>
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <Download size={14} /> Open / Save
            </a>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        {isImg && url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        )}
        {isPdf && url && (
          <iframe
            src={url}
            title={label}
            className="h-full w-full max-w-4xl rounded-xl bg-white"
            style={{ minHeight: "75vh" }}
          />
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
