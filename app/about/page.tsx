"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, Map, QrCode, ShieldCheck, Ticket } from "lucide-react";
import { BusPhoto, Button, Logo } from "@/components/ui";

const steps = [
  { icon: FileCheck2, t: "Apply online", d: "Fill a 4-step form, pick your route and stop, and upload your documents." },
  { icon: ShieldCheck, t: "Admin review", d: "The transport office verifies documents and approves or asks you to correct them." },
  { icon: Ticket, t: "Get your pass", d: "Approved applications instantly produce a digital pass with a unique ID." },
  { icon: QrCode, t: "Scan & ride", d: "Show the QR code to the conductor; the office can verify it in seconds." },
];

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-center justify-between"><Link href="/"><Logo /></Link><Link href="/" className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-forest-700 hover:bg-forest-50"><ArrowLeft size={16} /> Login</Link></div>
      <BusPhoto kind="hero" className="h-56 rounded-3xl sm:h-72">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/90 via-forest-900/30 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-white"><h1 className="text-2xl font-extrabold sm:text-4xl">Travel smart. Go further.</h1><p className="mt-1 max-w-xl text-sm text-white/80">A paperless student bus pass system for colleges — apply, track, approve and verify from any device.</p></div>
      </BusPhoto>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <motion.div key={s.t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex gap-4 rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-forest-700"><s.icon size={22} /></div>
            <div><div className="text-xs font-bold text-mint-500">STEP {i + 1}</div><h3 className="font-bold">{s.t}</h3><p className="text-sm text-ink-soft">{s.d}</p></div>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-forest-800 p-6 text-white">
        <h2 className="text-lg font-bold">What&apos;s inside</h2>
        <ul className="mt-3 grid gap-2 text-sm text-white/85 sm:grid-cols-2">
          {["Interactive route map with stops", "Digital pass with QR + PDF download", "Application tracking timeline", "Admin approvals with rejection reasons", "Pass revoke / extend / expiry alerts", "CSV reports and announcements"].map((x) => <li key={x} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-mint-300" />{x}</li>)}
        </ul>
        <p className="mt-4 text-xs text-white/60">Demo build: all data lives in your browser (LocalStorage + IndexedDB). No server, no accounts sent anywhere.</p>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row"><Link href="/routes"><Button variant="secondary" full><Map size={16} /> View routes</Button></Link><Link href="/"><Button full>Get started <ArrowRight size={16} /></Button></Link></div>
    </div>
  );
}
