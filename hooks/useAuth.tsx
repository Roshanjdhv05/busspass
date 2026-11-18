"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, meta, syncAllFromSupabase } from "@/lib/storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { seedIfNeeded } from "@/lib/seed";
import { runExpirySweep } from "@/lib/services";
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

    // If Supabase is configured, try to fetch the user from DB directly
    // This handles users registered on other devices or sessions
    if (isSupabaseConfigured() && supabase) {
      const { data: sbUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", e)
        .maybeSingle();

      if (sbUser) {
        if (sbUser.password !== password) {
          return { ok: false, error: "Incorrect email or password." };
        }
        if (sbUser.role !== role) {
          return { ok: false, error: `This account is a ${sbUser.role} account. Switch the role above.` };
        }

        // Upsert into localStorage so the session works
        const existing = db.users.get(sbUser.id);
        const user: User = {
          id: String(sbUser.id ?? ""),
          email: String(sbUser.email ?? ""),
          password: String(sbUser.password ?? ""),
          role: (sbUser.role as "student" | "admin") ?? "student",
          name: String(sbUser.name ?? ""),
          createdAt: String(sbUser.created_at ?? new Date().toISOString()),
        };
        if (!existing) {
          db.users.add(user);
        }

        // Also fetch and cache the student profile
        const { data: sbProfile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", sbUser.id)
          .maybeSingle();
        if (sbProfile && !db.studentProfiles.get(sbProfile.id)) {
          db.studentProfiles.add({
            id: sbProfile.id, userId: sbProfile.user_id, fullName: sbProfile.full_name,
            studentId: sbProfile.student_id ?? "", college: sbProfile.college ?? "",
            course: sbProfile.course ?? "", year: sbProfile.year ?? "",
            mobile: sbProfile.mobile ?? "", email: sbProfile.email ?? "",
            documentsUploaded: sbProfile.documents_uploaded ?? false,
            createdAt: sbProfile.created_at,
          });
        }

        meta.set("session", user.id);
        setUser(user);
        return { ok: true, user };
      }
    }

    // Fallback: check localStorage
    const u = db.users.all().find((x) => x.email.toLowerCase() === e);
    if (!u || u.password !== password) return { ok: false, error: "Incorrect email or password." };
    if (u.role !== role) return { ok: false, error: `This account is a ${u.role} account. Switch the role above.` };
    meta.set("session", u.id);
    setUser(u);
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
