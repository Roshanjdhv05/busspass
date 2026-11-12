"use client";
import { useEffect, useState } from "react";
import { Building2, CalendarClock, FileText, RotateCcw, User } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { db } from "@/lib/storage";
import { resetDemoData } from "@/lib/seed";
import AnnouncementManager from "@/components/AnnouncementManager";
import { Button, Card, ConfirmDialog, Field, Input, PageSkeleton, Textarea } from "@/components/ui";
import { isEmail } from "@/lib/utils";
import { PASS_TYPES, type Settings } from "@/lib/types";

export default function SettingsPage() {
  const settings = useCollection(db.settings)[0];
  const { user, logout } = useAuth();
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [reset, setReset] = useState(false);
  useEffect(() => { if (settings && !s) setS(settings); }, [settings, s]);
  if (!s || !user) return <PageSkeleton />;

  const section = (key: string, title: string, Icon: typeof User, children: React.ReactNode, onSave: () => Record<string, string>) => (
    <Card className="p-5"><h2 className="mb-4 flex items-center gap-2 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-100 text-forest-700"><Icon size={17} /></span>{title}</h2>
      <div className="space-y-3.5">{children}</div><Button className="mt-4" onClick={() => { const e = onSave(); setErrs(e); if (!Object.keys(e).length) toast(`${title} saved`); }} data-section={key}>Save</Button></Card>);

  const save = (p: Partial<Settings>) => db.settings.update(s.id, p);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div><h1 className="text-2xl font-extrabold">Settings</h1><p className="text-sm text-ink-mute">College, pass rules and demo data</p></div>
      {section("college", "College information", Building2, <>
        <Field label="College name" error={errs.collegeName}><Input value={s.collegeName} onChange={(e) => setS({ ...s, collegeName: e.target.value })} /></Field>
        <Field label="Address"><Input value={s.collegeAddress} onChange={(e) => setS({ ...s, collegeAddress: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Transport email" error={errs.collegeEmail}><Input value={s.collegeEmail} onChange={(e) => setS({ ...s, collegeEmail: e.target.value })} /></Field><Field label="Phone"><Input value={s.collegePhone} onChange={(e) => setS({ ...s, collegePhone: e.target.value })} /></Field></div></>,
        () => { const e: Record<string, string> = {}; if (s.collegeName.trim().length < 3) e.collegeName = "College name is required"; if (s.collegeEmail && !isEmail(s.collegeEmail)) e.collegeEmail = "Invalid email"; if (!Object.keys(e).length) save({ collegeName: s.collegeName.trim(), collegeAddress: s.collegeAddress, collegeEmail: s.collegeEmail, collegePhone: s.collegePhone }); return e; })}
      {section("admin", "Admin profile", User, <>
        <Field label="Display name" error={errs.adminName}><Input value={s.adminName} onChange={(e) => setS({ ...s, adminName: e.target.value })} /></Field>
        <Field label="Login email (read-only)"><Input value={user.email} disabled /></Field></>,
        () => { const e: Record<string, string> = {}; if (s.adminName.trim().length < 2) e.adminName = "Name is required"; if (!Object.keys(e).length) { save({ adminName: s.adminName.trim() }); db.users.update(user.id, { name: s.adminName.trim() }); } return e; })}
      {section("validity", "Pass validity & fees", CalendarClock, <>
        <div className="grid gap-3 sm:grid-cols-2">{PASS_TYPES.map((t) => (<div key={t.value} className="rounded-xl border border-forest-100 p-3"><div className="mb-2 text-sm font-bold">{t.label}</div><div className="grid grid-cols-2 gap-2">
          <Field label="Days" error={errs["d" + t.value]}><Input inputMode="numeric" value={s.validityDays[t.value]} onChange={(e) => setS({ ...s, validityDays: { ...s.validityDays, [t.value]: e.target.value === "" ? 0 : Number(e.target.value.replace(/\D/g, "")) } })} /></Field>
          <Field label="Fee (₹)" error={errs["f" + t.value]}><Input inputMode="numeric" value={s.fees[t.value]} onChange={(e) => setS({ ...s, fees: { ...s.fees, [t.value]: e.target.value === "" ? 0 : Number(e.target.value.replace(/\D/g, "")) } })} /></Field></div></div>))}</div>
        <p className="text-xs text-ink-mute">Validity applies to passes issued from now on; existing passes are unchanged.</p></>,
        () => { const e: Record<string, string> = {}; PASS_TYPES.forEach((t) => { if (s.validityDays[t.value] < 1) e["d" + t.value] = "Min 1 day"; if (s.fees[t.value] < 0) e["f" + t.value] = "Invalid"; }); if (!Object.keys(e).length) save({ validityDays: s.validityDays, fees: s.fees }); return e; })}
      {section("instr", "Application instructions", FileText, <Field label="Shown to students (one point per line)"><Textarea className="min-h-[140px]" value={s.instructions} onChange={(e) => setS({ ...s, instructions: e.target.value })} /></Field>, () => { save({ instructions: s.instructions }); return {}; })}
      <Card className="p-5"><AnnouncementManager /></Card>
      <Card className="border-red-100 p-5"><h2 className="font-bold text-red-700">Demo data</h2><p className="mb-3 mt-1 text-sm text-ink-soft">Wipe everything stored in this browser (applications, passes, uploads) and restore the original demo records.</p>
        <Button variant="danger" onClick={() => setReset(true)}><RotateCcw size={16} /> Reset demo data</Button></Card>
      <ConfirmDialog open={reset} danger title="Reset all demo data?" message="All changes and uploaded files will be erased and demo records restored. You will be logged out." confirmLabel="Reset everything"
        onConfirm={async () => { await resetDemoData(); toast("Demo data restored"); logout(); }} onClose={() => setReset(false)} />
    </div>
  );
}
