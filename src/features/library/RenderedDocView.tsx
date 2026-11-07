"use client";

import React, { useMemo, useState } from "react";
import type { DocBlock, DocSegment, RenderedDoc, SourceRef } from "@/types";
import { Badge, Modal, Tooltip } from "@/components/ui";
import { getSourceColorMap, SOURCE_PALETTE_SIZE } from "@/lib/citation";

export interface RenderedDocViewProps {
  rendered: RenderedDoc;
  colorEnabled?: boolean;
  pageMode?: "a4" | "flow";
  zoomPercent?: number;
  highlightQuery?: string;
  showSourceFooter?: boolean;
}

function getColorClassAndStyle(
  colorIndex: number | undefined,
  enabled: boolean,
): { className: string; style?: React.CSSProperties } {
  if (!enabled || colorIndex === undefined) {
    return { className: "" };
  }
  if (colorIndex < SOURCE_PALETTE_SIZE) {
    return { className: `cite-segment cite-color-${colorIndex}` };
  }
  // Xoay hue tự động khi số nguồn kề nhau vượt quá 8 màu chuẩn
  const hue = (colorIndex * 137.508) % 360;
  return {
    className: "cite-segment",
    style: {
      backgroundColor: `hsla(${hue}, 80%, 88%, 0.75)`,
      borderBottom: `2px solid hsl(${hue}, 70%, 60%)`,
    },
  };
}

function SourceTooltipCard({ source }: { source: SourceRef }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Badge tone="blue">Nguồn [{source.label}]</Badge>
        <span className="font-mono text-[11px] text-slate-400">#{source.key}</span>
      </div>
      <div className="text-xs font-semibold text-slate-900 dark:text-white">{source.title}</div>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Mở trên Google Drive ↗
        </a>
      ) : (
        <span className="text-[11px] italic text-amber-600">Chưa có link Google Drive</span>
      )}
    </div>
  );
}

