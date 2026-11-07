/**
 * Citation engine — Web con 2 (Thư viện, "/tai-lieu")
 *
 * Markdown (theo docs/mau/MAU_TAI_LIEU_VA_PROMPT.md) → DocBlock[] + SourceRef[] + toc.
 *
 * Thiết kế:
 * - Không phụ thuộc thư viện ngoài. Chỉ hỗ trợ tập con Markdown mà mẫu tài liệu dùng:
 *   front matter, heading, đoạn văn, danh sách, trích dẫn (>), bảng GFM, hình + caption,
 *   code fence, footnote `[^key]`, **đậm**, *nghiêng*, ~~gạch~~, `code`.
 * - An toàn XSS theo cách xây dựng: mọi văn bản đều được escape, HTML thô trong md
 *   KHÔNG được truyền qua. Chỉ engine này sinh thẻ HTML (danh sách trắng cố định).
 * - Liên kết trong thân bài bị ẩn (chỉ giữ chữ), URL trần bị xoá.
 *   Link chỉ còn trong `SourceRef.url`.
 *
 * Quy tắc chia đoạn: chữ từ sau marker trước tới marker hiện tại thuộc nguồn của marker
 * hiện tại; phần dư sau marker cuối có `sourceKey = null`.
 *
 * HTML sinh ra dùng các class (UI tự style):
 * - `cite-ref` (sup số chú thích, có `data-source-key`, `data-source-label`)
 * - `cite-ref-missing` (marker không có định nghĩa, hiển thị "[?]")
 * - `cite-table`, `cite-figure-img`, `cite-code`
 */

import type {
  DocBlock,
  DocBlockKind,
  DocSegment,
  DocTocItem,
  RenderedDoc,
  SourceRef,
} from "@/types";

/** Số màu trong bảng màu chuẩn. `colorIndex >= SOURCE_PALETTE_SIZE` → UI tự sinh màu (xoay hue). */
export const SOURCE_PALETTE_SIZE = 8;

export interface LibraryFrontMatter {
  title?: string;
  tags: string[];
  updated?: string;
  author?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * DocBlock mở rộng (vẫn gán được cho `DocBlock`).
 * Mỗi mục danh sách là một block `kind: "list"`; UI gom các block list liên tiếp thành <ul>/<ol>.
 */
export interface CitationDocBlock extends DocBlock {
  /** Chỉ có ở block list: true nếu là danh sách có số */
  listOrdered?: boolean;
  /** Chỉ có ở block list có số: số thứ tự gốc trong md */
  listNumber?: number;
}

export type LibraryRenderOutput = Omit<RenderedDoc, "doc"> & {
  blocks: CitationDocBlock[];
  frontMatter: LibraryFrontMatter;
  warnings: string[];
};

export interface RenderLibraryOptions {
  /**
   * Đổi đường dẫn ảnh (ví dụ "./hinh/a.png" → "/api/library/image/<id>").
   * Trả về null để bỏ ảnh. Mặc định giữ nguyên nếu đường dẫn an toàn.
   */
  resolveImageSrc?: (src: string) => string | null;
}

// ---------------------------------------------------------------------------
// Tiện ích chung
// ---------------------------------------------------------------------------

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeHttpUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function isGoogleDriveUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "drive.google.com" || host === "docs.google.com";
  } catch {
    return false;
  }
}

