"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, FilePlus2, FileText } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { Button, Card, EmptyState, StatusBadge } from "@/components/ui";
import { fmtDate, passTypeLabel } from "@/lib/utils";

export default function Applications() {
  const { apps, routes } = useStudent();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between"><div><h1 className="text-2xl font-extrabold">Applications</h1><p className="text-sm text-ink-mute">Track every pass request</p></div>
        <Link href="/student/apply"><Button size="sm"><FilePlus2 size={15} /> New</Button></Link></div>
      {apps.length === 0 ? <Card><EmptyState icon={FileText} title="No applications yet" text="Start your first bus pass application in under two minutes." action={<Link href="/student/apply"><Button>Apply now</Button></Link>} /></Card> : (
        <div className="space-y-3">
          {apps.map((a, i) => {
            const r = routes.find((x) => x.id === a.routeId);
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/student/applications/${a.id}`} className="block rounded-2xl border border-forest-50 bg-white p-4 shadow-soft transition hover:border-forest-200">
                  <div className="flex items-center justify-between gap-2"><span className="font-extrabold tracking-wide">{a.id}</span><StatusBadge status={a.status} /></div>
                  <div className="mt-1.5 text-sm text-ink-soft">Route {r?.number ?? "—"} · {a.startPoint} → {a.destination}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-ink-mute"><span>{passTypeLabel(a.passType)} · {fmtDate(a.submittedAt)}</span><ChevronRight size={16} /></div>
                  {a.status === "rejected" && a.rejectionReason && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{a.rejectionReason}</div>}
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
