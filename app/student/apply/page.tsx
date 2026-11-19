"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, Pencil } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { useToast } from "@/hooks/useToast";
import { db } from "@/lib/storage";
import { submitApplication, uploadDocumentToSupabase } from "@/lib/services";
import { Avatar, Button, Card, Field, Input, PageSkeleton, Select } from "@/components/ui";
import { COURSES, YEARS, cn, isEmail, isMobile, passTypeLabel } from "@/lib/utils";
import { PASS_TYPES, type Application, type PassType } from "@/lib/types";
import { LottieSuccess } from "@/components/LottieSuccess";

interface Form {
  fullName: string; studentId: string; college: string; course: string; year: string; mobile: string; email: string; profilePhoto?: string;
  startStop: string; destination: string; routeId: string; stopId: string; passType: PassType | "";
}
type Errors = Partial<Record<keyof Form, string>>;
const STEPS = ["Personal", "Journey", "Review"];

function validate(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!/^[A-Za-z0-9\-\/]{4,20}$/.test(f.studentId.trim())) e.studentId = "Enter a valid ID (4–20 letters/numbers)";
    if (f.college.trim().length < 3) e.college = "Enter your college name";
    if (!f.course) e.course = "Select your course";
    if (!f.year) e.year = "Select your year";
    if (!isMobile(f.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
    if (!isEmail(f.email)) e.email = "Enter a valid email address";
  }
  if (step === 1) {
    if (!f.startStop) e.startStop = "Choose your starting point";
    if (!f.destination) e.destination = "Choose a destination";
    if (!f.routeId) e.routeId = "Choose a bus route";
    if (!f.stopId) e.stopId = "Choose your preferred stop";
    if (!f.passType) e.passType = "Choose a pass type";
  }
  return e;
}

