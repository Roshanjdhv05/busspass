"use client";
import { db, getSettings, uid } from "./storage";
import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Announcement, AppNotification, Application, AppStatus, BusTicket, IssuedPass, PassType, StudentProfile, User,
} from "./types";
import { addDays, daysLeft, passState } from "./utils";
import { pushIfGranted } from "./pushBridge";

const nowIso = () => new Date().toISOString();

// ------------------------------------------------------------------ notifications
export function notify(n: Omit<AppNotification, "id" | "read" | "createdAt">) {
  db.notifications.add({ ...n, id: uid("n"), read: false, createdAt: nowIso() });
}
export const markRead = (id: string) => db.notifications.update(id, { read: true });
export function markAllRead(audience: string) {
  db.notifications.replaceAll(db.notifications.all().map((n) => (n.audience === audience ? { ...n, read: true } : n)));
}
export function clearNotifications(audience: string) {
  db.notifications.removeWhere((n) => n.audience === audience);
}

// ------------------------------------------------------------------ ids
function nextCounter(kind: "app" | "pass"): number {
  const s = getSettings();
  const next = (s?.counters?.[kind] ?? 0) + 1;
  if (s) {
    db.settings.update(s.id, { counters: { ...(s.counters ?? { app: 0, pass: 0 }), [kind]: next } });
  }
  return next;
}
export function newApplicationId(): string {
  let id: string;
  do { id = `APP${new Date().getFullYear()}${String(nextCounter("app")).padStart(4, "0")}`; } while (db.applications.get(id));
  return id;
}
export function newPassId(): string {
  let id: string;
  do { id = `BP${new Date().getFullYear()}${String(nextCounter("pass")).padStart(4, "0")}`; } while (db.issuedPasses.get(id));
  return id;
}

// ------------------------------------------------------------------ auth / users
export async function registerStudentToSupabase(name: string, email: string, password: string): Promise<User> {
  const e = email.trim().toLowerCase();

  // Check for duplicate in localStorage
  if (db.users.all().some((u) => u.email.toLowerCase() === e)) {
    throw new Error("An account with this email already exists.");
  }

  const userId = uid("user");
  const profileId = uid("sp");
  const at = nowIso();
  const collegeName = getSettings()?.collegeName ?? "";

  const user: User = { id: userId, email: e, password, role: "student", name: name.trim(), createdAt: at };
  const profile: StudentProfile = {
    id: profileId, userId, fullName: user.name, studentId: "", college: collegeName,
    course: "", year: "", mobile: "", email: e, createdAt: at,
  };

  // --- Write to Supabase first (if configured) ---
  if (isSupabaseConfigured() && supabase) {
    // Check for duplicate in Supabase
    const { data: existing } = await supabase.from("users").select("id").eq("email", e).maybeSingle();
    if (existing) throw new Error("An account with this email already exists.");

    const { error: userErr } = await supabase.from("users").insert({
      id: userId, email: e, password, role: "student", name: user.name, created_at: at,
    });
    if (userErr) throw new Error(`Failed to save account: ${userErr.message}`);

    const { error: profileErr } = await supabase.from("student_profiles").insert({
      id: profileId, user_id: userId, full_name: user.name, student_id: "",
      college: collegeName, course: "", year: "", mobile: "", email: e, created_at: at,
    });
    if (profileErr) {
      // Rollback user row
      await supabase.from("users").delete().eq("id", userId);
      throw new Error(`Failed to save profile: ${profileErr.message}`);
    }
  }

  // --- Always write to localStorage (source of truth for session) ---
  db.users.add(user);
  db.studentProfiles.add(profile);

  return user;
}

