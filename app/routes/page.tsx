"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RouteExplorer from "@/components/RouteExplorer";
import { Logo } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

export default function PublicRoutes() {
  const { ready } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-center justify-between"><Link href="/"><Logo /></Link><Link href="/" className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-forest-700 hover:bg-forest-50"><ArrowLeft size={16} /> Login</Link></div>
      <h1 className="text-2xl font-extrabold">Available Routes</h1>
      <p className="mb-4 text-sm text-ink-mute">Explore routes and stops before you apply.</p>
      {ready && <RouteExplorer mode="public" />}
    </div>
  );
}
