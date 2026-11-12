"use client";
import { forwardRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bus, Loader2, X } from "lucide-react";
import { cn, initials, statusLabel } from "@/lib/utils";
import type { AppStatus } from "@/lib/types";
import { useFileUrl } from "@/hooks/useData";

// ---------------------------------------------------------------- Button
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "mint";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  full?: boolean;
};
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", loading, full, className, children, disabled, ...rest }, ref) {
  const v = {
    primary: "bg-forest-700 text-white hover:bg-forest-800 shadow-soft",
    secondary: "bg-white text-forest-700 border border-forest-100 hover:bg-forest-50",
    ghost: "text-forest-700 hover:bg-forest-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    mint: "bg-mint-300 text-forest-900 hover:bg-mint-400",
  }[variant];
  const s = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-5 text-base" }[size];
  return (
    <motion.button ref={ref as never} whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }} disabled={disabled || loading}
      className={cn("inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-w-[44px]", v, s, full && "w-full", className)}
      {...(rest as object)}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </motion.button>
  );
});

// ---------------------------------------------------------------- Badge
const statusStyle: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-orange-50 text-orange-700 ring-orange-200",
  under_review: "bg-sky-50 text-sky-700 ring-sky-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  expired: "bg-red-50 text-red-700 ring-red-200",
  revoked: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  expiring: "bg-amber-50 text-amber-700 ring-amber-200",
};
export function StatusBadge({ status, label, className }: { status: AppStatus | "active" | "expired" | "revoked" | "expiring"; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset", statusStyle[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? (status in statusLabel ? statusLabel[status as AppStatus] : status)}
    </span>
  );
}

// ---------------------------------------------------------------- Avatar
export function Avatar({ name, fileKey, size = 40, className }: { name: string; fileKey?: string; size?: number; className?: string }) {
  const { url } = useFileUrl(fileKey);
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-bold text-white ring-2 ring-white", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

// ---------------------------------------------------------------- Photo with graceful fallback
const PHOTOS = {
  hero: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=70",
  bus: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=70",
  city: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1400&q=70",
  road: "https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&w=1000&q=70",
};
export function BusPhoto({ kind = "bus", className, children }: { kind?: keyof typeof PHOTOS; className?: string; children?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-forest-700 via-forest-600 to-forest-800", className)}>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={PHOTOS[kind]} alt="City bus on a Mumbai road" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {failed && <Bus className="absolute right-4 top-1/2 -translate-y-1/2 text-white/15" size={120} strokeWidth={1} />}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- Forms
export const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    {error && <span role="alert" className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
  </label>
);
const inputCls = "h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink-mute/70 focus:border-forest-500 focus:ring-4 focus:ring-forest-100 disabled:bg-neutral-50";
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...p }, ref) {
  return <input ref={ref} className={cn(inputCls, invalid ? "border-red-400" : "border-forest-100", className)} {...p} />;
});
export function Select({ className, invalid, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select className={cn(inputCls, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237B8680%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", invalid ? "border-red-400" : "border-forest-100", className)} {...p}>{children}</select>;
}
export function Textarea({ className, invalid, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={cn(inputCls, "h-auto min-h-[96px] py-3", invalid ? "border-red-400" : "border-forest-100", className)} {...p} />;
}

// ---------------------------------------------------------------- Modal / sheet
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-forest-900/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={cn("relative flex max-h-[100dvh] w-full flex-col bg-white shadow-lift max-sm:h-[100dvh] sm:max-h-[90vh] sm:rounded-3xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
            <div className="flex items-center justify-between border-b border-forest-50 px-5 py-4">
              <h2 className="text-lg font-bold text-ink">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-forest-50"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-forest-50 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger, onConfirm, onClose }: { open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></>}>
      <p className="text-sm text-ink-soft">{message}</p>
    </Modal>
  );
}

// ---------------------------------------------------------------- Misc
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-forest-100/60", className)} />;
}
export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-28" /><Skeleton className="h-40" /><Skeleton className="h-24" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: React.ElementType; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-mint-100 text-forest-600">
        <span className="absolute inset-0 animate-ping rounded-full bg-mint-200/50 [animation-duration:2.6s]" />
        <Icon size={32} className="relative" />
      </motion.div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-xs text-sm text-ink-mute">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-forest-50 bg-white shadow-soft", className)} {...p}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now(); const dur = 700;
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / dur); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{n.toLocaleString("en-IN")}</span>;
}

export function Logo({ light, size = 36 }: { light?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div style={{ width: size, height: size }} className={cn("flex items-center justify-center rounded-xl", light ? "bg-white/15 text-white" : "bg-forest-700 text-mint-200")}>
        <Bus size={size * 0.55} />
      </div>
      <div className="leading-tight">
        <div className={cn("text-[15px] font-extrabold", light ? "text-white" : "text-forest-800")}>Bus Pass</div>
        <div className={cn("text-[10px] font-semibold uppercase tracking-wider", light ? "text-mint-200" : "text-ink-mute")}>Management System</div>
      </div>
    </div>
  );
}