/** Chỉ cho phép http(s), đường dẫn tuyệt đối "/..." (không phải "//") và đường dẫn tương đối. */
function isSafeImageSrc(src: string): boolean {
  const s = src.trim();
  if (s === "" || s.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return /^https?:/i.test(s);
  return true;
}

function truncate(text: string, max = 50): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ---------------------------------------------------------------------------
// Front matter & comment
// ---------------------------------------------------------------------------

function unquote(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseFrontMatter(lines: string[]): LibraryFrontMatter {
  const fm: LibraryFrontMatter = { tags: [] };
  let pendingListKey: string | null = null;

  for (const line of lines) {
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && pendingListKey) {
      const current = fm[pendingListKey];
      const arr = Array.isArray(current) ? current : [];
      arr.push(unquote(listItem[1] ?? ""));
      fm[pendingListKey] = arr;
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1] ?? "";
    const value = (kv[2] ?? "").trim();
    if (value === "") {
      pendingListKey = key;
      fm[key] = [];
      continue;
    }
    pendingListKey = null;
    const inline = /^\[(.*)\]$/.exec(value);
    if (inline) {
      fm[key] = (inline[1] ?? "")
        .split(",")
        .map((x) => unquote(x))
        .filter((x) => x !== "");
    } else {
      fm[key] = unquote(value);
    }
  }

  const tags = fm.tags;
  fm.tags = Array.isArray(tags) ? tags : typeof tags === "string" ? [tags] : [];
  return fm;
}

function splitFrontMatter(src: string): { frontMatter: LibraryFrontMatter; body: string } {
  const lines = src.split("\n");
  if (lines[0]?.trim() !== "---") return { frontMatter: { tags: [] }, body: src };
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i]?.trim();
    if (t === "---" || t === "...") {
      return {
        frontMatter: parseFrontMatter(lines.slice(1, i)),
        body: lines.slice(i + 1).join("\n"),
      };
    }
  }
  return { frontMatter: { tags: [] }, body: src };
}

function normalizeSource(md: string): string {
  return md
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "");
}

// ---------------------------------------------------------------------------
// Định nghĩa nguồn
// ---------------------------------------------------------------------------

interface SourceDef {
  key: string;
  title: string;
  url: string;
}

const FOOTNOTE_DEF_RE = /^\[\^([^\]\s]+)\]:\s*(.*)$/;
const LINK_VALUE_RE = /^\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)\s*(.*)$/;

function parseSourceValue(key: string, value: string, origin: string, warnings: string[]): SourceDef {
  let title = "";
  let rawUrl = "";
  const link = LINK_VALUE_RE.exec(value.trim());
  if (link) {
    title = (link[1] ?? "").trim();
    rawUrl = link[2] ?? "";
  } else {
    const bare = /(https?:\/\/\S+)/i.exec(value);
    if (bare) {
      rawUrl = bare[1] ?? "";
      title = value.replace(rawUrl, "").replace(/[\s—–-]+$/, "").trim();
    } else {
      title = value.trim();
    }
  }

  const url = rawUrl ? safeHttpUrl(rawUrl) : "";
  if (!rawUrl) {
    warnings.push(`Nguồn [^${key}] (${origin}) không có link.`);
  } else if (!url) {
    warnings.push(`Nguồn [^${key}] (${origin}) có link không hợp lệ, đã bỏ: ${truncate(rawUrl)}`);
  } else if (!isGoogleDriveUrl(url)) {
    warnings.push(`Nguồn [^${key}] (${origin}) không phải link Google Drive: ${truncate(url)}`);
  }
  return { key, title: title || key, url };
}

/**
 * Tách các dòng định nghĩa `[^key]: ...` ra khỏi văn bản.
 * Dòng thụt lề ngay sau định nghĩa được nối vào giá trị.
 */
function extractSourceDefinitions(
  lines: string[],
  origin: string,
  warnings: string[],
): { defs: Map<string, SourceDef>; rest: string[] } {
  const defs = new Map<string, SourceDef>();
  const rest: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const m = FOOTNOTE_DEF_RE.exec(line);
    if (!m) {
      rest.push(line);
      continue;
    }
    const key = m[1] ?? "";
    let value = m[2] ?? "";
    while (i + 1 < lines.length && /^(\s{2,}|\t)\S/.test(lines[i + 1] ?? "")) {
      i++;
      value += ` ${(lines[i] ?? "").trim()}`;
    }
    if (defs.has(key)) {
      warnings.push(`Nguồn [^${key}] được định nghĩa nhiều lần trong ${origin}, giữ định nghĩa đầu tiên.`);
      continue;
    }
    defs.set(key, parseSourceValue(key, value, origin, warnings));
  }
  return { defs, rest };
}

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

