"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardList, Search } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import ApplicationDetail from "@/components/ApplicationDetail";
import { Card, EmptyState, Input, PageSkeleton, Select, StatusBadge } from "@/components/ui";
import { cn, fmtDate, passTypeLabel } from "@/lib/utils";
import type { AppStatus } from "@/lib/types";

const TABS: { v: "all" | AppStatus; l: string }[] = [
  { v: "all", l: "All" },
  { v: "pending", l: "Pending" },
  { v: "under_review", l: "Under Review" },
  { v: "approved", l: "Approved" },
  { v: "rejected", l: "Rejected" },
];

function Inner() {
  const sp = useSearchParams();
  const apps = useCollection(db.applications);
  const routes = useCollection(db.busRoutes);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState<"all" | AppStatus>("all");
  const [routeId, setRouteId] = useState("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<string | null>(null);
  const [approvedPassId, setApprovedPassId] = useState<string | null>(null);
  const [approvedAppId, setApprovedAppId] = useState<string | null>(null);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    let r = apps.filter((a) =>
      (status === "all" || a.status === status) && (routeId === "all" || a.routeId === routeId) &&
      (!n || [a.id, a.fullName, a.studentId, a.email].some((x) => x.toLowerCase().includes(n))) &&
      (!from || a.submittedAt.slice(0, 10) >= from) && (!to || a.submittedAt.slice(0, 10) <= to));
    const cmp: Record<string, (a: typeof r[0], b: typeof r[0]) => number> = {
      newest: (a, b) => b.submittedAt.localeCompare(a.submittedAt),
      oldest: (a, b) => a.submittedAt.localeCompare(b.submittedAt),
      name: (a, b) => a.fullName.localeCompare(b.fullName),
      id: (a, b) => a.id.localeCompare(b.id),
    };
    return r.sort(cmp[sort] ?? cmp.newest);
  }, [apps, q, status, routeId, from, to, sort]);

  const routeNo = (id: string) => routes.find((r) => r.id === id)?.number ?? "—";
  const counts = (v: string) => (v === "all" ? apps.length : apps.filter((a) => a.status === v).length);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Pass Applications</h1>
        <p className="text-sm text-ink-mute">Review student applications, verify documents, and approve or reject passes.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
        {TABS.map((t) => (
          <button key={t.v} role="tab" aria-selected={status === t.v} onClick={() => setStatus(t.v)}
            className={cn("shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition", status === t.v ? "border-forest-700 bg-forest-700 text-white" : "border-forest-100 bg-white text-ink-soft")}>
            {t.l} <span className="opacity-70">{counts(t.v)}</span>
          </button>
        ))}
      </div>

      <Card className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, name, student ID" className="pl-10" aria-label="Search applications" />
        </div>
        <Select value={routeId} onChange={(e) => setRouteId(e.target.value)} aria-label="Filter by route">
          <option value="all">All routes</option>
          {routes.map((r) => <option key={r.id} value={r.id}>Route {r.number}</option>)}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="id">Application ID</option>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </Card>

      {list.length === 0
        ? <Card><EmptyState icon={ClipboardList} title="No applications match" text="Try clearing filters or searching a different term." /></Card>
        : (
          <>
            {/* Desktop table — full row is clickable */}
            <Card className="hidden overflow-hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-50 text-xs uppercase tracking-wide text-ink-soft">
                  <tr>{["Application", "Student", "Route", "Pass type", "Date", "Status"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-forest-50">
                  {list.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setView(a.id)}
                      className="cursor-pointer transition-colors hover:bg-forest-50 active:bg-forest-100"
                    >
                      <td className="px-4 py-3 font-bold text-forest-700">{a.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{a.fullName}</div>
                        <div className="text-xs text-ink-mute">{a.studentId}</div>
                      </td>
                      <td className="px-4 py-3">{routeNo(a.routeId)}</td>
                      <td className="px-4 py-3">{passTypeLabel(a.passType)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{fmtDate(a.submittedAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Mobile cards — also fully clickable */}
            <div className="space-y-3 md:hidden">
              {list.map((a) => (
                <Card key={a.id} className="cursor-pointer p-4 transition-colors hover:bg-forest-50 active:bg-forest-100"
                  onClick={() => setView(a.id)}>
                  <div className="flex items-center justify-between"><span className="font-extrabold">{a.id}</span><StatusBadge status={a.status} /></div>
                  <div className="mt-1.5 text-sm font-semibold">{a.fullName} <span className="font-normal text-ink-mute">· {a.studentId}</span></div>
                  <div className="text-xs text-ink-mute">Route {routeNo(a.routeId)} · {passTypeLabel(a.passType)} · {fmtDate(a.submittedAt)}</div>
                </Card>
              ))}
            </div>
          </>
        )}

      <ApplicationDetail
        id={view}
        onClose={() => setView(null)}
        onApproved={(appId, passId) => {
          setView(null);
          setApprovedAppId(appId);
          setApprovedPassId(passId);
        }}
      />

      {/* Centered approval success overlay */}
      <AnimatePresence>
        {approvedPassId && approvedAppId && (
          <ApprovalSuccess
            appId={approvedAppId}
            passId={approvedPassId}
            onClose={() => { setApprovedPassId(null); setApprovedAppId(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ApprovalSuccess({ appId, passId, onClose }: { appId: string; passId: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* card */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center"
      >
        {/* animated checkmark circle */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-mint-100 text-forest-700 shadow-lift">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 200, damping: 15 }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-600 text-white"
          >
            <Check size={32} strokeWidth={3} />
          </motion.div>
        </div>

        <h2 className="text-2xl font-extrabold text-ink">Application Approved!</h2>
        <p className="mt-1.5 text-sm text-ink-mute">The pass has been generated and the student has been notified.</p>

        <div className="mt-5 space-y-2 rounded-2xl border border-forest-100 bg-forest-50 p-4 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-ink-mute">Application</span>
            <span className="font-bold text-forest-800">{appId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-mute">Pass Issued</span>
            <span className="font-bold text-forest-800">{passId}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-forest-700 py-3 text-sm font-bold text-white shadow-lift hover:bg-forest-800 transition active:scale-[0.99]"
        >
          Done
        </button>
      </motion.div>
    </div>,
    document.body
  );
}

export default function Page() { return <Suspense fallback={<PageSkeleton />}><Inner /></Suspense>; }
