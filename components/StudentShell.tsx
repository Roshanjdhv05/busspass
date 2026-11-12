"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Bus, FilePlus2, FileText, Home, LogOut, Map, Ticket, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { profileForUser } from "@/lib/services";
import { Avatar, Logo, PageSkeleton } from "./ui";
import { PageTransition } from "./PageTransition";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/routes", label: "Routes", icon: Map },
  { href: "/student/pass", label: "My Pass", icon: Ticket },
  { href: "/student/applications", label: "Applications", icon: FileText },
  { href: "/student/profile", label: "Profile", icon: UserIcon },
];
const isActive = (path: string, href: string) => (href === "/student" ? path === href : path.startsWith(href));

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const { ready, user, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const notifs = useCollection(db.notifications);
  const profiles = useCollection(db.studentProfiles);

  useEffect(() => { if (ready && (!user || user.role !== "student")) router.replace("/"); }, [ready, user, router]);
  if (!ready || !user || user.role !== "student") return <PageSkeleton />;

  const unread = notifs.filter((n) => n.audience === user.id && !n.read).length;
  const profile = profiles.find((p) => p.userId === user.id) ?? profileForUser(user.id);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-forest-50 bg-white p-5 lg:flex">
        <Link href="/student"><Logo /></Link>
        <Link href="/student/apply" className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-forest-700 text-sm font-semibold text-white shadow-soft hover:bg-forest-800"><FilePlus2 size={17} /> Apply for pass</Link>
        <nav className="mt-6 space-y-1">
          {[...NAV, { href: "/student/notifications", label: "Notifications", icon: Bell }].map((n) => {
            const a = isActive(path, n.href);
            return (
              <Link key={n.href} href={n.href} className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition", a ? "text-forest-800" : "text-ink-soft hover:bg-forest-50")}>
                {a && <motion.span layoutId="side-active" className="absolute inset-0 rounded-xl bg-mint-100" />}
                <n.icon size={18} className="relative" /><span className="relative">{n.label}</span>
                {n.label === "Notifications" && unread > 0 && <span className="relative ml-auto rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-forest-50 p-3">
            <Avatar name={user.name} fileKey={profile?.photoKey} size={38} />
            <div className="min-w-0"><div className="truncate text-sm font-bold">{user.name}</div><div className="truncate text-xs text-ink-mute">{profile?.studentId || user.email}</div></div>
          </div>
          <button onClick={logout} className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      {/* mobile / tablet header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-forest-50 bg-white/85 px-4 backdrop-blur lg:hidden">
        <Link href="/student"><Logo size={32} /></Link>
        <Link href="/student/notifications" aria-label="Notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full text-forest-700 hover:bg-forest-50">
          <Bell size={21} />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8"><PageTransition>{children}</PageTransition></main>

      {/* bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-forest-50 bg-white/95 backdrop-blur lg:hidden" aria-label="Primary">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => {
            const a = isActive(path, n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} className="relative flex h-16 flex-col items-center justify-center gap-0.5">
                  {a && <motion.span layoutId="tab-pill" className="absolute top-0 h-1 w-8 rounded-b-full bg-forest-600" />}
                  <motion.span animate={{ y: a ? -1 : 0, scale: a ? 1.1 : 1 }}><n.icon size={21} className={a ? "text-forest-700" : "text-ink-mute"} strokeWidth={a ? 2.4 : 2} /></motion.span>
                  <span className={cn("text-[10px] font-semibold", a ? "text-forest-700" : "text-ink-mute")}>{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
