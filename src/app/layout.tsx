import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: "Web Học Y4 — Thi thử Lâm sàng & Thư viện Y khoa",
  description:
    "Nền tảng cá nhân ôn thi trắc nghiệm, tự luận, chạy trạm OSCE và đọc tài liệu Y4 có chú thích nguồn",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
