"use client";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { SplashScreen } from "./SplashScreen";
import { NotificationBanner } from "./NotificationBanner";
import { seedIfNeeded } from "@/lib/seed";
import { syncAllFromSupabase } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";

const SPLASH_KEY = "bpms:splash:v2";

export function Providers({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const [ready, setReady] = useState(false);

  // Show splash only on the very first visit (per session)
  const [showSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      if (sessionStorage.getItem(SPLASH_KEY)) return false;
      sessionStorage.setItem(SPLASH_KEY, "1");
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 1. Seed local demo data first (fast, synchronous)
    seedIfNeeded();
    // 2. If Supabase is configured, pull latest data from DB
    if (isSupabaseConfigured()) {
      syncAllFromSupabase().finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        {showSplash && !splashDone && (
          <SplashScreen onDone={() => setSplashDone(true)} />
        )}
        {ready && children}
        <NotificationBanner />
      </ToastProvider>
    </AuthProvider>
  );
}
