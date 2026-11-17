"use client";
import { useState } from "react";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { useCollection } from "@/hooks/useData";
import { db } from "@/lib/storage";
import { saveAnnouncement } from "@/lib/services";
import { useToast } from "@/hooks/useToast";
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Textarea } from "./ui";
import { cn, timeAgo } from "@/lib/utils";
import type { Announcement } from "@/lib/types";

export default function AnnouncementManager() {
  const items = useCollection(db.announcements).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const toast = useToast();
  const [edit, setEdit] = useState<Partial<Announcement> | null>(null);
  const [err, setErr] = useState<{ title?: string; body?: string }>({});
  const [del, setDel] = useState<string | null>(null);

  const save = () => {
    if (!edit) return;
    const e: typeof err = {};
    if ((edit.title ?? "").trim().length < 3) e.title = "Title is required (min 3 characters)";
    if ((edit.body ?? "").trim().length < 5) e.body = "Message is required (min 5 characters)";
    setErr(e); if (Object.keys(e).length) return;
    saveAnnouncement({ ...edit, title: edit.title!.trim(), body: edit.body!.trim() });
    toast(edit.id ? "Announcement updated" : "Announcement published to students");
    setEdit(null);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold">Announcements</h2><Button size="sm" onClick={() => { setErr({}); setEdit({ title: "", body: "", priority: "normal", active: true }); }}><Plus size={15} /> New</Button></div>
      {items.length === 0 ? <Card><EmptyState icon={Megaphone} title="No announcements" text="Publish an update to show it on every student dashboard." /></Card> : (
        <div className="space-y-2.5">{items.map((a) => (
          <Card key={a.id} className={cn("p-4", !a.active && "opacity-60")}>
            <div className="flex items-start gap-3"><div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">{a.priority === "important" && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-700">Important</span>}{!a.active && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-600">Hidden</span>}<b className="text-sm">{a.title}</b></div>
              <p className="mt-1 text-sm text-ink-soft">{a.body}</p><div className="mt-1 text-xs text-ink-mute">{timeAgo(a.createdAt)}</div></div>
              <div className="flex shrink-0"><button onClick={() => { setErr({}); setEdit(a); }} aria-label="Edit announcement" className="flex h-10 w-10 items-center justify-center rounded-lg text-forest-700 hover:bg-forest-50"><Pencil size={16} /></button>
                <button onClick={() => setDel(a.id)} aria-label="Delete announcement" className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></div></div>
          </Card>))}</div>)}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit announcement" : "New announcement"} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>{edit?.id ? "Save" : "Publish"}</Button></>}>
        {edit && <div className="space-y-3.5">
          <Field label="Title" error={err.title}><Input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} invalid={!!err.title} /></Field>
          <Field label="Message" error={err.body}><Textarea value={edit.body ?? ""} onChange={(e) => setEdit({ ...edit, body: e.target.value })} invalid={!!err.body} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Priority"><Select value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value as Announcement["priority"] })}><option value="normal">Normal</option><option value="important">Important</option></Select></Field>
            <Field label="Visibility"><Select value={edit.active ? "1" : "0"} onChange={(e) => setEdit({ ...edit, active: e.target.value === "1" })}><option value="1">Visible to students</option><option value="0">Hidden</option></Select></Field></div>
        </div>}
      </Modal>
      <ConfirmDialog open={!!del} danger title="Delete announcement?" message="It will disappear from all student dashboards." confirmLabel="Delete" onConfirm={() => { if (del) { db.announcements.remove(del); toast("Announcement deleted"); } }} onClose={() => setDel(null)} />
    </div>
  );
}
