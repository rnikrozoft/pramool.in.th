"use client";

import { useEffect, useState } from "react";

const BACKOFFICE_API =
  process.env.NEXT_PUBLIC_BACKOFFICE_API?.replace(/\/$/, "") || "http://localhost:3104";

type Announcement = {
  announcement_id: number;
  title: string;
  body: string;
  link_url?: string;
  severity: "info" | "warning" | "critical";
};

const SEVERITY_CLASS: Record<Announcement["severity"], string> = {
  info: "bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-800",
  warning: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800",
  critical: "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-100 dark:border-rose-800",
};

export default function SiteAnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch(`${BACKOFFICE_API}/announcements`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: Announcement[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      {items.map((a) => (
        <div key={a.announcement_id} className={`border-b px-4 py-2 text-sm last:border-b-0 ${SEVERITY_CLASS[a.severity]}`}>
          <strong>{a.title}</strong>
          {a.body ? <span className="ml-2 opacity-90">{a.body}</span> : null}
          {a.link_url ? (
            <a href={a.link_url} className="ml-2 underline" target="_blank" rel="noreferrer">
              อ่านเพิ่มเติม
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
