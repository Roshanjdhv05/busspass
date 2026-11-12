"use client";
import { clearFiles } from "./idb";
import { clearAllData, db, meta } from "./storage";
import type {
  Announcement, AppNotification, Application, AppStatus, BusRoute, BusStop, IssuedPass, PassType, Settings, StudentProfile, User,
} from "./types";
import { addDays, DAY } from "./utils";

const SEED_VERSION = "3";
const COLLEGE = "Mumbai Metropolitan College";

interface RouteSeed {
  id: string; number: string; name: string; start: string; end: string; description: string;
  distanceKm: number; durationMin: number; color: string;
  stops: [string, number, number][];
}

const CAMPUS: [string, number, number] = ["Mulund Campus Gate", 19.1722, 72.9565];

const ROUTES: RouteSeed[] = [
  {
    id: "route_12a", number: "12A", name: "Andheri – Mulund Campus via Powai", start: "Andheri Station", end: "Mulund Campus",
    description: "Express college service from Andheri (W) via JVLR and Powai to the Mulund campus. Runs every 20 minutes between 6:30 and 9:30 AM.",
    distanceKm: 25, durationMin: 45, color: "#155A3F",
    stops: [["Andheri Station", 19.1197, 72.8464], ["Marol Naka", 19.1155, 72.8810], ["Powai Lake", 19.1262, 72.9048], ["Kanjurmarg Station", 19.1306, 72.9296], ["Bhandup Pumping", 19.1436, 72.9402], CAMPUS],
  },
  {
    id: "route_14b", number: "14B", name: "Borivali – Mulund Campus via Goregaon", start: "Borivali Station", end: "Mulund Campus",
    description: "Long-distance service covering the western suburbs, joining the Link Road corridor at Goregaon and continuing east to campus.",
    distanceKm: 38, durationMin: 85, color: "#2563EB",
    stops: [["Borivali Station", 19.2291, 72.8573], ["Kandivali Station", 19.2043, 72.8527], ["Malad Station", 19.1864, 72.8485], ["Goregaon Station", 19.1663, 72.8493], ["Powai IIT Gate", 19.1334, 72.9133], ["Bhandup Pumping", 19.1436, 72.9402], CAMPUS],
  },
  {
    id: "route_18c", number: "18C", name: "Thane – Mulund Campus Shuttle", start: "Thane Station", end: "Mulund Campus",
    description: "Frequent short shuttle between Thane station and the campus. Ideal for students living in Thane West.",
    distanceKm: 12, durationMin: 30, color: "#D97706",
    stops: [["Thane Station", 19.1860, 72.9758], ["Teen Hath Naka", 19.1944, 72.9650], ["Louiswadi", 19.1868, 72.9627], ["Mulund Check Naka", 19.1776, 72.9604], CAMPUS],
  },
  {
    id: "route_21d", number: "21D", name: "Vashi – Mulund Campus via Airoli", start: "Vashi Station", end: "Mulund Campus",
    description: "Connects Navi Mumbai with the campus across the Airoli bridge. Morning and evening trips only.",
    distanceKm: 24, durationMin: 55, color: "#7C3AED",
    stops: [["Vashi Station", 19.0745, 72.9986], ["Koparkhairane", 19.1030, 73.0080], ["Airoli Circle", 19.1575, 72.9988], ["Airoli Toll Naka", 19.1648, 72.9810], CAMPUS],
  },
  {
    id: "route_5s", number: "5S", name: "Dadar – Mulund Campus via Ghatkopar", start: "Dadar TT", end: "Mulund Campus",
    description: "South-central connector via Sion and Ghatkopar along the LBS Marg corridor.",
    distanceKm: 28, durationMin: 65, color: "#DC2626",
    stops: [["Dadar TT", 19.0178, 72.8478], ["Sion Circle", 19.0390, 72.8619], ["Kurla Depot", 19.0726, 72.8845], ["Ghatkopar Station", 19.0860, 72.9081], ["Vikhroli Station", 19.1117, 72.9279], CAMPUS],
  },
];

