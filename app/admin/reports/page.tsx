"use client";
import { useState } from "react";
import { ClipboardList, Download, GraduationCap, Ticket } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { Button, Card, Select } from "@/components/ui";
import { downloadText, fmtDate, passState, passTypeLabel, toCSV } from "@/lib/utils";

export default function Reports() {
  const apps = useCollection(db.applications);
  const passes = useCollection(db.issuedPasses);
  const students = useCollection(db.studentProfiles);
  const routes = useCollection(db.busRoutes);
  const toast = useToast();
  const [aStatus, setAStatus] = useState("all"); const [pState, setPState] = useState("all");
  const rn = (id: string) => routes.find((r) => r.id === id)?.number ?? "";
  const stamp = new Date().toISOString().slice(0, 10);

  const exportApps = () => {
    const rows = apps.filter((a) => aStatus === "all" || a.status === aStatus).map((a) => ({ "Application ID": a.id, "Student name": a.fullName, "Student ID": a.studentId, College: a.college, Course: a.course, Year: a.year, Mobile: a.mobile, Email: a.email, Route: rn(a.routeId), From: a.startPoint, To: a.destination, "Pass type": passTypeLabel(a.passType), Status: a.status, "Applied on": fmtDate(a.submittedAt), "Pass ID": a.passId ?? "", "Rejection reason": a.rejectionReason ?? "" }));
    if (!rows.length) return toast("No records to export", "error");
    downloadText(`applications-${stamp}.csv`, toCSV(rows)); toast(`Exported ${rows.length} applications`);
  };
  const exportPasses = () => {
    const rows = passes.filter((p) => pState === "all" || passState(p) === pState).map((p) => { const s = students.find((x) => x.id === p.studentProfileId); return { "Pass ID": p.id, "Application ID": p.applicationId, Student: s?.fullName ?? "", "Student ID": s?.studentId ?? "", Route: rn(p.routeId), "Pass type": passTypeLabel(p.passType), Issued: fmtDate(p.issueDate), Expires: fmtDate(p.expiryDate), Status: passState(p) }; });
    if (!rows.length) return toast("No records to export", "error");
    downloadText(`passes-${stamp}.csv`, toCSV(rows)); toast(`Exported ${rows.length} passes`);
  };
  const exportStudents = () => {
    const rows = students.map((s) => ({ Name: s.fullName, "Student ID": s.studentId, College: s.college, Course: s.course, Year: s.year, Mobile: s.mobile, Email: s.email, Applications: apps.filter((a) => a.userId === s.userId).length }));
    downloadText(`students-${stamp}.csv`, toCSV(rows)); toast(`Exported ${rows.length} students`);
  };

  const cards = [
    { i: ClipboardList, t: "Applications report", d: `${apps.length} records`, f: <Select value={aStatus} onChange={(e) => setAStatus(e.target.value)} aria-label="Status"><option value="all">All statuses</option><option value="pending">Pending</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select>, a: exportApps },
    { i: Ticket, t: "Issued passes report", d: `${passes.length} records`, f: <Select value={pState} onChange={(e) => setPState(e.target.value)} aria-label="Pass state"><option value="all">All passes</option><option value="active">Active</option><option value="expired">Expired</option><option value="revoked">Revoked</option></Select>, a: exportPasses },
    { i: GraduationCap, t: "Students report", d: `${students.length} records`, f: null, a: exportStudents },
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-extrabold">Reports</h1><p className="mb-5 text-sm text-ink-mute">Download records as CSV for Excel or Google Sheets</p>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.t} className="flex flex-col p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-100 text-forest-700"><c.i size={20} /></span>
            <h2 className="mt-3 font-bold">{c.t}</h2><p className="text-sm text-ink-mute">{c.d}</p><div className="mt-3 flex-1">{c.f}</div>
            <Button className="mt-4" full onClick={c.a}><Download size={16} /> Export CSV</Button></Card>))}
      </div>
    </div>
  );
}
