"use client";
import { db, getSettings, uid } from "./storage";
import type {
  Announcement, AppNotification, Application, AppStatus, IssuedPass, PassType, StudentProfile, User,
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
  const next = (s.counters?.[kind] ?? 0) + 1;
  db.settings.update(s.id, { counters: { ...s.counters, [kind]: next } });
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
export function registerStudent(name: string, email: string, password: string): User {
  const e = email.trim().toLowerCase();
  if (db.users.all().some((u) => u.email.toLowerCase() === e)) throw new Error("An account with this email already exists.");
  const user: User = { id: uid("user"), email: e, password, role: "student", name: name.trim(), createdAt: nowIso() };
  db.users.add(user);
  db.studentProfiles.add({
    id: uid("sp"), userId: user.id, fullName: user.name, studentId: "", college: getSettings().collegeName,
    course: "", year: "", mobile: "", email: e, createdAt: nowIso(),
  });
  return user;
}

export function profileForUser(userId: string): StudentProfile | undefined {
  return db.studentProfiles.all().find((p) => p.userId === userId);
}

// ------------------------------------------------------------------ applications
export type ApplicationDraft = Omit<Application, "id" | "status" | "submittedAt" | "timeline" | "reviewedAt" | "rejectionReason" | "passId">;

export function submitApplication(draft: ApplicationDraft): Application {
  const app: Application = {
    ...draft, id: newApplicationId(), status: "pending", submittedAt: nowIso(),
    timeline: [{ key: "submitted", label: "Application submitted", at: nowIso() }],
  };
  db.applications.add(app);
  // keep the profile in sync with the latest details
  db.studentProfiles.update(draft.studentProfileId, {
    fullName: draft.fullName, studentId: draft.studentId, college: draft.college, course: draft.course, year: draft.year,
    mobile: draft.mobile, email: draft.email,
  });
  notify({ audience: draft.userId, type: "submitted", title: "Application submitted", message: `Application ${app.id} was submitted for Route ${db.busRoutes.get(draft.routeId)?.number ?? ""}.`, link: `/student/applications/${app.id}` });
  notify({ audience: "admin", type: "submitted", title: "New application", message: `${draft.fullName} (${draft.studentId}) applied for a ${draft.passType} pass.`, link: "/admin/applications" });
  return app;
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
  pushIfGranted("🎉 Application Approved!", `Your bus pass ${pass.id} is ready. Valid till ${new Date(pass.expiryDate).toLocaleDateString("en-IN")}.`, "/student/pass");
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
      pushIfGranted("⚠️ Pass Expiring Soon", `Your bus pass expires in ${d} day${d === 1 ? "" : "s"}. Renew now.`, "/student/apply");
    } else if (st === "active" && d <= 30 && !p.notified30) {
      db.issuedPasses.update(p.id, { notified30: true });
      notify({ audience: p.userId, type: "expiring", title: "Pass expiring this month", message: `Your pass will expire in ${d} days. Consider renewing early.`, link: "/student/apply" });
      pushIfGranted("Pass Expiring Soon", `Your bus pass expires in ${d} days. Consider renewing early.`, "/student/apply");
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
