"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, MapPin, ShieldCheck, Ticket, User, XCircle } from "lucide-react";
import { db, toCamel } from "@/lib/storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { daysLeft, fmtDate, fmtDateTime, passState, passTypeLabel } from "@/lib/utils";
import type { BusRoute, BusTicket, IssuedPass, StudentProfile } from "@/lib/types";

type PublicResult =
  | {
      type: "ticket";
      state: "valid" | "expired" | "used";
      ticket: BusTicket;
    }
  | {
      type: "pass";
      state: "valid" | "expired" | "revoked";
      pass: IssuedPass;
      profile?: StudentProfile;
      route?: BusRoute;
    }
  | {
      type: "not_found";
      query: string;
    }
  | {
      type: "loading";
    };

function VerifyInner() {
  const sp = useSearchParams();
  const rawQuery = sp.get("t") || sp.get("ticket") || sp.get("p") || sp.get("pass") || sp.get("id") || "";
  const [result, setResult] = useState<PublicResult>({ type: "loading" });

  useEffect(() => {
    let active = true;
    const runLookup = async () => {
      const q = rawQuery.trim().toUpperCase();
      if (!q) {
        if (active) setResult({ type: "not_found", query: "" });
        return;
      }

      // 1. Check ticket
      if (q.startsWith("TKT") || sp.get("t") || sp.get("ticket")) {
        let ticket = db.tickets.get(q) ?? db.tickets.all().find((t) => t.id.toUpperCase() === q);
        if (!ticket && isSupabaseConfigured() && supabase) {
          const { data: sbTicket } = await supabase.from("bus_tickets").select("*").ilike("id", q).maybeSingle();
          if (sbTicket && active) {
            ticket = toCamel(sbTicket, "bus_tickets") as unknown as BusTicket;
            if (!db.tickets.get(ticket.id)) db.tickets.add(ticket);
          }
        }
        if (ticket && active) {
          if (ticket.used) return setResult({ type: "ticket", state: "used", ticket });
          if (new Date(ticket.expiresAt).getTime() < Date.now()) return setResult({ type: "ticket", state: "expired", ticket });
          return setResult({ type: "ticket", state: "valid", ticket });
        }
      }

      // 2. Check pass
      if (q.startsWith("BP") || sp.get("p") || sp.get("pass")) {
        let pass = db.issuedPasses.get(q) ?? db.issuedPasses.all().find((p) => p.id.toUpperCase() === q);
        let profile = db.studentProfiles.all().find((p) => p.id === pass?.studentProfileId);
        let route = db.busRoutes.get(pass?.routeId);

        if (!pass && isSupabaseConfigured() && supabase) {
          const { data: sbPass } = await supabase.from("issued_passes").select("*").ilike("id", q).maybeSingle();
          if (sbPass && active) {
            pass = toCamel(sbPass, "issued_passes") as unknown as IssuedPass;
            if (!db.issuedPasses.get(pass.id)) db.issuedPasses.add(pass);
            if (pass.studentProfileId) {
              const { data: sbProf } = await supabase.from("student_profiles").select("*").eq("id", pass.studentProfileId).maybeSingle();
              if (sbProf) profile = toCamel(sbProf, "student_profiles") as unknown as StudentProfile;
            }
            if (pass.routeId) {
              const { data: sbRoute } = await supabase.from("bus_routes").select("*").eq("id", pass.routeId).maybeSingle();
              if (sbRoute) route = toCamel(sbRoute, "bus_routes") as unknown as BusRoute;
            }
          }
        }

        if (pass && active) {
          const s = passState(pass);
          return setResult({
            type: "pass",
            state: s === "active" ? "valid" : s,
            pass,
            profile,
            route,
          });
        }
      }

      // 3. Fallback search both
      let pass = db.issuedPasses.get(q) ?? db.issuedPasses.all().find((p) => p.id.toUpperCase() === q);
      if (!pass && isSupabaseConfigured() && supabase) {
        const { data: sbPass } = await supabase.from("issued_passes").select("*").ilike("id", q).maybeSingle();
        if (sbPass && active) {
          pass = toCamel(sbPass, "issued_passes") as unknown as IssuedPass;
          if (!db.issuedPasses.get(pass.id)) db.issuedPasses.add(pass);
        }
      }
      if (pass && active) {
        const s = passState(pass);
        const profile = db.studentProfiles.all().find((p) => p.id === pass.studentProfileId);
        const route = db.busRoutes.get(pass.routeId);
        return setResult({
          type: "pass",
          state: s === "active" ? "valid" : s,
          pass,
          profile,
          route,
        });
      }

      let ticket = db.tickets.get(q) ?? db.tickets.all().find((t) => t.id.toUpperCase() === q);
      if (!ticket && isSupabaseConfigured() && supabase) {
        const { data: sbTicket } = await supabase.from("bus_tickets").select("*").ilike("id", q).maybeSingle();
        if (sbTicket && active) {
          ticket = toCamel(sbTicket, "bus_tickets") as unknown as BusTicket;
          if (!db.tickets.get(ticket.id)) db.tickets.add(ticket);
        }
      }
      if (ticket && active) {
        if (ticket.used) return setResult({ type: "ticket", state: "used", ticket });
        if (new Date(ticket.expiresAt).getTime() < Date.now()) return setResult({ type: "ticket", state: "expired", ticket });
        return setResult({ type: "ticket", state: "valid", ticket });
      }

      if (active) setResult({ type: "not_found", query: q });
    };

    runLookup();
    return () => { active = false; };
  }, [rawQuery, sp]);

  const isValid = result.type !== "not_found" && result.type !== "loading" && result.state === "valid";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100">
        {/* Top Header Card */}
        <div
          className={`flex flex-col items-center gap-3 p-8 text-white ${
            isValid
              ? "bg-emerald-600"
              : result.type === "loading"
              ? "bg-gray-400"
              : result.type === "ticket" && result.state === "used"
              ? "bg-amber-500"
              : "bg-rose-600"
          }`}
        >
          {isValid ? (
            <CheckCircle2 size={56} className="animate-bounce" />
          ) : result.type === "ticket" && result.state === "used" ? (
            <AlertTriangle size={56} />
          ) : result.type === "loading" ? (
            <Clock size={56} />
          ) : (
            <XCircle size={56} />
          )}

          <span className="text-xl font-black tracking-wide uppercase text-center">
            {result.type === "ticket" && (result.state === "valid" ? "VALID TICKET" : result.state === "used" ? "ALREADY USED" : "EXPIRED TICKET")}
            {result.type === "pass" && (result.state === "valid" ? "VALID BUS PASS" : result.state === "expired" ? "PASS EXPIRED" : "PASS REVOKED")}
            {result.type === "not_found" && "NOT FOUND"}
            {result.type === "loading" && "VERIFYING..."}
          </span>
        </div>

        {/* Details Card */}
        <div className="p-6 space-y-4">
          {/* TICKET DETAILS */}
          {result.type === "ticket" && (
            <>
              <div className="rounded-2xl bg-gray-50 p-4 space-y-2.5 text-xs">
                <Row label="Ticket ID" value={result.ticket.id} bold />
                <Row label="Passenger" value={result.ticket.studentName} />
                <Row label="Journey" value={`${result.ticket.fromStopName} → ${result.ticket.toStopName}`} />
                <Row
                  label="Type"
                  value={`${result.ticket.ticketType === "single" ? "Single" : "Return"} · ${result.ticket.passengers} passenger(s)`}
                />
                <Row label="Fare Paid" value={`₹${result.ticket.fare}`} bold />
                <Row label="Issued" value={fmtDateTime(result.ticket.issuedAt)} />
                <Row label="Expires" value={fmtDateTime(result.ticket.expiresAt)} />
              </div>

              {result.state === "valid" && (
                <button
                  className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 active:scale-95 transition shadow-lift"
                  onClick={() => {
                    db.tickets.update(result.ticket.id, { used: true });
                    window.location.reload();
                  }}
                >
                  Mark as Used & Board
                </button>
              )}
            </>
          )}

          {/* PASS DETAILS */}
          {result.type === "pass" && (
            <div className="rounded-2xl bg-gray-50 p-4 space-y-2.5 text-xs">
              <Row label="Pass ID" value={result.pass.id} bold />
              {result.profile && (
                <>
                  <Row label="Student" value={result.profile.fullName} bold />
                  <Row label="Student ID" value={result.profile.studentId} />
                  <Row label="Course" value={`${result.profile.course} ${result.profile.year}`} />
                </>
              )}
              {result.route && <Row label="Route" value={`${result.route.number} (${result.route.start} → ${result.route.end})`} />}
              <Row label="Pass Type" value={passTypeLabel(result.pass.passType)} />
              <Row label="Valid Till" value={fmtDate(result.pass.expiryDate)} />
              <Row
                label="Status"
                value={result.state === "valid" ? `Active (${daysLeft(result.pass)} days remaining)` : result.state.toUpperCase()}
                bold
              />
            </div>
          )}

          {/* NOT FOUND */}
          {result.type === "not_found" && (
            <div className="p-4 text-center text-sm text-ink-mute">
              No pass or ticket found matching <span className="font-bold">“{result.query || "(empty)"}”</span>.<br />
              Please rescan the QR code.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3.5 text-center text-xs font-semibold text-ink-mute bg-gray-50/50">
          Yatrik · Live Verification System
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-ink-mute shrink-0">{label}</span>
      <span className={`text-xs text-right break-words ${bold ? "font-extrabold text-ink" : "font-semibold text-ink-soft"}`}>
        {value}
      </span>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-ink-mute">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
