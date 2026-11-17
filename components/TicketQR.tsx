"use client";
import { useEffect, useRef } from "react";
import type { BusTicket } from "@/lib/types";

interface Props {
  ticket: BusTicket;
  size?: number;
}

// Builds a compact verifiable payload for the QR code
function ticketPayload(t: BusTicket): string {
  return JSON.stringify({
    id: t.id,
    from: t.fromStopName,
    to: t.toStopName,
    type: t.ticketType,
    pax: t.passengers,
    fare: t.fare,
    exp: t.expiresAt,
    used: t.used,
  });
}

export function TicketQR({ ticket, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    import("qrcode").then((QRCode) => {
      if (cancelled || !canvas) return;
      QRCode.toCanvas(canvas, ticketPayload(ticket), {
        width: size,
        margin: 2,
        color: { dark: "#155A3F", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      }).catch(() => {/* ignore */});
    });

    return () => { cancelled = true; };
  }, [ticket, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: 12 }}
    />
  );
}

// Returns the base URL for a verify link
export function ticketVerifyUrl(ticketId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/verify?t=${ticketId}`;
  }
  return `/verify?t=${ticketId}`;
}
