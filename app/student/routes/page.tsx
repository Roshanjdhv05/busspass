"use client";
import RouteExplorer from "@/components/RouteExplorer";
export default function Page() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Route Explorer</h1>
      <p className="mb-4 text-sm text-ink-mute">Browse every college bus route, stop and timing.</p>
      <RouteExplorer mode="student" />
    </div>
  );
}
