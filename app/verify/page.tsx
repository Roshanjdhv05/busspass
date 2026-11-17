"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { db } from "@/lib/storage";
import { fmtDateTime } from "@/lib/utils";
import type { BusTicket } from "@/lib/types";

type VerifyState = "loading" | "valid" | "expired" | "used" | "not_found";

function VerifyInner() {
  const sp = useSearchParams();
  const ticketId = sp.get("t") ?? "";
  const [ticket, setTicket] = useState<BusTicket | null>(null);
  const [state, setState] = useState<VerifyState>("loading");

  useEffect(() => {
    if (!ticketId) { setState("not_found"); return; }
    const t = db.tickets.get(ticketId);
    if (!t) { setState("not_found"); return; }
    setTicket(t);
    if (t.used) { setState("used"); return; }
    if (new Date(t.expiresAt).getTime() < Date.now()) { setState("expired"); return; }
    setState("valid");
  }, [ticketId]);

  const STATUS = {
    loading: { icon: Clock, color: "text-ink-mute", bg: "bg-gray-100", label: "Checking…" },
    valid:   { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100", label: "VALID TICKET" },
    expired: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-100", label: "EXPIRED" },
    used:    { icon: XCircle,  color: "text-red-600",  bg: "bg-red-100",  label: "ALREADY USED" },
    not_found:{ icon: XCircle, color: "text-red-600",  bg: "bg-red-100",  label: "TICKET NOT FOUND" },
  };

  const s = STATUS[state];
  const Icon = s.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-xl overflow-hidden">
        {/* header */}
        <div className={`flex flex-col items-center gap-3 p-8 ${state === "valid" ? "bg-emerald-600" : state === "loading" ? "bg-gray-200" : "bg-red-500"}`}>
          <Icon size={56} className="text-white" />
          <span className="text-xl font-extrabold text-white tracking-wide">{s.label}</span>
        </div>

        {ticket && (
          <div className="p-6 space-y-4">
            <div className="rounded-2xl bg-gray-50 p-4 space-y-2">
              <Row label="Ticket ID" value={ticket.id} bold />
              <Row label="Passenger" value={ticket.studentName} />
              <Row label="Journey" value={`${ticket.fromStopName} → ${ticket.toStopName}`} />
              <Row label="Type" value={`${ticket.ticketType === "single" ? "Single" : "Return"} · ${ticket.passengers} passenger${ticket.passengers > 1 ? "s" : ""}`} />
              <Row label="Fare" value={`₹${ticket.fare}`} bold />
              <Row label="Issued" value={fmtDateTime(ticket.issuedAt)} />
              <Row label="Expires" value={fmtDateTime(ticket.expiresAt)} highlight={state === "expired"} />
            </div>

            {state === "valid" && (
              <button
                className="w-full h-14 rounded-2xl bg-emerald-600 text-white text-base font-extrabold hover:bg-emerald-700 active:scale-95 transition"
                onClick={() => {
                  db.tickets.update(ticket.id, { used: true });
                  window.location.reload();
                }}
              >
                Mark as Used
              </button>
            )}

            {state === "expired" && (
              <p className="text-center text-sm text-red-500 font-semibold">This ticket expired and cannot be used.</p>
            )}
            {state === "used" && (
              <p className="text-center text-sm text-red-500 font-semibold">This ticket has already been validated.</p>
            )}
          </div>
        )}

        {state === "not_found" && (
          <div className="p-6 text-center text-sm text-ink-mute">
            No ticket found with ID <span className="font-bold">{ticketId || "(none)"}</span>.<br />
            Please scan the QR code again.
          </div>
        )}

        <div className="border-t border-gray-100 px-6 py-3 text-center text-xs text-ink-mute">
          Yatrik · Bus Ticket Verification
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-ink-mute shrink-0">{label}</span>
      <span className={`text-sm text-right ${bold ? "font-extrabold" : "font-medium"} ${highlight ? "text-red-500" : ""}`}>{value}</span>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-ink-mute">Loading…</div>}><VerifyInner /></Suspense>;
}
