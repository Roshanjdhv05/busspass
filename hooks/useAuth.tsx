"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, meta } from "@/lib/storage";
import { seedIfNeeded } from "@/lib/seed";
import { runExpirySweep } from "@/lib/services";
import type { Role, User } from "@/lib/types";
import { PageLoader } from "@/components/PageLoader";

interface AuthCtx {
  ready: boolean;
  user: User | null;
  login: (email: string, password: string, role: Role) => { ok: true; user: User } | { ok: false; error: string };
  logout: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      seedIfNeeded();
      runExpirySweep();
      const sid = meta.get("session");
      const u = sid ? db.users.get(sid) : undefined;
      setUser(u ?? null);
    } catch (e) {
      console.error("Init failed", e);
    }
    setReady(true);
  }, []);

  const login: AuthCtx["login"] = useCallback((email, password, role) => {
    const u = db.users.all().find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
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
