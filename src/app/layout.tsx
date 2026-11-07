import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Học Y4 — Nền tảng Học tập Y khoa Năm 4",
  description: "Hệ thống học tập, ôn luyện lâm sàng và trắc nghiệm Y4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
