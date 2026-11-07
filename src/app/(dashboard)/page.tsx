import Link from "next/link";
import { AppShell, Button } from "@/components/ui";
import { KanbanBoard } from "@/features/dashboard/KanbanBoard";

export default function DashboardPage() {
  return (
    <AppShell
      title="Web Học Y4"
      subtitle="Không gian học tập Y khoa Năm 4 — Thi thử Lâm sàng & Thư viện Chú thích Nguồn"
      actions={
        <Link href="/dev/ui">
          <Button variant="ghost" size="sm">
            UI Kit
          </Button>
        </Link>
      }
    >
      <KanbanBoard />
    </AppShell>
  );
}
