"use client";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { Avatar, Card, EmptyState, Input, Modal, Select, StatusBadge } from "@/components/ui";
import { COURSES, YEARS, fmtDate, passState, passTypeLabel } from "@/lib/utils";

export default function Students() {
  const students = useCollection(db.studentProfiles);
  const apps = useCollection(db.applications);
  const passes = useCollection(db.issuedPasses);
  const routes = useCollection(db.busRoutes);
  const [q, setQ] = useState(""); const [course, setCourse] = useState("all"); const [year, setYear] = useState("all");
  const [sel, setSel] = useState<string | null>(null);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return students.filter((s) => (course === "all" || s.course === course) && (year === "all" || s.year === year) &&
      (!n || [s.fullName, s.studentId, s.email, s.mobile].some((x) => x.toLowerCase().includes(n)))).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [students, q, course, year]);
  const curPass = (uid: string) => { const mine = passes.filter((p) => p.userId === uid).sort((a, b) => b.issueDate.localeCompare(a.issueDate)); return mine.find((p) => passState(p) === "active") ?? mine[0]; };
  const s = students.find((x) => x.id === sel);
  const sApps = s ? apps.filter((a) => a.userId === s.userId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)) : [];
  const sPass = s ? curPass(s.userId) : undefined;

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-extrabold">Students</h1><p className="text-sm text-ink-mute">{students.length} registered students</p></div>
      <Card className="grid gap-3 p-3 sm:grid-cols-3">
        <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, ID, email" aria-label="Search students" /></div>
        <Select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course"><option value="all">All courses</option>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year"><option value="all">All years</option>{YEARS.map((c) => <option key={c}>{c}</option>)}</Select>
      </Card>
      {list.length === 0 ? <Card><EmptyState icon={Users} title="No students found" text="Adjust the filters to see more." /></Card> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((st) => { const p = curPass(st.userId); const ps = p ? passState(p) : undefined; return (
            <button key={st.id} onClick={() => setSel(st.id)} className="flex items-center gap-3 rounded-2xl border border-forest-50 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-forest-200">
              <Avatar name={st.fullName} fileKey={st.photoKey} size={48} />
              <div className="min-w-0 flex-1"><div className="truncate font-bold">{st.fullName}</div><div className="truncate text-xs text-ink-mute">{st.studentId || "—"} · {st.course || "—"} {st.year}</div></div>
              {ps ? <StatusBadge status={ps} /> : <span className="text-xs text-ink-mute">No pass</span>}
            </button>); })}
        </div>)}
      <Modal open={!!s} onClose={() => setSel(null)} title="Student profile" wide>
        {s && <>
          <div className="flex items-center gap-3"><Avatar name={s.fullName} fileKey={s.photoKey} size={64} /><div><div className="text-lg font-extrabold">{s.fullName}</div><div className="text-sm text-ink-mute">{s.studentId} · {s.course} {s.year}</div></div></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">{[["College", s.college], ["Mobile", s.mobile || "—"], ["Email", s.email], ["Joined", fmtDate(s.createdAt)]].map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs text-ink-mute">{k}</dt><dd className="truncate font-semibold">{v}</dd></div>)}</dl>
          <h3 className="mb-2 mt-5 text-sm font-bold">Current pass</h3>
          {sPass ? <div className="flex items-center justify-between rounded-xl bg-forest-50 p-3 text-sm"><div><b>{sPass.id}</b><div className="text-xs text-ink-mute">Route {routes.find((r) => r.id === sPass.routeId)?.number} · {passTypeLabel(sPass.passType)} · till {fmtDate(sPass.expiryDate)}</div></div><StatusBadge status={passState(sPass)} /></div> : <p className="text-sm text-ink-mute">No pass issued.</p>}
          <h3 className="mb-2 mt-5 text-sm font-bold">Application history</h3>
          <ul className="space-y-2">{sApps.length === 0 && <li className="text-sm text-ink-mute">No applications.</li>}{sApps.map((a) => <li key={a.id} className="flex items-center justify-between rounded-xl border border-forest-50 px-3 py-2.5 text-sm"><div><b>{a.id}</b><div className="text-xs text-ink-mute">{passTypeLabel(a.passType)} · {fmtDate(a.submittedAt)}</div></div><StatusBadge status={a.status} /></li>)}</ul>
        </>}
      </Modal>
    </div>
  );
}
