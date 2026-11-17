"use client";
import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useCollection } from "./useData";
import { db } from "@/lib/storage";
import { passState } from "@/lib/utils";

export function useStudent() {
  const { user } = useAuth();
  const profiles = useCollection(db.studentProfiles);
  const applications = useCollection(db.applications);
  const passes = useCollection(db.issuedPasses);
  const routes = useCollection(db.busRoutes);
  const stops = useCollection(db.busStops);
  const settingsArr = useCollection(db.settings);
  return useMemo(() => {
    const profile = profiles.find((p) => p.userId === user?.id);
    const apps = applications.filter((a) => a.userId === user?.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const myPasses = passes.filter((p) => p.userId === user?.id).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    const pass = myPasses.find((p) => passState(p) === "active") ?? myPasses[0];
    const route = routes.find((r) => r.id === pass?.routeId);
    return { user, profile, apps, myPasses, pass, route, routes, stops, settings: settingsArr[0] };
  }, [user, profiles, applications, passes, routes, stops, settingsArr]);
}
