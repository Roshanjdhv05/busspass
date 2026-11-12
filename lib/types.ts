export type Role = "student" | "admin";
export type PassType = "monthly" | "quarterly" | "half-yearly" | "yearly";
export type AppStatus = "pending" | "under_review" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  name: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullName: string;
  studentId: string;
  college: string;
  course: string;
  year: string;
  mobile: string;
  email: string;
  photoKey?: string;
  createdAt: string;
}

export interface TimelineEvent {
  key: "submitted" | "review" | "approved" | "rejected" | "pass";
  label: string;
  at: string;
}

export interface Application {
  id: string;
  userId: string;
  studentProfileId: string;
  // snapshot of personal details at time of application
  fullName: string;
  studentId: string;
  college: string;
  course: string;
  year: string;
  mobile: string;
  email: string;
  routeId: string;
  startPoint: string;
  destination: string;
  stopId: string;
  passType: PassType;
  documents: { photo?: string; studentIdCard?: string; admissionProof?: string };
  status: AppStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  passId?: string;
  resubmittedFrom?: string;
  timeline: TimelineEvent[];
}

export interface BusRoute {
  id: string;
  number: string;
  name: string;
  start: string;
  end: string;
  description: string;
  distanceKm: number;
  durationMin: number;
  color: string;
  passTypes: PassType[];
  createdAt: string;
}

export interface BusStop {
  id: string;
  routeId: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export interface PassHistoryItem {
  at: string;
  action: "issued" | "extended" | "revoked" | "reinstated" | "expired";
  note: string;
}

export interface IssuedPass {
  id: string; // pass ID e.g. BP2026-0001
  applicationId: string;
  studentProfileId: string;
  userId: string;
  routeId: string;
  passType: PassType;
  issueDate: string;
  expiryDate: string;
  revoked: boolean;
  history: PassHistoryItem[];
  notified7?: boolean;
  notified30?: boolean;
  notifiedExpired?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "important";
  active: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  audience: string; // userId or "admin"
  title: string;
  message: string;
  type: "submitted" | "approved" | "rejected" | "pass" | "expiring" | "expired" | "info";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Settings {
  id: string;
  collegeName: string;
  collegeAddress: string;
  collegeEmail: string;
  collegePhone: string;
  adminName: string;
  adminEmail: string;
  validityDays: Record<PassType, number>;
  fees: Record<PassType, number>;
  instructions: string;
  counters: { app: number; pass: number };
}

export const PASS_TYPES: { value: PassType; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half-yearly", label: "Half-yearly" },
  { value: "yearly", label: "Yearly" },
];