function SegmentSpan({
  segment,
  sourceMap,
  colorMap,
  colorEnabled,
}: {
  segment: DocSegment;
  sourceMap: Record<string, SourceRef>;
  colorMap: Record<string, number>;
  colorEnabled: boolean;
}) {
  const source = segment.sourceKey ? sourceMap[segment.sourceKey] : undefined;
  const colorIdx = segment.sourceKey ? colorMap[segment.sourceKey] : undefined;
  const { className, style } = getColorClassAndStyle(colorIdx, colorEnabled);

  const inner = (
    <span
      className={`${className} ${source ? "cursor-pointer hover:brightness-95" : ""}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: segment.html }}
    />
  );

  if (!source) return inner;

  return (
    <Tooltip content={<SourceTooltipCard source={source} />} className="inline">
      {inner}
    </Tooltip>
  );
}

type GroupedItem =
  | { type: "single"; block: DocBlock }
  | { type: "list_group"; ordered: boolean; items: DocBlock[] };

function groupConsecutiveLists(blocks: DocBlock[]): GroupedItem[] {
  const result: GroupedItem[] = [];
  for (const b of blocks) {
    if (b.kind === "list") {
      const ordered = Boolean(b.listOrdered);
      const prev = result[result.length - 1];
      if (prev && prev.type === "list_group" && prev.ordered === ordered) {
        prev.items.push(b);
      } else {
        result.push({ type: "list_group", ordered, items: [b] });
      }
    } else {
      result.push({ type: "single", block: b });
    }
  }
  return result;
}

export function RenderedDocView({
  rendered,
  colorEnabled = true,
  pageMode = "a4",
  zoomPercent = 100,
  showSourceFooter = true,
}: RenderedDocViewProps) {
  const [zoomedImg, setZoomedImg] = useState<{ src: string; alt?: string } | null>(null);

  const sourceMap = useMemo(() => {
    const map: Record<string, SourceRef> = {};
    for (const s of rendered.sources) map[s.key] = s;
    return map;
  }, [rendered.sources]);

  const colorMap = useMemo(() => getSourceColorMap(rendered.sources), [rendered.sources]);
  const grouped = useMemo(() => groupConsecutiveLists(rendered.blocks), [rendered.blocks]);

  return (
    <div
      className={`mx-auto transition-all ${
        pageMode === "a4"
          ? "max-w-[210mm] rounded-xl border border-slate-300 bg-white p-6 shadow-xl sm:p-12 dark:border-slate-700 dark:bg-slate-900"
          : "max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      }`}
      style={{
        fontSize: `${zoomPercent}%`,
      }}
    >
      {/* Header trang A4 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
            {rendered.doc.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span>Thư mục: {rendered.doc.folderPath || "Gốc"}</span>
            {rendered.doc.tags.map((t) => (
              <Badge key={t} tone="neutral">
                #{t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Chú giải màu (Legend) của các nguồn xuất hiện trong bài */}
      {rendered.sources.length > 0 ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chú giải màu theo nguồn dẫn (Rê chuột hoặc chạm để mở Google Drive)
          </div>
          <div className="flex flex-wrap gap-2">
            {rendered.sources.map((src) => {
              const { className, style } = getColorClassAndStyle(src.colorIndex, colorEnabled);
              return (
                <Tooltip key={src.key} content={<SourceTooltipCard source={src} />}>
                  <span
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${className || "border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                    style={style}
                  >
                    <strong>[{src.label}]</strong>
                    <span className="max-w-[220px] truncate">{src.title}</span>
                  </span>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Nội dung các Block của tài liệu */}
      <article className="space-y-4 leading-relaxed text-slate-800 dark:text-slate-100">
        {grouped.map((item, idx) => {
          if (item.type === "list_group") {
            const ListTag = item.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={`list-${idx}`}
                className={`space-y-1.5 pl-6 ${item.ordered ? "list-decimal" : "list-disc"}`}
              >
                {item.items.map((li) => (
                  <li key={li.id} className="leading-relaxed">
                    {li.segments.map((seg, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <SegmentSpan
                          segment={seg}
                          sourceMap={sourceMap}
                          colorMap={colorMap}
                          colorEnabled={colorEnabled}
                        />{" "}
                      </React.Fragment>
                    ))}
                  </li>
                ))}
              </ListTag>
            );
          }

          const b = item.block;

          if (b.kind === "heading") {
            const html = b.segments[0]?.html ?? "";
            if (b.level === 1) {
              return (
                <h2
                  key={b.id}
                  id={b.id}
                  className="mt-6 scroll-mt-24 text-xl font-bold text-slate-900 dark:text-white"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            }
            if (b.level === 2) {
              return (
                <h3
                  key={b.id}
                  id={b.id}
                  className="mt-5 scroll-mt-24 border-b border-slate-100 pb-1 text-lg font-bold text-slate-900 dark:border-slate-800 dark:text-white"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            }
            return (
              <h4
                key={b.id}
                id={b.id}
                className="mt-4 scroll-mt-24 text-base font-semibold text-slate-900 dark:text-white"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          if (b.kind === "quote") {
            return (
              <blockquote
                key={b.id}
                className="border-l-4 border-blue-500 bg-slate-50 py-2 pr-3 pl-4 italic dark:bg-slate-800/50"
              >
                {b.segments.map((seg, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <SegmentSpan
                      segment={seg}
                      sourceMap={sourceMap}
                      colorMap={colorMap}
                      colorEnabled={colorEnabled}
                    />{" "}
                  </React.Fragment>
                ))}
              </blockquote>
            );
          }

          if (b.kind === "table") {
            const seg = b.segments[0];
            const srcKey = seg?.sourceKey ?? null;
            const colorIdx = srcKey ? colorMap[srcKey] : undefined;
            const { className, style } = getColorClassAndStyle(colorIdx, colorEnabled);

            return (
              <div key={b.id} className="print-break-inside-avoid my-4 space-y-1.5">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <div
                    className="min-w-full text-sm [&_table]:w-full [&_td]:border-t [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold dark:[&_td]:border-slate-800 dark:[&_th]:bg-slate-800"
                    dangerouslySetInnerHTML={{ __html: seg?.html ?? "" }}
                  />
                </div>
                {b.captionHtml ? (
                  <div className="text-xs">
                    <SegmentSpan
                      segment={{ html: b.captionHtml, sourceKey: srcKey }}
                      sourceMap={sourceMap}
                      colorMap={colorMap}
                      colorEnabled={colorEnabled}
                    />
                  </div>
                ) : null}
                {!b.captionHtml && className ? <div className={className} style={style} /> : null}
              </div>
            );
          }

          if (b.kind === "figure") {
            const seg = b.segments[0];
            const srcKey = seg?.sourceKey ?? null;
            return (
              <figure key={b.id} className="print-break-inside-avoid my-4 space-y-1.5">
                {b.figureSrc ? (
                  <button
                    type="button"
                    onClick={() => setZoomedImg({ src: b.figureSrc!, alt: b.figureAlt })}
                    className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.figureSrc}
                      alt={b.figureAlt ?? "Hình tài liệu"}
                      className="max-h-80 w-auto object-contain"
                    />
                    <span className="no-print absolute right-2 bottom-2 rounded-lg bg-slate-900/75 px-2 py-0.5 text-[11px] text-white">
                      🔍 Phóng to
                    </span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
                    🖼️ Hình minh hoạ: {b.figureAlt ?? "Hình trong tài liệu"}
                  </div>
                )}
                {b.captionHtml ? (
                  <figcaption className="text-xs">
                    <SegmentSpan
                      segment={{ html: b.captionHtml, sourceKey: srcKey }}
                      sourceMap={sourceMap}
                      colorMap={colorMap}
                      colorEnabled={colorEnabled}
                    />
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          return (
            <p key={b.id} className="leading-relaxed">
              {b.segments.map((seg, sIdx) => (
                <React.Fragment key={sIdx}>
                  <SegmentSpan
                    segment={seg}
                    sourceMap={sourceMap}
                    colorMap={colorMap}
                    colorEnabled={colorEnabled}
                  />{" "}
                </React.Fragment>
              ))}
            </p>
          );
        })}
      </article>

      {/* Danh mục Nguồn tham khảo ở cuối tài liệu */}
      {showSourceFooter && rendered.sources.length > 0 ? (
        <section className="mt-10 border-t-2 border-slate-200 pt-6 dark:border-slate-800">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Danh mục Nguồn tham khảo
          </h3>
          <ol className="space-y-2 text-xs">
            {rendered.sources.map((src) => {
              const { className, style } = getColorClassAndStyle(src.colorIndex, colorEnabled);
              return (
                <li key={src.key} className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-md px-2 py-1 font-medium ${className}`} style={style}>
                    [{src.label}] {src.title}
                  </span>
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                    >
                      {src.url} ↗
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <Modal
        open={Boolean(zoomedImg)}
        onClose={() => setZoomedImg(null)}
        title={zoomedImg?.alt ?? "Xem hình phóng to"}
      >
        {zoomedImg ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImg.src}
              alt={zoomedImg.alt ?? ""}
              className="max-h-[75dvh] w-auto object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
