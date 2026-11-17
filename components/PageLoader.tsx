"use client";
import { motion } from "framer-motion";
import { Bus } from "lucide-react";

/** Full-page loader shown while auth/data is initialising */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[8000] flex flex-col items-center justify-center bg-cream">
      {/* Bouncing bus */}
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-700 text-mint-200 shadow-soft"
      >
        <Bus size={32} strokeWidth={1.5} />
      </motion.div>

      {/* Road / dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-forest-300"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-ink-mute">Loading…</p>
    </div>
  );
}

/** Inline spinner for buttons / cards */
export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
      className={`inline-block rounded-full border-2 border-forest-200 border-t-forest-600 ${className}`}
    />
  );
}

/** Shimmer skeleton row */
export function ShimmerRow({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-forest-50 ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ x: ["−100%", "200%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/** Card-level skeleton with shimmer */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-forest-50 bg-white p-4 shadow-soft space-y-3">
      <ShimmerRow className="h-5 w-2/3" />
      <ShimmerRow className="h-4 w-full" />
      <ShimmerRow className="h-4 w-5/6" />
      <ShimmerRow className="h-10 w-1/3 mt-2" />
    </div>
  );
}