// Keep the synchronous version for backward compatibility (localStorage-only mode)
export function registerStudent(name: string, email: string, password: string): User {
  const e = email.trim().toLowerCase();
  if (db.users.all().some((u) => u.email.toLowerCase() === e)) throw new Error("An account with this email already exists.");
  const user: User = { id: uid("user"), email: e, password, role: "student", name: name.trim(), createdAt: nowIso() };
  db.users.add(user);
  db.studentProfiles.add({
    id: uid("sp"), userId: user.id, fullName: user.name, studentId: "", college: getSettings()?.collegeName ?? "",
    course: "", year: "", mobile: "", email: e, createdAt: nowIso(),
  });
  return user;
}

export function profileForUser(userId: string): StudentProfile | undefined {
  return db.studentProfiles.all().find((p) => p.userId === userId);
}

// ------------------------------------------------------------------ applications
export type ApplicationDraft = Omit<Application, "id" | "status" | "submittedAt" | "timeline" | "reviewedAt" | "rejectionReason" | "passId">;

export function submitApplication(draft: ApplicationDraft): { app: Application } {
  const at = nowIso();
  const appId = newApplicationId();
  const app: Application = {
    ...draft, id: appId, status: "pending", submittedAt: at,
    timeline: [{ key: "submitted", label: "Application submitted", at }],
  };
  db.applications.add(app);
  // keep the profile in sync with the latest details
  if (draft.studentProfileId) {
    db.studentProfiles.update(draft.studentProfileId, {
      fullName: draft.fullName, studentId: draft.studentId, college: draft.college, course: draft.course, year: draft.year,
      mobile: draft.mobile, email: draft.email,
    });
  }
  notify({ audience: draft.userId, type: "submitted", title: "Application submitted", message: `Your application ${appId} is under review. We'll notify you once approved.`, link: `/student/applications/${appId}` });
  notify({ audience: "admin", type: "submitted", title: "New application", message: `${draft.fullName} applied for a ${draft.passType} pass. Review now.`, link: "/admin/applications" });
  return { app };
}

export function startReview(id: string) {
  const a = db.applications.get(id);
  if (!a || a.status !== "pending") return;
  db.applications.update(id, { status: "under_review", timeline: [...a.timeline, { key: "review", label: "Documents under review", at: nowIso() }] });
}

function ensureReviewEvent(a: Application) {
  return a.timeline.some((t) => t.key === "review") ? a.timeline : [...a.timeline, { key: "review" as const, label: "Documents under review", at: nowIso() }];
}

export function approveApplication(id: string): IssuedPass {
  const a = db.applications.get(id);
  if (!a) throw new Error("Application not found");
  if (a.status === "approved" && a.passId) throw new Error("Already approved");
  const settings = getSettings();
  const at = nowIso();
  const pass: IssuedPass = {
    id: newPassId(), applicationId: a.id, studentProfileId: a.studentProfileId, userId: a.userId, routeId: a.routeId,
    passType: a.passType, issueDate: at, expiryDate: addDays(at, settings.validityDays[a.passType] ?? 30), revoked: false,
    history: [{ at, action: "issued", note: `${a.passType} pass issued on approval of ${a.id}` }],
  };
  db.issuedPasses.add(pass);
  db.applications.update(id, {
    status: "approved", reviewedAt: at, passId: pass.id, rejectionReason: undefined,
    timeline: [...ensureReviewEvent(a), { key: "approved", label: "Application approved", at }, { key: "pass", label: "Bus pass generated", at }],
  });
  notify({ audience: a.userId, type: "approved", title: "Application approved", message: `Your bus pass is ready! Pass ${pass.id} is now active.`, link: "/student/pass" });
  notify({ audience: a.userId, type: "pass", title: "Pass issued", message: `Valid till ${new Date(pass.expiryDate).toLocaleDateString("en-IN")}.`, link: "/student/pass" });
  pushIfGranted("🎉 Application Approved!", `Your Yatrik pass ${pass.id} is ready. Valid till ${new Date(pass.expiryDate).toLocaleDateString("en-IN")}.`, "/student/pass");
  return pass;
}

