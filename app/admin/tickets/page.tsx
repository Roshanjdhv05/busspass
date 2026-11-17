"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, QrCode, Search, TicketCheck, X } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { Card, EmptyState, Input, Select, StatusBadge } from "@/components/ui";
import { TicketQR } from "@/components/TicketQR";
import { cn, fmtDateTime } from "@/lib/utils";
import type { BusTicket } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTicketsPage() {
  const tickets = useCollection(db.tickets);
  const routes = useCollection(db.busRoutes);
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [routeId, setRouteId] = useState("all");
  const [verifyTicket, setVerifyTicket] = useState<BusTicket | null>(null);

  const isExpired = (t: typeof tickets[0]) => new Date(t.expiresAt).getTime() < Date.now();
  const ticketStatus = (t: typeof tickets[0]) => t.used ? "revoked" : isExpired(t) ? "expired" : "active";

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return tickets.filter((t) => {
      const st = ticketStatus(t);
      const matchFilter = filter === "all" || st === filter;
      const matchRoute = routeId === "all" || t.routeId === routeId;
      const matchQ = !n || t.id.toLowerCase().includes(n) || t.studentName.toLowerCase().includes(n) ||
        t.fromStopName.toLowerCase().includes(n) || t.toStopName.toLowerCase().includes(n);
      return matchFilter && matchRoute && matchQ;
    }).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, q, filter, routeId]);

  const counts = { all: tickets.length, active: 0, expired: 0, revoked: 0 };
  tickets.forEach((t) => { const s = ticketStatus(t); if (s in counts) (counts as Record<string, number>)[s]++; });

  const FILTERS = [["all", "All"], ["active", "Active"], ["expired", "Expired"], ["revoked", "Used"]] as const;

  const handleMarkUsed = (ticket: BusTicket) => {
    db.tickets.update(ticket.id, { used: true });
    toast(`Ticket ${ticket.id} marked as used`);
    setVerifyTicket((prev) => prev?.id === ticket.id ? { ...prev, used: true } : prev);
  };

  return (
    <>
      {/* Verify modal */}
      <AnimatePresence>
        {verifyTicket && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setVerifyTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setVerifyTicket(null)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-ink-soft hover:bg-forest-100">
                <X size={18} />
              </button>

              {/* Status header */}
              <div className={cn("mb-4 rounded-2xl px-4 py-3 text-center font-bold",
                verifyTicket.used ? "bg-red-50 text-red-700" :
                isExpired(verifyTicket) ? "bg-orange-50 text-orange-700" :
                "bg-emerald-50 text-emerald-700"
              )}>
                {verifyTicket.used ? "⛔ Already Used" : isExpired(verifyTicket) ? "⏰ Expired" : "✅ Valid Ticket"}
              </div>

              <div className="mb-4 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Ticket ID</div>
                <div className="mt-0.5 text-lg font-extrabold">{verifyTicket.id}</div>
              </div>

              {/* QR */}
              <div className="flex justify-center">
                <TicketQR ticket={verifyTicket} size={200} />
              </div>

              <div className="mt-4 space-y-1.5 rounded-2xl bg-forest-50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-ink-mute">Student</span><span className="font-semibold">{verifyTicket.studentName}</span></div>
                <div className="flex justify-between"><span className="text-ink-mute">Route</span><span className="font-semibold">{verifyTicket.fromStopName} → {verifyTicket.toStopName}</span></div>
                <div className="flex justify-between"><span className="text-ink-mute">Type</span><span className="capitalize font-semibold">{verifyTicket.ticketType} · {verifyTicket.passengers} pax</span></div>
                <div className="flex justify-between"><span className="text-ink-mute">Fare</span><span className="font-bold text-forest-700">₹{verifyTicket.fare}</span></div>
                <div className="flex justify-between"><span className="text-ink-mute">Expires</span><span className="font-semibold">{fmtDateTime(verifyTicket.expiresAt)}</span></div>
              </div>

              {/* Mark as used */}
              {!verifyTicket.used && !isExpired(verifyTicket) && (
                <button
                  onClick={() => handleMarkUsed(verifyTicket)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-700 py-3 text-sm font-bold text-white shadow-soft hover:bg-forest-800"
                >
                  <CheckCircle2 size={18} /> Mark as Used
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold">Tickets</h1>
          <p className="text-sm text-ink-mute">All single and return tickets issued through the system.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FILTERS.slice(1).map(([v, l]) => (
            <Card key={v} className="p-3 text-center">
              <div className="text-2xl font-extrabold text-forest-700">{counts[v as keyof typeof counts] ?? 0}</div>
              <div className="text-xs font-semibold uppercase text-ink-mute">{l}</div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={cn("rounded-full border px-3.5 py-2 text-sm font-semibold transition", filter === v ? "border-forest-700 bg-forest-700 text-white" : "border-forest-100 bg-white text-ink-soft")}>
              {l} <span className="opacity-70">{counts[v as keyof typeof counts] ?? tickets.length}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" placeholder="Search by ID, name or stop" />
          </div>
          <Select value={routeId} onChange={(e) => setRouteId(e.target.value)} className="w-40">
            <option value="all">All routes</option>
            {routes.map((r) => <option key={r.id} value={r.id}>Route {r.number}</option>)}
          </Select>
        </div>

        {list.length === 0
          ? <Card><EmptyState icon={TicketCheck} title="No tickets found" text="Tickets appear here when students book them." /></Card>
          : (
            <>
              {/* Desktop table */}
              <Card className="hidden overflow-hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-forest-50 text-xs uppercase tracking-wide text-ink-soft">
                    <tr>{["Ticket ID", "Student", "Route", "From → To", "Type", "Pax", "Fare", "Expires", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-forest-50">
                    {list.map((t) => {
                      const route = routes.find((r) => r.id === t.routeId);
                      const st = ticketStatus(t);
                      return (
                        <tr key={t.id} className="hover:bg-forest-50/40">
                          <td className="px-4 py-3 font-bold">{t.id}</td>
                          <td className="px-4 py-3">{t.studentName}</td>
                          <td className="px-4 py-3">{route?.number ?? "—"}</td>
                          <td className="px-4 py-3 text-xs">{t.fromStopName} → {t.toStopName}</td>
                          <td className="px-4 py-3 capitalize">{t.ticketType}</td>
                          <td className="px-4 py-3">{t.passengers}</td>
                          <td className="px-4 py-3 font-bold text-forest-700">₹{t.fare}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs">{fmtDateTime(t.expiresAt)}</td>
                          <td className="px-4 py-3"><StatusBadge status={st as "active" | "expired" | "revoked"} /></td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setVerifyTicket(t)}
                              className="flex items-center gap-1.5 rounded-xl border border-forest-200 px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-forest-50"
                            >
                              <QrCode size={13} /> Verify
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {list.map((t) => {
                  const route = routes.find((r) => r.id === t.routeId);
                  const st = ticketStatus(t);
                  return (
                    <Card key={t.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold">{t.id}</span>
                        <StatusBadge status={st as "active" | "expired" | "revoked"} />
                      </div>
                      <div className="mt-1 text-sm font-semibold">{t.studentName}</div>
                      <div className="text-xs text-ink-mute">Route {route?.number} · {t.fromStopName} → {t.toStopName}</div>
                      <div className="mt-1 text-xs text-ink-mute">{t.ticketType} · {t.passengers} pax · <span className="font-bold text-forest-700">₹{t.fare}</span></div>
                      <div className="mt-1 text-xs text-ink-mute">Expires {fmtDateTime(t.expiresAt)}</div>
                      <button
                        onClick={() => setVerifyTicket(t)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-forest-200 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50"
                      >
                        <QrCode size={15} /> Verify Ticket
                      </button>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
      </div>
    </>
  );
}
