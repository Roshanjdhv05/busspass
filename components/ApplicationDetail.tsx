"use client";
import { useState } from "react";
import { CheckCircle2, ScanSearch, XCircle } from "lucide-react";
import { Avatar, Button, Field, Modal, StatusBadge, Textarea } from "./ui";
import { DocThumb } from "./DocViewer";
import { db } from "@/lib/storage";
import { approveApplication, rejectApplication, startReview } from "@/lib/services";
import { useToast } from "@/hooks/useToast";
import { fmtDateTime, passTypeLabel } from "@/lib/utils";
import type { Application } from "@/lib/types";

export default function ApplicationDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const a: Application | undefined = id ? db.applications.get(id) : undefined;
  const profile = a ? db.studentProfiles.get(a.studentProfileId) : undefined;
  const route = a ? db.busRoutes.get(a.routeId) : undefined;
  const stop = a ? db.busStops.get(a.stopId) : undefined;
  const close = () => { setRejecting(false); setReason(""); setErr(""); onClose(); };
  if (!a) return <Modal open={false} onClose={close} title="Application" children={null} />;
  const canDecide = a.status === "pending" || a.status === "under_review";

  const approve = () => { try { const p = approveApplication(a.id); toast(`Approved · pass ${p.id} generated`); close(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } };
  const reject = () => {
    if (reason.trim().length < 5) return setErr("Please give a clear reason (at least 5 characters).");
    rejectApplication(a.id, reason); toast("Application rejected"); close();
  };

  return (
    <Modal open={!!id} onClose={close} title={`Application ${a.id}`} wide
      footer={canDecide ? (rejecting ? <><Button variant="secondary" onClick={() => setRejecting(false)}>Back</Button><Button variant="danger" onClick={reject}><XCircle size={16} /> Confirm rejection</Button></> :
        <>{a.status === "pending" && <Button variant="secondary" onClick={() => { startReview(a.id); toast("Marked as under review", "info"); }}><ScanSearch size={16} /> Start review</Button>}
          <Button variant="secondary" className="border-red-200 text-red-600" onClick={() => setRejecting(true)}><XCircle size={16} /> Reject</Button>
          <Button onClick={approve}><CheckCircle2 size={16} /> Approve & issue pass</Button></>) : undefined}>
      <div className="flex items-center gap-3">
        <Avatar name={a.fullName} fileKey={profile?.photoKey ?? a.documents.photo} size={56} />
        <div className="min-w-0 flex-1"><div className="truncate text-lg font-extrabold">{a.fullName}</div><div className="text-sm text-ink-mute">{a.studentId} · {a.course} {a.year}</div></div>
        <StatusBadge status={a.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-3">
        {[["College", a.college], ["Mobile", a.mobile], ["Email", a.email], ["Route", route ? `${route.number} · ${route.start} → ${route.end}` : "—"], ["Start point", a.startPoint], ["Preferred stop", stop?.name ?? "—"], ["Pass type", passTypeLabel(a.passType)], ["Submitted", fmtDateTime(a.submittedAt)], ["Pass ID", a.passId ?? "—"]].map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs text-ink-mute">{k}</dt><dd className="break-words font-semibold">{v}</dd></div>)}
      </dl>
      <h3 className="mb-2 mt-5 text-sm font-bold">Documents</h3>
      <div className="grid grid-cols-3 gap-3"><DocThumb label="Student ID" fileKey={a.documents.studentIdCard} /><DocThumb label="Admission proof" fileKey={a.documents.admissionProof} /><DocThumb label="Photograph" fileKey={a.documents.photo} /></div>
      {a.status === "rejected" && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"><b>Rejection reason:</b> {a.rejectionReason}</div>}
      {rejecting && <div className="mt-4"><Field label="Rejection reason (visible to student)" error={err}><Textarea autoFocus value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} invalid={!!err} placeholder="e.g. Student ID card image is blurry, please upload a clear scan." /></Field></div>}
      <h3 className="mb-2 mt-5 text-sm font-bold">Timeline</h3>
      <ul className="space-y-1.5 text-sm">{a.timeline.map((t, i) => <li key={i} className="flex justify-between gap-3 rounded-lg bg-forest-50 px-3 py-2"><span className="font-medium">{t.label}</span><span className="text-xs text-ink-mute">{fmtDateTime(t.at)}</span></li>)}</ul>
    </Modal>
  );
}
