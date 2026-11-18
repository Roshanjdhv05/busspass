"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Flag,
  HelpCircle,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db, uid } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { routeCascadeDelete } from "@/lib/services";
import MapView from "@/components/MapView";
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Textarea } from "@/components/ui";
import { PASS_TYPES, type BusRoute, type BusStop, type PassType } from "@/lib/types";
import { cn, estimateRouteKm, haversineKm, passState } from "@/lib/utils";

const COLORS = ["#155A3F", "#2563EB", "#D97706", "#7C3AED", "#DC2626", "#0891B2", "#BE185D"];

// Known landmarks in Mumbai / MMR for instant, accurate name deduction
const MUMBAI_LANDMARKS = [
  { name: "Mulund Campus Gate", lat: 19.1722, lng: 72.9565 },
  { name: "Mulund West Station", lat: 19.1726, lng: 72.9562 },
  { name: "Mulund Check Naka", lat: 19.1776, lng: 72.9604 },
  { name: "Thane Station West", lat: 19.186, lng: 72.9758 },
  { name: "Teen Hath Naka Thane", lat: 19.1944, lng: 72.965 },
  { name: "Cadbury Junction Thane", lat: 19.19, lng: 72.972 },
  { name: "Wagle Estate Thane", lat: 19.192, lng: 72.959 },
  { name: "Kapurbawdi Thane", lat: 19.215, lng: 72.985 },
  { name: "Bhandup Pumping", lat: 19.1436, lng: 72.9402 },
  { name: "Bhandup Station", lat: 19.145, lng: 72.937 },
  { name: "Kanjurmarg Station", lat: 19.1306, lng: 72.9296 },
  { name: "Vikhroli Station", lat: 19.1117, lng: 72.9279 },
  { name: "Ghatkopar Station", lat: 19.086, lng: 72.9081 },
  { name: "Ghatkopar East Depot", lat: 19.0864, lng: 72.918 },
  { name: "Kurla Station", lat: 19.0728, lng: 72.8842 },
  { name: "Kurla West Depot", lat: 19.0694, lng: 72.8793 },
  { name: "Sion Circle", lat: 19.039, lng: 72.8619 },
  { name: "Dadar Station East", lat: 19.0218, lng: 72.8456 },
  { name: "Dadar TT Circle", lat: 19.0178, lng: 72.8478 },
  { name: "Powai Lake", lat: 19.1262, lng: 72.9048 },
  { name: "Hiranandani Gardens Powai", lat: 19.1156, lng: 72.9108 },
  { name: "IIT Bombay Main Gate", lat: 19.1334, lng: 72.9133 },
  { name: "Sakivihar Road", lat: 19.1182, lng: 72.8936 },
  { name: "Marol Naka Andheri", lat: 19.1155, lng: 72.881 },
  { name: "Andheri Station East", lat: 19.1197, lng: 72.8464 },
  { name: "Andheri Station West", lat: 19.1197, lng: 72.8464 },
  { name: "DN Nagar Andheri", lat: 19.1245, lng: 72.8335 },
  { name: "Jogeshwari Junction", lat: 19.1393, lng: 72.8503 },
  { name: "Goregaon East", lat: 19.16, lng: 72.8697 },
  { name: "Goregaon Station West", lat: 19.1663, lng: 72.8493 },
  { name: "Malad Station West", lat: 19.1864, lng: 72.8485 },
  { name: "Malad East Bus Stop", lat: 19.183, lng: 72.86 },
  { name: "Kandivali Station", lat: 19.2043, lng: 72.8527 },
  { name: "Kandivali East", lat: 19.201, lng: 72.862 },
  { name: "Borivali Station East", lat: 19.2291, lng: 72.8573 },
  { name: "Borivali East Depot", lat: 19.225, lng: 72.864 },
  { name: "Airoli Circle", lat: 19.1575, lng: 72.9988 },
  { name: "Airoli Toll Naka", lat: 19.1648, lng: 72.981 },
  { name: "Ghansoli Station", lat: 19.118, lng: 73.01 },
  { name: "Koparkhairane", lat: 19.103, lng: 73.008 },
  { name: "Vashi Bus Depot", lat: 19.077, lng: 73.007 },
  { name: "Vashi Station", lat: 19.0745, lng: 72.9986 },
  { name: "Nerul Station", lat: 19.0345, lng: 73.0164 },
  { name: "Belapur CBD Station", lat: 19.0218, lng: 73.0398 },
  { name: "Kharghar Sector 7", lat: 19.043, lng: 73.068 },
  { name: "Kharghar Central Park", lat: 19.051, lng: 73.0629 },
  { name: "Panvel Bus Depot", lat: 18.9894, lng: 73.1175 },
  { name: "New Panvel Station", lat: 18.9942, lng: 73.1101 },
  { name: "Dombivli Station", lat: 19.2165, lng: 73.0862 },
  { name: "Kalyan Junction", lat: 19.2403, lng: 73.1305 },
  { name: "Bandra Station West", lat: 19.0544, lng: 72.8406 },
  { name: "Bandra Kurla Complex (BKC)", lat: 19.0657, lng: 72.868 },
  { name: "Santacruz Station", lat: 19.082, lng: 72.844 },
  { name: "Vile Parle Station", lat: 19.099, lng: 72.8597 },
  { name: "Worli Bus Depot", lat: 19.012, lng: 72.8197 },
  { name: "Chembur Station", lat: 19.062, lng: 72.899 },
];

