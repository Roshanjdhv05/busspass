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
  tickets: "bus_tickets",
};

// Convert camelCase keys → snake_case for Supabase, and back
function toSnake(obj: Record<string, unknown>, table?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    // Custom mapping for settings fields
    if (table === "settings") {
      if (k === "validityDays" && v && typeof v === "object") {
        const vd = v as Record<string, number>;
        out["validity_monthly"] = vd.monthly ?? 30;
        out["validity_quarterly"] = vd.quarterly ?? 90;
        out["validity_half_yearly"] = vd["half-yearly"] ?? 180;
        out["validity_yearly"] = vd.yearly ?? 365;
        continue;
      }
      if (k === "fees" && v && typeof v === "object") {
        const fees = v as Record<string, number>;
        out["fee_monthly"] = fees.monthly ?? 450;
        out["fee_quarterly"] = fees.quarterly ?? 1250;
        out["fee_half_yearly"] = fees["half-yearly"] ?? 2400;
        out["fee_yearly"] = fees.yearly ?? 4500;
        continue;
      }
      if (k === "counters" && v && typeof v === "object") {
        const counters = v as Record<string, number>;
        out["counter_app"] = counters.app ?? 0;
        out["counter_pass"] = counters.pass ?? 0;
        continue;
      }
    }
    // Custom mapping for bus_routes fields
    if (table === "bus_routes") {
      if (k === "start") { out["start_point"] = v; continue; }
      if (k === "end") { out["end_point"] = v; continue; }
    }
    // Custom mapping for issued_passes fields
    if (table === "issued_passes") {
      if (k === "history") continue;
      if (k === "notified7") { out["notified_7"] = v ?? false; continue; }
      if (k === "notified30") { out["notified_30"] = v ?? false; continue; }
      if (k === "notifiedExpired") { out["notified_expired"] = v ?? false; continue; }
    }
    // Custom mapping for application fields
    if (table === "applications") {
      if (k === "studentId") { out["student_id_no"] = v; continue; }
      if (k === "documents") {
        const docs = (v as Record<string, string> | undefined) || {};
        out["doc_photo"] = docs.photo ?? null;
        out["doc_student_id_card"] = docs.studentIdCard ?? null;
        out["doc_admission_proof"] = docs.admissionProof ?? null;
        continue;
      }
      if (k === "timeline") {
        // Handled separately on application_timeline table
        continue;
      }
    }
    const snake = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    out[snake] = v;
  }
  return out;
}
function toCamel(obj: Record<string, unknown>, table?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (table === "settings") {
      if (k === "validity_monthly" || k === "validity_quarterly" || k === "validity_half_yearly" || k === "validity_yearly") {
        if (!out["validityDays"]) {
          out["validityDays"] = { monthly: 30, quarterly: 90, "half-yearly": 180, yearly: 365 };
        }
        const vd = out["validityDays"] as Record<string, number>;
        if (k === "validity_monthly") vd.monthly = Number(v) || 30;
        if (k === "validity_quarterly") vd.quarterly = Number(v) || 90;
        if (k === "validity_half_yearly") vd["half-yearly"] = Number(v) || 180;
        if (k === "validity_yearly") vd.yearly = Number(v) || 365;
        continue;
      }
      if (k === "fee_monthly" || k === "fee_quarterly" || k === "fee_half_yearly" || k === "fee_yearly") {
        if (!out["fees"]) {
          out["fees"] = { monthly: 450, quarterly: 1250, "half-yearly": 2400, yearly: 4500 };
        }
        const fees = out["fees"] as Record<string, number>;
        if (k === "fee_monthly") fees.monthly = Number(v) || 450;
        if (k === "fee_quarterly") fees.quarterly = Number(v) || 1250;
        if (k === "fee_half_yearly") fees["half-yearly"] = Number(v) || 2400;
        if (k === "fee_yearly") fees.yearly = Number(v) || 4500;
        continue;
      }
      if (k === "counter_app" || k === "counter_pass") {
        if (!out["counters"]) {
          out["counters"] = { app: 0, pass: 0 };
        }
        const counters = out["counters"] as Record<string, number>;
        if (k === "counter_app") counters.app = Number(v) || 0;
        if (k === "counter_pass") counters.pass = Number(v) || 0;
        continue;
      }
    }
    if (table === "bus_routes") {
      if (k === "start_point") { out["start"] = v; continue; }
      if (k === "end_point") { out["end"] = v; continue; }
    }
    if (table === "issued_passes") {
      if (k === "notified_7") { out["notified7"] = v; continue; }
      if (k === "notified_30") { out["notified30"] = v; continue; }
      if (k === "notified_expired") { out["notifiedExpired"] = v; continue; }
    }
    if (table === "applications") {
      if (k === "student_id_no") { out["studentId"] = v; continue; }
      if (k === "doc_photo" || k === "doc_student_id_card" || k === "doc_admission_proof") {
        if (!out["documents"]) out["documents"] = {};
        const docs = out["documents"] as Record<string, unknown>;
        if (k === "doc_photo") docs["photo"] = v;
        if (k === "doc_student_id_card") docs["studentIdCard"] = v;
        if (k === "doc_admission_proof") docs["admissionProof"] = v;
        continue;
      }
    }
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  if (table === "settings") {
    if (!out["validityDays"]) {
      out["validityDays"] = { monthly: 30, quarterly: 90, "half-yearly": 180, yearly: 365 };
    }
    if (!out["fees"]) {
      out["fees"] = { monthly: 450, quarterly: 1250, "half-yearly": 2400, yearly: 4500 };
    }
    if (!out["counters"]) {
      out["counters"] = { app: 0, pass: 0 };
    }
  }
  if (table === "issued_passes" && !out["history"]) {
    out["history"] = [{ at: (out["issueDate"] as string) || new Date().toISOString(), action: "issued", note: "Pass issued" }];
  }
  if (table === "applications" && !out["timeline"]) {
    out["timeline"] = [{ key: "submitted", label: "Application submitted", at: (out["submittedAt"] as string) || new Date().toISOString() }];
  }
  return out;
}

