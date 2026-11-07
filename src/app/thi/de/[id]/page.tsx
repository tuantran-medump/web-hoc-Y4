"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { AnswerEdit, Exam, Question } from "@/types";
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
  Tabs,
  useToast,
} from "@/components/ui";
import { ContentBlockRenderer } from "@/features/exam/ContentBlockRenderer";

export default function ExamDetailAndEditPage() {
  const params = useParams<{ id: string }>();
  const examId = params.id;
  const { pushToast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [edits, setEdits] = useState<AnswerEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "history">("questions");

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [draftCorrectKeys, setDraftCorrectKeys] = useState<string>("");
  const [draftModelAnswer, setDraftModelAnswer] = useState<string>("");
  const [draftNote, setDraftNote] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, editsRes] = await Promise.all([
        fetch(`/api/exam/${examId}`).then((r) => r.json()),
        fetch(`/api/exam/${examId}/edits`).then((r) => r.json()),
      ]);
      if (examRes?.success) setExam(examRes.data as Exam);
      if (editsRes?.success && Array.isArray(editsRes.data)) {
        setEdits((editsRes.data as AnswerEdit[]).reverse());
      }
    } catch {
      pushToast("Không tải được chi tiết đề thi", "error");
    } finally {
      setLoading(false);
    }
  }, [examId, pushToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setDraftCorrectKeys((q.correctKeys ?? []).join(", "));
    setDraftModelAnswer(
      (q.modelAnswer ?? []).map((b) => (b.type === "text" ? b.md : "")).join("\n"),
    );
    setDraftNote((q.note ?? []).map((b) => (b.type === "text" ? b.md : "")).join("\n"));
  };

  const handleSaveQuestionEdit = async () => {
    if (!exam || !editingQuestion) return;
    let currentVersion = exam.version;

    try {
      if (editingQuestion.type !== "essay") {
        const keys = draftCorrectKeys
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const res = await fetch(`/api/exam/${exam.id}/questions/${editingQuestion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: currentVersion,
            field: "correctKeys",
            value: keys,
          }),
        }).then((r) => r.json());
        if (!res?.success) throw new Error(res?.error ?? "Lỗi sửa đáp án");
        currentVersion = res.data.exam.version;
      } else {
        const res = await fetch(`/api/exam/${exam.id}/questions/${editingQuestion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: currentVersion,
            field: "modelAnswer",
            value: [{ type: "text", md: draftModelAnswer.trim() || "Đáp án mẫu" }],
          }),
        }).then((r) => r.json());
        if (!res?.success) throw new Error(res?.error ?? "Lỗi sửa đáp án mẫu");
        currentVersion = res.data.exam.version;
      }

      if (draftNote.trim()) {
        await fetch(`/api/exam/${exam.id}/questions/${editingQuestion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: currentVersion,
            field: "note",
            value: [{ type: "text", md: draftNote.trim() }],
          }),
        });
      }

      pushToast(`Đã cập nhật Câu ${editingQuestion.number} và ghi vào lịch sử sửa!`, "success");
      setEditingQuestion(null);
      await loadData();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Không thể cập nhật câu hỏi", "error");
    }
  };

  const handleUndoEdit = async (editId: string) => {
    if (!exam) return;
    try {
      const res = await fetch(`/api/exam/${exam.id}/edits/${editId}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: exam.version }),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error ?? "Không thể hoàn tác");
      pushToast("Đã hoàn tác thay đổi đáp án!", "success");
      await loadData();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Lỗi hoàn tác", "error");
    }
  };

  if (loading) {
    return (
      <AppShell title="Chi tiết đề thi" backHref="/thi" backLabel="Ngân hàng đề">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!exam) {
    return (
      <AppShell title="Không tìm thấy đề thi" backHref="/thi" backLabel="Ngân hàng đề">
        <EmptyState title="Đề thi không tồn tại hoặc đã bị xoá" />
      </AppShell>
    );
  }

  const questions = Object.values(exam.questions).sort((a, b) => a.number - b.number);

  return (
    <AppShell
      title={exam.title}
      subtitle={`${exam.subject} • ${Math.round(exam.durationSec / 60)} phút • Phiên bản v${exam.version}`}
      backHref="/thi"
      backLabel="Ngân hàng đề"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/thi/de/${exam.id}/lam-bai?mode=exam`}>
            <Button variant="primary" size="sm">
              ▶ Thi thật
            </Button>
          </Link>
          <Link href={`/thi/de/${exam.id}/lam-bai?mode=practice`}>
            <Button variant="secondary" size="sm">
              💡 Luyện tập
            </Button>
          </Link>
          <Link href={`/thi/de/${exam.id}/in?variant=answers`}>
            <Button variant="outline" size="sm">
              🖨 In đề + Đáp án
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <Tabs
          items={[
            { id: "questions", label: "Danh sách Câu hỏi & Đáp án", badge: questions.length },
            { id: "history", label: "Lịch sử Sửa đáp án", badge: edits.length },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as "questions" | "history")}
        />

        {activeTab === "questions" ? (
          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      Câu {q.number} ({q.points} điểm)
                    </span>
                    <Badge tone="blue">{q.type}</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditQuestion(q)}>
                    ✏️ Sửa đáp án / Ghi chú
                  </Button>
                </div>

                <ContentBlockRenderer blocks={q.stem} />

                {q.choices && q.choices.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.choices.map((c) => {
                      const isCorrect = q.correctKeys?.includes(c.key);
                      return (
                        <div
                          key={c.key}
                          className={`rounded-xl border px-3.5 py-2.5 text-sm ${
                            isCorrect
                              ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200"
                              : "border-slate-200 bg-slate-50/60 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          <span className="mr-1.5 font-bold">{c.key}.</span>
                          {c.content.map((b) => (b.type === "text" ? b.md : "")).join(" ")}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {q.correctKeys && q.correctKeys.length > 0 ? (
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ Đáp án đúng: {q.correctKeys.join(", ")}
                  </div>
                ) : null}

                {q.modelAnswer && q.modelAnswer.length > 0 ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/40">
                    <div className="mb-1 text-xs font-bold text-blue-900 dark:text-blue-200">
                      Đáp án mẫu (Tự luận):
                    </div>
                    <ContentBlockRenderer blocks={q.modelAnswer} />
                  </div>
                ) : null}

                {q.rubric && q.rubric.length > 0 ? (
                  <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Barem tự chấm ({q.points} điểm):
                    </div>
                    {q.rubric.map((r) => (
                      <div key={r.id} className="text-slate-600 dark:text-slate-300">
                        • {r.label} — <strong>{r.points} đ</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                {q.note && q.note.length > 0 ? (
                  <div className="rounded-xl bg-amber-50/80 px-3.5 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <strong>💡 Giải thích / Ghi chú: </strong>
                    <ContentBlockRenderer blocks={q.note} />
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        ) : edits.length === 0 ? (
          <EmptyState
            title="Chưa có lịch sử sửa đáp án"
            description="Mọi thay đổi đáp án, đáp án mẫu hoặc ghi chú sẽ được ghi lại tại đây kèm nút Hoàn tác."
          />
        ) : (
          <div className="space-y-3">
            {edits.map((edit) => (
              <Card key={edit.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge tone="purple">Câu: {edit.questionId}</Badge>
                    <Badge tone="blue">Trường: {edit.field}</Badge>
                    <span className="text-slate-500">
                      {new Date(edit.editedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <strong>Trước:</strong> <code>{JSON.stringify(edit.before)}</code> →{" "}
                    <strong>Sau:</strong> <code>{JSON.stringify(edit.after)}</code>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => void handleUndoEdit(edit.id)}>
                  ↩ Hoàn tác
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        title={editingQuestion ? `Sửa Câu ${editingQuestion.number}` : "Sửa câu hỏi"}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>
              Huỷ
            </Button>
            <Button onClick={() => void handleSaveQuestionEdit()}>Lưu thay đổi</Button>
          </>
        }
      >
        {editingQuestion ? (
          <div className="space-y-4">
            {editingQuestion.type !== "essay" ? (
              <Input
                label="Đáp án đúng (cách nhau bằng dấu phẩy, ví dụ: B hoặc A, C hoặc Đúng)"
                value={draftCorrectKeys}
                onChange={(e) => setDraftCorrectKeys(e.target.value)}
              />
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Đáp án mẫu (Tự luận)</label>
                <textarea
                  rows={4}
                  value={draftModelAnswer}
                  onChange={(e) => setDraftModelAnswer(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ghi chú / Giải thích</label>
              <textarea
                rows={3}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