export function rejectApplication(id: string, reason: string) {
  const a = db.applications.get(id);
  if (!a) throw new Error("Application not found");
  if (!reason.trim()) throw new Error("A rejection reason is required.");
  const at = nowIso();
  db.applications.update(id, {
    status: "rejected", reviewedAt: at, rejectionReason: reason.trim(),
    timeline: [...ensureReviewEvent(a), { key: "rejected", label: "Application rejected", at }],
  });
  notify({ audience: a.userId, type: "rejected", title: "Application rejected", message: reason.trim(), link: `/student/applications/${id}` });
  pushIfGranted("Application Update", `Your application ${id} was not approved. ${reason.trim()}`, `/student/applications/${id}`);
}

// ------------------------------------------------------------------ passes
export function revokePass(id: string, note = "Revoked by administrator") {
  const p = db.issuedPasses.get(id);
  if (!p) return;
  db.issuedPasses.update(id, { revoked: true, history: [...p.history, { at: nowIso(), action: "revoked", note }] });
  notify({ audience: p.userId, type: "expired", title: "Pass revoked", message: `Pass ${p.id} has been revoked. ${note}`, link: "/student/pass" });
  pushIfGranted("Pass Revoked", `Pass ${p.id} has been revoked. ${note}`, "/student/pass");
}
export function reinstatePass(id: string) {
  const p = db.issuedPasses.get(id);
  if (!p) return;
  db.issuedPasses.update(id, { revoked: false, history: [...p.history, { at: nowIso(), action: "reinstated", note: "Pass reinstated" }] });
}
export function extendPass(id: string, days: number) {
  const p = db.issuedPasses.get(id);
  if (!p || days <= 0) return;
  const base = new Date(p.expiryDate).getTime() > Date.now() ? p.expiryDate : nowIso();
  const expiryDate = addDays(base, days);
  db.issuedPasses.update(id, {
    expiryDate, notified7: false, notified30: false, notifiedExpired: false,
    history: [...p.history, { at: nowIso(), action: "extended", note: `Extended by ${days} days` }],
  });
  notify({ audience: p.userId, type: "pass", title: "Pass extended", message: `Pass ${p.id} validity extended by ${days} days.`, link: "/student/pass" });
}

/** Creates "expiring soon" / "expired" notifications once per pass. Safe to call repeatedly. */
export function runExpirySweep() {
  for (const p of db.issuedPasses.all()) {
    if (p.revoked) continue;
    const d = daysLeft(p);
    const st = passState(p);
    if (st === "expired" && !p.notifiedExpired) {
      db.issuedPasses.update(p.id, { notifiedExpired: true, history: [...p.history, { at: p.expiryDate, action: "expired", note: "Pass validity ended" }] });
      notify({ audience: p.userId, type: "expired", title: "Pass expired", message: `Pass ${p.id} has expired. Apply for a renewal.`, link: "/student/apply" });
      pushIfGranted("Pass Expired", `Pass ${p.id} has expired. Tap to apply for renewal.`, "/student/apply");
    } else if (st === "active" && d <= 7 && !p.notified7) {
      db.issuedPasses.update(p.id, { notified7: true, notified30: true });
      notify({ audience: p.userId, type: "expiring", title: "Pass expiring soon", message: `Your pass will expire in ${d} day${d === 1 ? "" : "s"}.`, link: "/student/apply" });
      notify({ audience: "admin", type: "expiring", title: "Pass expiring within 7 days", message: `${p.id} expires in ${d} day${d === 1 ? "" : "s"}.`, link: "/admin/passes" });
      pushIfGranted("⚠️ Pass Expiring Soon", `Your Yatrik pass expires in ${d} day${d === 1 ? "" : "s"}. Renew now.`, "/student/apply");
    } else if (st === "active" && d <= 30 && !p.notified30) {
      db.issuedPasses.update(p.id, { notified30: true });
      notify({ audience: p.userId, type: "expiring", title: "Pass expiring this month", message: `Your pass will expire in ${d} days. Consider renewing early.`, link: "/student/apply" });
      pushIfGranted("Pass Expiring Soon", `Your Yatrik pass expires in ${d} days. Consider renewing early.`, "/student/apply");
    }
  }
}

