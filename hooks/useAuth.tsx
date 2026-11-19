"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, meta, syncAllFromSupabase } from "@/lib/storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { seedIfNeeded } from "@/lib/seed";
import { runExpirySweep, syncProfileDocumentsToSupabase } from "@/lib/services";
import type { Role, User } from "@/lib/types";
import { PageLoader } from "@/components/PageLoader";

interface AuthCtx {
  ready: boolean;
  user: User | null;
  login: (email: string, password: string, role: Role) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logout: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        seedIfNeeded();
        // Immediately restore session synchronously from localStorage so page reload doesn't kick user out
        const sid = meta.get("session");
        if (sid) {
          const u = db.users.get(sid);
          if (u && mounted) setUser(u);
        }

        // If Supabase is configured, sync background data
        if (isSupabaseConfigured()) {
          await syncAllFromSupabase();
          // After sync, re-verify session in case user was updated in DB
          if (mounted) {
            const freshSid = meta.get("session");
            if (freshSid) {
              const freshUser = db.users.get(freshSid);
              if (freshUser) setUser(freshUser);
            }
          }
        }
        runExpirySweep();
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        if (mounted) setReady(true);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const login: AuthCtx["login"] = useCallback(async (email, password, role) => {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    // If Supabase is configured, try to fetch the user from DB directly
    // This handles users registered on other devices or sessions
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: sbUser, error: sbErr } = await supabase
          .from("users")
          .select("*")
          .ilike("email", e)
          .maybeSingle();

        if (sbUser) {
          if (sbUser.password.trim() !== p) {
            return { ok: false, error: "Incorrect email or password." };
          }
          if (sbUser.role !== role) {
            const roleName = sbUser.role === "admin" ? "Admin" : "Student";
            return { ok: false, error: `This account is a ${roleName} account. Please select "${roleName}" above to login.` };
          }

          // Upsert into localStorage so the session works
          const user: User = {
            id: String(sbUser.id ?? ""),
            email: String(sbUser.email ?? ""),
            password: String(sbUser.password ?? ""),
            role: (sbUser.role as "student" | "admin") ?? "student",
            name: String(sbUser.name ?? ""),
            createdAt: String(sbUser.created_at ?? new Date().toISOString()),
          };
          const existing = db.users.get(user.id);
          if (!existing) {
            db.users.add(user);
          } else {
            db.users.update(user.id, user);
          }

          // Also fetch and cache the student profile
          const { data: sbProfile } = await supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", sbUser.id)
            .maybeSingle();
          if (sbProfile) {
            const profData = {
              id: sbProfile.id,
              userId: sbProfile.user_id,
              fullName: sbProfile.full_name,
              studentId: sbProfile.student_id ?? "",
              college: sbProfile.college ?? "",
              course: sbProfile.course ?? "",
              year: sbProfile.year ?? "",
              mobile: sbProfile.mobile ?? "",
              email: sbProfile.email ?? "",
              documentsUploaded: sbProfile.documents_uploaded ?? false,
              createdAt: sbProfile.created_at,
            };
            if (!db.studentProfiles.get(sbProfile.id)) {
              db.studentProfiles.add(profData);
            } else {
              db.studentProfiles.update(sbProfile.id, profData);
            }
          }

          meta.set("session", user.id);
          setUser(user);
          // Silently upload any IDB-local document files to Supabase Storage in background
          if (user.role === "student") {
            syncProfileDocumentsToSupabase(user.id).catch(() => {/* ignore upload errors */});
          }
          return { ok: true, user };
        }
      } catch (err) {
        console.error("Supabase login check error:", err);
      }
    }

    // Fallback: check localStorage
    const u = db.users.all().find((x) => x.email.trim().toLowerCase() === e);
    if (!u || u.password.trim() !== p) return { ok: false, error: "Incorrect email or password." };
    if (u.role !== role) {
      const roleName = u.role === "admin" ? "Admin" : "Student";
      return { ok: false, error: `This account is a ${roleName} account. Please select "${roleName}" above to login.` };
    }
    meta.set("session", u.id);
    setUser(u);
    // Silently upload any IDB-local document files to Supabase Storage in background
    if (u.role === "student") {
      syncProfileDocumentsToSupabase(u.id).catch(() => {/* ignore */});
    }
    return { ok: true, user: u };
  }, []);

  const logout = useCallback(() => {
    meta.remove("session"); setUser(null); router.replace("/");
  }, [router]);

  if (!ready) return <PageLoader />;
  return <Ctx.Provider value={{ ready, user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