/** Auto-deduct location name from latitude and longitude */
async function autoDeductName(lat: number, lng: number, fallback: string): Promise<string> {
  // 1. Check known landmark list
  let closest: { name: string; d: number } | null = null;
  for (const lm of MUMBAI_LANDMARKS) {
    const d = haversineKm({ lat, lng }, { lat: lm.lat, lng: lm.lng });
    if (d < 1.0 && (!closest || d < closest.d)) {
      closest = { name: lm.name, d };
    }
  }
  if (closest && closest.d < 0.6) return closest.name;

  // 2. Check existing database stops
  try {
    for (const s of db.busStops.all()) {
      const d = haversineKm({ lat, lng }, { lat: s.lat, lng: s.lng });
      if (d < 0.5 && (!closest || d < closest.d)) {
        closest = { name: s.name, d };
      }
    }
    if (closest && closest.d < 0.5) return closest.name;
  } catch { /* ignore */ }

  // 3. Online reverse-geocoding via OpenStreetMap Nominatim
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { signal: ctrl.signal }
    );
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const name =
        data.name ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        addr.village ||
        addr.city_district ||
        (data.display_name ? data.display_name.split(",")[0] : "");
      if (name && name.length >= 2) return name.trim();
    }
  } catch { /* ignore */ }

  return closest ? closest.name : fallback;
}

interface Draft {
  id?: string;
  number: string;
  name: string;
  start: string;
  end: string;
  description: string;
  distanceKm: string;
  durationMin: string;
  color: string;
  passTypes: PassType[];
  stops: { id: string; name: string; lat: string; lng: string }[];
}

type GuideStep = "start" | "end" | "stops" | "done";

const blank = (n: number): Draft => ({
  number: "",
  name: "",
  start: "",
  end: "",
  description: "",
  distanceKm: "",
  durationMin: "",
  color: COLORS[n % COLORS.length],
  passTypes: PASS_TYPES.map((p) => p.value),
  stops: [],
});

