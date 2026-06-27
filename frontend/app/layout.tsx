import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI UI Tutor",
  description: "Upload a UI screenshot and generate annotated interaction steps."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-roboto">{children}</body>
    </html>
  );
}
