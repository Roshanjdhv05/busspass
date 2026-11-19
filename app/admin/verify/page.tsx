"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ScanLine,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  Ticket as TicketIcon,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db, toCamel } from "@/lib/storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Avatar, Button, Card, Input } from "@/components/ui";
import { daysLeft, fmtDate, fmtDateTime, passState, passTypeLabel, cn } from "@/lib/utils";
import type { BusRoute, BusTicket, IssuedPass, StudentProfile } from "@/lib/types";

declare global {
  interface Window {
    BarcodeDetector?: new (o?: { formats: string[] }) => {
      detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]>;
    };
  }
}

type Result =
  | {
      type: "pass";
      kind: "valid" | "expired" | "revoked";
      pass: IssuedPass;
      profile?: StudentProfile;
      route?: BusRoute;
      query: string;
    }
  | {
      type: "ticket";
      kind: "valid" | "expired" | "used";
      ticket: BusTicket;
      query: string;
    }
  | {
      type: "unknown";
      kind: "notfound";
      query: string;
    };

/** Parse ticket payload if QR code contains full JSON ticket object */
function parseTicketPayload(raw: string): Partial<BusTicket> | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const j = JSON.parse(raw.slice(start, end + 1));
      if (j.id && typeof j.id === "string") {
        return {
          id: j.id.trim().toUpperCase(),
          fromStopName: j.from ?? "",
          toStopName: j.to ?? "",
          ticketType: j.type ?? "single",
          passengers: j.pax ?? 1,
          fare: j.fare ?? 0,
          expiresAt: j.exp ?? new Date().toISOString(),
          used: Boolean(j.used),
        };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Parse any QR code text, JSON string, or URL query into a clean ID */
function parseAnyInput(raw: string): string {
  const t = raw.trim();

  // 1. JSON payload from pass or ticket QR
  if (t.includes("{") && t.includes("}")) {
    try {
      const start = t.indexOf("{");
      const end = t.lastIndexOf("}");
      const j = JSON.parse(t.slice(start, end + 1));
      if (typeof j.pass === "string") return j.pass.trim().toUpperCase();
      if (typeof j.id === "string") return j.id.trim().toUpperCase();
    } catch {
      /* fall through */
    }
  }

  // 2. Full URL (e.g. http://localhost:3000/verify?t=TKT20260001 or ?p=BP20260001)
  if (t.includes("?")) {
    try {
      const url = new URL(t.startsWith("http") ? t : `http://dummy.com/${t}`);
      const ticketParam = url.searchParams.get("t") || url.searchParams.get("ticket");
      if (ticketParam) return ticketParam.trim().toUpperCase();
      const passParam = url.searchParams.get("p") || url.searchParams.get("pass");
      if (passParam) return passParam.trim().toUpperCase();
      const anyId = url.searchParams.get("id");
      if (anyId) return anyId.trim().toUpperCase();
    } catch {
      /* fall through */
    }
  }

  return t.replace(/^["']|["']$/g, "").trim().toUpperCase();
}

export default function Verify() {
  const passes = useCollection(db.issuedPasses);
  const tickets = useCollection(db.tickets);
  const profiles = useCollection(db.studentProfiles);
  const routes = useCollection(db.busRoutes);

  const [mode, setMode] = useState<"all" | "pass" | "ticket">("all");
  const [value, setValue] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [cam, setCam] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [validating, setValidating] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // Sync latest tickets and passes on mount so cache is fresh
  useEffect(() => {
    if (isSupabaseConfigured()) {
      db.tickets.syncFromSupabase();
      db.issuedPasses.syncFromSupabase();
    }
  }, []);

  const verify = async (raw: string) => {
    const id = parseAnyInput(raw);
    if (!id) return;
    setValidating(true);

    try {
      // Check if query is explicitly or matched as a Ticket
      const isExplicitTicket = id.startsWith("TKT");
      const isExplicitPass = id.startsWith("BP");
      const embeddedTicket = parseTicketPayload(raw);

      // 1. If explicit ticket or in ticket mode
      if (isExplicitTicket || mode === "ticket") {
        let ticket = db.tickets.get(id) ?? db.tickets.all().find((t) => t.id.toUpperCase() === id);

        // Live Supabase lookup if not found locally
        if (!ticket && isSupabaseConfigured() && supabase) {
          const { data: sbRow } = await supabase
            .from("bus_tickets")
            .select("*")
            .ilike("id", id)
            .maybeSingle();
          if (sbRow) {
            ticket = toCamel(sbRow, "bus_tickets") as unknown as BusTicket;
            if (!db.tickets.get(ticket.id)) db.tickets.add(ticket);
            else db.tickets.update(ticket.id, ticket);
          }
        }

        // If not in DB yet, but embedded in the QR payload
        if (!ticket && embeddedTicket && embeddedTicket.id === id) {
          ticket = {
            id: embeddedTicket.id,
            userId: "verified_passenger",
            studentProfileId: "",
            studentName: "Verified Rider",
            routeId: "",
            fromStopId: "",
            toStopId: "",
            fromStopName: embeddedTicket.fromStopName || "Origin",
            toStopName: embeddedTicket.toStopName || "Destination",
            ticketType: (embeddedTicket.ticketType as "single" | "return") || "single",
            passengers: embeddedTicket.passengers || 1,
            fare: embeddedTicket.fare || 0,
            stations: 1,
            issuedAt: new Date().toISOString(),
            expiresAt: embeddedTicket.expiresAt || new Date().toISOString(),
            used: embeddedTicket.used || false,
          };
          db.tickets.add(ticket);
        }

        if (ticket) {
          if (ticket.used) {
            return setRes({ type: "ticket", kind: "used", ticket, query: id });
          }
          if (new Date(ticket.expiresAt).getTime() < Date.now()) {
            return setRes({ type: "ticket", kind: "expired", ticket, query: id });
          }
          return setRes({ type: "ticket", kind: "valid", ticket, query: id });
        }
        if (isExplicitTicket) {
          return setRes({ type: "unknown", kind: "notfound", query: id });
        }
      }

      // 2. If explicit pass or in pass mode
      if (isExplicitPass || mode === "pass") {
        let pass = db.issuedPasses.get(id) ?? db.issuedPasses.all().find((p) => p.id.toUpperCase() === id);
        let profile = profiles.find((p) => p.id === pass?.studentProfileId);
        let route = routes.find((r) => r.id === pass?.routeId);

        // Live Supabase lookup if not found locally
        if (!pass && isSupabaseConfigured() && supabase) {
          const { data: sbPass } = await supabase
            .from("issued_passes")
            .select("*")
            .ilike("id", id)
            .maybeSingle();
          if (sbPass) {
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

        if (pass) {
          const s = passState(pass);
          return setRes({
            type: "pass",
            kind: s === "active" ? "valid" : s,
            pass,
            profile,
            route,
            query: id,
          });
        }
        if (isExplicitPass) {
          return setRes({ type: "unknown", kind: "notfound", query: id });
        }
      }

      // 3. Fallback: Search both collections with live Supabase query
      let pass = db.issuedPasses.get(id) ?? db.issuedPasses.all().find((p) => p.id.toUpperCase() === id);
      if (!pass && isSupabaseConfigured() && supabase) {
        const { data: sbPass } = await supabase.from("issued_passes").select("*").ilike("id", id).maybeSingle();
        if (sbPass) {
          pass = toCamel(sbPass, "issued_passes") as unknown as IssuedPass;
          if (!db.issuedPasses.get(pass.id)) db.issuedPasses.add(pass);
        }
      }
      if (pass) {
        const s = passState(pass);
        const profile = profiles.find((p) => p.id === pass.studentProfileId);
        const route = routes.find((r) => r.id === pass.routeId);
        return setRes({
          type: "pass",
          kind: s === "active" ? "valid" : s,
          pass,
          profile,
          route,
          query: id,
        });
      }

      let ticket = db.tickets.get(id) ?? db.tickets.all().find((t) => t.id.toUpperCase() === id);
      if (!ticket && isSupabaseConfigured() && supabase) {
        const { data: sbRow } = await supabase.from("bus_tickets").select("*").ilike("id", id).maybeSingle();
        if (sbRow) {
          ticket = toCamel(sbRow, "bus_tickets") as unknown as BusTicket;
          if (!db.tickets.get(ticket.id)) db.tickets.add(ticket);
        }
      }
      if (!ticket && embeddedTicket && embeddedTicket.id === id) {
        ticket = {
          id: embeddedTicket.id,
          userId: "verified_passenger",
          studentProfileId: "",
          studentName: "Verified Rider",
          routeId: "",
          fromStopId: "",
          toStopId: "",
          fromStopName: embeddedTicket.fromStopName || "Origin",
          toStopName: embeddedTicket.toStopName || "Destination",
          ticketType: (embeddedTicket.ticketType as "single" | "return") || "single",
          passengers: embeddedTicket.passengers || 1,
          fare: embeddedTicket.fare || 0,
          stations: 1,
          issuedAt: new Date().toISOString(),
          expiresAt: embeddedTicket.expiresAt || new Date().toISOString(),
          used: embeddedTicket.used || false,
        };
        db.tickets.add(ticket);
      }

      if (ticket) {
        if (ticket.used) {
          return setRes({ type: "ticket", kind: "used", ticket, query: id });
        }
        if (new Date(ticket.expiresAt).getTime() < Date.now()) {
          return setRes({ type: "ticket", kind: "expired", ticket, query: id });
        }
        return setRes({ type: "ticket", kind: "valid", ticket, query: id });
      }

      setRes({ type: "unknown", kind: "notfound", query: id });
    } finally {
      setValidating(false);
    }
  };

  // Mark valid ticket as used
  const handleMarkTicketUsed = async (tId: string) => {
    setValidating(true);
    db.tickets.update(tId, { used: true });
    if (isSupabaseConfigured() && supabase) {
      await supabase.from("bus_tickets").update({ used: true }).ilike("id", tId);
    }
    const updated = db.tickets.get(tId);
    if (updated) {
      setRes({ type: "ticket", kind: "used", ticket: { ...updated, used: true }, query: tId });
    }
    setValidating(false);
  };

  // Camera QR scanner
  useEffect(() => {
    if (!cam) return;
    let stream: MediaStream | undefined;
    let timer: number;
    let stopped = false;

    (async () => {
      try {
        if (!window.BarcodeDetector) {
          setCamErr("Live camera QR scanning isn't supported in this browser. Enter the Pass or Ticket ID below.");
          setCam(false);
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        const det = new window.BarcodeDetector!({ formats: ["qr_code"] });
        timer = window.setInterval(async () => {
          if (!video.current) return;
          try {
            const r = await det.detect(video.current);
            if (r[0]?.rawValue) {
              const detected = r[0].rawValue;
              setValue(detected);
              void verify(detected);
              setCam(false);
            }
          } catch {
            /* ignore frame */
          }
        }, 350);
      } catch {
        setCamErr("Camera access was denied or is unavailable.");
        setCam(false);
      }
    })();

    return () => {
      stopped = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [cam]);

  // Sample data chips for 1-click verification testing
  const samplePasses = [
    passes.find((p) => passState(p) === "active"),
    passes.find((p) => passState(p) === "expired"),
  ].filter(Boolean) as IssuedPass[];

  const sampleTickets = [
    tickets.find((t) => !t.used && new Date(t.expiresAt).getTime() > Date.now()),
    tickets.find((t) => t.used),
  ].filter(Boolean) as BusTicket[];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-ink">QR Verification</h1>
        <p className="text-sm text-ink-mute">
          Verify student bus passes and single / return ride tickets via camera scan or ID
        </p>
      </div>

      {/* Target Selector Tabs */}
      <div className="flex rounded-2xl border border-forest-100 bg-white p-1 shadow-soft" role="tablist">
        {[
          { key: "all", label: "Auto-detect (All)", icon: QrCode },
          { key: "pass", label: "Bus Passes", icon: ShieldCheck },
          { key: "ticket", label: "Daily Tickets", icon: TicketIcon },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setMode(tab.key as typeof mode);
              if (value) verify(value);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition",
              mode === tab.key ? "bg-forest-700 text-white shadow" : "text-ink-soft hover:bg-forest-50"
            )}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Scanner & Manual Input Card */}
      <Card className="p-4 shadow-soft">
        {/* Camera Box */}
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-forest-900 shadow-inner">
          <video ref={video} className={cn("h-full w-full object-cover", !cam && "hidden")} muted playsInline />
          {!cam && (
            <div className="flex h-full flex-col items-center justify-center gap-2.5 text-center text-white/80 p-6">
              <ScanLine size={44} className="text-mint-300 animate-pulse" />
              <div className="text-sm font-bold text-white">Ready to Scan</div>
              <p className="text-xs text-white/70 max-w-[200px]">
                Scan any student Yatrik Pass or Bus Ticket QR Code
              </p>
            </div>
          )}

          {/* Scanner Corner Crosshairs */}
          {["left-3 top-3 border-l-4 border-t-4 rounded-tl-xl", "right-3 top-3 border-r-4 border-t-4 rounded-tr-xl", "left-3 bottom-3 border-l-4 border-b-4 rounded-bl-xl", "right-3 bottom-3 border-r-4 border-b-4 rounded-br-xl"].map(
            (c) => (
              <span key={c} className={`absolute h-8 w-8 border-mint-300 ${c}`} />
            )
          )}

          {/* Animated Scanning Beam */}
          {cam && (
            <motion.span
              className="absolute inset-x-6 h-0.5 bg-mint-300 shadow-[0_0_12px_#8FDDB6]"
              animate={{ top: ["15%", "85%", "15%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        {/* Camera Toggle Button */}
        <Button
          variant="secondary"
          full
          className="mt-3 font-semibold"
          onClick={() => {
            setCamErr("");
            setCam((c) => !c);
          }}
        >
          {cam ? (
            <>
              <CameraOff size={16} /> Stop Camera
            </>
          ) : (
            <>
              <Camera size={16} /> Scan with Camera
            </>
          )}
        </Button>

        {camErr && <p role="alert" className="mt-2 text-center text-xs font-semibold text-orange-700">{camErr}</p>}

        {/* Input Form */}
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            verify(value);
          }}
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter ID e.g. BP20260001 or TKT20260001"
            aria-label="Pass or Ticket ID"
            autoComplete="off"
            className="font-semibold"
          />
          <Button type="submit" className="h-12 px-6 bg-forest-700 hover:bg-forest-800 text-white font-bold">
            Verify
          </Button>
        </form>

        {/* Quick Sample Test Chips */}
        <div className="mt-3.5 space-y-1.5 text-xs">
          <div className="font-semibold text-ink-mute">Quick Test Samples:</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {samplePasses.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setValue(p.id);
                  verify(p.id);
                }}
                className="rounded-full bg-forest-50 px-2.5 py-1 font-bold text-forest-700 hover:bg-forest-100 transition border border-forest-100"
              >
                Pass: {p.id} ({passState(p)})
              </button>
            ))}
            {sampleTickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setValue(t.id);
                  verify(t.id);
                }}
                className="rounded-full bg-mint-50 px-2.5 py-1 font-bold text-forest-800 hover:bg-mint-100 transition border border-mint-200"
              >
                Ticket: {t.id} {t.used ? "(Used)" : "(Valid)"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Verification Result Card */}
      <AnimatePresence mode="wait">
        {res && (
          <motion.div
            key={res.query + res.kind + ("used" in res ? String((res as { ticket?: BusTicket }).ticket?.used) : "")}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "rounded-3xl border p-5 shadow-lift transition",
              res.kind === "valid"
                ? "border-emerald-200 bg-emerald-50/80"
                : res.kind === "used"
                ? "border-amber-200 bg-amber-50/80"
                : res.kind === "expired"
                ? "border-rose-200 bg-rose-50/80"
                : "border-red-200 bg-red-50/80"
            )}
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div
                className={cn(
                  "flex items-center gap-2 text-xl font-extrabold",
                  res.kind === "valid"
                    ? "text-emerald-800"
                    : res.kind === "used"
                    ? "text-amber-800"
                    : "text-rose-800"
                )}
              >
                {res.kind === "valid" ? (
                  <ShieldCheck size={28} className="text-emerald-600" />
                ) : res.kind === "used" ? (
                  <AlertTriangle size={28} className="text-amber-600" />
                ) : res.kind === "expired" ? (
                  <ShieldAlert size={28} className="text-rose-600" />
                ) : (
                  <SearchX size={28} className="text-red-600" />
                )}
                <span>
                  {res.type === "pass" && (res.kind === "valid" ? "VALID BUS PASS" : res.kind === "expired" ? "PASS EXPIRED" : "PASS REVOKED")}
                  {res.type === "ticket" && (res.kind === "valid" ? "VALID RIDE TICKET" : res.kind === "used" ? "TICKET ALREADY USED" : "TICKET EXPIRED")}
                  {res.type === "unknown" && "RECORD NOT FOUND"}
                </span>
              </div>

              <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-xs font-bold shadow-sm">
                {res.query}
              </span>
            </div>

            {/* 1. BUS PASS RESULT */}
            {res.type === "pass" && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3.5 rounded-2xl bg-white/80 p-3.5 shadow-sm">
                  <Avatar name={res.profile?.fullName ?? "Student"} fileKey={res.profile?.photoKey} size={54} />
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-extrabold text-ink truncate">{res.profile?.fullName ?? "—"}</div>
                    <div className="text-xs text-ink-mute font-medium truncate">
                      {res.profile?.studentId} · {res.profile?.course} {res.profile?.year}
                    </div>
                    <div className="text-xs font-semibold text-forest-700 truncate">{res.profile?.college}</div>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white/80 p-2.5">
                    <dt className="text-ink-mute font-medium">Pass ID</dt>
                    <dd className="font-extrabold text-forest-900 mt-0.5">{res.pass.id}</dd>
                  </div>

                  <div className="rounded-xl bg-white/80 p-2.5">
                    <dt className="text-ink-mute font-medium">Pass Type</dt>
                    <dd className="font-extrabold text-ink mt-0.5">{passTypeLabel(res.pass.passType)}</dd>
                  </div>

                  <div className="rounded-xl bg-white/80 p-2.5">
                    <dt className="text-ink-mute font-medium">Route</dt>
                    <dd className="font-bold text-ink mt-0.5 truncate">
                      {res.route ? `Route ${res.route.number}` : "All Routes"}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white/80 p-2.5">
                    <dt className="text-ink-mute font-medium">Valid Till</dt>
                    <dd className="font-bold text-ink mt-0.5">
                      {fmtDate(res.pass.expiryDate)}{" "}
                      <span className="text-[11px] font-semibold text-forest-700">
                        ({daysLeft(res.pass)}d left)
                      </span>
                    </dd>
                  </div>
                </dl>

                {res.kind === "valid" ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-600 p-3 text-xs font-bold text-white shadow-lift">
                    <CheckCircle2 size={18} />
                    <span>Passenger verified. Valid to board.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-600 p-3 text-xs font-bold text-white shadow-lift">
                    <XCircle size={18} />
                    <span>Pass invalid or expired. Do not board.</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. BUS TICKET RESULT */}
            {res.type === "ticket" && (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-ink-mute font-medium">Passenger Name</div>
                      <div className="text-base font-extrabold text-ink">{res.ticket.studentName}</div>
                    </div>
                    <span className="rounded-xl bg-forest-100 px-3 py-1 text-xs font-black text-forest-800">
                      ₹{res.ticket.fare}
                    </span>
                  </div>

                  <div className="rounded-xl bg-forest-50/70 p-2.5 border border-forest-100 text-xs">
                    <div className="text-ink-mute font-medium">Journey</div>
                    <div className="font-extrabold text-forest-950 mt-0.5 flex items-center gap-1.5">
                      <MapPin size={13} className="text-forest-600" />
                      <span>{res.ticket.fromStopName}</span>
                      <span className="text-ink-mute">→</span>
                      <span>{res.ticket.toStopName}</span>
                    </div>
                    <div className="text-[11px] text-ink-mute mt-1">
                      {res.ticket.ticketType === "single" ? "Single Journey" : "Return Journey"} ·{" "}
                      {res.ticket.passengers} Passenger{res.ticket.passengers > 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-ink-mute">Issued: </span>
                      <span className="font-semibold">{fmtDateTime(res.ticket.issuedAt)}</span>
                    </div>
                    <div>
                      <span className="text-ink-mute">Expires: </span>
                      <span className="font-semibold">{fmtDateTime(res.ticket.expiresAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Action Button */}
                {res.kind === "valid" && (
                  <Button
                    full
                    loading={validating}
                    onClick={() => handleMarkTicketUsed(res.ticket.id)}
                    className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lift text-sm"
                  >
                    <CheckCircle2 size={18} /> Mark as Used & Allow Boarding
                  </Button>
                )}

                {res.kind === "used" && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-600 p-3 text-xs font-bold text-white shadow-lift">
                    <AlertTriangle size={18} />
                    <span>This ticket has already been used and validated.</span>
                  </div>
                )}

                {res.kind === "expired" && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-600 p-3 text-xs font-bold text-white shadow-lift">
                    <XCircle size={18} />
                    <span>Ticket expired (valid for 24 hours only).</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. NOT FOUND RESULT */}
            {res.type === "unknown" && (
              <div className="mt-3 text-sm text-red-800">
                <p>
                  No bus pass or ride ticket found matching <span className="font-bold">“{res.query}”</span>.
                </p>
                <p className="mt-1 text-xs text-red-700">
                  Please verify the QR code was scanned clearly or re-enter the ID.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
