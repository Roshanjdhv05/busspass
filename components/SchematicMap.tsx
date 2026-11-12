import type { BusRoute, BusStop } from "@/lib/types";
interface RouteWithStops { route: BusRoute; stops: BusStop[] }

// ------------------------------------------------------------ Schematic fallback (no tiles / map failure)
export function SchematicMap({ items, selectedId, className }: { items: RouteWithStops[]; selectedId?: string | null; className?: string }) {
  const all = items.flatMap((i) => i.stops);
  if (!all.length) return <div className={className} />;
  const minLat = Math.min(...all.map((s) => s.lat)), maxLat = Math.max(...all.map((s) => s.lat));
  const minLng = Math.min(...all.map((s) => s.lng)), maxLng = Math.max(...all.map((s) => s.lng));
  const W = 600, H = 400, pad = 40;
  const x = (lng: number) => pad + ((lng - minLng) / Math.max(1e-6, maxLng - minLng)) * (W - 2 * pad);
  const y = (lat: number) => H - pad - ((lat - minLat) / Math.max(1e-6, maxLat - minLat)) * (H - 2 * pad);
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full bg-mint-50" role="img" aria-label="Route illustration">
        <defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#DDF6E8" strokeWidth="1" /></pattern></defs>
        <rect width={W} height={H} fill="url(#g)" />
        {items.map(({ route, stops }) => {
          const s = [...stops].sort((a, b) => a.order - b.order);
          const on = !selectedId || selectedId === route.id;
          return (
            <g key={route.id} opacity={on ? 1 : 0.35}>
              <polyline fill="none" stroke={route.color} strokeWidth={on ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" points={s.map((p) => `${x(p.lng)},${y(p.lat)}`).join(" ")} />
              {s.map((p, i) => (
                <g key={p.id}>
                  <circle cx={x(p.lng)} cy={y(p.lat)} r={i === 0 || i === s.length - 1 ? 8 : 5} fill="#fff" stroke={route.color} strokeWidth="3" />
                  {on && <text x={x(p.lng) + 10} y={y(p.lat) + 4} fontSize="11" fill="#1E2522" fontWeight="600">{p.name}</text>}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

