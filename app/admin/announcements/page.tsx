"use client";
import AnnouncementManager from "@/components/AnnouncementManager";
export default function Page() {
  return <div className="mx-auto max-w-3xl"><h1 className="mb-1 text-2xl font-extrabold">Announcements</h1><p className="mb-5 text-sm text-ink-mute">Published announcements appear on every student dashboard.</p><AnnouncementManager /></div>;
}