export default function RoutesAdmin() {
  const toast = useToast();
  const routes = useCollection(db.busRoutes);
  const stops = useCollection(db.busStops);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errs, setErrs] = useState<string[]>([]);
  const [del, setDel] = useState<BusRoute | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  // Guided interactive map builder state
  const [guideStep, setGuideStep] = useState<GuideStep>("start");
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number; name: string; isResolving: boolean } | null>(null);

  const withStops = useMemo(
    () =>
      routes.map((r) => ({
        route: r,
        stops: stops.filter((s) => s.routeId === r.id).sort((a, b) => a.order - b.order),
      })),
    [routes, stops]
  );

  const edit = (r: BusRoute) => {
    setErrs([]);
    setPendingPoint(null);
    setGuideStep("done");
    setDraft({
      id: r.id,
      number: r.number,
      name: r.name,
      start: r.start,
      end: r.end,
      description: r.description,
      distanceKm: String(r.distanceKm),
      durationMin: String(r.durationMin),
      color: r.color,
      passTypes: r.passTypes,
      stops: stops
        .filter((s) => s.routeId === r.id)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ id: s.id, name: s.name, lat: String(s.lat), lng: String(s.lng) })),
    });
  };

  const openNewRoute = () => {
    setErrs([]);
    setPendingPoint(null);
    setGuideStep("start");
    setDraft(blank(routes.length));
  };

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const setStop = (i: number, p: Partial<Draft["stops"][0]>) =>
    draft && patch({ stops: draft.stops.map((s, j) => (j === i ? { ...s, ...p } : s)) });

  const move = (i: number, dir: -1 | 1) => {
    if (!draft) return;
    const a = [...draft.stops];
    const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    patch({ stops: a });
    recalculateStats(a);
  };

  const removeStop = (i: number) => {
    if (!draft) return;
    const updated = draft.stops.filter((_, j) => j !== i);
    patch({
      stops: updated,
      start: updated[0]?.name ?? draft.start,
      end: updated[updated.length - 1]?.name ?? draft.end,
    });
    recalculateStats(updated);
  };

  // Recalculates Distance (km) and Travel Time (min) automatically
  const recalculateStats = (stopsList: Draft["stops"]) => {
    const valid = stopsList
      .filter((s) => isFinite(+s.lat) && isFinite(+s.lng) && s.lat !== "" && s.lng !== "")
      .map((s) => ({ lat: +s.lat, lng: +s.lng }));
    if (valid.length >= 2) {
      const km = estimateRouteKm(valid);
      const min = Math.max(10, Math.round((km / 22) * 60));
      patch({ distanceKm: String(km), durationMin: String(min) });
    }
  };

  // Handler when clicking on the map during route creation
  const handleMapClick = async (lat: number, lng: number) => {
    if (!draft) return;

    if (guideStep === "start") {
      setPendingPoint({ lat, lng, name: "Locating...", isResolving: true });
      const detected = await autoDeductName(lat, lng, "Start Point");
      setPendingPoint({ lat, lng, name: detected, isResolving: false });
    } else if (guideStep === "end") {
      setPendingPoint({ lat, lng, name: "Locating...", isResolving: true });
      const detected = await autoDeductName(lat, lng, "Destination");
      setPendingPoint({ lat, lng, name: detected, isResolving: false });
    } else {
      // "stops" or "done": Add intermediate stop directly
      const tempId = uid("stop");
      const detected = await autoDeductName(lat, lng, `Stop ${draft.stops.length + 1}`);
      const newStop = { id: tempId, name: detected, lat: lat.toFixed(5), lng: lng.toFixed(5) };

      // Insert before the last stop if an end stop exists, otherwise append
      let updatedStops: Draft["stops"];
      if (draft.stops.length >= 2) {
        const last = draft.stops[draft.stops.length - 1];
        const initial = draft.stops.slice(0, -1);
        updatedStops = [...initial, newStop, last];
      } else {
        updatedStops = [...draft.stops, newStop];
      }

      patch({ stops: updatedStops });
      recalculateStats(updatedStops);
      toast(`Added stop: ${detected}`, "info");
    }
  };

  // Confirm Start Point
  const confirmStartPoint = () => {
    if (!draft || !pendingPoint) return;
    const startStop = {
      id: uid("stop"),
      name: pendingPoint.name.trim() || "Start Point",
      lat: pendingPoint.lat.toFixed(5),
      lng: pendingPoint.lng.toFixed(5),
    };
    const updated = [startStop, ...draft.stops.slice(1)];
    patch({
      start: startStop.name,
      stops: updated,
      name: draft.name || (draft.end ? `${startStop.name} – ${draft.end}` : ""),
    });
    setPendingPoint(null);
    setGuideStep("end");
    toast(`✓ Start point set: ${startStop.name}`);
  };

  // Confirm End Point
  const confirmEndPoint = () => {
    if (!draft || !pendingPoint) return;
    const endStop = {
      id: uid("stop"),
      name: pendingPoint.name.trim() || "Destination",
      lat: pendingPoint.lat.toFixed(5),
      lng: pendingPoint.lng.toFixed(5),
    };
    const updated = [...draft.stops, endStop];
    const generatedName = draft.name || `${draft.start || "Campus"} – ${endStop.name}`;
    patch({
      end: endStop.name,
      stops: updated,
      name: generatedName,
      description: draft.description || `Direct express service from ${draft.start || "Start"} to ${endStop.name}.`,
    });
    recalculateStats(updated);
    setPendingPoint(null);
    setGuideStep("stops");
    toast(`✓ Destination set: ${endStop.name}`);
  };

  const preview = useMemo(() => {
    if (!draft) return [];
    const st: BusStop[] = draft.stops
      .filter((s) => isFinite(+s.lat) && isFinite(+s.lng) && s.lat !== "" && s.lng !== "")
      .map((s, i) => ({
        id: s.id,
        routeId: draft.id ?? "draft",
        name: s.name || `Stop ${i + 1}`,
        lat: +s.lat,
        lng: +s.lng,
        order: i,
      }));

    // If there's a pending point (not yet confirmed), add it as a preview pin
    if (pendingPoint) {
      st.push({
        id: "pending_pin",
        routeId: draft.id ?? "draft",
        name: `📍 Selected: ${pendingPoint.name}`,
        lat: pendingPoint.lat,
        lng: pendingPoint.lng,
        order: guideStep === "start" ? 0 : 999,
      });
    }

    const route: BusRoute = {
      id: draft.id ?? "draft",
      number: draft.number || "NEW",
      name: draft.name,
      start: draft.start,
      end: draft.end,
      description: draft.description,
      distanceKm: +draft.distanceKm || 0,
      durationMin: +draft.durationMin || 0,
      color: draft.color,
      passTypes: draft.passTypes,
      createdAt: "",
    };
    return [{ route, stops: st }];
  }, [draft, pendingPoint, guideStep]);

  const save = () => {
    if (!draft) return;
    const e: string[] = [];
    const num = draft.number.trim().toUpperCase();
    if (!num) e.push("Route number is required (e.g. 12A, 25X).");
    if (routes.some((r) => r.number.toUpperCase() === num && r.id !== draft.id)) {
      e.push(`Route number ${num} already exists.`);
    }
    if (draft.name.trim().length < 3) e.push("Route name is required.");
    if (draft.stops.length < 2) {
      e.push("Select and confirm at least 2 points on the map (Start and Destination).");
    }
    draft.stops.forEach((s, i) => {
      if (!s.name.trim()) e.push(`Stop ${i + 1} needs a name.`);
    });
    if (!(+draft.distanceKm > 0)) e.push("Distance must be greater than 0 km.");
    if (!(+draft.durationMin > 0)) e.push("Duration must be greater than 0 min.");
    if (!draft.passTypes.length) e.push("Select at least one pass type.");
    setErrs(e);
    if (e.length) return;

    const id = draft.id ?? uid("route");
    const now = new Date().toISOString();
    const route: BusRoute = {
      id,
      number: num,
      name: draft.name.trim(),
      start: draft.start.trim() || draft.stops[0].name.trim(),
      end: draft.end.trim() || draft.stops[draft.stops.length - 1].name.trim(),
      description: draft.description.trim() || `Express route connecting ${draft.start} to ${draft.end}.`,
      distanceKm: +draft.distanceKm,
      durationMin: Math.round(+draft.durationMin),
      color: draft.color,
      passTypes: draft.passTypes,
      createdAt: db.busRoutes.get(id)?.createdAt ?? now,
    };
    const newStops: BusStop[] = draft.stops.map((s, i) => ({
      id: s.id,
      routeId: id,
      name: s.name.trim(),
      lat: +s.lat,
      lng: +s.lng,
      order: i,
    }));
    db.busStops.replaceAll([...db.busStops.all().filter((s) => s.routeId !== id), ...newStops], true);
    if (draft.id) db.busRoutes.update(id, route);
    else db.busRoutes.add(route);
    toast(draft.id ? "Route updated successfully" : "Route added — live in student portal");
    setDraft(null);
  };

  const tryDelete = (r: BusRoute) => {
    const active = db.issuedPasses.all().filter((p) => p.routeId === r.id && passState(p) === "active").length;
    const open = db.applications
      .all()
      .filter((a) => a.routeId === r.id && (a.status === "pending" || a.status === "under_review")).length;
    if (active || open) {
      return toast(`Can't delete: ${active} active pass(es) and ${open} open application(s) use this route.`, "error");
    }
    setDel(r);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Route Management</h1>
          <p className="text-sm text-ink-mute">Create bus routes with interactive map stop deduction</p>
        </div>
        <Button onClick={openNewRoute} className="bg-forest-700 hover:bg-forest-800 text-white shadow-lift font-bold">
          <Plus size={16} /> Add route
        </Button>
      </div>

      {/* Main Routes Grid & Map View */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {withStops.length === 0 && (
            <Card>
              <EmptyState
                icon={RouteIcon}
                title="No routes yet"
                text="Create your first bus route."
                action={<Button onClick={openNewRoute}>Add route</Button>}
              />
            </Card>
          )}
          {withStops.map(({ route: r, stops: st }) => (
            <Card key={r.id} className={cn("p-4 transition hover:shadow-soft", sel === r.id && "ring-2 ring-forest-600")}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setSel(sel === r.id ? null : r.id)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow"
                  style={{ background: r.color }}
                  aria-label={`Show route ${r.number} on map`}
                >
                  {r.number}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-ink">
                    {r.start} → {r.end}
                  </div>
                  <div className="truncate text-xs text-ink-mute">{r.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Navigation size={12} className="text-forest-600" />
                      {r.distanceKm} km
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock size={12} className="text-forest-600" />
                      {r.durationMin} min
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <MapPin size={12} className="text-forest-600" />
                      {st.length} stops
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => edit(r)}
                    aria-label={`Edit route ${r.number}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-forest-700 hover:bg-forest-50"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    onClick={() => tryDelete(r)}
                    aria-label={`Delete route ${r.number}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden xl:sticky xl:top-20 xl:self-start border border-forest-100">
          <div className="h-[320px] sm:h-[420px] xl:h-[560px]">
            <MapView
              items={sel ? withStops.filter((w) => w.route.id === sel) : withStops}
              selectedId={sel}
              onSelect={setSel}
            />
          </div>
        </Card>
      </div>

      {/* ── Guided Route Builder Modal ────────────────────────────────────── */}
      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        wide
        title={draft?.id ? `Edit Route ${draft.number}` : "Add New Route"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} className="bg-forest-700 hover:bg-forest-800 text-white font-bold shadow-lift">
              {draft?.id ? "Save Changes" : "Create Route"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {errs.length > 0 && (
              <ul role="alert" className="list-disc rounded-2xl bg-red-50 py-3 pl-8 pr-3 text-sm font-medium text-red-700">
                {errs.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}

            {/* 1. TOP TEXT INPUTS: Route Number & Route Name */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Route number">
                <Input
                  value={draft.number}
                  onChange={(e) => patch({ number: e.target.value })}
                  placeholder="e.g. 19D"
                  className="font-bold uppercase tracking-wider text-forest-800"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Route name">
                  <Input
                    value={draft.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="e.g. Vashi – Mulund Express"
                    className="font-semibold"
                  />
                </Field>
              </div>
            </div>

            {/* 2. DIRECT INTERACTIVE MAP WITH GUIDED STEPS */}
            <div className="rounded-2xl border border-forest-200 bg-white p-3.5 shadow-sm space-y-3">
              {/* Step Guidance Header */}
              <div className="flex items-center justify-between gap-2 border-b border-forest-100 pb-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  {guideStep === "start" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      1
                    </span>
                  )}
                  {guideStep === "end" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                      2
                    </span>
                  )}
                  {guideStep === "stops" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                      3
                    </span>
                  )}
                  {guideStep === "done" && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-xs font-bold text-white">
                      ✓
                    </span>
                  )}
                  <div>
                    <h3 className="text-sm font-black text-ink">
                      {guideStep === "start" && "Step 1: Select First Point (Start)"}
                      {guideStep === "end" && "Step 2: Select End Point (Destination)"}
                      {guideStep === "stops" && "Step 3: Select Intermediate Stops on Map"}
                      {guideStep === "done" && "Route Map Ready"}
                    </h3>
                    <p className="text-xs text-ink-mute">
                      {guideStep === "start" && "Click anywhere on the map to set starting point"}
                      {guideStep === "end" && "Click on the map to place destination location"}
                      {guideStep === "stops" && "Click map between start and end to add stops"}
                      {guideStep === "done" && "Click map to add more stops or edit below"}
                    </p>
                  </div>
                </div>

                {/* Step Switchers */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPoint(null);
                      setGuideStep("start");
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-bold transition",
                      guideStep === "start" ? "bg-emerald-600 text-white" : "bg-forest-50 text-ink-soft hover:bg-forest-100"
                    )}
                  >
                    Start Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPoint(null);
                      setGuideStep("end");
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-bold transition",
                      guideStep === "end" ? "bg-rose-600 text-white" : "bg-forest-50 text-ink-soft hover:bg-forest-100"
                    )}
                  >
                    End Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingPoint(null);
                      setGuideStep("stops");
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-bold transition",
                      guideStep === "stops" ? "bg-amber-600 text-white" : "bg-forest-50 text-ink-soft hover:bg-forest-100"
                    )}
                  >
                    + Stops
                  </button>
                </div>
              </div>

              {/* Confirmation Card for Pending Start / End selection */}
              {pendingPoint && (
                <div className="rounded-xl border border-forest-300 bg-mint-50/90 p-3 shadow-sm animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-[11px] font-bold text-forest-800 uppercase tracking-wider">
                        {guideStep === "start" ? "📍 Starting Location (Auto-Deducted)" : "🎯 Destination Location (Auto-Deducted)"}
                      </div>
                      <Input
                        value={pendingPoint.name}
                        onChange={(e) => setPendingPoint({ ...pendingPoint, name: e.target.value })}
                        className="h-9 mt-1 text-sm font-bold bg-white text-forest-950"
                        placeholder="Location name..."
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      {guideStep === "start" ? (
                        <Button size="sm" onClick={confirmStartPoint} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                          <Check size={14} /> Confirm Start Point
                        </Button>
                      ) : (
                        <Button size="sm" onClick={confirmEndPoint} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                          <Check size={14} /> Confirm Destination
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => setPendingPoint(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Map */}
              <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-2xl border border-forest-100 shadow-inner">
                <MapView items={preview} onMapClick={handleMapClick} />
                <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {guideStep === "start" && "👈 Click map to place Start Point (A)"}
                  {guideStep === "end" && "👈 Click map to place Destination (B)"}
                  {guideStep === "stops" && "👈 Click map to insert a stop"}
                  {guideStep === "done" && "👈 Click map to add more stops"}
                </div>
              </div>
            </div>

            {/* 3. AUTO-DEDUCTED DETAILS (Time, Distance, Stops) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-2xl border border-forest-100 bg-forest-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-mute font-medium">
                  <Navigation size={14} className="text-forest-600" /> Total Distance
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-forest-900">{draft.distanceKm || "0"}</span>
                  <span className="text-xs font-bold text-ink-mute">km (auto)</span>
                </div>
              </div>

              <div className="rounded-2xl border border-forest-100 bg-forest-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-mute font-medium">
                  <Clock size={14} className="text-forest-600" /> Est. Travel Time
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-forest-900">{draft.durationMin || "0"}</span>
                  <span className="text-xs font-bold text-ink-mute">min (auto)</span>
                </div>
              </div>

              <div className="rounded-2xl border border-forest-100 bg-forest-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-mute font-medium">
                  <Flag size={14} className="text-emerald-600" /> Start Point
                </div>
                <div className="mt-1 text-xs font-extrabold text-forest-950 truncate">
                  {draft.start || "Not set yet"}
                </div>
              </div>

              <div className="rounded-2xl border border-forest-100 bg-forest-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-mute font-medium">
                  <Compass size={14} className="text-rose-600" /> Destination
                </div>
                <div className="mt-1 text-xs font-extrabold text-forest-950 truncate">
                  {draft.end || "Not set yet"}
                </div>
              </div>
            </div>

            {/* 4. BUS STOPS LIST (Auto-named & reorderable) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                  Stops on Route ({draft.stops.length})
                </span>
                <span className="text-xs font-medium text-ink-mute">
                  {draft.stops.length < 2 ? "Need at least Start and End" : "Stops connected in order"}
                </span>
              </div>

              {draft.stops.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-forest-200 bg-cream p-4 text-center text-xs text-ink-mute">
                  No stops added yet. Click on the map above to select your First point (Start) and End point.
                </div>
              ) : (
                <ol className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {draft.stops.map((s, i) => (
                    <li
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-xs transition",
                        i === 0
                          ? "border-emerald-200 bg-emerald-50/50"
                          : i === draft.stops.length - 1
                          ? "border-rose-200 bg-rose-50/50"
                          : "border-forest-100 bg-white"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                          i === 0 ? "bg-emerald-600" : i === draft.stops.length - 1 ? "bg-rose-600" : "bg-forest-700"
                        )}
                      >
                        {i === 0 ? "A" : i === draft.stops.length - 1 ? "B" : i + 1}
                      </span>
                      <Input
                        value={s.name}
                        onChange={(e) => setStop(i, { name: e.target.value })}
                        className="h-8 text-xs font-semibold"
                        aria-label={`Stop ${i + 1} name`}
                      />
                      <span className="text-[10px] text-ink-mute font-mono shrink-0 hidden sm:inline">
                        {s.lat.slice(0, 6)}, {s.lng.slice(0, 6)}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          aria-label="Move up"
                          className="flex h-7 w-7 items-center justify-center rounded hover:bg-forest-100 disabled:opacity-20"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={i === draft.stops.length - 1}
                          aria-label="Move down"
                          className="flex h-7 w-7 items-center justify-center rounded hover:bg-forest-100 disabled:opacity-20"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStop(i)}
                          aria-label="Remove stop"
                          className="flex h-7 w-7 items-center justify-center rounded text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* 5. Additional Route Settings (Collapsible or Clean Layout) */}
            <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-forest-50">
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Line Color</div>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Colour ${c}`}
                      aria-pressed={draft.color === c}
                      onClick={() => patch({ color: c })}
                      className={cn(
                        "h-8 w-8 rounded-full ring-offset-2 transition",
                        draft.color === c && "ring-2 ring-forest-700 scale-105"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Pass Types Available</div>
                <div className="flex flex-wrap gap-1.5">
                  {PASS_TYPES.map((t) => {
                    const on = draft.passTypes.includes(t.value);
                    return (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          patch({
                            passTypes: on
                              ? draft.passTypes.filter((x) => x !== t.value)
                              : [...draft.passTypes, t.value],
                          })
                        }
                        className={cn(
                          "h-8 rounded-full border px-3 text-xs font-semibold transition",
                          on
                            ? "border-forest-700 bg-forest-700 text-white"
                            : "border-forest-200 text-ink-soft bg-white hover:bg-forest-50"
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!del}
        danger
        title={`Delete route ${del?.number}?`}
        message="The route and all its stops will be removed from the student portal. Past applications keep their records."
        confirmLabel="Delete route"
        onConfirm={() => {
          if (del) {
            routeCascadeDelete(del.id);
            toast("Route deleted");
          }
        }}
        onClose={() => setDel(null)}
      />
    </div>
  );
}
