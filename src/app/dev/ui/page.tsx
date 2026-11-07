"use client";

import React, { useState } from "react";
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Modal,
  Select,
  Sheet,
  Skeleton,
  Tabs,
  TagInput,
  Tooltip,
  useToast,
} from "@/components/ui";

export default function DevUiShowcasePage() {
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState("buttons");
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(["noi-khoa", "tim-mach"]);

  return (
    <AppShell
      title="Design System Showcase (/dev/ui)"
      subtitle="Kiểm thử trực quan bộ Component dùng chung (PC • iPad • iPhone • Android)"
      backHref="/"
    >
      <div className="space-y-6">
        <Tabs
          items={[
            { id: "buttons", label: "Buttons & Badges", badge: 6 },
            { id: "forms", label: "Inputs & Tags" },
            { id: "overlays", label: "Modal, Sheet & Tooltip" },
            { id: "colors", label: "8 Màu Chú thích Nguồn" },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-base font-bold">1. Buttons & Badges (Touch ≥ 44×44px)</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => pushToast("Đã bấm Primary!", "success")}>
                Primary
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger" onClick={() => pushToast("Cảnh báo thao tác xoá!", "error")}>
                Danger
              </Button>
              <IconButton label="Nút biểu tượng" onClick={() => pushToast("Icon button")}>
                ★
              </IconButton>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="blue">Nội khoa</Badge>
              <Badge tone="emerald">Đã chấm</Badge>
              <Badge tone="amber">Còn 5 phút</Badge>
              <Badge tone="rose">Còn 1 phút</Badge>
              <Badge tone="purple">OSCE Trạm</Badge>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold">2. Inputs, Select & TagInput (Font ≥ 16px)</h2>
            <Input label="Tên đề thi" placeholder="Nhập tên đề thi..." />
            <Select
              label="Chế độ thi"
              options={[
                { value: "standard", label: "Thường (Standard)" },
                { value: "station", label: "Chạy trạm (OSCE Station)" },
              ]}
            />
            <TagInput label="Danh sách Tag" tags={tags} onChange={setTags} />
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold">3. Overlays & Responsive Tooltip</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setModalOpen(true)}>
                Mở Modal
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(true)}>
                Mở Sheet (Drawer / Bottom Sheet)
              </Button>
              <Tooltip
                content={
                  <div className="space-y-1">
                    <div className="font-semibold">[1] ESC Heart Failure Guidelines 2021</div>
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-blue-600 underline dark:text-blue-400"
                    >
                      Mở trên Google Drive ↗
                    </a>
                  </div>
                }
              >
                <span className="cursor-pointer rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                  Rê chuột (PC) hoặc Chạm (Cảm ứng) [1]
                </span>
              </Tooltip>
            </div>
            <Skeleton className="h-10 w-full" />
          </Card>

          <Card className="space-y-4">
            <h2 className="text-base font-bold">4. Bảng 8 Màu Pastel Tô Nguồn Tài Liệu</h2>
            <div className="space-y-2 text-sm">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
                <div key={idx} className={`cite-segment cite-color-${idx} block py-1.5`}>
                  Đoạn văn mẫu sử dụng bảng màu nguồn số <strong>[{idx + 1}]</strong> (colorIndex = {idx})
                </div>
              ))}
            </div>
          </Card>
        </div>

        <EmptyState
          title="Trạng thái trống (EmptyState)"
          description="Hiển thị khi chưa có đề thi hoặc tài liệu nào phù hợp bộ lọc."
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Xác nhận nộp bài"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={() => setModalOpen(false)}>Đồng ý</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Bạn có chắc chắn muốn nộp bài thi ngay bây giờ không?
        </p>
      </Modal>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Bảng điều hướng câu hỏi">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }, (_, i) => (
            <Button key={i} variant={i < 5 ? "primary" : "outline"} size="sm">
              {i + 1}
            </Button>
          ))}
        </div>
      </Sheet>
    </AppShell>
  );
}