// ------------------------------------------------------------------ announcements
export function saveAnnouncement(a: Partial<Announcement> & { title: string; body: string }) {
  if (a.id && db.announcements.get(a.id)) return db.announcements.update(a.id, a);
  const item: Announcement = { id: uid("ann"), priority: "normal", active: true, createdAt: nowIso(), ...a } as Announcement;
  db.announcements.add(item);
  db.users.all().filter((u) => u.role === "student").forEach((u) =>
    notify({ audience: u.id, type: "info", title: "New announcement", message: item.title, link: "/student" }));
  pushIfGranted("📢 New Announcement", item.title, "/student");
  return item;
}

// ------------------------------------------------------------------ lookups
export function latestPassForUser(userId: string): IssuedPass | undefined {
  const mine = db.issuedPasses.all().filter((p) => p.userId === userId && !p.revoked);
  const active = mine.filter((p) => passState(p) === "active").sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  if (active[0]) return active[0];
  return db.issuedPasses.all().filter((p) => p.userId === userId).sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];
}
export const passTypeOptions: PassType[] = ["monthly", "quarterly", "half-yearly", "yearly"];
export const appStatusOrder: AppStatus[] = ["pending", "under_review", "approved", "rejected"];

export function routeCascadeDelete(routeId: string) {
  db.busStops.removeWhere((s) => s.routeId === routeId);
  db.busRoutes.remove(routeId);
}

// ------------------------------------------------------------------ tickets
/** ₹2 per 2-station gap, rounded up. Single journey = stations * 2. Return = single * 2. */
export function calcFare(fromOrder: number, toOrder: number, ticketType: "single" | "return", passengers: number): { fare: number; stations: number } {
  const stations = Math.abs(toOrder - fromOrder);
  const baseFare = Math.ceil(stations / 2) * 2; // ₹2 per 2 stations
  const fare = (ticketType === "return" ? baseFare * 2 : baseFare) * passengers;
  return { fare, stations };
}

function newTicketId(): string {
  const all = db.tickets.all();
  const year = new Date().getFullYear();
  let n = all.filter((t) => t.id.startsWith(`TKT${year}`)).length + 1;
  let id = `TKT${year}${String(n).padStart(4, "0")}`;
  while (db.tickets.get(id)) { n++; id = `TKT${year}${String(n).padStart(4, "0")}`; }
  return id;
}

export interface TicketDraft {
  userId: string;
  studentProfileId: string;
  studentName: string;
  routeId: string;
  fromStopId: string;
  toStopId: string;
  fromStopName: string;
  toStopName: string;
  ticketType: "single" | "return";
  passengers: number;
}

export function issueTicket(draft: TicketDraft): BusTicket {
  const fromStop = db.busStops.get(draft.fromStopId);
  const toStop = db.busStops.get(draft.toStopId);
  if (!fromStop || !toStop) throw new Error("Invalid stops selected.");
  if (fromStop.routeId !== toStop.routeId) throw new Error("Stops must be on the same route.");
  const { fare, stations } = calcFare(fromStop.order, toStop.order, draft.ticketType, draft.passengers);
  if (stations === 0) throw new Error("From and To stops must be different.");
  const issuedAt = nowIso();
  const expiresAt = new Date(new Date(issuedAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
  const ticket: BusTicket = {
    id: newTicketId(),
    ...draft, fare, stations,
    issuedAt, expiresAt, used: false,
  };
  db.tickets.add(ticket);
  notify({ audience: draft.userId, type: "pass", title: "Ticket issued!", message: `Ticket ${ticket.id} — ${draft.fromStopName} → ${draft.toStopName}. Valid for 24 hours.`, link: "/student/tickets" });
  return ticket;
}
