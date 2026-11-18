"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Route as RouteIcon,
  ScanSearch,
  Ticket,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, Button, Field, StatusBadge, Textarea } from "./ui";
import { useFileUrl } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { approveApplication, rejectApplication, startReview } from "@/lib/services";
import { useToast } from "@/hooks/useToast";
import { fmtDateTime, passTypeLabel } from "@/lib/utils";
import type { Application } from "@/lib/types";

interface Props {
  id: string | null;
  onClose: () => void;
  onApproved?: (appId: string, passId: string) => void;
}

// ── Document Card with visual thumbnail & click-to-enlarge ───────────
function DocumentCard({
  label,
  fileKey,
  onOpen,
}: {
  label: string;
  fileKey?: string;
  onOpen: (url: string, name: string) => void;
}) {
  const { url, type, name, loading } = useFileUrl(fileKey);
  const isImg = type?.startsWith("image/") || (url && !type?.includes("pdf"));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (url) {
      onOpen(url, name ?? label);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick(e as unknown as React.MouseEvent)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-forest-100 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-400 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest-500"
    >
      {/* Top Label */}
      <div className="flex items-center justify-between gap-1 mb-1.5 px-0.5">
        <span className="text-[11px] font-bold text-forest-900 truncate">{label}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest-50 text-forest-700 transition group-hover:bg-forest-600 group-hover:text-white">
          <Maximize2 size={11} />
        </span>
      </div>

      {/* Image / Thumbnail Container */}
      <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-forest-50/60 border border-forest-100/70">
        {loading ? (
          <div className="flex items-center gap-1.5 text-xs text-ink-mute animate-pulse">
            <span className="h-2 w-2 rounded-full bg-forest-500 animate-ping" /> Loading…
          </div>
        ) : url && isImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : url ? (
          <div className="flex flex-col items-center gap-1.5 text-forest-700 p-2 text-center">
            <FileText size={28} className="text-forest-600" />
            <span className="text-[10px] font-semibold text-ink-mute truncate max-w-full">
              {name ?? label}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-forest-700 p-2 text-center">
            <FileCheck size={26} className="text-forest-600" />
            <span className="text-[10px] font-semibold text-ink-mute">Document on file</span>
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-forest-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-forest-800 shadow-lift">
            <Eye size={12} /> View Full
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Standalone Lightbox Modal (Portaled directly to body at z-[9999]) ──
function LightboxModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-white">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-mint-400" />
          <span className="text-sm font-bold tracking-wide">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            <Download size={14} /> Open / Save
          </a>
          <button
            onClick={onClose}
            aria-label="Close Preview"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 hover:rotate-90"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div
        className="flex flex-1 items-center justify-center p-4 sm:p-8 overflow-auto cursor-zoom-out"
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()} className="relative max-h-full max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={title}
            className="max-h-[82vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Application Detail Modal ────────────────────────────────────
export default function ApplicationDetail({ id, onClose, onApproved }: Props) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const a: Application | undefined = id ? db.applications.get(id) : undefined;
  const profile = a ? db.studentProfiles.get(a.studentProfileId) : undefined;
  const route = a ? db.busRoutes.get(a.routeId) : undefined;
  const stop = a ? db.busStops.get(a.stopId) : undefined;

  const close = () => {
    setRejecting(false);
    setReason("");
    setErr("");
    setLightbox(null);
    onClose();
  };

  if (!id || !a || !mounted) return null;

  const canDecide = a.status === "pending" || a.status === "under_review";

  const approve = () => {
    try {
      const p = approveApplication(a.id);
      close();
      if (onApproved) {
        onApproved(a.id, p.id);
      } else {
        toast(`✅ Approved — Pass ${p.id} issued`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "error");
    }
  };

  const reject = () => {
    if (reason.trim().length < 5) return setErr("Please give a clear reason (at least 5 characters).");
    rejectApplication(a.id, reason);
    toast("Application rejected");
    close();
  };

  const docs = [
    { label: "Passport Photo", key: a.documents.photo ?? profile?.photoKey },
    { label: "Student ID Card", key: a.documents.studentIdCard ?? profile?.idCardKey },
    { label: "Aadhar Card", key: profile?.aadharKey },
    { label: "PAN Card", key: profile?.panKey },
    { label: "Admission / Bonafide", key: a.documents.admissionProof ?? profile?.admissionKey },
  ].filter((d) => d.key);

  const content = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9000] flex items-start justify-center p-3 pt-4 sm:pt-7 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Proper Backdrop: Soft forest dark gradient with blur */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-forest-950/60 backdrop-blur-md transition-opacity"
          onClick={close}
        />

        {/* Modal Card Box */}
        <motion.div
          key="modal-card"
          initial={{ scale: 0.94, opacity: 0, y: -16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: -16 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-3xl rounded-3xl bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-forest-100 flex flex-col overflow-hidden max-h-[92vh] my-auto sm:my-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-forest-100/70 bg-gradient-to-r from-forest-50/90 via-mint-50/50 to-white px-6 py-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar
                name={a.fullName}
                fileKey={profile?.photoKey ?? a.documents.photo}
                size={52}
                className="ring-2 ring-forest-300 shadow-sm shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-forest-950 tracking-tight truncate">{a.fullName}</h2>
                  <span className="font-mono text-xs font-bold text-forest-700 bg-forest-100/80 px-2.5 py-0.5 rounded-full border border-forest-200">
                    {a.id}
                  </span>
                </div>
                <div className="text-xs font-medium text-ink-mute truncate mt-0.5">
                  {a.studentId} · {a.course} {a.year} · {a.college}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              <StatusBadge status={a.status} />
              <button
                onClick={close}
                aria-label="Close dialog"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100/70 text-ink-soft hover:bg-forest-200 hover:text-ink transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="px-6 py-4 space-y-4 overflow-y-auto">
            {/* 4 Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {/* Route */}
              <div className="rounded-2xl border border-forest-100 bg-forest-50/40 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-ink-mute font-medium text-[11px]">
                  <RouteIcon size={13} className="text-forest-600" /> Route & Journey
                </div>
                <div className="font-bold text-ink mt-1 truncate text-xs">
                  {route ? `Route ${route.number}` : "—"} · {a.startPoint} → {a.destination}
                </div>
                <div className="text-[11px] text-ink-mute mt-0.5 flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-forest-500 shrink-0" />
                  <span className="truncate">{stop?.name ?? "Campus Stop"}</span>
                </div>
              </div>

              {/* Pass Type */}
              <div className="rounded-2xl border border-forest-100 bg-forest-50/40 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-ink-mute font-medium text-[11px]">
                  <Ticket size={13} className="text-forest-600" /> Pass Type & Applied
                </div>
                <div className="font-bold text-forest-800 mt-1 text-xs">
                  {passTypeLabel(a.passType)} Pass
                </div>
                <div className="text-[11px] text-ink-mute mt-0.5 flex items-center gap-1 truncate">
                  <Clock size={11} className="text-forest-500 shrink-0" />
                  <span className="truncate">{fmtDateTime(a.submittedAt)}</span>
                </div>
              </div>

              {/* Mobile */}
              <div className="rounded-2xl border border-forest-100 bg-forest-50/40 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-ink-mute font-medium text-[11px]">
                  <Phone size={13} className="text-forest-600" /> Mobile Number
                </div>
                <div className="font-bold text-ink mt-1 truncate text-xs">{a.mobile || "—"}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Verified SMS</div>
              </div>

              {/* Email */}
              <div className="rounded-2xl border border-forest-100 bg-forest-50/40 p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-ink-mute font-medium text-[11px]">
                  <Mail size={13} className="text-forest-600" /> Email Address
                </div>
                <div className="font-bold text-ink mt-1 truncate text-xs">{a.email || "—"}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Verified Email</div>
              </div>
            </div>

            {/* Documents Attached Section with Real Click-To-Open Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-forest-900">
                    Documents Attached ({docs.length})
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <FileCheck size={11} /> Verified
                  </span>
                </div>
                <span className="text-xs font-semibold text-forest-700">Click any document to open</span>
              </div>

              {docs.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-center gap-2">
                  <FileText size={16} /> No documents uploaded for this application.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {docs.map((d) => (
                    <DocumentCard
                      key={d.label}
                      label={d.label}
                      fileKey={d.key}
                      onOpen={(url, title) => setLightbox({ url, title })}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Rejection Alert if already rejected */}
            {a.status === "rejected" && a.rejectionReason && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  <XCircle size={15} /> Rejection reason:
                </div>
                {a.rejectionReason}
              </div>
            )}

            {/* Inline Reject Form */}
            <AnimatePresence>
              {rejecting && (
                <motion.div
                  key="reject-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Field label="Reason for rejection (sent to student)" error={err}>
                    <Textarea
                      autoFocus
                      rows={2}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        setErr("");
                      }}
                      invalid={!!err}
                      placeholder="e.g. ID card copy is blurred or enrollment number mismatch..."
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Footer */}
          <div className="border-t border-forest-100 bg-forest-50/70 px-6 py-3.5 shrink-0">
            {canDecide ? (
              rejecting ? (
                <div className="flex items-center gap-3">
                  <Button variant="secondary" full onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" full onClick={reject}>
                    <XCircle size={15} /> Confirm Rejection
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={approve}
                    className="flex-1 bg-forest-700 hover:bg-forest-800 text-white shadow font-bold text-sm py-2.5"
                  >
                    <CheckCircle2 size={16} /> Approve & Issue Pass
                  </Button>

                  {a.status === "pending" && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        startReview(a.id);
                        toast("Marked as under review", "info");
                      }}
                      className="shrink-0 text-xs px-3.5 py-2.5 font-semibold"
                    >
                      <ScanSearch size={15} /> Reviewing
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    className="border-red-200 text-red-600 hover:bg-red-50 shrink-0 text-xs px-3.5 py-2.5 font-semibold"
                    onClick={() => setRejecting(true)}
                  >
                    <XCircle size={15} /> Reject
                  </Button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-forest-800">
                    {a.passId ? `Pass Generated: ${a.passId}` : `Status: ${a.status}`}
                  </span>
                </div>
                <Button variant="secondary" onClick={close} className="text-xs px-5 font-bold">
                  Close
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Lightbox Preview if clicked */}
      {lightbox && (
        <LightboxModal
          url={lightbox.url}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
