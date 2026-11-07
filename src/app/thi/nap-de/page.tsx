"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParseResult } from "@/types";
import { AppShell, Badge, Button, Card, Input, useToast } from "@/components/ui";
import { ContentBlockRenderer } from "@/features/exam/ContentBlockRenderer";

const SAMPLE_STANDARD_EXAM_TEXT = `ĐỀ: Thi thử Nội khoa — Tim mạch & Hô hấp 02
MÔN: Nội khoa
THỜI GIAN: 20 phút
CHẾ ĐỘ: Thường
TAG: tim mạch, hô hấp, Y4

PHẦN I. TRẮC NGHIỆM

Câu 1 (1 điểm).
Thuốc nào sau đây thuộc nhóm ức chế SGLT2 dùng trong điều trị suy tim phân suất tống máu giảm (HFrEF)?
A. Dapagliflozin
B. Digoxin
C. Ivabradin
D. Verapamil
Đáp án: A
Ghi chú: Dapagliflozin và Empagliflozin là 2 thuốc SGLT2i nền tảng giảm tử vong tim mạch và nhập viện vì suy tim.
---
Câu 2 (1 điểm).
Những dấu hiệu nào sau đây gợi ý suy tim trái trên lâm sàng?
A. Khó thở khi nằm (orthopnea)
B. Ran ẩm ở hai đáy phổi
C. Gan to đàn xếp, tĩnh mạch cổ nổi đơn thuần
D. Cơn khó thở kịch phát về đêm
Đáp án: A, B, D
---
Câu 3 (1 điểm).
Đ/S: NT-proBNP < 125 pg/mL giúp loại trừ suy tim mạn ở bệnh nhân ngoại trú có triệu chứng nhẹ.
Đáp án: Đúng

PHẦN II. TỰ LUẬN

Câu 4 (2 điểm).
Trình bày 4 nhóm thuốc nền tảng điều trị suy tim HFrEF theo khuyến cáo ESC 2021.
Đáp án mẫu:
Bốn nhóm thuốc trụ cột trong điều trị HFrEF gồm: (1) ARNI hoặc ACEi/ARB, (2) Chẹn beta giao cảm, (3) Đối kháng thụ thể mineralocorticoid (MRA), và (4) Ức chế SGLT2.
Barem:
- Ý 1 (0.5 đ): Nêu đúng nhóm ARNI (Sacubitril/Valsartan) hoặc ACEi
- Ý 2 (0.5 đ): Nêu đúng nhóm Chẹn beta (Bisoprolol, Carvedilol, Metoprolol succinate, Nebivolol)
- Ý 3 (0.5 đ): Nêu đúng nhóm MRA (Spironolacton, Eplerenon)
- Ý 4 (0.5 đ): Nêu đúng nhóm SGLT2i (Dapagliflozin, Empagliflozin)
Ghi chú: Khởi trị sớm cả 4 trụ cột và chỉnh liều tới liều đích dung nạp được.`;

const SAMPLE_STATION_EXAM_TEXT = `ĐỀ: OSCE Ngoại & Nội khoa — Cấp cứu Đau ngực
MÔN: Lâm sàng Tổng hợp
THỜI GIAN: 10 phút
CHẾ ĐỘ: Trạm
TAG: osce, cấp cứu

TRẠM 1 (5 phút). Khai thác bệnh sử đau ngực cấp
Tình huống: Bệnh nhân nam 60 tuổi vào cấp cứu vì đau ngực sau xương ức lan lên cổ và tay trái 1 giờ.
Câu 1 (3 điểm).
Nêu 3 đặc điểm tính chất cơn đau thắt ngực điển hình do mạch vành cần khai thác.
Đáp án mẫu:
Vị trí sau xương ức lan cổ/hàm/tay trái; tính chất bóp nghẹt/đè nặng; xuất hiện khi gắng sức hoặc xúc động, kéo dài > 20 phút trong hội chứng vành cấp.
Barem:
- Ý 1 (1 đ): Vị trí và hướng lan điển hình
- Ý 2 (1 đ): Tính chất đè nặng / bóp nghẹt
- Ý 3 (1 đ): Thời gian kéo dài và hoàn cảnh khởi phát

TRẠM 2 (5 phút). Xử trí ban đầu
Tình huống: ECG ghi nhận ST chênh lên ở DII, DIII, aVF.
Câu 2 (1 điểm).
Chuyển đạo nào cần đo thêm để tầm soát nhồi máu thất phải đi kèm?
A. V3R, V4R
B. V7, V8, V9
C. DI, aVL
D. V1, V2
Đáp án: A
Ghi chú: Nhồi máu thành dưới cần đo V3R, V4R để phát hiện nhồi máu thất phải.`;

