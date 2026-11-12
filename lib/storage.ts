"use client";
import type {
  Announcement, AppNotification, Application, BusRoute, BusStop, IssuedPass, Settings, StudentProfile, User,
} from "./types";

const PREFIX = "bpms:";
export const CHANGE_EVENT = "bpms:change";

export function uid(prefix = "id"): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rnd}`;
}

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
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

/** Generic, validated collection stored as a JSON array under one localStorage key. */
export class Collection<T extends { id: string }> {
  constructor(public readonly key: string, private validate?: (x: unknown) => x is T) {}

  all(): T[] {
    const raw = rawGet(this.key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("not an array");
      const items = parsed.filter((x): x is T =>
        x && typeof x === "object" && typeof (x as { id?: unknown }).id === "string" && (!this.validate || this.validate(x)));
      return items;
    } catch {
      // Corrupted data: reset this collection gracefully
      rawRemove(this.key);
      return [];
    }
  }
  get(id: string | undefined | null): T | undefined {
    if (!id) return undefined;
    return this.all().find((x) => x.id === id);
  }
  find(pred: (x: T) => boolean): T[] { return this.all().filter(pred); }
  replaceAll(items: T[], silent = false) {
    rawSet(this.key, JSON.stringify(items));
    if (!silent) emit();
  }
  add(item: T): T {
    const items = this.all();
    if (items.some((x) => x.id === item.id)) throw new Error(`Duplicate id ${item.id}`);
    items.push(item);
    this.replaceAll(items);
    return item;
  }
  update(id: string, patch: Partial<T>): T | undefined {
    const items = this.all();
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) return undefined;
    items[i] = { ...items[i], ...patch, id };
    this.replaceAll(items);
    return items[i];
  }
  remove(id: string) {
    this.replaceAll(this.all().filter((x) => x.id !== id));
  }
  removeWhere(pred: (x: T) => boolean) {
    this.replaceAll(this.all().filter((x) => !pred(x)));
  }
  clear() { rawRemove(this.key); emit(); }
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