interface RenderContext {
  defs: Map<string, SourceDef>;
  labels: Map<string, number>;
  missingWarned: Set<string>;
  warnings: string[];
  resolveImageSrc: (src: string) => string | null;
}

const MARKER_RE = /\[\^([^\]\s]+)\]/g;
const INLINE_IMAGE_RE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

function imageTag(ctx: RenderContext, alt: string, src: string, className?: string): string | null {
  if (!isSafeImageSrc(src)) return null;
  const resolved = ctx.resolveImageSrc(src.trim());
  if (resolved === null || !isSafeImageSrc(resolved)) return null;
  const cls = className ? ` class="${className}"` : "";
  return `<img${cls} src="${escapeHtml(resolved)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
}

/** Định dạng inline (không xử lý marker). Ẩn link, xoá URL trần, escape mọi thứ còn lại. */
function renderInlineFormatting(ctx: RenderContext, raw: string): string {
  const slots: string[] = [];
  const hold = (html: string): string => `\u0000${slots.push(html) - 1}\u0000`;

  let s = raw.replace(/\u0000/g, "");

  // code span
  s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_m, _ticks: string, code: string) =>
    hold(`<code>${escapeHtml(code.trim())}</code>`),
  );
  // ảnh inline
  s = s.replace(INLINE_IMAGE_RE, (_m, alt: string, src: string) => {
    const tag = imageTag(ctx, alt, src);
    return tag ? hold(tag) : alt;
  });
  // link → chỉ giữ chữ
  s = s.replace(/\[([^\]]*)\]\(\s*<?[^)\s>]*>?(?:\s+"[^"]*")?\s*\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");
  // autolink & URL trần → xoá
  s = s.replace(/<(?:https?|ftp|mailto):[^>\s]*>/gi, "");
  s = s.replace(/(?:https?:\/\/|www\.)[^\s<]+/gi, "");

  s = escapeHtml(s);

  s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(?=\S)([\s\S]*?\S)__/g, "<strong>$1</strong>");
  s = s.replace(/\*(?=\S)([^*]*?\S)\*/g, "<em>$1</em>");
  s = s.replace(/(^|[^\w])_(?=\S)([^_]*?\S)_(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>");

  s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => slots[Number(i)] ?? "");
  return s.replace(/[ \t]{2,}/g, " ");
}

function citeSup(ctx: RenderContext, key: string): { html: string; defined: boolean } {
  const def = ctx.defs.get(key);
  if (!def) {
    if (!ctx.missingWarned.has(key)) {
      ctx.missingWarned.add(key);
      ctx.warnings.push(`Marker [^${key}] không có định nghĩa nguồn.`);
    }
    return {
      html: `<sup class="cite-ref cite-ref-missing" data-source-key="${escapeHtml(key)}">[?]</sup>`,
      defined: false,
    };
  }
  let label = ctx.labels.get(key);
  if (label === undefined) {
    label = ctx.labels.size + 1;
    ctx.labels.set(key, label);
  }
  return {
    html: `<sup class="cite-ref" data-source-key="${escapeHtml(key)}" data-source-label="${label}">[${label}]</sup>`,
    defined: true,
  };
}

/** Chia một đoạn chữ thành các DocSegment theo marker chú thích. */
function renderSegments(ctx: RenderContext, text: string): DocSegment[] {
  const chunks: { text: string; keys: string[] }[] = [];
  let last = 0;
  for (const m of text.matchAll(MARKER_RE)) {
    const idx = m.index ?? 0;
    const between = text.slice(last, idx);
    const key = m[1] ?? "";
    const prev = chunks[chunks.length - 1];
    if (prev && between.trim() === "") {
      prev.keys.push(key); // [^a][^b] liền nhau → cùng một đoạn
    } else {
      chunks.push({ text: between, keys: [key] });
    }
    last = idx + m[0].length;
  }
  const tail = text.slice(last);

  const segments: DocSegment[] = [];
  for (const chunk of chunks) {
    let sourceKey: string | null = null;
    let sups = "";
    for (const key of chunk.keys) {
      const sup = citeSup(ctx, key);
      sups += sup.html;
      if (sourceKey === null && sup.defined) sourceKey = key;
    }
    segments.push({ html: renderInlineFormatting(ctx, chunk.text) + sups, sourceKey });
  }
  if (tail.trim() !== "") {
    segments.push({ html: renderInlineFormatting(ctx, tail), sourceKey: null });
  }
  return segments;
}

function stripMarkers(text: string): { text: string; had: boolean } {
  let had = false;
  const out = text.replace(MARKER_RE, () => {
    had = true;
    return "";
  });
  return { text: out, had };
}

// ---------------------------------------------------------------------------
// Block
// ---------------------------------------------------------------------------

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_RE = /^\s*(`{3,}|~{3,})/;
const TABLE_ROW_RE = /^\s*\|/;
const IMAGE_LINE_RE = /^\s*!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)\s*$/;
const CAPTION_RE = /^\s*[*_]{1,2}\s*(?:Hình|Bảng|Hinh|Bang|Figure|Fig\.|Table)\s*\d*/i;
const LIST_RE = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const QUOTE_RE = /^\s*>\s?(.*)$/;
const HR_RE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;

