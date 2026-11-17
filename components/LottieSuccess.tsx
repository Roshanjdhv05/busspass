"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Props {
  onDone: () => void;
  title?: string;
  subtitle?: string;
}

export function LottieSuccess({ onDone, title = "Done!", subtitle }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/97 backdrop-blur"
    >
      {/* Success GIF */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
      >
        <Image
          src="/success-anim.gif"
          alt="Success"
          width={180}
          height={180}
          unoptimized
          priority
          className="object-contain"
        />
      </motion.div>

      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-2xl font-extrabold text-forest-800"
        >
          {title}
        </motion.h2>
      )}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-1 text-sm text-ink-mute"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
