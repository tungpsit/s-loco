import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S-Local Admin — Quản trị hệ thống",
  description:
    "Bảng điều khiển quản trị S-Local — quản lý vendor, voucher, đơn hàng và báo cáo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
