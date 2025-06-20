// src/app/layout.tsx
import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
// ไม่ต้อง import FirebaseMessagingProvider แล้ว!

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Maopay - ส่งไวเหมือนซาก้าเลี้ยงจี้",
  description: "บริการรับส่งอาหาร สั่งง่าย ได้เร็ว",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={kanit.className}>
        <AuthProvider>
          {/* เอา Provider ที่ครอบไว้ออก ให้เหลือแค่นี้ */}
          <Navbar />
          <main className="min-h-screen bg-slate-50">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}