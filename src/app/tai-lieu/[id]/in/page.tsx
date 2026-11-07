"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RenderedDoc } from "@/types";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { RenderedDocView } from "@/features/library/RenderedDocView";
import { isIosDevice, triggerPrintPdf } from "@/lib/print";

export default function LibraryPrintPage() {
  const params = useParams<{ id: string }>();
  const docId = params.id;

  const [rendered, setRendered] = useState<RenderedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [colorEnabled, setColorEnabled] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/library/docs/${docId}`).then((r) => r.json());
        if (res?.success) setRendered(res.data as RenderedDoc);
      } finally {
        setLoading(false);
      }
    })();
  }, [docId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!rendered) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <EmptyState title="Không tìm thấy tài liệu để xuất PDF" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0 dark:bg-slate-950">
      <div className="no-print mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/tai-lieu/${rendered.doc.id}`}>
            <Button variant="outline" size="sm">
              ← Quay lại trình đọc
            </Button>
          </Link>
          <Button
            variant={colorEnabled ? "primary" : "outline"}
            size="sm"
            onClick={() => setColorEnabled(true)}
          >
            🎨 Bản in Có màu nguồn (Mặc định)
          </Button>
          <Button
            variant={!colorEnabled ? "primary" : "outline"}
            size="sm"
            onClick={() => setColorEnabled(false)}
          >
            🖨 Bản in Đen trắng
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {isIosDevice() ? (
            <span className="text-xs text-slate-500">
              iOS: Bấm Xuất PDF → Chia sẻ → Lưu vào Tệp
            </span>
          ) : null}
          <Button variant="primary" size="sm" onClick={triggerPrintPdf}>
            🖨 Xuất PDF / In ngay (A4)
          </Button>
        </div>
      </div>

      <div className="print:p-0">
        <RenderedDocView
          rendered={rendered}
          colorEnabled={colorEnabled}
          pageMode="a4"
          showSourceFooter={true}
        />
      </div>
    </div>
  );
}
