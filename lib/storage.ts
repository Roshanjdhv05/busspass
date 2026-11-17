"use client";
import type {
  Announcement, AppNotification, Application, BusRoute, BusStop, BusTicket, IssuedPass, Settings, StudentProfile, User,
} from "./types";
import { supabase, isSupabaseConfigured } from "./supabase";

const PREFIX = "bpms:";
export const CHANGE_EVENT = "bpms:change";

export function uid(prefix = "id"): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rnd}`;
}

// ─── localStorage helpers ───────────────────────────────────────────────────

function hasStorage(): boolean {
  try { return typeof window !== "undefined" && !!window.localStorage; } catch { return false; }
}
const memoryFallback: Record<string, string> = {};
function rawGet(key: string): string | null {
  if (!hasStorage()) return memoryFallback[key] ?? null;
  try { return window.localStorage.getItem(PREFIX + key); } catch { return memoryFallback[key] ?? null; }
}
function rawSet(key: string, value: string) {
  if (!hasStorage()) { memoryFallback[key] = value; return; }
  try { window.localStorage.setItem(PREFIX + key, value); } catch { memoryFallback[key] = value; }
}
function rawRemove(key: string) {
  delete memoryFallback[key];
  if (hasStorage()) { try { window.localStorage.removeItem(PREFIX + key); } catch { /* ignore */ } }
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ─── Supabase table name mapping ────────────────────────────────────────────

const TABLE_MAP: Record<string, string> = {
  users: "users",
  studentProfiles: "student_profiles",
  applications: "applications",
  busRoutes: "bus_routes",
  busStops: "bus_stops",
  issuedPasses: "issued_passes",
  announcements: "announcements",
  notifications: "notifications",
  settings: "settings",
  tickets: "tickets",
};

// Convert camelCase keys → snake_case for Supabase, and back
function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    out[snake] = v;
  }
  return out;
}
function toCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

// ─── Collection class ────────────────────────────────────────────────────────

export class Collection<T extends { id: string }> {
  constructor(public readonly key: string) {}

  private get tableName(): string {
    return TABLE_MAP[this.key] ?? this.key;
  }

  // ── localStorage read/write ──

  private lsAll(): T[] {
    const raw = rawGet(this.key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error();
      return parsed.filter((x): x is T => x && typeof x === "object" && typeof (x as { id?: unknown }).id === "string");
    } catch {
      rawRemove(this.key);
      return [];
    }
  }

  private lsSet(items: T[], silent = false) {
    rawSet(this.key, JSON.stringify(items));
    if (!silent) emit();
  }

  // ── Supabase read/write (fire-and-forget sync) ──

  private async sbUpsert(item: T) {
    if (!supabase) return;
    const { error } = await supabase.from(this.tableName).upsert(toSnake(item as unknown as Record<string, unknown>));
    if (error) console.error(`[Supabase] upsert error on ${this.tableName}:`, error.message, error.details);
  }

  private async sbDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from(this.tableName).delete().eq("id", id);
    if (error) console.error(`[Supabase] delete error on ${this.tableName}:`, error.message);
  }

  // ── Public API ──

  all(): T[] {
    return this.lsAll();
  }

  get(id: string | undefined | null): T | undefined {
    if (!id) return undefined;
    return this.lsAll().find((x) => x.id === id);
  }

  find(pred: (x: T) => boolean): T[] {
    return this.lsAll().filter(pred);
  }

  replaceAll(items: T[], silent = false) {
    this.lsSet(items, silent);
    // sync to Supabase in background
    if (supabase) {
      Promise.all(items.map((item) =>
        supabase!.from(this.tableName).upsert(toSnake(item as unknown as Record<string, unknown>))
      )).catch(() => { /* ignore */ });
    }
  }

  add(item: T): T {
    const items = this.lsAll();
    if (items.some((x) => x.id === item.id)) throw new Error(`Duplicate id ${item.id}`);
    items.push(item);
    this.lsSet(items);
    this.sbUpsert(item);
    return item;
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const items = this.lsAll();
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) return undefined;
    items[i] = { ...items[i], ...patch, id };
    this.lsSet(items);
    this.sbUpsert(items[i]);
    return items[i];
  }

  remove(id: string) {
    const items = this.lsAll().filter((x) => x.id !== id);
    this.lsSet(items);
    this.sbDelete(id);
  }

  removeWhere(pred: (x: T) => boolean) {
    const before = this.lsAll();
    const after = before.filter((x) => !pred(x));
    this.lsSet(after);
    const removed = before.filter(pred);
    if (supabase) {
      removed.forEach((x) => this.sbDelete(x.id));
    }
  }

  clear() {
    rawRemove(this.key);
    emit();
    if (supabase) {
      void supabase.from(this.tableName).delete().neq("id", "");
    }
  }

  // Pull latest data from Supabase into localStorage (call on app init when configured)
  async syncFromSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from(this.tableName).select("*");
      if (error || !data) return;
      const items = data.map((row) => toCamel(row as Record<string, unknown>) as unknown as T);
      if (items.length > 0) {
        this.lsSet(items, true);
      }
    } catch { /* ignore */ }
  }
}

export const db = {
  users: new Collection<User>("users"),
  studentProfiles: new Collection<StudentProfile>("studentProfiles"),
  applications: new Collection<Application>("applications"),
  busRoutes: new Collection<BusRoute>("busRoutes"),
  busStops: new Collection<BusStop>("busStops"),
  issuedPasses: new Collection<IssuedPass>("issuedPasses"),
  announcements: new Collection<Announcement>("announcements"),
  notifications: new Collection<AppNotification>("notifications"),
  settings: new Collection<Settings>("settings"),
  tickets: new Collection<BusTicket>("tickets"),
};

export function getSettings(): Settings {
  return db.settings.all()[0] as Settings;
}

export const meta = {
  get(key: string): string | null { return rawGet("meta:" + key); },
  set(key: string, v: string) { rawSet("meta:" + key, v); },
  remove(key: string) { rawRemove("meta:" + key); },
};

export function clearAllData() {
  Object.values(db).forEach((c) => c.replaceAll([], true));
  meta.remove("seedVersion");
  meta.remove("session");
  emit();
}

export const emitChange = emit;

// ─── Supabase full sync on app init ─────────────────────────────────────────

export async function syncAllFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await Promise.all(Object.values(db).map((c) => c.syncFromSupabase()));
  emit();
}
