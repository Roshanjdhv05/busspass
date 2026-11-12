"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bell, CalendarClock, ChevronRight, FilePlus2, Map, Megaphone, Route as RouteIcon, Ticket, FileSearch, Sparkles } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import PassCard from "@/components/PassCard";
import { Avatar, BusPhoto, Card, EmptyState, SectionTitle, StatusBadge } from "@/components/ui";
import { daysLeft, fmtDate, passState, timeAgo } from "@/lib/utils";

export default function Dashboard() {
  const { user, profile, apps, pass, route, settings } = useStudent();
  const announcements = useCollection(db.announcements).filter((a) => a.active).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!user || !settings) return null;
  const st = pass ? passState(pass) : undefined;
  const latest = apps[0];
  const pendingApp = apps.find((a) => a.status === "pending" || a.status === "under_review");
  const activity = apps.flatMap((a) => a.timeline.map((t) => ({ ...t, app: a.id }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);

  const stats = [
    { label: "Pass status", value: st ? (st === "active" ? "Active" : st === "revoked" ? "Revoked" : "Expired") : "No pass", tone: st === "active" ? "text-emerald-700" : st ? "text-red-600" : "text-ink-soft" },
    { label: "Active route", value: route ? `Route ${route.number}` : "—", tone: "text-ink" },
    { label: "Expires", value: pass ? fmtDate(pass.expiryDate, { day: "2-digit", month: "short" }) : "—", tone: pass && daysLeft(pass) <= 7 ? "text-orange-600" : "text-ink" },
    { label: "Application", value: latest ? (latest.status === "under_review" ? "In review" : latest.status[0].toUpperCase() + latest.status.slice(1)) : "None", tone: latest?.status === "rejected" ? "text-red-600" : latest?.status === "approved" ? "text-emerald-700" : "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <BusPhoto kind="hero" className="-mx-4 -mt-5 h-48 rounded-b-3xl sm:mx-0 sm:mt-0 sm:rounded-3xl lg:h-56">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/90 via-forest-900/40 to-forest-900/10" />
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <div className="text-sm text-white/75">Welcome back 👋</div>
            <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Hello, {user.name.split(" ")[0]}!</h1>
            <div className="mt-0.5 truncate text-xs text-white/70">{settings.collegeName}</div>
          </div>
          <Link href="/student/profile"><Avatar name={user.name} fileKey={profile?.photoKey} size={56} className="ring-white/60" /></Link>
        </div>
      </BusPhoto>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-forest-50 bg-white p-3.5 shadow-soft">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{s.label}</div>
            <div className={`mt-1 truncate text-lg font-extrabold ${s.tone}`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {pass && profile ? (
            <div>
              <SectionTitle action={<Link href="/student/pass" className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600">Open <ChevronRight size={15} /></Link>}>Your bus pass</SectionTitle>
              <Link href="/student/pass" className="block"><PassCard pass={pass} profile={profile} route={route} collegeName={settings.collegeName} compact /></Link>
              {st !== "active" && <Link href="/student/apply" className="mt-3 flex items-center justify-between rounded-2xl bg-orange-50 p-3.5 text-sm font-semibold text-orange-800"><span>Your pass is no longer valid — renew now</span><ArrowRight size={16} /></Link>}
              {st === "active" && daysLeft(pass) <= 30 && !pendingApp && <Link href="/student/apply" className="mt-3 flex items-center justify-between rounded-2xl bg-orange-50 p-3.5 text-sm font-semibold text-orange-800"><span>Expires in {daysLeft(pass)} days — renew early</span><ArrowRight size={16} /></Link>}
            </div>
          ) : (
            <Card><EmptyState icon={Ticket} title="No bus pass yet" text="Apply for a pass and it will appear here once approved." action={<Link href="/student/apply" className="inline-flex h-11 items-center gap-2 rounded-xl bg-forest-700 px-5 text-sm font-semibold text-white"><FilePlus2 size={16} /> Apply now</Link>} /></Card>
          )}

          {pendingApp && (
            <Link href={`/student/applications/${pendingApp.id}`} className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <Sparkles className="text-orange-600" size={22} /><div className="min-w-0 flex-1"><div className="text-sm font-bold text-orange-900">Application {pendingApp.id} is {pendingApp.status === "pending" ? "pending" : "under review"}</div><div className="text-xs text-orange-800/80">Tap to track progress</div></div><ChevronRight size={18} className="text-orange-700" />
            </Link>
          )}

          <div>
            <SectionTitle>Quick actions</SectionTitle>
            <div className="grid grid-cols-4 gap-2.5">
              {[{ h: "/student/apply", i: FilePlus2, l: "Apply Pass" }, { h: "/student/routes", i: Map, l: "View Routes" }, { h: "/student/pass", i: Ticket, l: "My Pass" }, { h: "/student/applications", i: FileSearch, l: "Track App" }].map((q) => (
                <Link key={q.h} href={q.h} className="group flex flex-col items-center gap-2 rounded-2xl border border-forest-50 bg-white p-3 text-center shadow-soft transition hover:-translate-y-0.5 hover:border-forest-200">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-100 text-forest-700 transition group-hover:bg-forest-700 group-hover:text-white"><q.i size={20} /></span>
                  <span className="text-[11px] font-semibold leading-tight">{q.l}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle><span className="inline-flex items-center gap-1.5"><Megaphone size={16} className="text-forest-600" /> Announcements</span></SectionTitle>
            <div className="space-y-2.5">
              {announcements.length === 0 && <Card><EmptyState icon={Bell} title="No announcements" text="Important updates from the transport office appear here." /></Card>}
              {announcements.slice(0, 3).map((a) => (
                <Card key={a.id} className="p-3.5">
                  <div className="flex items-start gap-2">{a.priority === "important" && <span className="mt-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-700">Important</span>}<div className="text-sm font-bold leading-snug">{a.title}</div></div>
                  <p className="mt-1 text-xs text-ink-soft">{a.body}</p><div className="mt-1.5 text-[11px] text-ink-mute">{timeAgo(a.createdAt)}</div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle action={<Link href="/student/applications" className="text-sm font-semibold text-forest-600">See all</Link>}>Recent activity</SectionTitle>
            <Card className="divide-y divide-forest-50">
              {activity.length === 0 && <EmptyState icon={CalendarClock} title="Nothing yet" text="Your application activity will show up here." />}
              {activity.map((t, i) => (
                <Link key={i} href={`/student/applications/${t.app}`} className="flex items-center gap-3 p-3.5 hover:bg-forest-50/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-100 text-forest-700"><RouteIcon size={16} /></span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{t.label}</div><div className="text-xs text-ink-mute">{t.app} · {timeAgo(t.at)}</div></div>
                </Link>
              ))}
            </Card>
            {latest && <div className="mt-2 flex items-center justify-between px-1 text-xs text-ink-mute"><span>Latest: {latest.id}</span><StatusBadge status={latest.status} /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
