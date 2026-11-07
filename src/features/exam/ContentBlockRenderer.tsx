"use client";

import React, { useState } from "react";
import type { ContentBlock } from "@/types";
import { Modal } from "@/components/ui";

export function ContentBlockRenderer({ blocks }: { blocks?: ContentBlock[] }) {
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt?: string } | null>(null);

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <p key={idx} className="whitespace-pre-line">
              {block.md}
            </p>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={idx} className="my-2">
              <button
                type="button"
                onClick={() => setZoomedImage({ src: block.src, alt: block.alt })}
                className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt={block.alt ?? "Hình minh hoạ đề thi"}
                  className="max-h-72 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
                <span className="no-print absolute right-2 bottom-2 rounded-lg bg-slate-900/75 px-2 py-1 text-[11px] font-medium text-white">
                  🔍 Bấm để phóng to
                </span>
              </button>
              {block.alt ? (
                <figcaption className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
                  {block.alt}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === "table") {
          return (
            <div key={idx} className="my-2 space-y-1">
              {block.caption ? (
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {block.caption}
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-700">
                  {block.hasHeader && block.rows.length > 0 ? (
                    <thead className="bg-slate-100 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                      <tr>
                        {block.rows[0]?.map((cell, cIdx) => (
                          <th key={cIdx} className="px-3 py-2">
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  ) : null}
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {(block.hasHeader ? block.rows.slice(1) : block.rows).map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return null;
      })}

      <Modal
        open={Boolean(zoomedImage)}
        onClose={() => setZoomedImage(null)}
        title={zoomedImage?.alt ?? "Xem chi tiết hình ảnh"}
      >
        {zoomedImage ? (
          <div className="flex flex-col items-center gap-2 overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt ?? "Hình phóng to"}
              className="max-h-[75dvh] w-auto rounded-lg object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
