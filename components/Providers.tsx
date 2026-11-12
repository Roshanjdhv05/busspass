"use client";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { SplashScreen } from "./SplashScreen";
import { NotificationBanner } from "./NotificationBanner";

const SPLASH_KEY = "bpms:splash:v1";

export function Providers({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

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

  return (
    <AuthProvider>
      <ToastProvider>
        {showSplash && !splashDone && (
          <SplashScreen onDone={() => setSplashDone(true)} />
        )}
        {children}
        <NotificationBanner />
      </ToastProvider>
    </AuthProvider>
  );
}
