"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, List, Map as MapIcon, MapPin, Navigation, Route as RouteIcon, Search } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { passTypeLabel, cn } from "@/lib/utils";
import MapView from "./MapView";
import { SchematicMap } from "./SchematicMap";
import { Button, EmptyState, Skeleton } from "./ui";

export default function RouteExplorer({ mode, initialRouteId }: { mode: "student" | "public"; initialRouteId?: string }) {
  const routes = useCollection(db.busRoutes);
  const stops = useCollection(db.busStops);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(initialRouteId ?? null);
  const [view, setView] = useState<"map" | "list">("map");
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const withStops = useMemo(() => routes.map((r) => ({ route: r, stops: stops.filter((s) => s.routeId === r.id).sort((a, b) => a.order - b.order) })), [routes, stops]);
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => !needle ? withStops : withStops.filter(({ route, stops }) =>
    [route.number, route.name, route.start, route.end, ...stops.map((s) => s.name)].some((t) => t.toLowerCase().includes(needle))), [withStops, needle]);
  const stopMatches = needle ? withStops.flatMap(({ route, stops }) => stops.filter((s) => s.name.toLowerCase().includes(needle)).map((s) => ({ s, route }))).slice(0, 5) : [];
  const selected = withStops.find((w) => w.route.id === sel);
  const mapItems = selected ? [selected] : filtered;
  const applyHref = (id: string) => (mode === "student" ? `/student/apply?route=${id}` : "/");

  const Detail = selected && (
    <motion.div key={selected.route.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-forest-100 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="rounded-lg px-2 py-0.5 text-sm font-extrabold text-white" style={{ background: selected.route.color }}>{selected.route.number}</span><h3 className="truncate font-bold">{selected.route.start} → {selected.route.end}</h3></div>
          <p className="mt-2 text-sm text-ink-soft">{selected.route.description}</p>
        </div>
        <button onClick={() => setSel(null)} className="shrink-0 text-xs font-semibold text-forest-600">All routes</button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-forest-50 p-2"><div className="text-xs text-ink-mute">Distance</div><div className="font-bold">{selected.route.distanceKm} km</div></div>
        <div className="rounded-xl bg-forest-50 p-2"><div className="text-xs text-ink-mute">Duration</div><div className="font-bold">{selected.route.durationMin} min</div></div>
        <div className="rounded-xl bg-forest-50 p-2"><div className="text-xs text-ink-mute">Stops</div><div className="font-bold">{selected.stops.length}</div></div>
      </div>
      <ol className="mt-4 space-y-0">
        {selected.stops.map((s, i) => (
          <li key={s.id}>
            <button onClick={() => { setFocus({ lat: s.lat, lng: s.lng }); setView("map"); }} className="flex w-full items-center gap-3 rounded-lg py-1.5 text-left text-sm hover:bg-forest-50">
              <span className="relative flex w-4 justify-center"><span className={cn("z-10 h-3 w-3 rounded-full border-[3px] bg-white", i === 0 || i === selected.stops.length - 1 ? "border-forest-700" : "border-forest-300")} />
                {i < selected.stops.length - 1 && <span className="absolute left-1/2 top-3 h-7 w-0.5 -translate-x-1/2 bg-forest-100" />}</span>
              <span className={cn(i === 0 || i === selected.stops.length - 1 ? "font-bold" : "font-medium")}>{s.name}</span>
              {i === 0 && <span className="ml-auto text-[10px] font-bold uppercase text-mint-500">Start</span>}
              {i === selected.stops.length - 1 && <span className="ml-auto text-[10px] font-bold uppercase text-forest-600">Destination</span>}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-1.5">{selected.route.passTypes.map((t) => <span key={t} className="rounded-full bg-mint-100 px-2.5 py-1 text-xs font-semibold text-forest-700">{passTypeLabel(t)}</span>)}</div>
      <Link href={applyHref(selected.route.id)} className="mt-4 block"><Button full>{mode === "student" ? "Apply for this route" : "Log in to apply"} <ArrowRight size={16} /></Button></Link>
    </motion.div>
  );

  const List_ = (
    <div className="space-y-2.5">
      {filtered.length === 0 && <EmptyState icon={RouteIcon} title="No routes found" text="Try a different stop, area or route number." />}
      {filtered.map(({ route, stops }) => (
        <motion.button layout key={route.id} onClick={() => { setSel(route.id); setFocus(null); }} whileTap={{ scale: 0.99 }}
          className={cn("w-full rounded-2xl border bg-white p-3.5 text-left shadow-soft transition hover:border-forest-300", sel === route.id ? "border-forest-500 ring-2 ring-forest-100" : "border-forest-50")}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: route.color }}>{route.number}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{route.start} → {route.end}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-mute"><span className="inline-flex items-center gap-1"><Navigation size={12} />{route.distanceKm} km</span><span className="inline-flex items-center gap-1"><Clock size={12} />{route.durationMin} min</span><span className="inline-flex items-center gap-1"><MapPin size={12} />{stops.length} stops</span></div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );

  if (!routes.length && !stops.length) return <Skeleton className="h-96" />;

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a location, stop or route number" aria-label="Search routes"
            className="h-12 w-full rounded-xl border border-forest-100 bg-white pl-10 pr-3 text-[15px] outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100" />
        </div>
        <div className="flex rounded-xl border border-forest-100 bg-white p-1 lg:hidden" role="tablist">
          {([["map", MapIcon], ["list", List]] as const).map(([v, Icon]) => (
            <button key={v} role="tab" aria-selected={view === v} aria-label={`${v} view`} onClick={() => setView(v)} className={cn("flex h-10 w-11 items-center justify-center rounded-lg transition", view === v ? "bg-forest-700 text-white" : "text-ink-soft")}><Icon size={18} /></button>
          ))}
        </div>
      </div>
      {stopMatches.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {stopMatches.map(({ s, route }) => (
            <button key={s.id} onClick={() => { setSel(route.id); setFocus({ lat: s.lat, lng: s.lng }); setView("map"); }} className="flex shrink-0 items-center gap-1.5 rounded-full border border-forest-100 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700"><MapPin size={12} />{s.name} · {route.number}</button>
          ))}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className={cn("order-2 space-y-3 lg:order-1 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1", view === "map" && "max-lg:order-2")}>
          <AnimatePresence mode="wait">{Detail ? <div key="d">{Detail}</div> : <div key="l" className={cn(view === "map" ? "" : "")}>{List_}</div>}</AnimatePresence>
        </div>
        <div className={cn("order-1 overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-soft lg:order-2", view === "list" && "max-lg:hidden")}>
          <div className="relative h-[52vh] min-h-[300px] lg:h-[640px]">
            {useFallback ? <SchematicMap items={mapItems} selectedId={sel} className="h-full w-full" /> : <MapView items={mapItems} selectedId={sel} onSelect={(id) => setSel(id)} focus={focus} className="h-full w-full" />}
            <button onClick={() => setUseFallback((f) => !f)} className="absolute bottom-2 left-2 z-[500] rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-forest-700 shadow">{useFallback ? "Live map" : "Illustration"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