function Apply() {
  const { user, profile, routes, stops, settings, apps } = useStudent();
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<{ app: Application } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const resubmitId = sp.get("resubmit");
  const routeParam = sp.get("route");
  const pending = apps.find((a) => a.status === "pending" || a.status === "under_review");

  useEffect(() => {
    if (form || !user || !profile || !routes.length) return;
    const prev = resubmitId ? db.applications.get(resubmitId) : undefined;
    const r = prev ? routes.find((x) => x.id === prev.routeId) : routes.find((x) => x.id === routeParam);
    const rStops = r ? stops.filter((s) => s.routeId === r.id).sort((a, b) => a.order - b.order) : [];
    setForm({
      fullName: prev?.fullName ?? profile.fullName, studentId: prev?.studentId ?? profile.studentId,
      college: prev?.college ?? (profile.college || settings?.collegeName || ""),
      course: prev?.course ?? profile.course, year: prev?.year ?? profile.year,
      mobile: prev?.mobile ?? profile.mobile, email: prev?.email ?? profile.email,
      profilePhoto: profile.photoKey,
      startStop: prev ? prev.startPoint : r?.start ?? "",
      destination: prev ? prev.destination : r?.end ?? "",
      routeId: r?.id ?? "", stopId: prev?.stopId ?? rStops[0]?.id ?? "", passType: prev?.passType ?? "",
    });
  }, [form, user, profile, routes, stops, settings, resubmitId, routeParam]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const startOptions = useMemo(() => {
    const names = new Set<string>();
    stops.forEach((s) => { const r = routes.find((x) => x.id === s.routeId); if (r && s.order < stops.filter((q) => q.routeId === r.id).length - 1) names.add(s.name); });
    return Array.from(names).sort();
  }, [stops, routes]);
  const destOptions = useMemo(() => Array.from(new Set(routes.map((r) => r.end))).sort(), [routes]);
  const routeOptions = useMemo(() => routes.filter((r) => {
    const rs = stops.filter((s) => s.routeId === r.id);
    return (!form?.startStop || rs.some((s) => s.name === form.startStop)) && (!form?.destination || r.end === form.destination);
  }), [routes, stops, form?.startStop, form?.destination]);
  const route = routes.find((r) => r.id === form?.routeId);
  const routeStops = route ? stops.filter((s) => s.routeId === route.id).sort((a, b) => a.order - b.order) : [];
  const pickupStops = routeStops.slice(0, -1);
  const stop = routeStops.find((s) => s.id === form?.stopId);

  if (!user || !profile || !settings || !form) return <PageSkeleton />;

  // Redirect to profile docs if documents not uploaded yet
  if (!profile.documentsUploaded) {
    return (
      <div className="mx-auto max-w-md pt-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-500">
          <Camera size={36} />
        </div>
        <h1 className="text-xl font-extrabold">Upload your documents first</h1>
        <p className="mt-2 text-sm text-ink-mute">
          To apply for a bus pass, you need to upload your Aadhar card, PAN card, student ID card, and a passport photo once from your profile. After that you can apply without re-uploading.
        </p>
        <Button size="lg" full className="mt-6" onClick={() => router.push("/student/profile?tab=docs")}>
          Go to Profile → Documents
        </Button>
      </div>
    );
  }

  const onStart = (name: string) => {
    setForm((f) => {
      if (!f) return f;
      const matches = routes.filter((r) => stops.some((s) => s.routeId === r.id && s.name === name) && (!f.destination || r.end === f.destination));
      const r = matches.length === 1 ? matches[0] : matches.find((m) => m.id === f.routeId);
      const s = r ? stops.find((x) => x.routeId === r.id && x.name === name) : undefined;
      return { ...f, startStop: name, routeId: r?.id ?? "", stopId: s?.id ?? "", destination: r?.end ?? f.destination };
    });
    setErrors((e) => ({ ...e, startStop: undefined, routeId: undefined, stopId: undefined }));
  };
  const onRoute = (id: string) => {
    const r = routes.find((x) => x.id === id);
    const rs = stops.filter((s) => s.routeId === id).sort((a, b) => a.order - b.order);
    const s = rs.find((x) => x.name === form.startStop) ?? rs[0];
    setForm({ ...form, routeId: id, destination: r?.end ?? form.destination, startStop: form.startStop && rs.some((x) => x.name === form.startStop) ? form.startStop : r?.start ?? "", stopId: s?.id ?? "" });
    setErrors((e) => ({ ...e, routeId: undefined, stopId: undefined, startStop: undefined }));
  };

  const next = () => {
    const e = validate(step, form);
    setErrors(e);
    if (Object.keys(e).length) { toast("Please fix the highlighted fields", "error"); return; }
    setStep((s) => s + 1); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const jump = (s: number) => { setStep(s); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const submit = () => {
    for (let i = 0; i < 2; i++) { const e = validate(i, form); if (Object.keys(e).length) { setErrors(e); setStep(i); toast("Some details need attention", "error"); return; } }
    setBusy(true);
    (async () => {
      try {
        if (form.profilePhoto && profile.id) db.studentProfiles.update(profile.id, { photoKey: form.profilePhoto });

        // Upload documents to Supabase Storage so admin can view them from any device
        const userId = user.id;
        const [photoUrl, idCardUrl, admissionUrl, aadharUrl, panUrl] = await Promise.all([
          uploadDocumentToSupabase(profile.photoKey, `users/${userId}`),
          uploadDocumentToSupabase(profile.idCardKey, `users/${userId}`),
          uploadDocumentToSupabase(profile.admissionKey, `users/${userId}`),
          uploadDocumentToSupabase(profile.aadharKey, `users/${userId}`),
          uploadDocumentToSupabase(profile.panKey, `users/${userId}`),
        ]);

        // Update profile with Supabase URLs so future views also work
        if (profile.id) {
          db.studentProfiles.update(profile.id, {
            photoKey: photoUrl ?? profile.photoKey,
            idCardKey: idCardUrl ?? profile.idCardKey,
            admissionKey: admissionUrl ?? profile.admissionKey,
            aadharKey: aadharUrl ?? profile.aadharKey,
            panKey: panUrl ?? profile.panKey,
          });
        }

        const { app } = submitApplication({
          userId: user.id, studentProfileId: profile.id, fullName: form.fullName.trim(),
          studentId: form.studentId.trim().toUpperCase(), college: form.college.trim(),
          course: form.course, year: form.year,
          mobile: form.mobile.replace(/[\s-]/g, "").replace(/^\+91/, ""),
          email: form.email.trim().toLowerCase(),
          routeId: form.routeId, startPoint: form.startStop, destination: form.destination,
          stopId: form.stopId, passType: form.passType as PassType,
          documents: {
            photo: photoUrl ?? profile.photoKey,
            studentIdCard: idCardUrl ?? profile.idCardKey,
            admissionProof: admissionUrl ?? profile.admissionKey,
          },
          resubmittedFrom: resubmitId ?? undefined,
        });
        setDone({ app });
        setShowSuccess(true);
      } catch (ex) {
        console.error("Submit application error:", ex);
        toast(ex instanceof Error ? ex.message : "Could not submit", "error");
      }
      setBusy(false);
    })();
  };

  // ---------- success screen
  if (done) {
    if (showSuccess) {
      return (
        <LottieSuccess
          onDone={() => setShowSuccess(false)}
          title="Application Submitted!"
          subtitle="We'll notify you once it's approved."
        />
      );
    }
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-8 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          {[...Array(10)].map((_, i) => (
            <motion.span key={i} initial={{ scale: 0, opacity: 1, x: 0, y: 0 }} animate={{ scale: 1, opacity: 0, x: Math.cos((i / 10) * 6.28) * 70, y: Math.sin((i / 10) * 6.28) * 70 }} transition={{ duration: 0.9, delay: 0.35 }} className="absolute h-2.5 w-2.5 rounded-full bg-mint-400" />
          ))}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10, stiffness: 160 }} className="flex h-24 w-24 items-center justify-center rounded-full bg-forest-600 text-white shadow-lift">
            <Check size={40} />
          </motion.div>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Application Submitted!</h1>
        <p className="mt-1 text-sm text-ink-mute">Your application is pending review. You'll receive a notification once approved by the admin.</p>
        <div className="mt-5 w-full rounded-2xl border border-forest-100 bg-white p-4 shadow-soft">
          <div><div className="text-xs font-semibold uppercase text-ink-mute">Application ID</div><div className="text-lg font-extrabold tracking-wider text-forest-800">{done.app.id}</div></div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-orange-700"><span className="inline-block h-2 w-2 rounded-full bg-orange-400" />Pending review</div>
        </div>
        <div className="mt-5 w-full space-y-2.5">
          <Button size="lg" full onClick={() => router.push(`/student/applications/${done.app.id}`)}>Track Application <ArrowRight size={18} /></Button>
          <Button size="lg" variant="secondary" full onClick={() => router.push("/student")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (pending && !resubmitId) {
    return (
      <div className="mx-auto max-w-md pt-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600"><CheckCircle2 size={30} /></div>
        <h1 className="text-xl font-extrabold">Application in progress</h1>
        <p className="mt-1 text-sm text-ink-mute">{pending.id} is {pending.status === "pending" ? "waiting for review" : "under review"}.</p>
        <Link href={`/student/applications/${pending.id}`} className="mt-5 inline-block"><Button size="lg">Track {pending.id}</Button></Link>
      </div>
    );
  }

  const defaultValidity: Record<PassType, number> = { monthly: 30, quarterly: 90, "half-yearly": 180, yearly: 365 };
  const defaultFees: Record<PassType, number> = { monthly: 450, quarterly: 1250, "half-yearly": 2400, yearly: 4500 };
  const validityDays = settings?.validityDays ?? defaultValidity;
  const fees = settings?.fees ?? defaultFees;

  const fee = form.passType ? (fees[form.passType] ?? 0) : 0;
  const days = form.passType ? (validityDays[form.passType] ?? 0) : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => (step === 0 ? router.back() : jump(step - 1))} aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-forest-50"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-extrabold">{resubmitId ? "Resubmit Application" : "Apply for Bus Pass"}</h1>
      </div>

      {/* progress */}
      <ol className="mb-6 flex items-center" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <button type="button" disabled={i > step} onClick={() => jump(i)} aria-current={i === step ? "step" : undefined} className="flex flex-col items-center gap-1">
              <motion.span animate={{ scale: i === step ? 1.1 : 1 }} className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors", i < step ? "border-forest-600 bg-forest-600 text-white" : i === step ? "border-forest-700 bg-forest-700 text-white" : "border-forest-200 bg-white text-ink-mute")}>{i < step ? <Check size={16} /> : i + 1}</motion.span>
              <span className={cn("hidden text-[11px] font-semibold xs:block", i <= step ? "text-forest-700" : "text-ink-mute")}>{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className="relative mx-1 h-0.5 flex-1 bg-forest-100"><motion.div className="absolute inset-y-0 left-0 bg-forest-600" animate={{ width: i < step ? "100%" : "0%" }} /></div>}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
          {step === 0 && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-bold">Personal Details</h2><p className="text-sm text-ink-mute">Pre-filled from your profile — edit if needed</p></div>
              <div className="flex flex-col items-center gap-2">
                <ProfilePhoto name={form.fullName || user.name} value={form.profilePhoto} onChange={(k) => set("profilePhoto", k)} />
              </div>
              <Field label="Full name" error={errors.fullName}><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} invalid={!!errors.fullName} autoComplete="name" /></Field>
              <Field label="Student ID / Enrollment no." error={errors.studentId}><Input value={form.studentId} onChange={(e) => set("studentId", e.target.value)} invalid={!!errors.studentId} placeholder="STU2025001" /></Field>
              <Field label="College name" error={errors.college}><Input value={form.college} onChange={(e) => set("college", e.target.value)} invalid={!!errors.college} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Course" error={errors.course}><Select value={form.course} onChange={(e) => set("course", e.target.value)} invalid={!!errors.course}><option value="">Select</option>{COURSES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
                <Field label="Year" error={errors.year}><Select value={form.year} onChange={(e) => set("year", e.target.value)} invalid={!!errors.year}><option value="">Select</option>{YEARS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
              </div>
              <Field label="Mobile number" error={errors.mobile}><Input inputMode="tel" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} invalid={!!errors.mobile} placeholder="98XXXXXXXX" autoComplete="tel" /></Field>
              <Field label="Email address" error={errors.email}><Input type="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} invalid={!!errors.email} autoComplete="email" /></Field>
              <div className="rounded-xl border border-forest-100 bg-mint-50 p-3 text-xs text-forest-700">
                ✓ Your documents (Aadhar, PAN, student ID) are already saved in your profile and will be used automatically.
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-bold">Journey Details</h2><p className="text-sm text-ink-mute">Select your route and pass type</p></div>
              <Field label="Starting point" error={errors.startStop}><Select value={form.startStop} onChange={(e) => onStart(e.target.value)} invalid={!!errors.startStop}><option value="">Select starting point</option>{startOptions.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Destination" error={errors.destination}><Select value={form.destination} onChange={(e) => { setForm({ ...form, destination: e.target.value, routeId: "", stopId: "" }); setErrors((x) => ({ ...x, destination: undefined })); }} invalid={!!errors.destination}><option value="">Select destination</option>{destOptions.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Bus route" error={errors.routeId} hint={routeOptions.length === 0 ? "No route connects these two points" : undefined}>
                <Select value={form.routeId} onChange={(e) => onRoute(e.target.value)} invalid={!!errors.routeId}><option value="">Select route</option>{routeOptions.map((r) => <option key={r.id} value={r.id}>{r.number} — {r.start} → {r.end} ({r.distanceKm} km)</option>)}</Select>
              </Field>
              <Field label="Preferred bus stop" error={errors.stopId}><Select value={form.stopId} onChange={(e) => set("stopId", e.target.value)} invalid={!!errors.stopId} disabled={!route}><option value="">{route ? "Select stop" : "Choose a route first"}</option>{pickupStops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
              {route && <div className="rounded-xl bg-mint-100/70 p-3 text-sm text-forest-800">Route <b>{route.number}</b> · {route.distanceKm} km · about {route.durationMin} min</div>}
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Pass type</div>
                <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
                  {PASS_TYPES.map((t) => (
                    <button key={t.value} type="button" role="radio" aria-checked={form.passType === t.value} onClick={() => set("passType", t.value)}
                      className={cn("relative rounded-2xl border p-3 text-left transition", form.passType === t.value ? "border-forest-600 bg-mint-50 ring-2 ring-forest-100" : "border-forest-100 bg-white")}>
                      <div className="text-sm font-bold">{t.label}</div><div className="text-xs text-ink-mute">{(validityDays[t.value] ?? 30)} days</div><div className="mt-1 text-sm font-extrabold text-forest-700">₹{(fees[t.value] ?? 0).toLocaleString("en-IN")}</div>
                      {form.passType === t.value && <Check size={16} className="absolute right-3 top-3 text-forest-600" />}
                    </button>
                  ))}
                </div>
                {errors.passType && <div role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.passType}</div>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div><h2 className="text-lg font-bold">Review & Submit</h2><p className="text-sm text-ink-mute">Your application will be sent to the admin for review and approval.</p></div>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={form.fullName} fileKey={form.profilePhoto} size={56} />
                  <div className="min-w-0 flex-1"><div className="truncate text-lg font-extrabold">{form.fullName}</div><div className="text-sm text-ink-mute">{form.studentId.toUpperCase()}</div></div>
                  <button onClick={() => jump(0)} className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-forest-600 hover:bg-forest-50"><Pencil size={14} /> Edit</button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  {[["College", form.college], ["Course", `${form.course} · ${form.year}`], ["Mobile", form.mobile], ["Email", form.email]].map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs text-ink-mute">{k}</dt><dd className="truncate font-semibold">{v}</dd></div>)}
                </dl>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Journey</h3><button onClick={() => jump(1)} className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-forest-600 hover:bg-forest-50"><Pencil size={14} /> Edit</button></div>
                <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div><dt className="text-xs text-ink-mute">Route</dt><dd className="font-semibold">{route?.number} · {form.startStop} → {form.destination}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Preferred stop</dt><dd className="font-semibold">{stop?.name}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Pass type</dt><dd className="font-semibold">{form.passType && passTypeLabel(form.passType)} ({days} days)</dd></div>
                  <div><dt className="text-xs text-ink-mute">Fee</dt><dd className="font-extrabold text-forest-700">₹{fee.toLocaleString("en-IN")}</dd></div>
                </dl>
              </Card>
              <Card className="p-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Documents (from your profile)</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {[["Aadhar card", profile.aadharKey], ["PAN card", profile.panKey], ["Student ID card", profile.idCardKey], ["Passport photo", profile.photoKey]].map(([k, v]) => (
                    <li key={k as string} className="flex items-center gap-2">
                      <CheckCircle2 size={15} className={v ? "text-emerald-600" : "text-amber-500"} />
                      <span>{k as string}</span>
                      {!v && <span className="text-xs text-amber-600">(not uploaded)</span>}
                    </li>
                  ))}
                </ul>
                <Link href="/student/profile?tab=docs" className="mt-2 inline-block text-xs font-semibold text-forest-600 hover:underline">Update documents in profile →</Link>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-20 z-10 mt-6 lg:bottom-4">
        {step < 2 ? <Button size="lg" full onClick={next} className="shadow-lift">Next <ArrowRight size={18} /></Button>
          : <Button size="lg" full loading={busy} onClick={submit} className="shadow-lift">Submit Application <ArrowRight size={18} /></Button>}
      </div>
    </div>
  );
}

function ProfilePhoto({ name, value, onChange }: { name: string; value?: string; onChange: (k?: string) => void }) {
  return (
    <div className="relative">
      <Avatar name={name || "?"} fileKey={value} size={96} className="ring-4 ring-mint-100" />
      <label className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-forest-700 text-white shadow-lift">
        <Camera size={18} /><span className="sr-only">Upload profile photograph</span>
        <input type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ""; if (!f || !f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) return;
          const { compressImage, putFile } = await import("@/lib/idb"); const { uid } = await import("@/lib/storage");
          const key = uid("file"); await putFile(key, await compressImage(f, 500), f.name); onChange(key);
        }} />
      </label>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<PageSkeleton />}><Apply /></Suspense>; }
