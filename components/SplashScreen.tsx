"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus } from "lucide-react";

const SPLASH_KEY = "bpms:splash:v1";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"bus" | "logo" | "tagline" | "out">("bus");

  useEffect(() => {
    // bus drives in → 500ms, logo fades → 900ms, tagline → 1400ms, hold → 2000ms, out → 2600ms
    const timers = [
      setTimeout(() => setPhase("logo"), 500),
      setTimeout(() => setPhase("tagline"), 900),
      setTimeout(() => setPhase("out"), 2000),
      setTimeout(onDone, 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-forest-800 overflow-hidden"
      animate={phase === "out" ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
    >
      {/* Animated background rings */}
      <motion.div
        className="absolute rounded-full border border-mint-300/10"
        style={{ width: 420, height: 420 }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full border border-mint-300/5"
        style={{ width: 620, height: 620 }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
      />

      {/* Bus icon sliding in */}
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.8 }}
        className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-mint-300/30 to-forest-600 shadow-lift"
      >
        <Bus size={48} className="text-mint-200" strokeWidth={1.5} />
        {/* spinning ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-mint-300/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Title */}
      <AnimatePresence>
        {(phase === "logo" || phase === "tagline" || phase === "out") && (
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="text-3xl font-extrabold tracking-tight text-white">Bus Pass</div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-mint-300">Management System</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tagline */}
      <AnimatePresence>
        {(phase === "tagline" || phase === "out") && (
          <motion.p
            className="relative z-10 mt-4 text-sm text-white/50"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Travel Smart. Go Further.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Loading bar */}
      <motion.div
        className="absolute bottom-10 left-1/2 h-0.5 w-32 -translate-x-1/2 overflow-hidden rounded-full bg-white/10"
      >
        <motion.div
          className="h-full rounded-full bg-mint-300"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.9, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
