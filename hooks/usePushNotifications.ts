"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

const SW_PATH = "/sw.js";
const PERM_KEY = "bpms:push:asked";

/** Returns whether this browser supports push/service-worker at all. */
function isSupported() {
  return typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    "PushManager" in window;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  const asked = useRef(false);

  // Register SW on mount
  useEffect(() => {
    if (!isSupported()) { setPermission("unsupported"); return; }
    setPermission(Notification.permission as PushPermission);
    navigator.serviceWorker.register(SW_PATH).then((reg) => {
      setSwReg(reg);
    }).catch(() => {/* SW registration failed gracefully */});
  }, []);

  /** Ask the user for notification permission (call only on user gesture). */
  const requestPermission = useCallback(async (): Promise<PushPermission> => {
    if (!isSupported()) return "unsupported";
    if (asked.current) return permission;
    asked.current = true;
    try {
      localStorage.setItem(PERM_KEY, "1");
    } catch { /* ignore */ }
    const result = await Notification.requestPermission();
    setPermission(result as PushPermission);
    return result as PushPermission;
  }, [permission]);

  /**
   * Show a local notification immediately (no server push needed).
   * Falls back gracefully if permission is not granted.
   */
  const showNotification = useCallback(async (
    title: string,
    opts: { body?: string; icon?: string; url?: string; tag?: string } = {}
  ) => {
    if (!isSupported()) return;
    if (Notification.permission !== "granted") return;
    const { body = "", icon = "/icon-192.png", url = "/", tag } = opts;
    // Prefer SW notification (shows on mobile + persists) over new Notification()
    if (swReg) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await swReg.showNotification(title, {
          body, icon, badge: "/icon-192.png",
          data: { url },
          tag,
        } as any);
        return;
      } catch { /* fall through to Notification API */ }
    }
    new Notification(title, { body, icon });
  }, [swReg]);

  return { permission, requestPermission, showNotification };
}
