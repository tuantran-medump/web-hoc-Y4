/**
 * Hợp đồng dữ liệu cho Web con 1: Thi thử ("/thi")
 * Chốt tại Wave 0 — Không tự ý sửa ở các nhánh con.
 */

export type ContentBlock =
  | { type: "text"; md: string }
  | { type: "image"; src: string; alt?: string; width?: number; height?: number }
  | {
      type: "table";
      rows: string[][];
      hasHeader: boolean;
      caption?: string;
      fallbackImage?: string;
    };

export type QuestionType = "mcq_single" | "mcq_multi" | "true_false" | "essay";

export interface Choice {
  /** 'A' | 'B' | 'C' | 'D' | 'E' | 'F' */
  key: string;
  content: ContentBlock[];
}

export interface RubricItem {
  id: string;
  label: string;
  points: number;
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  points: number;
  stem: ContentBlock[];
  choices?: Choice[];
  /** Đáp án đúng cho câu trắc nghiệm ('A'..'F' hoặc 'Đúng'|'Sai') */
  correctKeys?: string[];
  /** Đáp án mẫu cho câu tự luận */
  modelAnswer?: ContentBlock[];
  /** Barem tự chấm cho câu tự luận */
  rubric?: RubricItem[];
  /** Ghi chú / giải thích */
  note?: ContentBlock[];
  tags: string[];
  /** Trang xuất hiện trong PDF gốc */
  sourcePage?: number;
}

export interface ExamSection {
  id: string;
  title: string;
  questionIds: string[];
}

export interface Station {
  id: string;
  title: string;
  durationSec: number;
  scenario: ContentBlock[];
  questionIds: string[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  tags: string[];
  mode: "standard" | "station";
  /** standard: tổng giờ; station: tổng thời gian các trạm (giây) */
  durationSec: number;
  sections: ExamSection[];
  stations?: Station[];
  questions: Record<string, Question>;
  sourcePdfPath?: string;
  createdAt: string;
  updatedAt: string;
  /** Xoá mềm (thùng rác 30 ngày) */
  deletedAt?: string | null;
  version: number;
}

export type AnswerEditableField =
  | "correctKeys"
  | "modelAnswer"
  | "rubric"
  | "note"
  | "stem"
  | "choices";

export interface AnswerEdit {
  id: string;
  examId: string;
  questionId: string;
  field: AnswerEditableField;
  before: unknown;
  after: unknown;
  editedAt: string;
}

export type AnswerValue =
  | { kind: "choice"; keys: string[] }
  | { kind: "essay"; text: string };

export interface SelfGrade {
  checkedRubricIds: string[];
  score: number;
  comment?: string;
}

export interface Attempt {
  id: string;
  examId: string;
  examVersion: number;
  /** 'practice': được tạm dừng, xem đáp án ngay; 'exam': thi thật */
  mode: "exam" | "practice";
  startedAt: string;
  /** Mốc kết thúc tuyệt đối (ISO 8601) → chống lệch đồng hồ */
  endsAt: string;
  /** Nếu tạm dừng ở chế độ practice, lưu số giây còn lại */
  pausedRemainingSec?: number | null;
  currentStationIndex?: number;
  stationEndsAt?: string;
  answers: Record<string, AnswerValue>;
  flagged: string[];
  submittedAt?: string;
  /** Điểm chấm tự động phần trắc nghiệm */
  autoScore?: number;
  selfGrades: Record<string, SelfGrade>;
  totalScore?: number;
  status: "in_progress" | "submitted" | "graded";
}

export interface ParseIssue {
  level: "error" | "warning";
  questionNumber?: number;
  page?: number;
  message: string;
}

export interface ParseResult {
  exam: Exam;
  issues: ParseIssue[];
}

export interface ExamBackupPayload {
  version: number;
  exportedAt: string;
  exams: Exam[];
  attempts: Attempt[];
  answerEdits: AnswerEdit[];
}
