"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RenderedDoc } from "@/types";
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Sheet,
  Skeleton,
} from "@/components/ui";
import { RenderedDocView } from "@/features/library/RenderedDocView";

export default function LibraryReaderPage() {
  const params = useParams<{ id: string }>();
  const docId = params.id;

  const [rendered, setRendered] = useState<RenderedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [colorEnabled, setColorEnabled] = useState(true);
  const [pageMode, setPageMode] = useState<"a4" | "flow">("a4");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    // Trên điện thoại < 640px, mặc định chế độ chữ chảy liên tục cho dễ đọc
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setPageMode("flow");
    }
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/library/docs/${docId}`).then((r) => r.json());
        if (res?.success) {
          setRendered(res.data as RenderedDoc);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [docId]);

  if (loading) {
    return (
      <AppShell title="Đang mở trình đọc tài liệu..." backHref="/tai-lieu" backLabel="Thư viện">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  if (!rendered) {
    return (
      <AppShell title="Không tìm thấy tài liệu" backHref="/tai-lieu" backLabel="Thư viện">
        <EmptyState title="Tài liệu không tồn tại hoặc đã bị xoá" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={rendered.doc.title}
      subtitle={`Thư mục: ${rendered.doc.folderPath || "Gốc"} • ${rendered.sources.length} nguồn dẫn`}
      backHref="/tai-lieu"
      backLabel="Thư viện"
      actions={
        <Link href={`/tai-lieu/${rendered.doc.id}/in`}>
          <Button variant="primary" size="sm">
            🖨 Xuất PDF A4
          </Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {/* Thanh công cụ Trình đọc PDF */}
        <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={colorEnabled ? "primary" : "outline"}
              size="sm"
              onClick={() => setColorEnabled((v) => !v)}
            >
              {colorEnabled ? "🎨 Đang tô màu nguồn" : "🎨 Bật tô màu nguồn"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageMode((m) => (m === "a4" ? "flow" : "a4"))}
            >
              {pageMode === "a4" ? "📄 Khổ trang A4" : "📱 Chữ chảy liên tục"}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setTocOpen(true)}>
              📑 Mục lục ({rendered.toc.length})
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomPercent((z) => Math.max(85, z - 10))}
            >
              −
            </Button>
            <Badge tone="neutral">{zoomPercent}%</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomPercent((z) => Math.min(135, z + 10))}
            >
              +
            </Button>
          </div>
        </div>

        {/* Khung đọc chính + Mục lục bên phải trên màn hình lớn */}
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="rounded-2xl bg-slate-200/70 p-2 sm:p-6 dark:bg-slate-950">
            <RenderedDocView
              rendered={rendered}
              colorEnabled={colorEnabled}
              pageMode={pageMode}
              zoomPercent={zoomPercent}
            />
          </div>

          <aside className="hidden lg:block">
            <Card className="sticky top-32 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mục lục tài liệu
              </h3>
              <nav className="space-y-1 text-xs">
                {rendered.toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    style={{ paddingLeft: `${(item.level - 1) * 10}px` }}
                    className="block rounded-lg px-2 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </Card>
          </aside>
        </div>
      </div>

      <Sheet open={tocOpen} onClose={() => setTocOpen(false)} title="Mục lục tài liệu">
        <nav className="space-y-1.5 text-sm">
          {rendered.toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setTocOpen(false)}
              style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {item.text}
            </a>
          ))}
        </nav>
      </Sheet>
    </AppShell>
  );
}