function isTableSeparator(line: string | undefined): boolean {
  if (!line || !line.includes("|") || !line.includes("-")) return false;
  return line.replace(/[\s|:-]/g, "") === "";
}

function isTableStart(lines: string[], i: number): boolean {
  return TABLE_ROW_RE.test(lines[i] ?? "") && isTableSeparator(lines[i + 1]);
}

function splitTableRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|") && !t.endsWith("\\|")) t = t.slice(0, -1);
  return t.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, "|").trim());
}

function indentWidth(ws: string): number {
  return ws.replace(/\t/g, "    ").length;
}

function startsNewBlock(lines: string[], i: number): boolean {
  const line = lines[i] ?? "";
  return (
    HEADING_RE.test(line) ||
    FENCE_RE.test(line) ||
    isTableStart(lines, i) ||
    IMAGE_LINE_RE.test(line) ||
    LIST_RE.test(line) ||
    QUOTE_RE.test(line) ||
    HR_RE.test(line) ||
    CAPTION_RE.test(line)
  );
}

/** Tìm dòng caption ngay sau bảng/hình (cho phép cách bởi dòng trống). */
function findCaption(lines: string[], from: number): { text: string; next: number } | null {
  let j = from;
  while (j < lines.length && (lines[j] ?? "").trim() === "") j++;
  const line = lines[j];
  if (line !== undefined && CAPTION_RE.test(line)) return { text: line.trim(), next: j + 1 };
  return null;
}

function trailingUncitedWarning(ctx: RenderContext, kind: DocBlockKind, segments: DocSegment[]): void {
  const lastSeg = segments[segments.length - 1];
  if (!lastSeg || lastSeg.sourceKey !== null) return;
  const text = htmlToPlainText(lastSeg.html);
  if (text === "") return;
  const label = kind === "list" ? "Ý danh sách" : kind === "quote" ? "Trích dẫn" : "Đoạn";
  ctx.warnings.push(`${label} chưa có chú thích nguồn ở cuối: "${truncate(text)}"`);
}

