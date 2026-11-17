"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 2600);
    const t2 = setTimeout(onDone, 3050);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
      animate={phase === "out" ? { opacity: 0, scale: 1.03 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: "easeInOut" }}
    >
      {/* Bus GIF */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Image
          src="/splash-bus.gif"
          alt="Yatrik bus"
          width={180}
          height={120}
          unoptimized
          priority
          className="object-contain"
        />
      </motion.div>

      {/* Animated "Yatrik" — Yat=green, rik=black */}
      <motion.div
        className="mt-5 flex items-baseline gap-0"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
      >
        {"Yat".split("").map((ch, i) => (
          <motion.span
            key={`yat-${i}`}
            className="text-4xl font-extrabold tracking-tight text-forest-700"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 + i * 0.07, duration: 0.38 }}
          >
            {ch}
          </motion.span>
        ))}
        {"rik".split("").map((ch, i) => (
          <motion.span
            key={`rik-${i}`}
            className="text-4xl font-extrabold tracking-tight text-gray-900"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.63 + i * 0.07, duration: 0.38 }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink-mute"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        Book • Travel • Reach
      </motion.p>

      {/* Loading bar */}
      <div className="absolute bottom-10 left-1/2 h-0.5 w-32 -translate-x-1/2 overflow-hidden rounded-full bg-forest-100">
        <motion.div
          className="h-full rounded-full bg-forest-600"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
