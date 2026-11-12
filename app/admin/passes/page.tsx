"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, History, Search, ShieldOff, Ticket, Undo2 } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { extendPass, reinstatePass, revokePass } from "@/lib/services";
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageSkeleton, Select, StatusBadge } from "@/components/ui";
import { cn, daysLeft, expiryBucket, fmtDate, fmtDateTime, passState, passTypeLabel } from "@/lib/utils";

const FILTERS = [["all", "All"], ["active", "Active"], ["7", "Expiring ≤7d"], ["30", "Expiring ≤30d"], ["expired", "Expired"], ["revoked", "Revoked"]] as const;

function Inner() {
  const sp = useSearchParams();
  const toast = useToast();
  const passes = useCollection(db.issuedPasses);
  const profiles = useCollection(db.studentProfiles);
  const routes = useCollection(db.busRoutes);
  const [q, setQ] = useState(""); const [filter, setFilter] = useState<string>(sp.get("filter") ?? "all");
  const [sel, setSel] = useState<string | null>(null);
  const [revoke, setRevoke] = useState(false);
  const [extend, setExtend] = useState(false); const [days, setDays] = useState("30");

  const name = (id: string) => profiles.find((p) => p.id === id)?.fullName ?? "Unknown";
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return passes.filter((p) => {
      const b = expiryBucket(p);
      const ok = filter === "all" || (filter === "active" && passState(p) === "active") || (filter === "7" && b === "7") || (filter === "30" && (b === "7" || b === "30")) || (filter === "expired" && b === "expired") || (filter === "revoked" && b === "revoked");
      return ok && (!n || p.id.toLowerCase().includes(n) || name(p.studentProfileId).toLowerCase().includes(n));
    }).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passes, profiles, q, filter]);
  const p = passes.find((x) => x.id === sel);
  const profile = profiles.find((x) => x.id === p?.studentProfileId);
  const route = routes.find((r) => r.id === p?.routeId);
  const st = p ? passState(p) : undefined;
  const label = (x: typeof passes[0]) => { const b = expiryBucket(x); return b === "7" || b === "30" ? "expiring" as const : passState(x); };

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-extrabold">Bus Passes</h1><p className="text-sm text-ink-mute">Check validity, revoke or extend issued passes</p></div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist">{FILTERS.map(([v, l]) => <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold", filter === v ? "border-forest-700 bg-forest-700 text-white" : "border-forest-100 bg-white text-ink-soft")}>{l}</button>)}</div>
      <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by student name or pass ID" aria-label="Search passes" /></div>

      {list.length === 0 ? <Card><EmptyState icon={Ticket} title="No passes found" text="Passes appear here after applications are approved." /></Card> : (
        <>
          <Card className="hidden overflow-hidden md:block"><table className="w-full text-left text-sm">
            <thead className="bg-forest-50 text-xs uppercase tracking-wide text-ink-soft"><tr>{["Pass ID", "Student", "Route", "Type", "Issued", "Expires", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-forest-50">{list.map((x) => (
              <tr key={x.id} className="hover:bg-forest-50/40"><td className="px-4 py-3 font-bold">{x.id}</td><td className="px-4 py-3">{name(x.studentProfileId)}</td><td className="px-4 py-3">{routes.find((r) => r.id === x.routeId)?.number}</td><td className="px-4 py-3">{passTypeLabel(x.passType)}</td><td className="whitespace-nowrap px-4 py-3">{fmtDate(x.issueDate)}</td><td className="whitespace-nowrap px-4 py-3">{fmtDate(x.expiryDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={label(x)} label={label(x) === "expiring" ? `Expires in ${daysLeft(x)}d` : undefined} /></td><td className="px-4 py-3 text-right"><Button size="sm" variant="secondary" onClick={() => setSel(x.id)}>Manage</Button></td></tr>))}</tbody></table></Card>
          <div className="space-y-3 md:hidden">{list.map((x) => (
            <Card key={x.id} className="p-4"><div className="flex items-center justify-between"><b>{x.id}</b><StatusBadge status={label(x)} label={label(x) === "expiring" ? `${daysLeft(x)}d left` : undefined} /></div>
              <div className="mt-1 text-sm font-semibold">{name(x.studentProfileId)}</div><div className="text-xs text-ink-mute">Route {routes.find((r) => r.id === x.routeId)?.number} · till {fmtDate(x.expiryDate)}</div>
              <Button size="sm" variant="secondary" full className="mt-3" onClick={() => setSel(x.id)}>Manage pass</Button></Card>))}</div>
        </>)}

      <Modal open={!!p} onClose={() => setSel(null)} title={p ? `Pass ${p.id}` : "Pass"} wide
        footer={p && <>{st === "revoked" ? <Button variant="secondary" onClick={() => { reinstatePass(p.id); toast("Pass reinstated"); }}><Undo2 size={16} /> Reinstate</Button> : <Button variant="secondary" className="border-red-200 text-red-600" onClick={() => setRevoke(true)}><ShieldOff size={16} /> Revoke</Button>}<Button onClick={() => setExtend(true)}><CalendarPlus size={16} /> Extend validity</Button></>}>
        {p && <>
          <div className="flex items-center justify-between"><div><div className="text-lg font-extrabold">{profile?.fullName}</div><div className="text-sm text-ink-mute">{profile?.studentId} · {profile?.course} {profile?.year}</div></div>{st && <StatusBadge status={st} />}</div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">{[["Route", route ? `${route.number} · ${route.start} → ${route.end}` : "—"], ["Pass type", passTypeLabel(p.passType)], ["Application", p.applicationId], ["Issued", fmtDate(p.issueDate)], ["Expires", fmtDate(p.expiryDate)], ["Validity", st === "active" ? `${daysLeft(p)} days left` : st === "revoked" ? "Revoked" : "Expired"]].map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs text-ink-mute">{k}</dt><dd className="break-words font-semibold">{v}</dd></div>)}</dl>
          <h3 className="mb-2 mt-5 flex items-center gap-1.5 text-sm font-bold"><History size={15} /> Pass history</h3>
          <ul className="space-y-1.5 text-sm">{[...p.history].sort((a, b) => b.at.localeCompare(a.at)).map((h, i) => <li key={i} className="flex justify-between gap-3 rounded-lg bg-forest-50 px-3 py-2"><span><b className="capitalize">{h.action}</b> — {h.note}</span><span className="shrink-0 text-xs text-ink-mute">{fmtDateTime(h.at)}</span></li>)}</ul>
        </>}
      </Modal>
      <ConfirmDialog open={revoke} danger title="Revoke this pass?" message="The student will be notified and the pass will fail verification. You can reinstate it later." confirmLabel="Revoke pass" onConfirm={() => { if (p) { revokePass(p.id); toast("Pass revoked"); } }} onClose={() => setRevoke(false)} />
      <Modal open={extend} onClose={() => setExtend(false)} title="Extend validity" footer={<><Button variant="secondary" onClick={() => setExtend(false)}>Cancel</Button><Button onClick={() => { if (p) { extendPass(p.id, Number(days)); toast(`Extended by ${days} days`); } setExtend(false); }}>Extend</Button></>}>
        <Field label="Extend by" hint={p ? `Current expiry: ${fmtDate(p.expiryDate)}` : undefined}><Select value={days} onChange={(e) => setDays(e.target.value)}>{["7", "15", "30", "60", "90", "180", "365"].map((d) => <option key={d} value={d}>{d} days</option>)}</Select></Field>
      </Modal>
    </div>
  );
}
export default function Page() { return <Suspense fallback={<PageSkeleton />}><Inner /></Suspense>; }