export function renderLibraryMarkdown(
  md: string,
  sharedSources?: string,
  options: RenderLibraryOptions = {},
): LibraryRenderOutput {
  const warnings: string[] = [];
  const { frontMatter, body } = splitFrontMatter(normalizeSource(md));
  const withoutComments = body.replace(/<!--[\s\S]*?-->/g, "");

  const local = extractSourceDefinitions(withoutComments.split("\n"), "tài liệu", warnings);
  const defs = new Map<string, SourceDef>();
  if (sharedSources) {
    const sharedBody = splitFrontMatter(normalizeSource(sharedSources)).body.replace(/<!--[\s\S]*?-->/g, "");
    const shared = extractSourceDefinitions(sharedBody.split("\n"), "_nguon.md", warnings);
    for (const [k, v] of shared.defs) defs.set(k, v);
  }
  for (const [k, v] of local.defs) defs.set(k, v); // định nghĩa trong file ưu tiên

  const ctx: RenderContext = {
    defs,
    labels: new Map(),
    missingWarned: new Set(),
    warnings,
    resolveImageSrc: options.resolveImageSrc ?? ((src) => src),
  };

  const lines = local.rest;
  const blocks: CitationDocBlock[] = [];
  const toc: DocTocItem[] = [];
  const usedIds = new Set<string>();
  const nextId = (): string => `b${blocks.length}`;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "" || HR_RE.test(line)) {
      i++;
      continue;
    }

    // Heading
    const h = HEADING_RE.exec(line);
    if (h) {
      const stripped = stripMarkers(h[2] ?? "");
      if (stripped.had) warnings.push(`Tiêu đề không cần chú thích nguồn, đã bỏ marker: "${truncate(stripped.text)}"`);
      const html = renderInlineFormatting(ctx, stripped.text.trim());
      const text = htmlToPlainText(html);
      let id = slugify(text) || `muc-${toc.length + 1}`;
      if (usedIds.has(id)) {
        let n = 2;
        while (usedIds.has(`${id}-${n}`)) n++;
        id = `${id}-${n}`;
      }
      usedIds.add(id);
      const level = (h[1] ?? "#").length;
      blocks.push({ id, kind: "heading", level, segments: [{ html, sourceKey: null }] });
      toc.push({ id, text, level });
      i++;
      continue;
    }

    // Code fence
    const fence = FENCE_RE.exec(line);
    if (fence) {
      const marker = fence[1] ?? "```";
      const code: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith(marker)) {
        code.push(lines[i] ?? "");
        i++;
      }
      i++; // bỏ dòng đóng
      blocks.push({
        id: nextId(),
        kind: "paragraph",
        segments: [{ html: `<pre class="cite-code"><code>${escapeHtml(code.join("\n"))}</code></pre>`, sourceKey: null }],
      });
      continue;
    }

    // Bảng
    if (isTableStart(lines, i)) {
      const header = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && TABLE_ROW_RE.test(lines[i] ?? "")) {
        rows.push(splitTableRow(lines[i] ?? ""));
        i++;
      }
      let cellHadMarker = false;
      const cell = (raw: string): string => {
        const s = stripMarkers(raw);
        if (s.had) cellHadMarker = true;
        return renderInlineFormatting(ctx, s.text);
      };
      const thead = `<thead><tr>${header.map((c) => `<th>${cell(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${header.map((_, ci) => `<td>${cell(r[ci] ?? "")}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      if (cellHadMarker) warnings.push("Marker chú thích trong ô bảng bị bỏ qua; hãy đặt marker ở caption bảng.");

      const caption = findCaption(lines, i);
      let captionHtml: string | undefined;
      let sourceKey: string | null = null;
      if (caption) {
        const segs = renderSegments(ctx, caption.text);
        captionHtml = segs.map((s) => s.html).join("");
        sourceKey = segs.find((s) => s.sourceKey !== null)?.sourceKey ?? null;
        i = caption.next;
      }
      if (sourceKey === null) warnings.push(`Bảng "${truncate(header.join(" | "))}" chưa có caption kèm chú thích nguồn.`);
      blocks.push({
        id: nextId(),
        kind: "table",
        segments: [{ html: `<table class="cite-table">${thead}${tbody}</table>`, sourceKey }],
        captionHtml,
      });
      continue;
    }

    // Hình
    const img = IMAGE_LINE_RE.exec(line);
    if (img) {
      const alt = img[1] ?? "";
      const src = img[2] ?? "";
      const tag = imageTag(ctx, alt, src, "cite-figure-img");
      i++;
      const caption = findCaption(lines, i);
      let captionHtml: string | undefined;
      let sourceKey: string | null = null;
      if (caption) {
        const segs = renderSegments(ctx, caption.text);
        captionHtml = segs.map((s) => s.html).join("");
        sourceKey = segs.find((s) => s.sourceKey !== null)?.sourceKey ?? null;
        i = caption.next;
      }
      if (!tag) {
        warnings.push(`Ảnh có đường dẫn không an toàn hoặc không phân giải được, đã bỏ: ${truncate(src)}`);
      }
      if (sourceKey === null) warnings.push(`Hình "${truncate(alt || src)}" chưa có caption kèm chú thích nguồn.`);
      const resolved = tag ? ctx.resolveImageSrc(src.trim()) : null;
      blocks.push({
        id: nextId(),
        kind: "figure",
        segments: [{ html: tag ?? "", sourceKey }],
        figureSrc: resolved ?? undefined,
        figureAlt: alt,
        captionHtml,
      });
      continue;
    }

    // Danh sách: mỗi mục là một block
    const li = LIST_RE.exec(line);
    if (li) {
      const baseIndent = indentWidth(li[1] ?? "");
      const marker = li[2] ?? "-";
      const ordered = /^\d/.test(marker);
      const parts = [li[3] ?? ""];
      i++;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        if (next.trim() === "" || LIST_RE.test(next)) break;
        const lead = /^(\s*)/.exec(next)?.[1] ?? "";
        if (indentWidth(lead) <= baseIndent && startsNewBlock(lines, i)) break;
        parts.push(next.trim());
        i++;
      }
      const segments = renderSegments(ctx, parts.join(" "));
      trailingUncitedWarning(ctx, "list", segments);
      const block: CitationDocBlock = {
        id: nextId(),
        kind: "list",
        level: Math.floor(baseIndent / 2) + 1,
        segments,
        listOrdered: ordered,
      };
      if (ordered) block.listNumber = Number.parseInt(marker, 10);
      blocks.push(block);
      continue;
    }

    // Trích dẫn
    if (QUOTE_RE.test(line)) {
      const parts: string[] = [];
      while (i < lines.length) {
        const q = QUOTE_RE.exec(lines[i] ?? "");
        if (!q) break;
        parts.push((q[1] ?? "").trim());
        i++;
      }
      const segments = renderSegments(ctx, parts.join(" "));
      trailingUncitedWarning(ctx, "quote", segments);
      blocks.push({ id: nextId(), kind: "quote", segments });
      continue;
    }

    // Đoạn văn (kể cả dòng caption đứng lẻ)
    const parts = [line.trim()];
    i++;
    while (i < lines.length && (lines[i] ?? "").trim() !== "" && !startsNewBlock(lines, i)) {
      parts.push((lines[i] ?? "").trim());
      i++;
    }
    const segments = renderSegments(ctx, parts.join(" "));
    if (segments.length > 0) {
      trailingUncitedWarning(ctx, "paragraph", segments);
      blocks.push({ id: nextId(), kind: "paragraph", segments });
    }
  }

  const baseSources: Omit<SourceRef, "colorIndex">[] = [...ctx.labels.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([key, label]) => {
      const def = defs.get(key);
      return { key, label, title: def?.title ?? key, url: def?.url ?? "" };
    });

  return {
    blocks,
    sources: assignSourceColors(blocks, baseSources),
    toc,
    frontMatter,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Tô màu đồ thị
// ---------------------------------------------------------------------------

/** Chuỗi sourceKey (bỏ null) theo thứ tự đọc, xuyên qua ranh giới block. */
function citedSequence(blocks: DocBlock[], known: Set<string>): string[] {
  const seq: string[] = [];
  for (const block of blocks) {
    for (const seg of block.segments) {
      if (seg.sourceKey !== null && known.has(seg.sourceKey)) seq.push(seg.sourceKey);
    }
  }
  return seq;
}

/**
 * Gán `colorIndex` cho từng nguồn.
 * - Đỉnh = nguồn; cạnh = hai nguồn khác nhau xuất hiện ở hai đoạn có nguồn liền kề nhau
 *   (bỏ qua đoạn không có nguồn, kể cả qua ranh giới block).
 * - Tham lam theo thứ tự `label`. Trong các màu 0..7 không xung đột, chọn màu đang dùng ít nhất
 *   (để các nguồn khác nhau ưu tiên màu khác nhau). Hết màu thì cấp chỉ số >= 8.
 * Bảo đảm: cùng nguồn cùng màu; hai đoạn liền kề khác nguồn khác màu.
 * Trả về theo đúng thứ tự `sources` đầu vào.
 */
export function assignSourceColors(
  blocks: DocBlock[],
  sources: Omit<SourceRef, "colorIndex">[],
): SourceRef[] {
  const known = new Set(sources.map((s) => s.key));
  const adjacency = new Map<string, Set<string>>();
  for (const s of sources) adjacency.set(s.key, new Set());

  const seq = citedSequence(blocks, known);
  for (let k = 1; k < seq.length; k++) {
    const a = seq[k - 1];
    const b = seq[k];
    if (a === undefined || b === undefined || a === b) continue;
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }

  const colors = new Map<string, number>();
  const usage: number[] = new Array<number>(SOURCE_PALETTE_SIZE).fill(0);
  const ordered = [...sources].sort((x, y) => x.label - y.label);

  for (const s of ordered) {
    const forbidden = new Set<number>();
    for (const n of adjacency.get(s.key) ?? []) {
      const c = colors.get(n);
      if (c !== undefined) forbidden.add(c);
    }
    let chosen = -1;
    let bestUsage = Number.POSITIVE_INFINITY;
    for (let c = 0; c < SOURCE_PALETTE_SIZE; c++) {
      const u = usage[c] ?? 0;
      if (!forbidden.has(c) && u < bestUsage) {
        bestUsage = u;
        chosen = c;
      }
    }
    if (chosen === -1) {
      chosen = SOURCE_PALETTE_SIZE;
      while (forbidden.has(chosen)) chosen++;
    } else {
      usage[chosen] = (usage[chosen] ?? 0) + 1;
    }
    colors.set(s.key, chosen);
  }

  return sources.map((s) => ({ ...s, colorIndex: colors.get(s.key) ?? 0 }));
}

/** Map key → colorIndex để UI tra nhanh. */
export function getSourceColorMap(sources: SourceRef[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sources) map[s.key] = s.colorIndex;
  return map;
}

/**
 * Kiểm tra bất biến tô màu (dùng cho test): trả về các cặp đoạn liền kề khác nguồn nhưng trùng màu.
 * Mảng rỗng = hợp lệ.
 */
export function findAdjacentColorConflicts(
  blocks: DocBlock[],
  sources: SourceRef[],
): { a: string; b: string; colorIndex: number }[] {
  const colorMap = getSourceColorMap(sources);
  const seq = citedSequence(blocks, new Set(Object.keys(colorMap)));
  const conflicts: { a: string; b: string; colorIndex: number }[] = [];
  for (let k = 1; k < seq.length; k++) {
    const a = seq[k - 1];
    const b = seq[k];
    if (a === undefined || b === undefined || a === b) continue;
    const ca = colorMap[a];
    if (ca !== undefined && ca === colorMap[b]) conflicts.push({ a, b, colorIndex: ca });
  }
  return conflicts;
}