// ─── Collection class ────────────────────────────────────────────────────────

export class Collection<T extends { id: string }> {
  constructor(public readonly key: string) {}

  public get tableName(): string {
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

  // ── Supabase read/write ──

  public async sbUpsert(item: T): Promise<void> {
    if (!supabase) return;
    try {
      const payload = toSnake(item as unknown as Record<string, unknown>, this.tableName);
      const { error } = await supabase.from(this.tableName).upsert(payload);
      if (error) {
        console.error(`[Supabase] upsert error on ${this.tableName}:`, error.message, error.details);
      } else {
        // Timeline & History secondary table sync
        if (this.tableName === "applications") {
          const app = item as unknown as Application;
          if (Array.isArray(app.timeline) && app.timeline.length > 0) {
            const events = app.timeline.map((t) => ({
              application_id: app.id,
              event_key: t.key,
              label: t.label,
              occurred_at: t.at || new Date().toISOString(),
            }));
            try { await supabase.from("application_timeline").upsert(events); } catch { /* ignore */ }
          }
        }
        if (this.tableName === "issued_passes") {
          const pass = item as unknown as IssuedPass;
          if (Array.isArray(pass.history) && pass.history.length > 0) {
            const historyEvents = pass.history.map((h) => ({
              pass_id: pass.id,
              action: h.action,
              note: h.note || "",
              occurred_at: h.at || new Date().toISOString(),
            }));
            try { await supabase.from("pass_history").insert(historyEvents); } catch { /* ignore */ }
          }
        }
      }
    } catch (e) {
      console.error(`[Supabase] unexpected error in sbUpsert on ${this.tableName}:`, e);
    }
  }

  public async sbDelete(id: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from(this.tableName).delete().eq("id", id);
      if (error) console.error(`[Supabase] delete error on ${this.tableName}:`, error.message);
    } catch (e) {
      console.error(`[Supabase] unexpected error in sbDelete on ${this.tableName}:`, e);
    }
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
      Promise.all(items.map((item) => this.sbUpsert(item))).catch((err) => {
        console.error(`[Supabase] replaceAll sync error on ${this.tableName}:`, err);
      });
    }
  }

  add(item: T): T {
    const items = this.lsAll();
    if (items.some((x) => x.id === item.id)) throw new Error(`Duplicate id ${item.id}`);
    items.push(item);
    this.lsSet(items);
    void this.sbUpsert(item);
    return item;
  }

  async addAsync(item: T): Promise<T> {
    const items = this.lsAll();
    if (items.some((x) => x.id === item.id)) throw new Error(`Duplicate id ${item.id}`);
    items.push(item);
    this.lsSet(items);
    await this.sbUpsert(item);
    return item;
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const items = this.lsAll();
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) return undefined;
    items[i] = { ...items[i], ...patch, id };
    this.lsSet(items);
    void this.sbUpsert(items[i]);
    return items[i];
  }

  async updateAsync(id: string, patch: Partial<T>): Promise<T | undefined> {
    const items = this.lsAll();
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) return undefined;
    items[i] = { ...items[i], ...patch, id };
    this.lsSet(items);
    await this.sbUpsert(items[i]);
    return items[i];
  }

  remove(id: string) {
    const items = this.lsAll().filter((x) => x.id !== id);
    this.lsSet(items);
    void this.sbDelete(id);
  }

  removeWhere(pred: (x: T) => boolean) {
    const before = this.lsAll();
    const after = before.filter((x) => !pred(x));
    this.lsSet(after);
    const removed = before.filter(pred);
    if (supabase) {
      removed.forEach((x) => void this.sbDelete(x.id));
    }
  }

  clear() {
    rawRemove(this.key);
    emit();
    if (supabase) {
      void supabase.from(this.tableName).delete().neq("id", "");
    }
  }

  // Pull latest data from Supabase into localStorage and upload any local records missing in DB
  async syncFromSupabase(): Promise<void> {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from(this.tableName).select("*");
      if (error || !data) {
        if (error) console.error(`[Supabase] sync error on ${this.tableName}:`, error.message);
        return;
      }
      const remoteItems = data.map((row) => toCamel(row as Record<string, unknown>, this.tableName) as unknown as T);
      const localItems = this.lsAll();

      // Find local items that do not exist on Supabase yet, and upload them
      const remoteIds = new Set(remoteItems.map((r) => r.id));
      const missingOnRemote = localItems.filter((loc) => !remoteIds.has(loc.id));
      if (missingOnRemote.length > 0) {
        await Promise.all(missingOnRemote.map((item) => this.sbUpsert(item)));
      }

      // Merge remote items into local
      const mergedMap = new Map<string, T>();
      for (const item of localItems) mergedMap.set(item.id, item);
      for (const item of remoteItems) mergedMap.set(item.id, item);
      this.lsSet(Array.from(mergedMap.values()), true);
    } catch (e) {
      console.error(`[Supabase] syncFromSupabase error on ${this.tableName}:`, e);
    }
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
  const all = db.settings.all();
  if (all.length > 0) return all[0] as Settings;
  return {
    id: "settings_main",
    collegeName: "Mumbai Metropolitan College",
    collegeAddress: "LBS Marg, Mulund West, Mumbai 400080",
    collegeEmail: "transport@mmc.edu.in",
    collegePhone: "+91 22 2560 1234",
    adminName: "Transport Office",
    adminEmail: "admin@demo.com",
    validityDays: { monthly: 30, quarterly: 90, "half-yearly": 180, yearly: 365 },
    fees: { monthly: 450, quarterly: 1250, "half-yearly": 2400, yearly: 4500 },
    instructions: "Keep your college ID card, admission proof and a passport-size photo ready.",
    counters: { app: 0, pass: 0 },
  };
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
  // Sync in foreign-key dependency order so relational constraints are preserved
  const order: (keyof typeof db)[] = [
    "settings",
    "users",
    "studentProfiles",
    "busRoutes",
    "busStops",
    "applications",
    "issuedPasses",
    "tickets",
    "announcements",
    "notifications",
  ];
  for (const k of order) {
    if (db[k]) {
      await db[k].syncFromSupabase();
    }
  }
  emit();
}
