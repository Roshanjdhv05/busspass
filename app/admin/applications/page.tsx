"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardList, Eye, Search, XCircle } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { approveApplication } from "@/lib/services";
import ApplicationDetail from "@/components/ApplicationDetail";
import { Card, ConfirmDialog, EmptyState, Input, PageSkeleton, Select, StatusBadge } from "@/components/ui";
import { cn, fmtDate, passTypeLabel } from "@/lib/utils";
import type { AppStatus } from "@/lib/types";

const TABS: { v: "all" | AppStatus; l: string }[] = [{ v: "all", l: "All" }, { v: "pending", l: "Pending" }, { v: "under_review", l: "In review" }, { v: "approved", l: "Approved" }, { v: "rejected", l: "Rejected" }];

function Inner() {
  const sp = useSearchParams();
  const toast = useToast();
  const apps = useCollection(db.applications);
  const routes = useCollection(db.busRoutes);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState<"all" | AppStatus>("all");
  const [routeId, setRouteId] = useState("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    let r = apps.filter((a) =>
      (status === "all" || a.status === status) && (routeId === "all" || a.routeId === routeId) &&
      (!n || [a.id, a.fullName, a.studentId, a.email].some((x) => x.toLowerCase().includes(n))) &&
      (!from || a.submittedAt.slice(0, 10) >= from) && (!to || a.submittedAt.slice(0, 10) <= to));
    const cmp: Record<string, (a: typeof r[0], b: typeof r[0]) => number> = {
      newest: (a, b) => b.submittedAt.localeCompare(a.submittedAt), oldest: (a, b) => a.submittedAt.localeCompare(b.submittedAt),
      name: (a, b) => a.fullName.localeCompare(b.fullName), status: (a, b) => a.status.localeCompare(b.status), id: (a, b) => a.id.localeCompare(b.id),
    };
    return r.sort(cmp[sort]);
  }, [apps, q, status, routeId, from, to, sort]);
  const routeNo = (id: string) => routes.find((r) => r.id === id)?.number ?? "—";
  const counts = (v: string) => (v === "all" ? apps.length : apps.filter((a) => a.status === v).length);
  const canAct = (s: AppStatus) => s === "pending" || s === "under_review";

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-extrabold">Applications</h1><p className="text-sm text-ink-mute">Review, approve or reject bus pass requests</p></div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
        {TABS.map((t) => <button key={t.v} role="tab" aria-selected={status === t.v} onClick={() => setStatus(t.v)} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition", status === t.v ? "border-forest-700 bg-forest-700 text-white" : "border-forest-100 bg-white text-ink-soft")}>{t.l} <span className="opacity-70">{counts(t.v)}</span></button>)}
      </div>
      <Card className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, name, student ID" className="pl-10" aria-label="Search applications" /></div>
        <Select value={routeId} onChange={(e) => setRouteId(e.target.value)} aria-label="Filter by route"><option value="all">All routes</option>{routes.map((r) => <option key={r.id} value={r.id}>Route {r.number}</option>)}</Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option><option value="status">Status</option><option value="id">Application ID</option></Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </Card>

      {list.length === 0 ? <Card><EmptyState icon={ClipboardList} title="No applications match" text="Try clearing filters or searching a different term." /></Card> : (<>
        <Card className="hidden overflow-hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-xs uppercase tracking-wide text-ink-soft"><tr>{["Application", "Student", "Route", "Pass type", "Date", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-forest-50">
              {list.map((a) => (
                <tr key={a.id} className="hover:bg-forest-50/40">
                  <td className="px-4 py-3 font-bold">{a.id}</td>
                  <td className="px-4 py-3"><div className="font-semibold">{a.fullName}</div><div className="text-xs text-ink-mute">{a.studentId}</div></td>
                  <td className="px-4 py-3">{routeNo(a.routeId)}</td><td className="px-4 py-3">{passTypeLabel(a.passType)}</td><td className="whitespace-nowrap px-4 py-3">{fmtDate(a.submittedAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <button onClick={() => setView(a.id)} aria-label={`View ${a.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-forest-700 hover:bg-forest-100"><Eye size={17} /></button>
                    {canAct(a.status) && <><button onClick={() => setConfirm(a.id)} aria-label={`Approve ${a.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={17} /></button>
                      <button onClick={() => setView(a.id)} aria-label={`Reject ${a.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><XCircle size={17} /></button></>}
                  </div></td>
                </tr>))}
            </tbody>
          </table>
        </Card>
        <div className="space-y-3 md:hidden">
          {list.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between"><span className="font-extrabold">{a.id}</span><StatusBadge status={a.status} /></div>
              <div className="mt-1.5 text-sm font-semibold">{a.fullName} <span className="font-normal text-ink-mute">· {a.studentId}</span></div>
              <div className="text-xs text-ink-mute">Route {routeNo(a.routeId)} · {passTypeLabel(a.passType)} · {fmtDate(a.submittedAt)}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setView(a.id)} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-forest-100 text-sm font-semibold text-forest-700"><Eye size={16} /> View</button>
                {canAct(a.status) && <><button onClick={() => setConfirm(a.id)} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest-700 text-sm font-semibold text-white"><CheckCircle2 size={16} /> Approve</button>
                  <button onClick={() => setView(a.id)} aria-label="Reject" className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><XCircle size={18} /></button></>}
              </div>
            </Card>))}
        </div>
      </>)}
      <ApplicationDetail id={view} onClose={() => setView(null)} />
      <ConfirmDialog open={!!confirm} title="Approve application?" message="A unique pass ID will be generated and the student's digital pass issued immediately." confirmLabel="Approve & issue pass"
        onConfirm={() => { try { const p = approveApplication(confirm!); toast(`Approved · pass ${p.id} generated`); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } }} onClose={() => setConfirm(null)} />
    </div>
  );
}
export default function Page() { return <Suspense fallback={<PageSkeleton />}><Inner /></Suspense>; }
