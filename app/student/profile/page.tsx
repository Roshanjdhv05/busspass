"use client";
import Link from "next/link";
import { useState } from "react";
import { Camera, ChevronRight, GraduationCap, LogOut, Mail, Pencil, Phone, Ticket } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { db } from "@/lib/storage";
import { compressImage, putFile } from "@/lib/idb";
import { uid } from "@/lib/storage";
import { Avatar, Button, Card, EmptyState, Field, Input, Modal, PageSkeleton, SectionTitle, Select, StatusBadge } from "@/components/ui";
import { COURSES, YEARS, fmtDate, isEmail, isMobile, passState } from "@/lib/utils";

export default function Profile() {
  const { profile, apps, myPasses, routes } = useStudent();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ fullName: "", studentId: "", college: "", course: "", year: "", mobile: "", email: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!profile || !user) return <PageSkeleton />;

  const open = () => { setF({ fullName: profile.fullName, studentId: profile.studentId, college: profile.college, course: profile.course, year: profile.year, mobile: profile.mobile, email: profile.email }); setErr({}); setEdit(true); };
  const save = () => {
    const e: Record<string, string> = {};
    if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!f.studentId.trim()) e.studentId = "Student ID is required";
    if (!f.college.trim()) e.college = "College is required";
    if (!f.course) e.course = "Select course"; if (!f.year) e.year = "Select year";
    if (!isMobile(f.mobile)) e.mobile = "Enter a valid 10-digit mobile";
    if (!isEmail(f.email)) e.email = "Enter a valid email";
    setErr(e); if (Object.keys(e).length) return;
    db.studentProfiles.update(profile.id, { ...f, fullName: f.fullName.trim(), mobile: f.mobile.replace(/[\s-]/g, "").replace(/^\+91/, "") });
    db.users.update(user.id, { name: f.fullName.trim() });
    toast("Profile updated"); setEdit(false);
  };
  const photo = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return toast("Choose an image file", "error");
    const key = uid("file"); await putFile(key, await compressImage(file, 500), file.name);
    db.studentProfiles.update(profile.id, { photoKey: key }); toast("Photo updated");
  };
  const rows = [[GraduationCap, "College", `${profile.college}`], [GraduationCap, "Course", `${profile.course || "—"} · ${profile.year || "—"}`], [Phone, "Mobile", profile.mobile || "—"], [Mail, "Email", profile.email]] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative"><Avatar name={profile.fullName} fileKey={profile.photoKey} size={96} className="ring-4 ring-mint-100" />
          <label className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-forest-700 text-white shadow-lift"><Camera size={17} /><span className="sr-only">Change photo</span><input type="file" accept="image/*" hidden onChange={(e) => { photo(e.target.files?.[0]); e.target.value = ""; }} /></label></div>
        <h1 className="mt-3 text-xl font-extrabold">{profile.fullName}</h1><div className="text-sm text-ink-mute">{profile.studentId || "Student ID not set"}</div>
        <Button variant="secondary" size="sm" className="mt-3" onClick={open}><Pencil size={14} /> Edit profile</Button>
      </div>

      <Card className="divide-y divide-forest-50">{rows.map(([Icon, k, v]) => <div key={k} className="flex items-center gap-3 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-100 text-forest-700"><Icon size={16} /></span><div className="min-w-0"><div className="text-xs text-ink-mute">{k}</div><div className="truncate text-sm font-semibold">{v}</div></div></div>)}</Card>

      <div><SectionTitle>Bus passes</SectionTitle>
        {myPasses.length === 0 ? <Card><EmptyState icon={Ticket} title="No passes yet" text="Active and expired passes will be listed here." /></Card> : (
          <Card className="divide-y divide-forest-50">{myPasses.map((p) => { const st = passState(p); return (
            <Link key={p.id} href="/student/pass" className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="text-sm font-bold">{p.id}</div><div className="text-xs text-ink-mute">Route {routes.find((r) => r.id === p.routeId)?.number} · till {fmtDate(p.expiryDate)}</div></div><StatusBadge status={st} /></Link>); })}</Card>)}</div>

      <div><SectionTitle action={<Link href="/student/applications" className="text-sm font-semibold text-forest-600">View all</Link>}>Application history</SectionTitle>
        <Card className="divide-y divide-forest-50">{apps.length === 0 && <EmptyState icon={Ticket} title="No applications" />}{apps.slice(0, 5).map((a) => <Link key={a.id} href={`/student/applications/${a.id}`} className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="text-sm font-bold">{a.id}</div><div className="text-xs text-ink-mute">{fmtDate(a.submittedAt)}</div></div><StatusBadge status={a.status} /><ChevronRight size={16} className="text-ink-mute" /></Link>)}</Card></div>

      <Button variant="secondary" full size="lg" className="border-red-100 text-red-600 hover:bg-red-50" onClick={logout}><LogOut size={18} /> Logout</Button>

      <Modal open={edit} onClose={() => setEdit(false)} title="Edit profile" footer={<><Button variant="secondary" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={save}>Save changes</Button></>}>
        <div className="space-y-3.5">
          <Field label="Full name" error={err.fullName}><Input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
          <Field label="Student ID" error={err.studentId}><Input value={f.studentId} onChange={(e) => setF({ ...f, studentId: e.target.value })} /></Field>
          <Field label="College" error={err.college}><Input value={f.college} onChange={(e) => setF({ ...f, college: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Course" error={err.course}><Select value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })}><option value="">Select</option>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Year" error={err.year}><Select value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}><option value="">Select</option>{YEARS.map((c) => <option key={c}>{c}</option>)}</Select></Field></div>
          <Field label="Mobile" error={err.mobile}><Input inputMode="tel" value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></Field>
          <Field label="Email" error={err.email}><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
