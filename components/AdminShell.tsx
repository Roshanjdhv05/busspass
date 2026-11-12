"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bell, Bus, ClipboardList, FileDown, LayoutDashboard, LogOut, Megaphone, Menu, QrCode, Route, Search, Settings, Ticket, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { markAllRead, markRead } from "@/lib/services";
import { Avatar, Logo, PageSkeleton } from "./ui";
import { PageTransition } from "./PageTransition";
import { cn, timeAgo } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/passes", label: "Passes", icon: Ticket },
  { href: "/admin/verify", label: "QR Verification", icon: QrCode },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/reports", label: "Reports", icon: FileDown },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
const MOBILE = ["/admin", "/admin/applications", "/admin/passes", "/admin/verify"];
const active = (p: string, h: string) => (h === "/admin" ? p === h : p.startsWith(h));

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready, user, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const notifs = useCollection(db.notifications);
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { if (ready && (!user || user.role !== "admin")) router.replace("/"); }, [ready, user, router]);
  useEffect(() => { setMenu(false); setBell(false); }, [path]);
  if (!ready || !user || user.role !== "admin") return <PageSkeleton />;

  const mine = notifs.filter((n) => n.audience === "admin").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;
  const doSearch = (e: React.FormEvent) => { e.preventDefault(); router.push(`/admin/applications?q=${encodeURIComponent(q)}`); };

  const NavList = ({ items }: { items: typeof NAV }) => (
    <nav className="space-y-1">
      {items.map((n) => {
        const a = active(path, n.href);
        return (
          <Link key={n.href} href={n.href} className={cn("relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition", a ? "text-white" : "text-white/70 hover:bg-white/5 hover:text-white")}>
            {a && <motion.span layoutId="admin-side" className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/10" />}
            <n.icon size={18} className={cn("relative", a && "text-mint-300")} /><span className="relative">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-forest-900 p-5 lg:flex">
        <Logo light /><div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-mint-300/70">Admin console</div>
        <div className="mt-6 flex-1 overflow-y-auto"><NavList items={NAV} /></div>
        <button onClick={logout} className="mt-3 flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-300 hover:bg-white/5"><LogOut size={16} /> Logout</button>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-forest-50 bg-white/90 px-3 backdrop-blur sm:px-6 lg:h-16">
        <div className="lg:hidden"><Bus size={22} className="text-forest-700" /></div>
        <form onSubmit={doSearch} className="relative min-w-0 flex-1 sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search applications…" aria-label="Search applications"
            className="h-10 w-full rounded-xl border border-forest-100 bg-cream pl-9 pr-3 text-sm outline-none focus:border-forest-500 focus:bg-white" />
        </form>
        <div className="relative ml-auto">
          <button onClick={() => setBell((b) => !b)} aria-label="Notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full text-forest-700 hover:bg-forest-50">
            <Bell size={20} />{unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </button>
          <AnimatePresence>
            {bell && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-forest-50 bg-white shadow-lift">
                <div className="flex items-center justify-between border-b border-forest-50 px-4 py-3"><b className="text-sm">Notifications</b><button className="text-xs font-semibold text-forest-600" onClick={() => markAllRead("admin")}>Mark all read</button></div>
                <ul className="max-h-80 overflow-y-auto">
                  {mine.length === 0 && <li className="p-6 text-center text-sm text-ink-mute">You&apos;re all caught up.</li>}
                  {mine.slice(0, 12).map((n) => (
                    <li key={n.id}><Link href={n.link ?? "/admin"} onClick={() => markRead(n.id)} className={cn("block border-b border-forest-50/60 px-4 py-3 hover:bg-forest-50", !n.read && "bg-mint-50")}>
                      <div className="text-sm font-semibold">{n.title}</div><div className="text-xs text-ink-soft">{n.message}</div><div className="mt-0.5 text-[11px] text-ink-mute">{timeAgo(n.createdAt)}</div>
                    </Link></li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Link href="/admin/settings" className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-forest-50"><Avatar name={user.name} size={34} /><span className="hidden text-sm font-semibold sm:block">{user.name}</span></Link>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-7"><PageTransition>{children}</PageTransition></main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-forest-50 bg-white/95 backdrop-blur lg:hidden" aria-label="Admin primary">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.filter((n) => MOBILE.includes(n.href)).map((n) => {
            const a = active(path, n.href);
            return (
              <li key={n.href}><Link href={n.href} className="relative flex h-16 flex-col items-center justify-center gap-0.5">
                {a && <motion.span layoutId="adm-pill" className="absolute top-0 h-1 w-8 rounded-b-full bg-forest-600" />}
                <n.icon size={21} className={a ? "text-forest-700" : "text-ink-mute"} /><span className={cn("text-[10px] font-semibold", a ? "text-forest-700" : "text-ink-mute")}>{n.label.replace("QR Verification", "Verify")}</span>
              </Link></li>
            );
          })}
          <li><button onClick={() => setMenu(true)} className="flex h-16 w-full flex-col items-center justify-center gap-0.5 text-ink-mute"><Menu size={21} /><span className="text-[10px] font-semibold">More</span></button></li>
        </ul>
      </nav>

      <AnimatePresence>
        {menu && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-forest-900 p-5">
              <div className="mb-4 flex items-center justify-between"><Logo light size={32} /><button onClick={() => setMenu(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"><X size={20} /></button></div>
              <div className="flex-1 overflow-y-auto"><NavList items={NAV} /></div>
              <button onClick={logout} className="mt-3 flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-300 hover:bg-white/5"><LogOut size={16} /> Logout</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
