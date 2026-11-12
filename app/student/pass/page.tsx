"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, FilePlus2, Info, QrCode, Share2, Ticket } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { useToast } from "@/hooks/useToast";
import PassCard, { useQr } from "@/components/PassCard";
import { Button, Card, EmptyState, Modal, PageSkeleton, StatusBadge } from "@/components/ui";
import { daysLeft, downloadUrl, fmtDate, fmtDateTime, passState, passTypeLabel, cn } from "@/lib/utils";
import { downloadPassPdf } from "@/lib/pass-tools";
import { getFile } from "@/lib/idb";

export default function MyPass() {
  const { profile, myPasses, pass: defaultPass, routes, settings } = useStudent();
  const toast = useToast();
  const [selId, setSelId] = useState<string | null>(null);
  const [details, setDetails] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pass = myPasses.find((p) => p.id === selId) ?? defaultPass;
  const route = routes.find((r) => r.id === pass?.routeId);
  const qr = useQr(pass, profile, 480);
  const st = pass ? passState(pass) : undefined;
  const history = useMemo(() => (pass ? [...pass.history].sort((a, b) => b.at.localeCompare(a.at)) : []), [pass]);

  if (!profile || !settings) return <PageSkeleton />;
  if (!pass) return (
    <div><h1 className="mb-2 text-2xl font-extrabold">My Bus Pass</h1>
      <Card><EmptyState icon={Ticket} title="No bus pass yet" text="Once your application is approved, your digital pass will appear here." action={<Link href="/student/apply"><Button><FilePlus2 size={16} /> Apply for a pass</Button></Link>} /></Card></div>
  );

  const pdf = async () => {
    setBusy(true);
    try {
      const f = profile.photoKey ? await getFile(profile.photoKey) : undefined;
      await downloadPassPdf({ pass, profile, route, collegeName: settings.collegeName, photo: f?.blob });
      toast("Pass PDF downloaded");
    } catch { toast("Could not create the PDF", "error"); }
    setBusy(false);
  };
  const share = async () => {
    const text = `Bus pass ${pass.id} · Route ${route?.number} · valid till ${fmtDate(pass.expiryDate)}`;
    try { if (navigator.share) await navigator.share({ title: "My bus pass", text }); else { await navigator.clipboard.writeText(text); toast("Pass details copied"); } } catch { /* cancelled */ }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-extrabold">My Bus Pass</h1>{st && <StatusBadge status={st} label={st === "active" ? "Active" : st === "revoked" ? "Revoked" : "Expired"} />}</div>
      {myPasses.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
          {myPasses.map((p) => <button key={p.id} role="tab" aria-selected={p.id === pass.id} onClick={() => setSelId(p.id)} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold", p.id === pass.id ? "border-forest-700 bg-forest-700 text-white" : "border-forest-100 bg-white text-ink-soft")}>{p.id} · {passState(p)}</button>)}
        </div>
      )}
      <PassCard key={pass.id} pass={pass} profile={profile} route={route} collegeName={settings.collegeName} />
      {st === "active" && daysLeft(pass) <= 30 && <div className="mt-3 rounded-2xl bg-orange-50 p-3.5 text-sm font-semibold text-orange-800">Your pass expires in {daysLeft(pass)} day{daysLeft(pass) === 1 ? "" : "s"}. <Link href="/student/apply" className="underline">Renew now</Link></div>}
      {st !== "active" && <div className="mt-3 rounded-2xl bg-red-50 p-3.5 text-sm font-semibold text-red-700">This pass is {st}. <Link href="/student/apply" className="underline">Apply for a new pass</Link></div>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button loading={busy} onClick={pdf}><Download size={17} /> Download PDF</Button>
        <Button variant="secondary" onClick={share}><Share2 size={17} /> Share</Button>
        <Button variant="secondary" onClick={() => setQrOpen(true)}><QrCode size={17} /> Show QR</Button>
        <Button variant="secondary" onClick={() => setDetails(true)}><Info size={17} /> Pass details</Button>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Pass QR code" footer={<Button onClick={() => qr && downloadUrl(`QR-${pass.id}.png`, qr)}><Download size={16} /> Download QR</Button>}>
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt={`QR code for ${pass.id}`} className="h-64 w-64 rounded-2xl border border-forest-100 p-2" />}
          <div className="mt-3 text-lg font-extrabold tracking-wider">{pass.id}</div><p className="mt-1 text-center text-xs text-ink-mute">Show this to the conductor or transport office. Verification is simulated for this demo.</p>
        </div>
      </Modal>

      <Modal open={details} onClose={() => setDetails(false)} title="Pass details">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {[["Pass ID", pass.id], ["Application", pass.applicationId], ["Student", profile.fullName], ["Student ID", profile.studentId], ["College", profile.college], ["Course", `${profile.course} ${profile.year}`], ["Route", route ? `${route.number} · ${route.start} → ${route.end}` : "—"], ["Pass type", passTypeLabel(pass.passType)], ["Issued", fmtDate(pass.issueDate)], ["Expires", fmtDate(pass.expiryDate)], ["Status", st ?? ""], ["Days left", st === "active" ? String(daysLeft(pass)) : "0"]].map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-xs text-ink-mute">{k}</dt><dd className="break-words font-semibold capitalize">{v}</dd></div>)}
        </dl>
        <h3 className="mb-2 mt-5 text-sm font-bold">History</h3>
        <ul className="space-y-2">{history.map((h, i) => <li key={i} className="flex justify-between gap-3 rounded-xl bg-forest-50 px-3 py-2 text-xs"><span><b className="capitalize">{h.action}</b> — {h.note}</span><span className="shrink-0 text-ink-mute">{fmtDateTime(h.at)}</span></li>)}</ul>
      </Modal>
    </div>
  );
}
