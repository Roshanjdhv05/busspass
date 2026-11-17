"use client";
import { useState } from "react";
import { CheckCircle2, Clock, ExternalLink, FileText, ScanSearch, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Button, Field, StatusBadge, Textarea } from "./ui";
import { DocViewer, DocThumb } from "./DocViewer";
import { db } from "@/lib/storage";
import { approveApplication, rejectApplication, startReview } from "@/lib/services";
import { useToast } from "@/hooks/useToast";
import { fmtDateTime, passTypeLabel } from "@/lib/utils";
import type { Application } from "@/lib/types";

interface Props { id: string | null; onClose: () => void; }

export default function ApplicationDetail({ id, onClose }: Props) {
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [docView, setDocView] = useState<{ fileKey: string; label: string } | null>(null);

  const a: Application | undefined = id ? db.applications.get(id) : undefined;
  const profile = a ? db.studentProfiles.get(a.studentProfileId) : undefined;
  const route = a ? db.busRoutes.get(a.routeId) : undefined;
  const stop = a ? db.busStops.get(a.stopId) : undefined;

  const close = () => { setRejecting(false); setReason(""); setErr(""); onClose(); };

  if (!id || !a) return null;

  const canDecide = a.status === "pending" || a.status === "under_review";

  const approve = () => {
    try {
      const p = approveApplication(a.id);
      toast(`✅ Approved — Pass ${p.id} issued`);
      close();
    } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); }
  };

  const reject = () => {
    if (reason.trim().length < 5) return setErr("Please give a clear reason (at least 5 characters).");
    rejectApplication(a.id, reason);
    toast("Application rejected");
    close();
  };

  const docs = [
    { label: "Passport Photo", key: a.documents.photo ?? profile?.photoKey },
    { label: "Student ID Card", key: a.documents.studentIdCard ?? profile?.idCardKey },
    { label: "Admission / Bonafide", key: a.documents.admissionProof ?? profile?.admissionKey },
    { label: "Aadhar Card", key: profile?.aadharKey },
    { label: "PAN Card", key: profile?.panKey },
  ].filter((d) => d.key);

  return (
    <>
      {/* Full-screen slide-in panel */}
      <AnimatePresence>
        {id && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={close}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl sm:max-w-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-forest-50 px-5 py-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Application</div>
                  <div className="text-lg font-extrabold">{a.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-ink-soft hover:bg-forest-100">
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {/* Student header */}
                <div className="flex items-center gap-4 rounded-2xl bg-forest-50 p-4">
                  <Avatar name={a.fullName} fileKey={profile?.photoKey ?? a.documents.photo} size={64} className="ring-2 ring-forest-200" />
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-extrabold">{a.fullName}</div>
                    <div className="text-sm text-ink-mute">{a.studentId} · {a.course} {a.year}</div>
                    <div className="text-xs text-ink-mute">{a.college}</div>
                  </div>
                </div>

                {/* Application details */}
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-mute">Application Details</div>
                  <div className="rounded-2xl border border-forest-100 divide-y divide-forest-50 overflow-hidden">
                    {[
                      ["Mobile", a.mobile],
                      ["Email", a.email],
                      ["Route", route ? `Route ${route.number} — ${route.name}` : "—"],
                      ["From → To", `${a.startPoint} → ${a.destination}`],
                      ["Preferred stop", stop?.name ?? "—"],
                      ["Pass type", passTypeLabel(a.passType)],
                      ["Submitted", fmtDateTime(a.submittedAt)],
                      ...(a.passId ? [["Pass issued", a.passId]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="text-ink-mute shrink-0">{k}</span>
                        <span className="font-semibold text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-mute">
                    Documents ({docs.length} uploaded)
                  </div>
                  {docs.length === 0 ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700 flex items-center gap-2">
                      <FileText size={16} /> No documents uploaded by student.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {docs.map((d) => (
                        <button
                          key={d.label}
                          onClick={() => d.key && setDocView({ fileKey: d.key, label: d.label })}
                          className="group relative flex flex-col items-center gap-1.5 rounded-2xl border border-forest-100 bg-white p-2 hover:border-forest-400 hover:bg-forest-50 transition"
                        >
                          <DocThumb label={d.label} fileKey={d.key} />
                          <span className="text-[10px] font-semibold text-ink-mute text-center leading-tight">{d.label}</span>
                          <span className="absolute right-1.5 top-1.5 hidden rounded-full bg-forest-700 p-0.5 text-white group-hover:flex">
                            <ExternalLink size={9} />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rejection reason */}
                {a.status === "rejected" && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div className="font-bold mb-1">Rejection reason</div>
                    {a.rejectionReason}
                  </div>
                )}

                {/* Reject form */}
                <AnimatePresence>
                  {rejecting && (
                    <motion.div key="rform" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <Field label="Rejection reason (shown to student)" error={err}>
                        <Textarea autoFocus value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} invalid={!!err} placeholder="e.g. Student ID card image is blurry, please upload a clear scan." />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timeline */}
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-mute">Timeline</div>
                  <ul className="space-y-2">
                    {a.timeline.map((t, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-forest-50 px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="shrink-0 text-forest-500" />
                          <span className="font-semibold">{t.label}</span>
                        </div>
                        <span className="text-xs text-ink-mute whitespace-nowrap">{fmtDateTime(t.at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sticky action footer */}
              {canDecide && (
                <div className="border-t border-forest-50 bg-white px-5 py-4 space-y-2.5">
                  {rejecting ? (
                    <div className="flex gap-2.5">
                      <Button variant="secondary" full onClick={() => setRejecting(false)}>Cancel</Button>
                      <Button variant="danger" full onClick={reject}><XCircle size={16} /> Confirm Rejection</Button>
                    </div>
                  ) : (
                    <>
                      <Button full onClick={approve} className="bg-forest-700 hover:bg-forest-800 text-white shadow-lift">
                        <CheckCircle2 size={18} /> Approve & Issue Pass
                      </Button>
                      <div className="flex gap-2.5">
                        {a.status === "pending" && (
                          <Button variant="secondary" full onClick={() => { startReview(a.id); toast("Marked as under review", "info"); }}>
                            <ScanSearch size={16} /> Mark Under Review
                          </Button>
                        )}
                        <Button variant="secondary" full className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setRejecting(true)}>
                          <XCircle size={16} /> Reject
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Document full-view modal */}
      {docView && (
        <DocViewer fileKey={docView.fileKey} label={docView.label} onClose={() => setDocView(null)} />
      )}
    </>
  );
}
