"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, ExternalLink, TicketCheck } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { calcFare, issueTicket } from "@/lib/services";
import { Button, Card, Field, PageSkeleton, Select, StatusBadge } from "@/components/ui";
import { cn, fmtDateTime } from "@/lib/utils";
import { TicketQR, ticketVerifyUrl } from "@/components/TicketQR";
import { LottieSuccess } from "@/components/LottieSuccess";
import type { BusTicket } from "@/lib/types";

type Step = "book" | "done";

export default function TicketsPage() {
  const { user, profile, routes, stops } = useStudent();
  const tickets = useCollection(db.tickets);
  const toast = useToast();

  const [step, setStep] = useState<Step>("book");
  const [routeId, setRouteId] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [ticketType, setTicketType] = useState<"single" | "return">("single");
  const [passengers, setPassengers] = useState(1);
  const [issued, setIssued] = useState<BusTicket | null>(null);
  const [showLottie, setShowLottie] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"book" | "history">("book");

  const selectedRoute = routes.find((r) => r.id === routeId);
  const routeStops = useMemo(
    () => (routeId ? stops.filter((s) => s.routeId === routeId).sort((a, b) => a.order - b.order) : []),
    [stops, routeId]
  );
  const fromStop = routeStops.find((s) => s.id === fromId);
  const toStop = routeStops.find((s) => s.id === toId);
  const { fare, stations } = fromStop && toStop
    ? calcFare(fromStop.order, toStop.order, ticketType, passengers)
    : { fare: 0, stations: 0 };
  const myTickets = tickets
    .filter((t) => t.userId === user?.id)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  const isExpired = (t: BusTicket) => new Date(t.expiresAt).getTime() < Date.now();
  const ticketStatus = (t: BusTicket) => t.used ? "revoked" : isExpired(t) ? "expired" : "active";

  const canBook = routeId && fromId && toId && fromId !== toId && passengers >= 1;

  const handleBook = () => {
    if (!canBook || !user || !profile) return;
    setBusy(true);
    setTimeout(() => {
      try {
        const t = issueTicket({
          userId: user.id, studentProfileId: profile.id, studentName: profile.fullName,
          routeId, fromStopId: fromId, toStopId: toId,
          fromStopName: fromStop!.name, toStopName: toStop!.name,
          ticketType, passengers,
        });
        setIssued(t);
        setShowLottie(true);
        setStep("done");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not book ticket", "error");
      }
      setBusy(false);
    }, 400);
  };

  void selectedRoute; // suppress unused warning

  if (!user || !profile) return <PageSkeleton />;

  return (
    <>
      {/* Success overlay */}
      <AnimatePresence>
        {showLottie && (
          <LottieSuccess
            onDone={() => setShowLottie(false)}
            title="Ticket Booked!"
            subtitle="Valid for 24 hours. Show QR to conductor."
          />
        )}
      </AnimatePresence>

      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">Bus Tickets</h1>
          <p className="text-sm text-ink-mute">Book a single-journey or return ticket. Valid for 24 hours. ₹2 per 2 stations.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["book", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition capitalize",
                tab === t ? "border-forest-700 bg-forest-700 text-white" : "border-forest-100 bg-white text-ink-soft")}>
              {t === "book" ? "Book Ticket" : `My Tickets (${myTickets.length})`}
            </button>
          ))}
        </div>

        {tab === "history" ? (
          <div className="space-y-3">
            {myTickets.length === 0 ? (
              <Card className="p-8 text-center text-ink-mute">No tickets yet. Book your first one!</Card>
            ) : myTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} status={ticketStatus(t)} expandable />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === "done" && issued && !showLottie ? (
              <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex flex-col items-center pt-2 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-forest-600 text-white shadow-lift">
                    <TicketCheck size={36} />
                  </motion.div>
                  <h2 className="mt-4 text-xl font-extrabold">Ticket Booked!</h2>
                  <p className="text-sm text-ink-mute">Show the QR code to the conductor for verification.</p>
                </div>
                <TicketCard ticket={issued} status="active" showQR />
                <Button size="lg" full onClick={() => { setStep("book"); setIssued(null); setRouteId(""); setFromId(""); setToId(""); setPassengers(1); setTicketType("single"); }}>
                  Book Another
                </Button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Route */}
                <Card className="space-y-4 p-4">
                  <h2 className="font-bold">Journey Details</h2>
                  <Field label="Bus Route">
                    <Select value={routeId} onChange={(e) => { setRouteId(e.target.value); setFromId(""); setToId(""); }}>
                      <option value="">Select route</option>
                      {routes.map((r) => <option key={r.id} value={r.id}>Route {r.number} — {r.name}</option>)}
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="From">
                      <Select value={fromId} onChange={(e) => setFromId(e.target.value)} disabled={!routeId}>
                        <option value="">From stop</option>
                        {routeStops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="To">
                      <Select value={toId} onChange={(e) => setToId(e.target.value)} disabled={!routeId}>
                        <option value="">To stop</option>
                        {routeStops.filter((s) => s.id !== fromId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </Select>
                    </Field>
                  </div>
                </Card>

                {/* Type & passengers */}
                <Card className="space-y-4 p-4">
                  <h2 className="font-bold">Ticket Options</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {(["single", "return"] as const).map((type) => (
                      <button key={type} onClick={() => setTicketType(type)}
                        className={cn("rounded-2xl border p-3 text-left transition", ticketType === type ? "border-forest-600 bg-mint-50 ring-2 ring-forest-100" : "border-forest-100 bg-white")}>
                        <div className="text-sm font-bold capitalize">{type}</div>
                        <div className="text-xs text-ink-mute">{type === "single" ? "One way journey" : "Go & return"}</div>
                        {type === "return" && <div className="mt-0.5 text-xs font-semibold text-forest-600">2× single fare</div>}
                      </button>
                    ))}
                  </div>
                  <Field label="Number of passengers">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-forest-200 text-lg font-bold hover:bg-forest-50">−</button>
                      <span className="w-8 text-center text-lg font-extrabold">{passengers}</span>
                      <button onClick={() => setPassengers((p) => Math.min(10, p + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-forest-200 text-lg font-bold hover:bg-forest-50">+</button>
                      <span className="ml-1 text-sm text-ink-mute">max 10</span>
                    </div>
                  </Field>
                </Card>

                {/* Fare preview */}
                {canBook && stations > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-ink-mute">{fromStop?.name} → {toStop?.name}</div>
                          <div className="text-xs text-ink-mute">{stations} station{stations > 1 ? "s" : ""} · {ticketType} · {passengers} passenger{passengers > 1 ? "s" : ""}</div>
                        </div>
                        <div className="text-2xl font-extrabold text-forest-700">₹{fare}</div>
                      </div>
                      <div className="mt-1 text-xs text-ink-mute">Valid 24 hours from booking</div>
                    </Card>
                  </motion.div>
                )}

                <Button size="lg" full disabled={!canBook || stations === 0} loading={busy} onClick={handleBook} className="shadow-lift">
                  Book Ticket — {canBook && stations > 0 ? `₹${fare}` : "Select route & stops"} <ArrowRight size={18} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

function TicketCard({ ticket, status, showQR, expandable }: { ticket: BusTicket; status: string; showQR?: boolean; expandable?: boolean }) {
  const [expanded, setExpanded] = useState(showQR ?? false);
  const expiresAt = new Date(ticket.expiresAt);
  const isExpiredTicket = expiresAt.getTime() < Date.now();
  const remaining = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000));
  const hours = Math.floor(remaining / 60);
  const mins = remaining % 60;
  const canShowQR = status === "active" && !isExpiredTicket;

  return (
    <div className={cn("overflow-hidden rounded-2xl border shadow-soft",
      status === "active" ? "border-forest-200 bg-gradient-to-br from-forest-50 to-mint-50" : "border-forest-100 bg-white")}>
      {/* Ticket stub top */}
      <div className={cn("flex items-center justify-between px-4 py-3",
        status === "active" ? "bg-forest-700 text-white" : "bg-forest-100 text-ink-soft")}>
        <div className="flex items-center gap-2">
          <TicketCheck size={18} />
          <span className="font-bold tracking-wide">{ticket.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={status as "active" | "expired" | "revoked"}
            label={status === "active" && !isExpiredTicket ? (hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`) : undefined}
          />
          {/* Expand/collapse button for QR — only on history cards */}
          {expandable && canShowQR && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label={expanded ? "Hide QR" : "Show QR"}
            >
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} />
              </motion.span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-bold">{ticket.fromStopName}</div>
            <div className="text-xs text-ink-mute">From</div>
          </div>
          <ArrowRight size={18} className="shrink-0 text-forest-500" />
          <div className="flex-1 min-w-0 text-right">
            <div className="truncate text-sm font-bold">{ticket.toStopName}</div>
            <div className="text-xs text-ink-mute">To</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            ["Type", ticket.ticketType === "single" ? "Single" : "Return"],
            ["Pax", String(ticket.passengers)],
            ["Fare", `₹${ticket.fare}`],
            ["Stations", String(ticket.stations)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/80 p-1.5">
              <div className="text-[10px] font-semibold uppercase text-ink-mute">{k}</div>
              <div className="text-sm font-extrabold">{v}</div>
            </div>
          ))}
        </div>

        {/* QR Code section — always shown on "done" step, expandable on history */}
        <AnimatePresence>
          {(expanded || showQR) && canShowQR && (
            <motion.div
              key="qr"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-forest-100 bg-white p-4">
                <TicketQR ticket={ticket} size={180} />
                <p className="text-xs font-semibold text-ink-mute">Show to conductor to scan &amp; verify</p>
                <a
                  href={ticketVerifyUrl(ticket.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline"
                >
                  Open verify page <ExternalLink size={12} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to show QR hint on history */}
        {expandable && canShowQR && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 w-full rounded-xl border border-forest-200 bg-white py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50"
          >
            Tap to show QR code
          </button>
        )}

        <div className="mt-2 text-xs text-ink-mute">
          Issued: {fmtDateTime(ticket.issuedAt)} · Expires: {fmtDateTime(ticket.expiresAt)}
        </div>
      </div>
    </div>
  );
}