const FIRST = ["Rahul", "Priya", "Amit", "Sneha", "Rohan", "Neha", "Karan", "Anjali", "Vikram", "Pooja", "Aditya", "Isha", "Siddharth", "Meera", "Arjun", "Kavya", "Nikhil", "Divya", "Yash", "Tanvi", "Harsh", "Riya", "Manav", "Shruti"];
const LAST = ["Sharma", "Patel", "Kumar", "Desai", "Mehta", "Iyer", "Singh", "Joshi", "Kulkarni", "Nair", "Shah", "Gupta", "Verma", "Pawar", "Rao", "Menon"];
const COURSES = ["B.Com", "B.Sc IT", "BMS", "BAF", "B.Tech", "BA", "B.Sc CS", "MBA"];
const YEARS = ["FY", "SY", "TY"];
const PASS_TYPES: PassType[] = ["monthly", "quarterly", "half-yearly", "yearly"];
const VALIDITY: Record<PassType, number> = { monthly: 30, quarterly: 90, "half-yearly": 180, yearly: 365 };

// deterministic PRNG so every fresh seed looks the same
function rng(seed: number) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296); }

export function seedIfNeeded(): void {
  const hasData = db.users.all().length > 0 && db.busRoutes.all().length > 0 && db.settings.all().length > 0;
  if (meta.get("seedVersion") === SEED_VERSION && hasData) return;
  seedDemoData();
}

export async function resetDemoData(): Promise<void> {
  clearAllData();
  await clearFiles();
  seedDemoData();
}

