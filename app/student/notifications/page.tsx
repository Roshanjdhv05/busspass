"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertOctagon, Bell, BellRing, CheckCheck, CheckCircle2, Clock, FileText, Megaphone, Ticket, Trash2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { clearNotifications, markAllRead, markRead } from "@/lib/services";
import { Button, Card, EmptyState } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

const ICON = { submitted: [FileText, "bg-sky-50 text-sky-600"], approved: [CheckCircle2, "bg-emerald-50 text-emerald-600"], rejected: [XCircle, "bg-red-50 text-red-600"], pass: [Ticket, "bg-mint-100 text-forest-700"], expiring: [Clock, "bg-orange-50 text-orange-600"], expired: [AlertOctagon, "bg-red-50 text-red-600"], info: [Megaphone, "bg-forest-50 text-forest-600"] } as const;

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const all = useCollection(db.notifications);
  const [tab, setTab] = useState<"all" | "unread">("all");
  if (!user) return null;
  const mine = all.filter((n) => n.audience === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = tab === "unread" ? mine.filter((n) => !n.read) : mine;
  const unread = mine.filter((n) => !n.read).length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-extrabold">Notifications</h1>{unread > 0 && <button onClick={() => markAllRead(user.id)} className="inline-flex h-10 items-center gap-1 text-sm font-semibold text-forest-600"><CheckCheck size={16} /> Mark all read</button>}</div>
      <div className="mb-4 grid grid-cols-2 rounded-xl bg-forest-50 p-1" role="tablist">
        {(["all", "unread"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("h-10 rounded-lg text-sm font-semibold capitalize transition", tab === t ? "bg-white text-forest-800 shadow-soft" : "text-ink-soft")}>{t}{t === "unread" && unread ? ` (${unread})` : ""}</button>)}
      </div>
      {list.length === 0 ? <Card><EmptyState icon={tab === "unread" ? BellRing : Bell} title={tab === "unread" ? "All caught up" : "No notifications"} text="Updates about your applications and pass will appear here." /></Card> : (
        <Card className="divide-y divide-forest-50 overflow-hidden">
          {list.map((n) => { const [Icon, tone] = ICON[n.type]; return (
            <button key={n.id} onClick={() => { markRead(n.id); if (n.link) router.push(n.link); }} className={cn("flex w-full items-start gap-3 p-4 text-left transition hover:bg-forest-50/60", !n.read && "bg-mint-50/70")}>
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tone)}><Icon size={18} /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><b className="text-sm">{n.title}</b>{!n.read && <span className="h-2 w-2 rounded-full bg-orange-500" />}</span><span className="block text-sm text-ink-soft">{n.message}</span></span>
              <span className="shrink-0 text-xs text-ink-mute">{timeAgo(n.createdAt)}</span>
            </button>); })}
        </Card>
      )}
      {mine.length > 0 && <Button variant="secondary" full className="mt-4" onClick={() => clearNotifications(user.id)}><Trash2 size={16} /> Clear all</Button>}
    </div>
  );
}
