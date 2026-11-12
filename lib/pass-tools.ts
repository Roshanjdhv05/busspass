"use client";
import QRCode from "qrcode";
import type { BusRoute, IssuedPass, StudentProfile } from "./types";
import { fmtDate, passState, passTypeLabel } from "./utils";

/** Payload encoded in the QR. Verification is simulated against local data. */
export function qrPayload(pass: IssuedPass, profile?: StudentProfile) {
  return JSON.stringify({ v: 1, pass: pass.id, sid: profile?.studentId ?? "", exp: pass.expiryDate.slice(0, 10) });
}
export function parsePassInput(text: string): string {
  const t = text.trim();
  if (t.startsWith("{")) {
    try { const j = JSON.parse(t); if (typeof j.pass === "string") return j.pass.toUpperCase(); } catch { /* fall through */ }
  }
  return t.toUpperCase();
}
export function qrDataUrl(text: string, size = 320): Promise<string> {
  return QRCode.toDataURL(text, { width: size, margin: 1, color: { dark: "#0B3B2A", light: "#FFFFFF" }, errorCorrectionLevel: "M" });
}

async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b); });
}

export async function downloadPassPdf(opts: { pass: IssuedPass; profile: StudentProfile; route?: BusRoute; collegeName: string; photo?: Blob }) {
  const { jsPDF } = await import("jspdf");
  const { pass, profile, route, collegeName, photo } = opts;
  const doc = new jsPDF({ unit: "mm", format: [100, 160] }); // portrait card-like page
  const W = 100;
  doc.setFillColor(11, 59, 42); doc.rect(0, 0, W, 160, "F");
  doc.setFillColor(15, 74, 52); doc.rect(0, 0, W, 34, "F");
  doc.setTextColor(143, 221, 182); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("STUDENT BUS PASS", 8, 12);
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text(collegeName, 8, 21, { maxWidth: 84 });
  const state = passState(pass);
  doc.setFillColor(state === "active" ? 61 : 220, state === "active" ? 182 : 38, state === "active" ? 127 : 38);
  doc.roundedRect(W - 30, 6, 22, 7, 3.5, 3.5, "F");
  doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.text(state.toUpperCase(), W - 19, 10.7, { align: "center" });

  // white body
  doc.setFillColor(255, 255, 255); doc.roundedRect(6, 38, W - 12, 112, 4, 4, "F");
  let y = 46;
  if (photo && photo.type.startsWith("image/")) {
    try { doc.addImage(await blobToDataUrl(photo), "JPEG", 10, y, 22, 28); } catch { /* skip photo */ }
  } else {
    doc.setFillColor(213, 232, 222); doc.roundedRect(10, y, 22, 28, 2, 2, "F");
    doc.setTextColor(15, 74, 52); doc.setFontSize(16);
    doc.text(profile.fullName.split(" ").map((s) => s[0]).slice(0, 2).join(""), 21, y + 17, { align: "center" });
  }
  doc.setTextColor(30, 37, 34); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(profile.fullName, 36, y + 6, { maxWidth: 52 });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(90, 100, 95);
  doc.text(profile.studentId, 36, y + 12); doc.text(`${profile.course} ${profile.year}`, 36, y + 17);
  doc.text(passTypeLabel(pass.passType) + " pass", 36, y + 22);

  y = 82;
  const rows: [string, string][] = [
    ["Pass ID", pass.id],
    ["Route", route ? `${route.number} · ${route.start} → ${route.end}` : "—"],
    ["Issued", fmtDate(pass.issueDate)],
    ["Valid till", fmtDate(pass.expiryDate)],
  ];
  rows.forEach(([k, v]) => {
    doc.setFontSize(7); doc.setTextColor(123, 134, 128); doc.text(k.toUpperCase(), 10, y);
    doc.setFontSize(9.5); doc.setTextColor(30, 37, 34); doc.setFont("helvetica", "bold"); doc.text(v, 10, y + 4.5, { maxWidth: 78 });
    doc.setFont("helvetica", "normal"); y += 11;
  });
  const qr = await qrDataUrl(qrPayload(pass, profile), 400);
  doc.addImage(qr, "PNG", 38, 125, 24, 24);
  doc.setFontSize(6.5); doc.setTextColor(123, 134, 128);
  doc.text("Scan to verify · demo verification only", W / 2, 154, { align: "center" });
  doc.save(`BusPass-${pass.id}.pdf`);
}
