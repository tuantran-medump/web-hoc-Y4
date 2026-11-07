import { describe, expect, it } from "vitest";
import {
  findAdjacentColorConflicts,
  renderLibraryMarkdown,
} from "@/lib/citation";

const SAMPLE_MD = `---
title: Suy tim mạn — Chẩn đoán và điều trị
tags: [noi-khoa, tim-mach]
updated: 2026-11-07
---

# Suy tim mạn

## 1. Định nghĩa

Suy tim là một hội chứng lâm sàng gồm khó thở và phù chân.[^esc2021] Nguyên nhân là bất thường cấu trúc hoặc chức năng tim.[^harrison21] Theo dõi lâu dài tại cơ sở chuyên khoa.[^esc2021]

- Suy tim EF giảm (HFrEF): EF <= 40%.[^esc2021]
- Suy tim EF bảo tồn (HFpEF): EF >= 50%.[^bnyhd]

Xem thêm tại [Tài liệu ngoài](https://example.com) hoặc https://google.com trong thân bài.[^esc2021]

| Phân độ NYHA | Triệu chứng |
|---|---|
| I | Không giới hạn |

*Bảng 1. Phân độ NYHA.*[^esc2021]

[^esc2021]: [ESC Heart Failure Guidelines 2021](https://drive.google.com/file/d/AAAA/view)
[^harrison21]: [Harrison 21e](https://drive.google.com/file/d/BBBB/view)
`;

const SHARED_SOURCES = `
[^bnyhd]: [Bệnh học Nội khoa ĐH Y Hà Nội](https://drive.google.com/file/d/CCCC/view)
`;

describe("Citation & Graph Coloring Engine (src/lib/citation)", () => {
  it("merges local and shared sources, numbers labels in order, strips body links, and assigns conflict-free colors", () => {
    const out = renderLibraryMarkdown(SAMPLE_MD, SHARED_SOURCES);

    expect(out.frontMatter.title).toBe("Suy tim mạn — Chẩn đoán và điều trị");
    expect(out.sources.map((s) => ({ key: s.key, label: s.label }))).toEqual([
      { key: "esc2021", label: 1 },
      { key: "harrison21", label: 2 },
      { key: "bnyhd", label: 3 },
    ]);

    // Kiểm tra không có bất kỳ xung đột màu nào giữa 2 đoạn liền kề khác nguồn
    expect(findAdjacentColorConflicts(out.blocks, out.sources)).toEqual([]);

    // Kiểm tra mọi link trong thân bài đã bị ẩn (không có thẻ <a trong segments)
    const allHtml = out.blocks.flatMap((b) => b.segments.map((s) => s.html)).join("\n");
    expect(allHtml).not.toContain("<a ");
    expect(allHtml).toContain("Tài liệu ngoài");
    expect(allHtml).not.toContain("https://google.com");
  });
});
