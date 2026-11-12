"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, Replace, UploadCloud, X } from "lucide-react";
import { compressImage, deleteFile, putFile } from "@/lib/idb";
import { useFileUrl } from "@/hooks/useData";
import { uid } from "@/lib/storage";
import { cn } from "@/lib/utils";

const MAX = 5 * 1024 * 1024;

export function FileDrop({ label, hint, accept, value, onChange, error, imageOnly }: {
  label: string; hint: string; accept: string; value?: string; onChange: (key?: string) => void; error?: string; imageOnly?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const { url, type, name, loading } = useFileUrl(value);
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const pick = async (f?: File) => {
    if (!f) return;
    setLocalErr("");
    const okType = imageOnly ? f.type.startsWith("image/") : f.type.startsWith("image/") || f.type === "application/pdf";
    if (!okType) return setLocalErr(imageOnly ? "Please choose a JPG or PNG image." : "Only JPG, PNG or PDF files are allowed.");
    if (f.size > MAX) return setLocalErr("File is larger than 5 MB.");
    setBusy(true);
    try {
      const blob = await compressImage(f);
      const key = uid("file");
      await putFile(key, blob, f.name);
      if (value) await deleteFile(value);
      onChange(key);
    } catch { setLocalErr("Could not save the file in your browser storage."); }
    setBusy(false);
  };

  const isImg = type?.startsWith("image/");
  const err = localErr || error;
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={cn("flex items-center gap-3 rounded-2xl border border-dashed bg-white p-3 transition", err ? "border-red-400" : value ? "border-forest-400 bg-mint-50/60" : "border-forest-200 hover:border-forest-400")}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-forest-50 text-forest-600">
          {busy || loading ? <Loader2 className="animate-spin" size={22} /> : url && isImg ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={label} className="h-full w-full object-cover" /> : value ? <FileText size={26} /> : <UploadCloud size={26} />}
        </div>
        <div className="min-w-0 flex-1">
          {value ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="flex items-center gap-1 text-sm font-semibold text-forest-700"><CheckCircle2 size={15} /> Uploaded</div><div className="truncate text-xs text-ink-mute">{name ?? "file"}</div></motion.div>
          ) : (<><div className="text-sm font-semibold">Tap to upload</div><div className="text-xs text-ink-mute">{hint}</div></>)}
        </div>
        <input ref={ref} type="file" accept={accept} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} aria-label={label} />
        {value ? (
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => ref.current?.click()} aria-label="Replace file" className="flex h-10 w-10 items-center justify-center rounded-xl text-forest-700 hover:bg-forest-50"><Replace size={18} /></button>
            <button type="button" onClick={() => { deleteFile(value); onChange(undefined); }} aria-label="Remove file" className="flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50"><X size={18} /></button>
          </div>
        ) : (
          <button type="button" onClick={() => ref.current?.click()} className="h-10 shrink-0 rounded-xl bg-forest-700 px-3.5 text-sm font-semibold text-white">Upload</button>
        )}
      </div>
      {err && <div role="alert" className="mt-1 text-xs font-medium text-red-600">{err}</div>}
    </div>
  );
}
