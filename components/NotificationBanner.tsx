"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const DISMISSED_KEY = "bpms:push:dismissed";

export function NotificationBanner() {
  const { permission, requestPermission, showNotification } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if: browser supports it, not yet granted/denied, not previously dismissed
    if (permission === "unsupported" || permission === "granted" || permission === "denied") return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch { return; }
    // Slight delay so it doesn't appear during splash
    const t = setTimeout(() => setVisible(true), 3500);
    return () => clearTimeout(t);
  }, [permission]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  };

  const allow = async () => {
    setVisible(false);
    const result = await requestPermission();
    if (result === "granted") {
      await showNotification("Bus Pass notifications enabled 🎉", {
        body: "You'll get alerts when your application is approved, pass is about to expire, and more.",
        url: "/student",
      });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
          className="fixed bottom-4 left-1/2 z-[1800] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl bg-forest-800 shadow-lift"
          role="dialog"
          aria-label="Enable notifications"
        >
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-300/20">
              <Bell size={20} className="text-mint-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Enable notifications</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/60">
                Get alerts when your pass is approved, expiring, or when new announcements arrive.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={allow}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-mint-300 px-3 text-xs font-bold text-forest-900 transition hover:bg-mint-400"
                >
                  <Bell size={13} /> Allow
                </button>
                <button
                  onClick={dismiss}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/20"
                >
                  <BellOff size={13} /> Not now
                </button>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Close"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 hover:text-white/80"
            >
              <X size={15} />
            </button>
          </div>
          {/* animated progress bar hinting auto-dismiss isn't happening */}
          <motion.div
            className="h-0.5 bg-mint-300/40"
            initial={{ scaleX: 0, transformOrigin: "left" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 12, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
