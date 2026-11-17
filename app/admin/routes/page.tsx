"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Clock, MapPin, Navigation, Pencil, Plus, Route as RouteIcon, Trash2, Wand2 } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db, uid } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { routeCascadeDelete } from "@/lib/services";
import MapView from "@/components/MapView";
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Textarea } from "@/components/ui";
import { PASS_TYPES, type BusRoute, type BusStop, type PassType } from "@/lib/types";
import { cn, estimateRouteKm, passState } from "@/lib/utils";

const COLORS = ["#155A3F", "#2563EB", "#D97706", "#7C3AED", "#DC2626", "#0891B2", "#BE185D"];
interface Draft { id?: string; number: string; name: string; start: string; end: string; description: string; distanceKm: string; durationMin: string; color: string; passTypes: PassType[]; stops: { id: string; name: string; lat: string; lng: string }[] }

const blank = (n: number): Draft => ({ number: "", name: "", start: "", end: "", description: "", distanceKm: "", durationMin: "", color: COLORS[n % COLORS.length], passTypes: PASS_TYPES.map((p) => p.value), stops: [] });

export default function RoutesAdmin() {
  const toast = useToast();
  const routes = useCollection(db.busRoutes);
  const stops = useCollection(db.busStops);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errs, setErrs] = useState<string[]>([]);
  const [del, setDel] = useState<BusRoute | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  const withStops = useMemo(() => routes.map((r) => ({ route: r, stops: stops.filter((s) => s.routeId === r.id).sort((a, b) => a.order - b.order) })), [routes, stops]);

  const edit = (r: BusRoute) => {
    setErrs([]);
    setDraft({ id: r.id, number: r.number, name: r.name, start: r.start, end: r.end, description: r.description, distanceKm: String(r.distanceKm), durationMin: String(r.durationMin), color: r.color, passTypes: r.passTypes,
      stops: stops.filter((s) => s.routeId === r.id).sort((a, b) => a.order - b.order).map((s) => ({ id: s.id, name: s.name, lat: String(s.lat), lng: String(s.lng) })) });
  };
  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const setStop = (i: number, p: Partial<Draft["stops"][0]>) => draft && patch({ stops: draft.stops.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const move = (i: number, dir: -1 | 1) => { if (!draft) return; const a = [...draft.stops]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; patch({ stops: a }); };
  const addStopAt = (lat: number, lng: number) => setDraft((d) => d && { ...d, stops: [...d.stops, { id: uid("stop"), name: `Stop ${d.stops.length + 1}`, lat: lat.toFixed(5), lng: lng.toFixed(5) }] });

  const preview = useMemo(() => {
    if (!draft) return [];
    const st: BusStop[] = draft.stops.filter((s) => isFinite(+s.lat) && isFinite(+s.lng) && s.lat !== "" && s.lng !== "").map((s, i) => ({ id: s.id, routeId: draft.id ?? "draft", name: s.name || `Stop ${i + 1}`, lat: +s.lat, lng: +s.lng, order: i }));
    const route: BusRoute = { id: draft.id ?? "draft", number: draft.number || "NEW", name: draft.name, start: draft.start, end: draft.end, description: draft.description, distanceKm: +draft.distanceKm || 0, durationMin: +draft.durationMin || 0, color: draft.color, passTypes: draft.passTypes, createdAt: "" };
    return [{ route, stops: st }];
  }, [draft]);

  const autoDistance = () => { if (!draft) return; const km = estimateRouteKm(preview[0].stops); patch({ distanceKm: String(km), durationMin: draft.durationMin || String(Math.round((km / 22) * 60)) }); };

  const save = () => {
    if (!draft) return;
    const e: string[] = [];
    const num = draft.number.trim().toUpperCase();
    if (!num) e.push("Route number is required.");
    if (routes.some((r) => r.number.toUpperCase() === num && r.id !== draft.id)) e.push(`Route number ${num} already exists.`);
    if (draft.name.trim().length < 3) e.push("Route name is required.");
    if (draft.stops.length < 2) e.push("Add at least 2 stops (click the map or use “Add stop”).");
    draft.stops.forEach((s, i) => { if (!s.name.trim()) e.push(`Stop ${i + 1} needs a name.`); if (!(+s.lat >= -90 && +s.lat <= 90) || s.lat === "") e.push(`Stop ${i + 1}: invalid latitude.`); if (!(+s.lng >= -180 && +s.lng <= 180) || s.lng === "") e.push(`Stop ${i + 1}: invalid longitude.`); });
    if (!(+draft.distanceKm > 0)) e.push("Distance must be greater than 0.");
    if (!(+draft.durationMin > 0)) e.push("Duration must be greater than 0.");
    if (!draft.passTypes.length) e.push("Select at least one pass type.");
    setErrs(e); if (e.length) return;

    const id = draft.id ?? uid("route");
    const now = new Date().toISOString();
    const route: BusRoute = { id, number: num, name: draft.name.trim(), start: draft.start.trim() || draft.stops[0].name.trim(), end: draft.end.trim() || draft.stops[draft.stops.length - 1].name.trim(), description: draft.description.trim(), distanceKm: +draft.distanceKm, durationMin: Math.round(+draft.durationMin), color: draft.color, passTypes: draft.passTypes, createdAt: db.busRoutes.get(id)?.createdAt ?? now };
    const newStops: BusStop[] = draft.stops.map((s, i) => ({ id: s.id, routeId: id, name: s.name.trim(), lat: +s.lat, lng: +s.lng, order: i }));
    db.busStops.replaceAll([...db.busStops.all().filter((s) => s.routeId !== id), ...newStops], true);
    if (draft.id) db.busRoutes.update(id, route); else db.busRoutes.add(route);
    toast(draft.id ? "Route updated — live in the student portal" : "Route added — live in the student portal");
    setDraft(null);
  };

  const tryDelete = (r: BusRoute) => {
    const active = db.issuedPasses.all().filter((p) => p.routeId === r.id && passState(p) === "active").length;
    const open = db.applications.all().filter((a) => a.routeId === r.id && (a.status === "pending" || a.status === "under_review")).length;
    if (active || open) return toast(`Can't delete: ${active} active pass(es) and ${open} open application(s) use this route.`, "error");
    setDel(r);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold">Route Management</h1><p className="text-sm text-ink-mute">Changes appear instantly in the student portal</p></div>
        <Button onClick={() => { setErrs([]); setDraft(blank(routes.length)); }}><Plus size={16} /> Add route</Button></div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {withStops.length === 0 && <Card><EmptyState icon={RouteIcon} title="No routes yet" text="Create your first bus route." action={<Button onClick={() => setDraft(blank(0))}>Add route</Button>} /></Card>}
          {withStops.map(({ route: r, stops: st }) => (
            <Card key={r.id} className={cn("p-4 transition", sel === r.id && "ring-2 ring-forest-300")}>
              <div className="flex items-start gap-3">
                <button onClick={() => setSel(sel === r.id ? null : r.id)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: r.color }} aria-label={`Show route ${r.number} on map`}>{r.number}</button>
                <div className="min-w-0 flex-1"><div className="truncate font-bold">{r.start} → {r.end}</div><div className="truncate text-xs text-ink-mute">{r.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-soft"><span className="inline-flex items-center gap-1"><Navigation size={12} />{r.distanceKm} km</span><span className="inline-flex items-center gap-1"><Clock size={12} />{r.durationMin} min</span><span className="inline-flex items-center gap-1"><MapPin size={12} />{st.length} stops</span></div></div>
                <div className="flex shrink-0 gap-1"><button onClick={() => edit(r)} aria-label={`Edit route ${r.number}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-forest-700 hover:bg-forest-50"><Pencil size={17} /></button>
                  <button onClick={() => tryDelete(r)} aria-label={`Delete route ${r.number}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={17} /></button></div>
              </div>
            </Card>))}
        </div>
        <Card className="overflow-hidden xl:sticky xl:top-20 xl:self-start"><div className="h-[320px] sm:h-[420px] xl:h-[560px]"><MapView items={sel ? withStops.filter((w) => w.route.id === sel) : withStops} selectedId={sel} onSelect={setSel} /></div></Card>
      </div>

      <Modal open={!!draft} onClose={() => setDraft(null)} wide title={draft?.id ? `Edit route ${draft.number}` : "Add new route"} footer={<><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={save}>{draft?.id ? "Save changes" : "Create route"}</Button></>}>
        {draft && <div className="space-y-4">
          {errs.length > 0 && <ul role="alert" className="list-disc rounded-xl bg-red-50 py-3 pl-8 pr-3 text-sm font-medium text-red-700">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
          <div className="grid gap-3 sm:grid-cols-3"><Field label="Route number"><Input value={draft.number} onChange={(e) => patch({ number: e.target.value })} placeholder="22E" /></Field><div className="sm:col-span-2"><Field label="Route name"><Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Kurla – Mulund Campus" /></Field></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Starting location" hint="Defaults to first stop"><Input value={draft.start} onChange={(e) => patch({ start: e.target.value })} /></Field><Field label="Ending location" hint="Defaults to last stop"><Input value={draft.end} onChange={(e) => patch({ end: e.target.value })} /></Field></div>
          <Field label="Description"><Textarea value={draft.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Timings, notable areas covered…" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Distance (km)"><Input inputMode="decimal" value={draft.distanceKm} onChange={(e) => patch({ distanceKm: e.target.value })} /></Field><Field label="Est. duration (min)"><Input inputMode="numeric" value={draft.durationMin} onChange={(e) => patch({ durationMin: e.target.value })} /></Field></div>
          <Button variant="secondary" size="sm" onClick={autoDistance} disabled={draft.stops.length < 2}><Wand2 size={14} /> Estimate from stops</Button>
          <div><div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Line colour</div><div className="flex flex-wrap gap-2">{COLORS.map((c) => <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={draft.color === c} onClick={() => patch({ color: c })} className={cn("h-9 w-9 rounded-full ring-offset-2 transition", draft.color === c && "ring-2 ring-forest-700")} style={{ background: c }} />)}</div></div>
          <div><div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Available pass types</div><div className="flex flex-wrap gap-2">{PASS_TYPES.map((t) => { const on = draft.passTypes.includes(t.value); return <button key={t.value} type="button" aria-pressed={on} onClick={() => patch({ passTypes: on ? draft.passTypes.filter((x) => x !== t.value) : [...draft.passTypes, t.value] })} className={cn("h-10 rounded-full border px-4 text-sm font-semibold", on ? "border-forest-700 bg-forest-700 text-white" : "border-forest-100 text-ink-soft")}>{t.label}</button>; })}</div></div>

          <div><div className="mb-1.5 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Bus stops ({draft.stops.length}) — click the map to add</span>
            <Button size="sm" variant="secondary" onClick={() => addStopAt(19.13 + draft.stops.length * 0.005, 72.9 + draft.stops.length * 0.005)}><Plus size={14} /> Add stop</Button></div>
            <div className="h-64 overflow-hidden rounded-2xl border border-forest-100"><MapView items={preview} onMapClick={addStopAt} /></div>
            <ol className="mt-3 space-y-2">
              {draft.stops.map((s, i) => (
                <li key={s.id} className="rounded-xl border border-forest-100 p-2.5">
                  <div className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-700 text-xs font-bold text-white">{i + 1}</span><Input value={s.name} onChange={(e) => setStop(i, { name: e.target.value })} className="h-10" aria-label={`Stop ${i + 1} name`} />
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-forest-50 disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === draft.stops.length - 1} aria-label="Move down" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-forest-50 disabled:opacity-30"><ArrowDown size={16} /></button>
                    <button type="button" onClick={() => patch({ stops: draft.stops.filter((_, j) => j !== i) })} aria-label="Remove stop" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></div>
                  <div className="mt-2 grid grid-cols-2 gap-2 pl-9"><Input value={s.lat} onChange={(e) => setStop(i, { lat: e.target.value })} className="h-10" aria-label={`Stop ${i + 1} latitude`} placeholder="Latitude" /><Input value={s.lng} onChange={(e) => setStop(i, { lng: e.target.value })} className="h-10" aria-label={`Stop ${i + 1} longitude`} placeholder="Longitude" /></div>
                </li>))}
            </ol></div>
        </div>}
      </Modal>
      <ConfirmDialog open={!!del} danger title={`Delete route ${del?.number}?`} message="The route and all its stops will be removed from the student portal. Past applications keep their records." confirmLabel="Delete route" onConfirm={() => { if (del) { routeCascadeDelete(del.id); toast("Route deleted"); } }} onClose={() => setDel(null)} />
    </div>
  );
}
