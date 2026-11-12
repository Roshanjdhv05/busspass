"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Check, Clock, FileSearch, RotateCcw, Ticket, X } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { Button, Card, EmptyState, StatusBadge } from "@/components/ui";
import { DocThumb } from "@/components/DocViewer";
import { cn, fmtDateTime, passTypeLabel } from "@/lib/utils";

type StepState = "done" | "current" | "todo" | "failed";

export default function Tracking() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { apps, routes, stops } = useStudent();
  const a = apps.find((x) => x.id === id);
  if (!a) return <Card><EmptyState icon={FileSearch} title="Application not found" action={<Link href="/student/applications"><Button>Back to applications</Button></Link>} /></Card>;
  const r = routes.find((x) => x.id === a.routeId);
  const stop = stops.find((s) => s.id === a.stopId);
  const ev = (k: string) => a.timeline.find((t) => t.key === k);
  const decided = a.status === "approved" || a.status === "rejected";
  const steps: { label: string; at?: string; state: StepState; note?: string }[] = [
    { label: "Application submitted", at: ev("submitted")?.at, state: "done", note: "We received your application." },
    { label: "Documents under review", at: ev("review")?.at, state: ev("review") ? "done" : "current", note: ev("review") ? "Documents are being verified by the transport office." : "Waiting for the transport office to start review." },
    a.status === "rejected" ? { label: "Application rejected", at: ev("rejected")?.at, state: "failed", note: a.rejectionReason }
      : { label: "Application approved", at: ev("approved")?.at, state: a.status === "approved" ? "done" : ev("review") ? "current" : "todo", note: a.status === "approved" ? "Your application has been approved." : "Decision pending." },
    { label: "Bus pass generated", at: ev("pass")?.at, state: a.passId ? "done" : "todo", note: a.passId ? `Pass ${a.passId} is ready.` : a.status === "rejected" ? "No pass issued." : "Your digital pass appears here once approved." },
  ];
  const tone = (s: StepState) => s === "done" ? "bg-forest-600 text-white" : s === "failed" ? "bg-red-600 text-white" : s === "current" ? "border-2 border-orange-400 bg-orange-50 text-orange-600" : "border-2 border-forest-100 bg-white text-ink-mute";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2"><button onClick={() => router.push("/student/applications")} aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-forest-50"><ArrowLeft size={20} /></button><h1 className="text-xl font-extrabold">Application Tracking</h1></div>
      <Card className="mb-5 p-4">
        <div className="flex items-center justify-between"><div><div className="text-xs font-semibold uppercase text-ink-mute">Application ID</div><div className="text-xl font-extrabold tracking-wide" data-testid="tracking-id">{a.id}</div></div><StatusBadge status={a.status} /></div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-ink-mute">Route</dt><dd className="font-semibold">{r?.number} · {a.startPoint} → {a.destination}</dd></div>
          <div><dt className="text-xs text-ink-mute">Pass type</dt><dd className="font-semibold">{passTypeLabel(a.passType)}</dd></div>
          <div><dt className="text-xs text-ink-mute">Preferred stop</dt><dd className="font-semibold">{stop?.name ?? "—"}</dd></div>
          <div><dt className="text-xs text-ink-mute">Submitted</dt><dd className="font-semibold">{fmtDateTime(a.submittedAt)}</dd></div>
        </dl>
      </Card>

      <ol className="relative ml-1 space-y-0">
        {steps.map((s, i) => (
          <motion.li key={s.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span className={cn("absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5", s.state === "done" ? "bg-forest-500" : "bg-forest-100")} />}
            <motion.span layout className={cn("z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tone(s.state))}>
              {s.state === "done" ? <Check size={17} /> : s.state === "failed" ? <X size={17} /> : s.state === "current" ? <Clock size={16} className="animate-pulse" /> : <span className="h-2 w-2 rounded-full bg-forest-200" />}
            </motion.span>
            <div className="min-w-0 flex-1 pt-0.5"><div className={cn("font-bold", s.state === "todo" && "text-ink-mute")}>{s.label}</div>
              {s.at && <div className="text-xs text-ink-mute">{fmtDateTime(s.at)}</div>}
              {s.note && <div className={cn("mt-1 text-sm", s.state === "failed" ? "rounded-xl bg-red-50 px-3 py-2 font-medium text-red-700" : "text-ink-soft")}>{s.note}</div>}</div>
          </motion.li>
        ))}
      </ol>

      {a.status === "approved" && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 rounded-2xl bg-mint-100 p-4"><div className="font-bold text-forest-800">Your bus pass is ready!</div><div className="text-sm text-forest-700">Check it in the My Pass section.</div><Link href="/student/pass" className="mt-3 block"><Button full><Ticket size={16} /> View my pass</Button></Link></motion.div>}
      {a.status === "rejected" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4"><div className="flex items-center gap-2 font-bold text-red-800"><AlertTriangle size={18} /> Why it was rejected</div><p className="mt-1 text-sm text-red-700">{a.rejectionReason}</p>
          <Link href={`/student/apply?resubmit=${a.id}`} className="mt-3 block"><Button full variant="danger"><RotateCcw size={16} /> Correct & resubmit</Button></Link></div>
      )}
      {!decided && <p className="mt-6 text-center text-xs text-ink-mute">Reviews usually take up to 2 working days. You&apos;ll be notified here.</p>}

      <h2 className="mb-2 mt-8 text-base font-bold">Submitted documents</h2>
      <div className="grid grid-cols-3 gap-3"><DocThumb label="Student ID" fileKey={a.documents.studentIdCard} /><DocThumb label="Admission proof" fileKey={a.documents.admissionProof} /><DocThumb label="Photo" fileKey={a.documents.photo} /></div>
    </div>
  );
}
