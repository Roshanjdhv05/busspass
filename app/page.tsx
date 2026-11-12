"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, GraduationCap, Info, Map, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { BusPhoto, Button, Field, Input, Logo } from "@/components/ui";
import { registerStudent } from "@/lib/services";
import { isEmail } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { ready, user, login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("student@demo.com");
  const [password, setPassword] = useState("demo123");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && user) router.replace(user.role === "admin" ? "/admin" : "/student"); }, [ready, user, router]);
  useEffect(() => {
    try { const r = localStorage.getItem("bpms:rememberEmail"); if (r) { setEmail(r); } } catch { /* ignore */ }
  }, []);

  const pickRole = (r: Role) => { setRole(r); setErr(""); setEmail(r === "admin" ? "admin@demo.com" : "student@demo.com"); setPassword("demo123"); if (r === "admin") setMode("login"); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!isEmail(email)) return setErr("Enter a valid email address.");
    if (password.length < 4) return setErr("Password must be at least 4 characters.");
    setBusy(true);
    setTimeout(() => {
      try {
        if (mode === "register") {
          if (name.trim().length < 2) { setErr("Enter your full name."); setBusy(false); return; }
          registerStudent(name, email, password); toast("Account created. Welcome aboard!");
        }
        const r = login(email, password, role);
        if (!r.ok) { setErr(r.error); setBusy(false); return; }
        try { remember ? localStorage.setItem("bpms:rememberEmail", email) : localStorage.removeItem("bpms:rememberEmail"); } catch { /* ignore */ }
        router.replace(r.user.role === "admin" ? "/admin" : "/student");
      } catch (ex) { setErr(ex instanceof Error ? ex.message : "Something went wrong."); setBusy(false); }
    }, 350);
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <BusPhoto kind="hero" className="hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/95 via-forest-900/40 to-forest-900/20" />
        <div className="absolute left-10 top-10"><Logo light size={42} /></div>
        <div className="absolute bottom-12 left-10 right-10 text-white">
          <h2 className="text-4xl font-extrabold leading-tight">Travel Smart,<br />Go Further.</h2>
          <p className="mt-3 max-w-md text-white/80">Apply for your college bus pass, track approval and ride with a digital pass — all in one place.</p>
        </div>
      </BusPhoto>

      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <div className="lg:hidden">
          <BusPhoto kind="hero" className="-mx-5 -mt-6 h-44 sm:-mx-10">
            <div className="absolute inset-0 bg-gradient-to-t from-cream via-forest-900/20 to-forest-900/30" />
            <div className="absolute left-5 top-5 sm:left-10"><Logo light /></div>
          </BusPhoto>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md flex-1 pt-5 lg:flex lg:flex-col lg:justify-center lg:pt-0">
          <h1 className="text-2xl font-extrabold text-ink">{mode === "login" ? "Welcome back!" : "Create student account"}</h1>
          <p className="mt-1 text-sm text-ink-mute">Choose your role to continue</p>

          <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Role">
            {([["student", "Student", "Apply & track passes", GraduationCap], ["admin", "Admin", "Manage applications", ShieldCheck]] as const).map(([r, t, d, Icon]) => (
              <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => pickRole(r)}
                className={cn("relative rounded-2xl border p-3.5 text-left transition", role === r ? "border-forest-600 bg-white shadow-soft ring-2 ring-forest-100" : "border-forest-100 bg-white/60 hover:bg-white")}>
                <Icon size={22} className={role === r ? "text-forest-700" : "text-ink-mute"} />
                <div className="mt-2 text-sm font-bold">{t}</div><div className="text-xs text-ink-mute">{d}</div>
                {role === r && <motion.span layoutId="role-dot" className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-mint-400" />}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
            <AnimatePresence initial={false}>
              {mode === "register" && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your full name" /></Field>
                </motion.div>
              )}
            </AnimatePresence>
            <Field label="Email address"><Input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" /></Field>
            <Field label="Password">
              <div className="relative">
                <Input type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-ink-mute">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex min-h-[44px] items-center gap-2 text-ink-soft"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-forest-700" /> Remember me</label>
              <button type="button" onClick={() => toast("Demo build: password is demo123", "info")} className="font-semibold text-forest-600">Forgot password?</button>
            </div>
            {err && <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{err}</motion.div>}
            <Button type="submit" size="lg" full loading={busy}>{mode === "login" ? "Login" : "Create account"} <ArrowRight size={18} /></Button>
          </form>

          {role === "student" && (
            <p className="mt-4 text-center text-sm text-ink-soft">
              {mode === "login" ? "New student? " : "Already registered? "}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); if (mode === "login") { setEmail(""); setPassword(""); } else { setEmail("student@demo.com"); setPassword("demo123"); } }} className="font-bold text-forest-700">{mode === "login" ? "Create an account" : "Login"}</button>
            </p>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-mint-100/70 p-3 text-xs text-forest-800"><Info size={15} className="mt-0.5 shrink-0" /><span>Demo logins — Student: <b>student@demo.com</b> · Admin: <b>admin@demo.com</b> · Password: <b>demo123</b></span></div>
          <div className="mt-4 flex justify-center gap-5 text-sm font-semibold text-forest-700">
            <Link href="/about" className="inline-flex min-h-[44px] items-center gap-1">About the system</Link>
            <Link href="/routes" className="inline-flex min-h-[44px] items-center gap-1"><Map size={15} /> Available routes</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