export function seedDemoData(): void {
  const rand = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  const now = Date.now();
  const iso = (offsetDays: number, hour = 10) => {
    const d = new Date(now + offsetDays * DAY); d.setHours(hour, Math.floor(rand() * 59), 0, 0); return d.toISOString();
  };

  // ---- settings
  const settings: Settings = {
    id: "settings_main", collegeName: COLLEGE, collegeAddress: "LBS Marg, Mulund West, Mumbai 400080",
    collegeEmail: "transport@mmc.edu.in", collegePhone: "+91 22 2560 1234",
    adminName: "Transport Office", adminEmail: "admin@demo.com",
    validityDays: { ...VALIDITY }, fees: { monthly: 450, quarterly: 1250, "half-yearly": 2400, yearly: 4500 },
    instructions: "Keep your college ID card, admission proof and a passport-size photo ready.\nUpload clear scans (JPG, PNG or PDF, under 5 MB).\nApplications are reviewed within 2 working days.\nA rejected application can be corrected and resubmitted.",
    counters: { app: 0, pass: 0 },
  };

  // ---- routes & stops
  const routes: BusRoute[] = [];
  const stops: BusStop[] = [];
  for (const r of ROUTES) {
    routes.push({
      id: r.id, number: r.number, name: r.name, start: r.start, end: r.end, description: r.description,
      distanceKm: r.distanceKm, durationMin: r.durationMin, color: r.color, passTypes: [...PASS_TYPES], createdAt: iso(-200),
    });
    r.stops.forEach(([name, lat, lng], i) => stops.push({ id: `${r.id}_s${i + 1}`, routeId: r.id, name, lat, lng, order: i }));
  }

  // ---- users
  const users: User[] = [
    { id: "user_admin", email: "admin@demo.com", password: "demo123", role: "admin", name: "Transport Office", createdAt: iso(-300) },
    { id: "user_student", email: "student@demo.com", password: "demo123", role: "student", name: "Rahul Sharma", createdAt: iso(-120) },
  ];
  const profiles: StudentProfile[] = [
    { id: "sp_rahul", userId: "user_student", fullName: "Rahul Sharma", studentId: "STU2025001", college: COLLEGE, course: "B.Com", year: "TY", mobile: "9820012345", email: "student@demo.com", createdAt: iso(-120) },
  ];

  const NUM = 17;
  for (let i = 0; i < NUM; i++) {
    const fn = FIRST[(i + 1) % FIRST.length], ln = LAST[(i * 3 + 1) % LAST.length];
    const name = `${fn} ${ln}`;
    const uidn = `user_s${i + 2}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 2}@student.mmc.edu.in`;
    users.push({ id: uidn, email, password: "demo123", role: "student", name, createdAt: iso(-150 + i * 5) });
    profiles.push({
      id: `sp_${i + 2}`, userId: uidn, fullName: name, studentId: `STU2025${String(i + 2).padStart(3, "0")}`, college: COLLEGE,
      course: pick(COURSES), year: pick(YEARS), mobile: `98${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`, email, createdAt: iso(-150 + i * 5),
    });
  }

  // ---- applications / passes
  const apps: Application[] = [];
  const passes: IssuedPass[] = [];
  let appN = 0, passN = 0;
  const year = new Date().getFullYear();

  const makeApp = (p: StudentProfile, daysAgo: number, status: AppStatus, routeId: string, passType: PassType, reason?: string): Application => {
    appN++;
    const route = routes.find((r) => r.id === routeId)!;
    const rStops = stops.filter((s) => s.routeId === routeId);
    const submittedAt = iso(-daysAgo, 10);
    const timeline: Application["timeline"] = [{ key: "submitted", label: "Application submitted", at: submittedAt }];
    let reviewedAt: string | undefined;
    if (status !== "pending") timeline.push({ key: "review", label: "Documents under review", at: addDays(submittedAt, 0.05) });
    if (status === "approved" || status === "rejected") {
      reviewedAt = addDays(submittedAt, 0.2 + rand() * 1.5);
      timeline.push({ key: status, label: status === "approved" ? "Application approved" : "Application rejected", at: reviewedAt });
    }
    const a: Application = {
      id: `APP${year}${String(appN).padStart(4, "0")}`, userId: p.userId, studentProfileId: p.id,
      fullName: p.fullName, studentId: p.studentId, college: p.college, course: p.course, year: p.year, mobile: p.mobile, email: p.email,
      routeId, startPoint: route.start, destination: route.end, stopId: rStops[Math.floor(rand() * (rStops.length - 1))].id,
      passType, documents: {}, status, submittedAt, reviewedAt, rejectionReason: reason, timeline,
    };
    return a;
  };
  const issue = (a: Application) => {
    passN++;
    const issueDate = a.reviewedAt || a.submittedAt;
    const pass: IssuedPass = {
      id: `BP${year}${String(passN).padStart(4, "0")}`, applicationId: a.id, studentProfileId: a.studentProfileId, userId: a.userId,
      routeId: a.routeId, passType: a.passType, issueDate, expiryDate: addDays(issueDate, VALIDITY[a.passType]), revoked: false,
      history: [{ at: issueDate, action: "issued", note: `${a.passType} pass issued` }],
    };
    a.passId = pass.id;
    a.timeline.push({ key: "pass", label: "Bus pass generated", at: addDays(issueDate, 0.01) });
    passes.push(pass);
    return pass;
  };

  // Rahul – active yearly-ish pass expiring in ~52 days + one earlier expired application history
  const rahul = profiles[0];
  const rOld = makeApp(rahul, 400, "approved", "route_12a", "quarterly"); issue(rOld);
  const rCur = makeApp(rahul, 5, "approved", "route_12a", "half-yearly");
  // set explicit dates so the expiry is ~52 days out
  rCur.submittedAt = iso(-128); rCur.reviewedAt = iso(-127);
  rCur.timeline = [
    { key: "submitted", label: "Application submitted", at: rCur.submittedAt },
    { key: "review", label: "Documents under review", at: addDays(rCur.submittedAt, 0.2) },
    { key: "approved", label: "Application approved", at: rCur.reviewedAt },
  ];
  issue(rCur);
  passes[passes.length - 1].expiryDate = addDays(now, 52);

  // spread the remaining students across the last ~6 months
  const statusPlan: AppStatus[] = ["approved", "approved", "approved", "approved", "approved", "approved", "pending", "rejected", "approved", "approved", "pending", "approved", "under_review", "approved", "rejected", "pending", "approved"];
  const reasons = ["Student ID card image is blurry. Please upload a clear scan.", "Admission proof does not match the entered course.", "Photograph does not meet passport-size requirements."];
  const expiryOffsets: Record<number, number> = { 0: -12, 1: 4, 2: 19, 3: 3, 4: 25 }; // force a few passes into expiring / expired buckets
  for (let i = 0; i < NUM; i++) {
    const p = profiles[i + 1];
    const st = statusPlan[i];
    const daysAgo = st === "pending" ? Math.floor(rand() * 3) + 1 : st === "under_review" ? 2 : 175 - i * 9;
    const a = makeApp(p, daysAgo, st, routes[Math.floor(rand() * routes.length)].id, pick(PASS_TYPES), st === "rejected" ? reasons[i % 3] : undefined);
    if (st === "approved") {
      const pass = issue(a);
      if (expiryOffsets[i] !== undefined) pass.expiryDate = addDays(now, expiryOffsets[i]);
    }
    apps.push(a);
  }
  // a couple of extra historical applications to give the trend chart some body
  for (let i = 0; i < 8; i++) {
    const p = profiles[(i * 2 + 3) % profiles.length];
    const a = makeApp(p, 160 - i * 17, i % 4 === 3 ? "rejected" : "approved", routes[i % routes.length].id, pick(PASS_TYPES), i % 4 === 3 ? reasons[i % 3] : undefined);
    if (a.status === "approved") issue(a);
    apps.push(a);
  }
  apps.push(rOld, rCur);
  apps.sort((a, b) => a.id.localeCompare(b.id));

  // keep unique, sequential IDs consistent with counters
  settings.counters = { app: appN, pass: passN };

  // mark long expired passes
  passes.forEach((p) => {
    if (new Date(p.expiryDate).getTime() < now) {
      p.notifiedExpired = true;
      p.history.push({ at: p.expiryDate, action: "expired", note: "Pass validity ended" });
    }
  });

  // ---- announcements
  const announcements: Announcement[] = [
    { id: "ann_1", title: "College transport will operate normally during exams", body: "All routes run on their regular schedule during the semester examinations. Carry your digital pass.", priority: "important", active: true, createdAt: iso(0, 8) },
    { id: "ann_2", title: "New stop added on Route 12A", body: "A new stop at Marol Naka is now live for morning services.", priority: "normal", active: true, createdAt: iso(-3, 9) },
    { id: "ann_3", title: "Pass renewals open 7 days before expiry", body: "Apply early to avoid a gap in your travel pass. Renewals are processed within 2 working days.", priority: "normal", active: true, createdAt: iso(-8, 9) },
  ];

  // ---- notifications
  const notifications: AppNotification[] = [
    { id: "n_1", audience: "user_student", type: "approved", title: "Application approved", message: `Your bus pass is ready! Pass ${rCur.passId} has been issued.`, read: false, link: "/student/pass", createdAt: rCur.reviewedAt! },
    { id: "n_2", audience: "user_student", type: "info", title: "New announcement", message: "College transport will operate normally during exams.", read: false, link: "/student", createdAt: iso(0, 8) },
    { id: "n_3", audience: "user_student", type: "submitted", title: "Application submitted", message: `Application ${rCur.id} was submitted successfully.`, read: true, link: `/student/applications/${rCur.id}`, createdAt: rCur.submittedAt },
    { id: "n_a1", audience: "admin", type: "submitted", title: "New application", message: "Pending applications are waiting for your review.", read: false, link: "/admin/applications", createdAt: iso(-1, 11) },
  ];

  // ---- write (no duplicates: collections are replaced wholesale)
  db.users.replaceAll(users, true);
  db.studentProfiles.replaceAll(profiles, true);
  db.busRoutes.replaceAll(routes, true);
  db.busStops.replaceAll(stops, true);
  db.applications.replaceAll(apps, true);
  db.issuedPasses.replaceAll(passes, true);
  db.announcements.replaceAll(announcements, true);
  db.notifications.replaceAll(notifications, true);
  db.settings.replaceAll([settings], true);
  meta.set("seedVersion", SEED_VERSION);
  window.dispatchEvent(new Event("bpms:change"));
}
