"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, GraduationCap, Hourglass, Ticket, TimerOff, XCircle } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { Card, CountUp, SectionTitle, Skeleton, StatusBadge } from "@/components/ui";
import { expiryBucket, fmtDate, passState, passTypeLabel } from "@/lib/utils";
import { PASS_TYPES } from "@/lib/types";

const L = () => <Skeleton className="h-56" />;
const TrendChart = dynamic(() => import("@/components/charts").then((m) => m.TrendChart), { ssr: false, loading: L });
const DonutChart = dynamic(() => import("@/components/charts").then((m) => m.DonutChart), { ssr: false, loading: L });
const RouteBar = dynamic(() => import("@/components/charts").then((m) => m.RouteBar), { ssr: false, loading: L });

export default function Overview() {
  const students = useCollection(db.studentProfiles);
  const apps = useCollection(db.applications);
  const passes = useCollection(db.issuedPasses);
  const routes = useCollection(db.busRoutes);

  const pending = apps.filter((a) => a.status === "pending" || a.status === "under_review").length;
  const approved = apps.filter((a) => a.status === "approved").length;
  const rejected = apps.filter((a) => a.status === "rejected").length;
  const active = passes.filter((p) => passState(p) === "active").length;
  const expired = passes.filter((p) => passState(p) === "expired").length;
  const exp7 = passes.filter((p) => expiryBucket(p) === "7").length;
  const exp30 = passes.filter((p) => expiryBucket(p) === "30").length;

  const stats = [
    { l: "Registered students", v: students.length, i: GraduationCap, c: "bg-sky-50 text-sky-600" },
    { l: "Total applications", v: apps.length, i: ClipboardList, c: "bg-forest-50 text-forest-700" },
    { l: "Pending", v: pending, i: Hourglass, c: "bg-orange-50 text-orange-600" },
    { l: "Approved", v: approved, i: CheckCircle2, c: "bg-emerald-50 text-emerald-600" },
    { l: "Rejected", v: rejected, i: XCircle, c: "bg-red-50 text-red-600" },
    { l: "Active passes", v: active, i: Ticket, c: "bg-mint-100 text-forest-700" },
    { l: "Expired passes", v: expired, i: TimerOff, c: "bg-red-50 text-red-600" },
  ];

  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d; });
  const trend = months.map((d) => {
    const inM = apps.filter((a) => { const x = new Date(a.submittedAt); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); });
    return { month: d.toLocaleString("en-IN", { month: "short" }), applications: inM.length, approved: inM.filter((a) => a.status === "approved").length };
  });
  const routeDist = routes.map((r) => ({ route: r.number, students: new Set(passes.filter((p) => p.routeId === r.id && passState(p) === "active").map((p) => p.userId)).size + new Set(apps.filter((a) => a.routeId === r.id && a.status !== "approved" && a.status !== "rejected").map((a) => a.userId)).size }));
  const typeDist = PASS_TYPES.map((t) => ({ name: t.label, value: passes.filter((p) => p.passType === t.value).length })).filter((x) => x.value > 0);
  const recent = [...apps].filter((a) => a.status === "pending" || a.status === "under_review").sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold">Admin Overview</h1><p className="text-sm text-ink-mute">Live snapshot of applications and passes</p></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {stats.map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-forest-50 bg-white p-4 shadow-soft">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.c}`}><s.i size={18} /></span>
            <div className="mt-3 text-2xl font-extrabold"><CountUp value={s.v} /></div><div className="text-xs font-medium text-ink-mute">{s.l}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2"><SectionTitle>Monthly application trend</SectionTitle><TrendChart data={trend} /></Card>
        <Card className="p-4"><SectionTitle>Approval vs rejection</SectionTitle><DonutChart colors={["#3DB67F", "#DC2626", "#F59E0B"]} data={[{ name: "Approved", value: approved }, { name: "Rejected", value: rejected }, { name: "Pending", value: pending }]} /></Card>
        <Card className="p-4 lg:col-span-2"><SectionTitle>Route-wise student distribution</SectionTitle><RouteBar data={routeDist} /></Card>
        <Card className="p-4"><SectionTitle>Pass type distribution</SectionTitle><DonutChart data={typeDist} /></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle action={<Link href="/admin/applications" className="text-sm font-semibold text-forest-600">Review all</Link>}>Awaiting review</SectionTitle>
          {recent.length === 0 ? <p className="py-6 text-center text-sm text-ink-mute">No pending applications 🎉</p> : (
            <ul className="divide-y divide-forest-50">{recent.map((a) => (
              <li key={a.id}><Link href={`/admin/applications?q=${a.id}`} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{a.fullName}</div><div className="text-xs text-ink-mute">{a.id} · {passTypeLabel(a.passType)} · {fmtDate(a.submittedAt)}</div></div><StatusBadge status={a.status} /></Link></li>
            ))}</ul>)}
        </Card>
        <Card className="p-4">
          <SectionTitle action={<Link href="/admin/passes" className="text-sm font-semibold text-forest-600">Manage passes</Link>}>Expiry watch</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {[["≤ 7 days", exp7, "bg-red-50 text-red-700", AlertTriangle], ["≤ 30 days", exp30, "bg-orange-50 text-orange-700", Clock], ["Expired", expired, "bg-neutral-100 text-neutral-700", TimerOff]].map(([l, v, c, I]) => { const Icon = I as typeof Clock; return (
              <Link key={l as string} href={`/admin/passes?filter=${l === "Expired" ? "expired" : l === "≤ 7 days" ? "7" : "30"}`} className={`rounded-2xl p-3 text-center ${c}`}><Icon size={18} className="mx-auto" /><div className="mt-1 text-2xl font-extrabold">{v as number}</div><div className="text-[11px] font-semibold">{l as string}</div></Link>); })}
          </div>
        </Card>
      </div>
    </div>
  );
}
