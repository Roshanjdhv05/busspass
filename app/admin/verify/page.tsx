"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, CheckCircle2, ScanLine, SearchX, ShieldAlert, ShieldCheck } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { parsePassInput } from "@/lib/pass-tools";
import { Avatar, Button, Card, Input } from "@/components/ui";
import { daysLeft, fmtDate, passState, passTypeLabel, cn } from "@/lib/utils";
import type { IssuedPass } from "@/lib/types";

type Result = { kind: "valid" | "expired" | "revoked" | "notfound"; pass?: IssuedPass; query: string };

declare global { interface Window { BarcodeDetector?: new (o?: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } } }

export default function Verify() {
  const passes = useCollection(db.issuedPasses);
  const profiles = useCollection(db.studentProfiles);
  const routes = useCollection(db.busRoutes);
  const [value, setValue] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [cam, setCam] = useState(false);
  const [camErr, setCamErr] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  const verify = (raw: string) => {
    const id = parsePassInput(raw);
    if (!id) return;
    const pass = db.issuedPasses.get(id) ?? db.issuedPasses.all().find((p) => p.id.toUpperCase() === id);
    if (!pass) return setRes({ kind: "notfound", query: id });
    const s = passState(pass);
    setRes({ kind: s === "active" ? "valid" : s, pass, query: id });
  };

  useEffect(() => {
    if (!cam) return;
    let stream: MediaStream | undefined; let timer: number; let stopped = false;
    (async () => {
      try {
        if (!window.BarcodeDetector) { setCamErr("Live QR scanning isn't supported in this browser. Enter the pass ID instead."); setCam(false); return; }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
        const det = new window.BarcodeDetector!({ formats: ["qr_code"] });
        timer = window.setInterval(async () => {
          if (!video.current) return;
          try { const r = await det.detect(video.current); if (r[0]) { setValue(r[0].rawValue); verify(r[0].rawValue); setCam(false); } } catch { /* ignore frame */ }
        }, 400);
      } catch { setCamErr("Camera access was denied or is unavailable."); setCam(false); }
    })();
    return () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [cam]);

  const profile = profiles.find((p) => p.id === res?.pass?.studentProfileId);
  const route = routes.find((r) => r.id === res?.pass?.routeId);
  const TONES = {
    valid: { box: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", Icon: ShieldCheck, title: "Valid Pass" },
    expired: { box: "bg-red-50 border-red-200", text: "text-red-700", Icon: ShieldAlert, title: "Pass Expired" },
    revoked: { box: "bg-neutral-100 border-neutral-300", text: "text-neutral-700", Icon: ShieldAlert, title: "Pass Revoked" },
    notfound: { box: "bg-red-50 border-red-200", text: "text-red-700", Icon: SearchX, title: "Pass Not Found" },
  } as const;
  const tone = res ? TONES[res.kind] : undefined;
  const Icon = tone?.Icon;
  const samples = [passes.find((p) => passState(p) === "active"), passes.find((p) => passState(p) === "expired"), passes.find((p) => passState(p) === "revoked")].filter(Boolean) as IssuedPass[];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div><h1 className="text-2xl font-extrabold">QR Verification</h1><p className="text-sm text-ink-mute">Scan a pass QR code or enter the pass ID</p></div>
      <Card className="p-4">
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-forest-900">
          <video ref={video} className={cn("h-full w-full object-cover", !cam && "hidden")} muted playsInline />
          {!cam && <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/70"><ScanLine size={40} className="text-mint-300" /><span className="px-6 text-sm">Scan Bus Pass QR Code<br />or enter Pass ID below</span></div>}
          {["left-3 top-3 border-l-4 border-t-4 rounded-tl-xl", "right-3 top-3 border-r-4 border-t-4 rounded-tr-xl", "left-3 bottom-3 border-l-4 border-b-4 rounded-bl-xl", "right-3 bottom-3 border-r-4 border-b-4 rounded-br-xl"].map((c) => <span key={c} className={`absolute h-9 w-9 border-mint-300 ${c}`} />)}
          {cam && <motion.span className="absolute inset-x-6 h-0.5 bg-mint-300 shadow-[0_0_12px_#8FDDB6]" animate={{ top: ["15%", "85%", "15%"] }} transition={{ duration: 2.4, repeat: Infinity }} />}
        </div>
        <Button variant="secondary" full className="mt-3" onClick={() => { setCamErr(""); setCam((c) => !c); }}>{cam ? <><CameraOff size={16} /> Stop camera</> : <><Camera size={16} /> Scan with camera</>}</Button>
        {camErr && <p role="alert" className="mt-2 text-center text-xs font-medium text-orange-700">{camErr}</p>}
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); verify(value); }}>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter Pass ID e.g. BP20260002" aria-label="Pass ID" autoComplete="off" />
          <Button type="submit" className="h-12 px-5">Verify</Button>
        </form>
        {samples.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-mute">Try: {samples.map((s) => <button key={s.id} onClick={() => { setValue(s.id); verify(s.id); }} className="rounded-full bg-forest-50 px-2.5 py-1.5 font-semibold text-forest-700">{s.id} ({passState(s)})</button>)}</div>}
      </Card>

      <AnimatePresence mode="wait">
        {res && tone && Icon && (
          <motion.div key={res.query + res.kind} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className={cn("rounded-2xl border p-5", tone.box)} data-testid="verify-result" data-kind={res.kind}>
            <div className={cn("flex items-center gap-2 text-xl font-extrabold", tone.text)}><motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}><Icon size={28} /></motion.span>{tone.title}</div>
            {res.pass && profile ? (
              <div className="mt-4 flex items-start gap-3"><Avatar name={profile.fullName} fileKey={profile.photoKey} size={56} />
                <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  {[["Student", profile.fullName], ["Student ID", profile.studentId], ["Pass ID", res.pass.id], ["Route", route ? `${route.number} · ${route.start} → ${route.end}` : "—"], ["Pass type", passTypeLabel(res.pass.passType)], ["Valid till", fmtDate(res.pass.expiryDate)], ["Validity", res.kind === "valid" ? `${daysLeft(res.pass)} days left` : res.kind === "revoked" ? "Revoked" : "Expired"], ["Status", res.kind === "valid" ? "Active" : res.kind]].map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs text-ink-mute">{k}</dt><dd className="break-words font-semibold capitalize">{v}</dd></div>)}
                </dl></div>
            ) : <p className="mt-2 text-sm text-red-700">No issued pass matches “{res.query}”. Check the ID and try again.</p>}
            {res.kind === "valid" && <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} /> Passenger may board. (Demo verification)</div>}
          </motion.div>)}
      </AnimatePresence>
    </div>
  );
}
