"use client";
import "leaflet/dist/leaflet.css";
import { Component, Fragment, useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { BusRoute, BusStop } from "@/lib/types";

export interface RouteWithStops { route: BusRoute; stops: BusStop[] }

const MUMBAI: [number, number] = [19.13, 72.92];

function stopIcon(color: string, kind: "start" | "end" | "mid", label?: string) {
  const size = kind === "mid" ? 14 : 28;
  const html = kind === "mid"
    ? `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`
    : `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${kind === "start" ? "#3DB67F" : color};border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#fff;font:700 11px sans-serif">${label ?? ""}</span></div>`;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: kind === "mid" ? [7, 7] : [14, 28], popupAnchor: [0, kind === "mid" ? -8 : -26] });
}

function Fit({ items, focusKey }: { items: RouteWithStops[]; focusKey: string }) {
  const map = useMap();
  useEffect(() => {
    const pts = items.flatMap((i) => i.stops.map((s) => [s.lat, s.lng] as [number, number]));
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14, animate: true });
    setTimeout(() => map.invalidateSize(), 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map]);
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function ClickCatcher({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export interface RouteMapProps {
  items: RouteWithStops[];
  selectedId?: string | null;
  onSelect?: (routeId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  focus?: { lat: number; lng: number } | null;
  className?: string;
  renderPopupExtra?: (r: BusRoute) => React.ReactNode;
}

function FlyTo({ focus }: { focus?: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => { if (focus) map.flyTo([focus.lat, focus.lng], 15, { duration: 0.8 }); }, [focus, map]);
  return null;
}

function LeafletInner({ items, selectedId, onSelect, onMapClick, focus, className, renderPopupExtra }: RouteMapProps) {
  const focusKey = useMemo(() => items.map((i) => i.route.id + ":" + i.stops.map((s) => s.id + s.lat + s.lng).join(",")).join("|") + (selectedId ?? ""), [items, selectedId]);
  return (
    <MapContainer center={MUMBAI} zoom={11} scrollWheelZoom className={className ?? "h-full w-full"} style={{ minHeight: 240 }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Fit items={items} focusKey={focusKey} />
      <FlyTo focus={focus} />
      {onMapClick && <ClickCatcher onClick={onMapClick} />}
      {items.map(({ route, stops }) => {
        const sorted = [...stops].sort((a, b) => a.order - b.order);
        const selected = !selectedId || selectedId === route.id;
        const pts = sorted.map((s) => [s.lat, s.lng] as [number, number]);
        return (
          <Fragment key={route.id}>
            {pts.length > 1 && (
              <>
                <Polyline positions={pts} pathOptions={{ color: "#fff", weight: selected ? 9 : 6, opacity: selected ? 0.9 : 0.5 }} />
                <Polyline positions={pts} pathOptions={{ color: route.color, weight: selected ? 5 : 3, opacity: selected ? 1 : 0.55 }}
                  eventHandlers={{ click: () => onSelect?.(route.id) }} />
              </>
            )}
            {sorted.map((s, i) => {
              const kind = i === 0 ? "start" : i === sorted.length - 1 ? "end" : "mid";
              if (kind === "mid" && !selected) return <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={3} pathOptions={{ color: route.color }} />;
              return (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={stopIcon(route.color, kind, kind === "start" ? "A" : kind === "end" ? "B" : "")}
                  eventHandlers={{ click: () => onSelect?.(route.id) }}>
                  <Popup>
                    <div style={{ minWidth: 170 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                      <div style={{ color: "#4A5550", fontSize: 12, marginTop: 2 }}>
                        Route {route.number} · Stop {i + 1} of {sorted.length}{kind === "start" ? " · Start" : kind === "end" ? " · Destination" : ""}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>{route.distanceKm} km · {route.durationMin} min</div>
                      {renderPopupExtra?.(route)}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}

class MapBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}

import { SchematicMap } from "./SchematicMap";

export default function RouteMap(props: RouteMapProps) {
  return (
    <MapBoundary fallback={<SchematicMap items={props.items} selectedId={props.selectedId} className={props.className ?? "h-full w-full"} />}>
      <LeafletInner {...props} />
    </MapBoundary>
  );
}
