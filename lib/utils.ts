import type { AppStatus, BusStop, IssuedPass, PassType } from "./types";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const DAY = 86_400_000;
export const addDays = (iso: string | Date | number, days: number) => new Date(new Date(iso).getTime() + days * DAY).toISOString();

export function fmtDate(iso?: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", opts);
}
export function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}

export const passTypeLabel = (t: PassType) =>
  ({ monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", yearly: "Yearly" }[t]);

export type PassState = "active" | "expired" | "revoked";
export function passState(p: IssuedPass): PassState {
  if (p.revoked) return "revoked";
  return new Date(p.expiryDate).getTime() < Date.now() ? "expired" : "active";
}
export function daysLeft(p: IssuedPass) {
  return Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / DAY);
}
export function expiryBucket(p: IssuedPass): "expired" | "7" | "30" | "ok" | "revoked" {
  const s = passState(p);
  if (s === "revoked") return "revoked";
  if (s === "expired") return "expired";
  const d = daysLeft(p);
  if (d <= 7) return "7";
  if (d <= 30) return "30";
  return "ok";
}

export const statusLabel: Record<AppStatus, string> = {
  pending: "Pending", under_review: "Under review", approved: "Approved", rejected: "Rejected",
};

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Approximate road distance: straight-line legs x 1.3 detour factor. */
export function estimateRouteKm(stops: Pick<BusStop, "lat" | "lng">[]) {
  let t = 0;
  for (let i = 1; i < stops.length; i++) t += haversineKm(stops[i - 1], stops[i]);
  return Math.round(t * 1.3 * 10) / 10;
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "?";

export const COURSES = ["B.Com", "B.Sc IT", "B.Sc CS", "BMS", "BAF", "B.Tech", "BA", "MBA", "M.Com"];
export const YEARS = ["FY", "SY", "TY", "1st Year", "2nd Year"];

// ---------- validation ----------
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
export const isMobile = (s: string) => /^[6-9]\d{9}$/.test(s.replace(/[\s-]/g, "").replace(/^\+91/, ""));

// ---------- CSV ----------
export function toCSV(rows: Record<string, string | number | undefined | null>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s; // neutralise spreadsheet formulas
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
export function downloadText(filename: string, text: string, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type: mime + ";charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadUrl(filename: string, url: string) {
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}
