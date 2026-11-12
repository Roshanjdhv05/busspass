"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bus, CalendarCheck } from "lucide-react";
import type { BusRoute, IssuedPass, StudentProfile } from "@/lib/types";
import { daysLeft, fmtDate, passState, passTypeLabel, cn } from "@/lib/utils";
import { qrDataUrl, qrPayload } from "@/lib/pass-tools";
import { Avatar, StatusBadge } from "./ui";

export function useQr(pass?: IssuedPass, profile?: StudentProfile, size = 300) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!pass) return;
    let live = true;
    qrDataUrl(qrPayload(pass, profile), size).then((u) => live && setUrl(u)).catch(() => {});
    return () => { live = false; };
  }, [pass, profile, size]);
  return url;
}

export function ValidityBar({ pass }: { pass: IssuedPass }) {
  const total = new Date(pass.expiryDate).getTime() - new Date(pass.issueDate).getTime();
  const used = Date.now() - new Date(pass.issueDate).getTime();
  const pct = Math.max(0, Math.min(100, 100 - (used / total) * 100));
  const st = passState(pass);
  const d = daysLeft(pass);
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-white/80">
        <span>{st === "active" ? `${d} day${d === 1 ? "" : "s"} left` : st === "revoked" ? "Revoked" : "Expired"}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.5 }}
          className={cn("h-full rounded-full", st !== "active" ? "bg-red-400" : d <= 7 ? "bg-orange-300" : "bg-mint-300")} />
      </div>
    </div>
  );
}

/** Premium digital pass. `compact` is the dashboard preview. */
export default function PassCard({ pass, profile, route, collegeName, compact }: { pass: IssuedPass; profile: StudentProfile; route?: BusRoute; collegeName: string; compact?: boolean }) {
  const qr = useQr(pass, profile, 260);
  const st = passState(pass);
  return (
    <motion.div
      initial={{ rotateX: -60, y: 30, opacity: 0 }} animate={{ rotateX: 0, y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 110 }} style={{ transformPerspective: 900, transformOrigin: "top" }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900 p-5 text-white shadow-lift">
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-mint-300/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-mint-300/5" />
      <motion.div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }} animate={{ x: "500%" }} transition={{ duration: 1.6, delay: 0.6, ease: "easeInOut" }} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-mint-300"><Bus size={13} /> Student bus pass</div>
          <div className="mt-1 truncate text-sm font-semibold text-white/90">{collegeName}</div>
        </div>
        <StatusBadge status={st} label={st === "active" ? "Active" : st === "revoked" ? "Revoked" : "Expired"} className="bg-white/95" />
      </div>

      <div className={cn("relative mt-4 flex gap-4", compact ? "items-center" : "items-start")}>
        <Avatar name={profile.fullName} fileKey={profile.photoKey} size={compact ? 56 : 72} className="rounded-2xl ring-white/30" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-extrabold leading-tight">{profile.fullName}</div>
          <div className="text-xs text-white/70">{profile.studentId} · {profile.course} {profile.year}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold">
            Route {route?.number ?? "—"} <span className="text-white/50">·</span> {passTypeLabel(pass.passType)}
          </div>
        </div>
        {!compact && (
          <div className="hidden shrink-0 rounded-xl bg-white p-1.5 xs:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt={`QR code for pass ${pass.id}`} className="h-[84px] w-[84px]" /> : <div className="h-[84px] w-[84px] animate-pulse bg-forest-50" />}
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2.5 text-sm font-semibold">
        <span className="truncate">{route?.start ?? "—"}</span><ArrowRight size={15} className="shrink-0 text-mint-300" /><span className="truncate">{route?.end ?? "—"}</span>
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-2 text-xs">
        <div><div className="text-white/55">Pass ID</div><div className="mt-0.5 truncate font-bold tracking-wide">{pass.id}</div></div>
        <div><div className="text-white/55">Issued</div><div className="mt-0.5 font-bold">{fmtDate(pass.issueDate, { day: "2-digit", month: "short", year: "2-digit" })}</div></div>
        <div><div className="text-white/55">Valid till</div><div className="mt-0.5 flex items-center gap-1 font-bold"><CalendarCheck size={12} className="text-mint-300" />{fmtDate(pass.expiryDate, { day: "2-digit", month: "short", year: "2-digit" })}</div></div>
      </div>
      <div className="relative mt-4"><ValidityBar pass={pass} /></div>
      {!compact && qr && (
        <div className="relative mt-4 flex justify-center xs:hidden"><div className="rounded-2xl bg-white p-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={qr} alt="QR code" className="h-36 w-36" /></div></div>
      )}
    </motion.div>
  );
}