export default function ImportExamPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [rawText, setRawText] = useState(SAMPLE_STANDARD_EXAM_TEXT);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleParse = async (textToParse = rawText) => {
    if (!textToParse.trim()) {
      pushToast("Vui lòng nhập hoặc chọn file đề thi trước khi phân tích", "error");
      return;
    }
    setParsing(true);
    try {
      const res = await fetch("/api/exam/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToParse }),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error ?? "Lỗi phân tích đề");
      setParseResult(res.data as ParseResult);
      pushToast("Đã phân tích đề thi thành công! Hãy kiểm tra bản xem trước.", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Lỗi phân tích đề", "error");
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setRawText(text);
      await handleParse(text);
    } catch {
      pushToast("Không đọc được file", "error");
    }
  };

  const handleSaveExam = async () => {
    if (!parseResult) return;
    const hasFatalError = parseResult.issues.some((i) => i.level === "error");
    if (hasFatalError) {
      pushToast("Vui lòng sửa các lỗi mức Error trước khi lưu đề", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.exam),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error ?? "Không lưu được đề");
      pushToast("Đã lưu đề thi vào Ngân hàng đề!", "success");
      router.push(`/thi/de/${res.data.id}`);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Lỗi lưu đề", "error");
    } finally {
      setSaving(false);
    }
  };

  const questionsList = parseResult
    ? Object.values(parseResult.exam.questions).sort((a, b) => a.number - b.number)
    : [];

  return (
    <AppShell
      title="Nạp Đề thi & Xem trước (Preview)"
      subtitle="Đọc định dạng đề chuẩn Y4, kiểm tra lỗi thiếu đáp án / lệch điểm barem trước khi lưu"
      backHref="/thi"
      backLabel="Ngân hàng đề"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">1. Nguồn đề thi (PDF Text / Markdown chuẩn)</h2>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRawText(SAMPLE_STANDARD_EXAM_TEXT);
                  void handleParse(SAMPLE_STANDARD_EXAM_TEXT);
                }}
              >
                Mẫu Đề Thường
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRawText(SAMPLE_STATION_EXAM_TEXT);
                  void handleParse(SAMPLE_STATION_EXAM_TEXT);
                }}
              >
                Mẫu Đề OSCE Trạm
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 text-center text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                📂 Chọn file đề (.txt, .md, .pdf có lớp chữ) từ thiết bị / iCloud
              </span>
              <input
                type="file"
                accept=".txt,.md,.pdf"
                onChange={handleFileChange}
                className="mt-1 text-xs"
              />
            </label>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={18}
            className="w-full rounded-xl border border-slate-300 bg-white p-3.5 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="Dán nội dung đề thi theo mẫu ĐỀ:, MÔN:, THỜI GIAN:, Câu 1 (1 điểm)..."
          />

          <div className="flex items-center justify-end gap-2">
            <Button variant="primary" onClick={() => void handleParse()} disabled={parsing}>
              {parsing ? "Đang phân tích..." : "🔍 Phân tích & Xem trước"}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">2. Kết quả kiểm tra & Xem trước</h2>
              {parseResult ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleSaveExam()}
                  disabled={saving || parseResult.issues.some((i) => i.level === "error")}
                >
                  {saving ? "Đang lưu..." : "💾 Lưu vào Ngân hàng đề"}
                </Button>
              ) : null}
            </div>

            {!parseResult ? (
              <p className="text-sm text-slate-500">
                Bấm <strong>Phân tích & Xem trước</strong> để kiểm tra cấu trúc câu hỏi, đáp án và barem.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Tên đề thi"
                    value={parseResult.exam.title}
                    onChange={(e) =>
                      setParseResult({
                        ...parseResult,
                        exam: { ...parseResult.exam, title: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Môn học"
                    value={parseResult.exam.subject}
                    onChange={(e) =>
                      setParseResult({
                        ...parseResult,
                        exam: { ...parseResult.exam, subject: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Danh sách lỗi / cảnh báo */}
                {parseResult.issues.length > 0 ? (
                  <div className="space-y-1.5 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Phát hiện {parseResult.issues.length} vấn đề khi phân tích:
                    </div>
                    <ul className="space-y-1 text-xs">
                      {parseResult.issues.map((issue, idx) => (
                        <li
                          key={idx}
                          className={
                            issue.level === "error"
                              ? "font-semibold text-rose-700 dark:text-rose-300"
                              : "text-amber-800 dark:text-amber-300"
                          }
                        >
                          [{issue.level.toUpperCase()}]
                          {issue.questionNumber ? ` Câu ${issue.questionNumber}: ` : " "}
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    ✓ Đề thi hợp lệ 100% ({questionsList.length} câu hỏi, không có lỗi định dạng).
                  </div>
                )}

                <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
                  {questionsList.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Câu {q.number} ({q.points} điểm)
                        </span>
                        <Badge tone="blue">{q.type}</Badge>
                      </div>
                      <ContentBlockRenderer blocks={q.stem} />
                      {q.choices && q.choices.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs">
                          {q.choices.map((c) => {
                            const isCorrect = q.correctKeys?.includes(c.key);
                            return (
                              <li
                                key={c.key}
                                className={`rounded-lg px-2.5 py-1 ${
                                  isCorrect
                                    ? "bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {c.key}. {c.content.map((b) => (b.type === "text" ? b.md : "")).join(" ")}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                      {q.correctKeys && q.correctKeys.length > 0 ? (
                        <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Đáp án đúng: {q.correctKeys.join(", ")}
                        </div>
                      ) : null}
                      {q.rubric && q.rubric.length > 0 ? (
                        <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs dark:border-slate-700">
                          <div className="font-semibold">Barem tự chấm:</div>
                          {q.rubric.map((r) => (
                            <div key={r.id} className="text-slate-600 dark:text-slate-300">
                              • {r.label} ({r.points} đ)
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
