import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FirebaseMessagingProvider } from "@/components/auth/FirebaseMessagingProvider"; // 1. Import เข้ามา

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
          {/* 2. เอามาครอบแอปของเราไว้ตรงนี้! */}
          <FirebaseMessagingProvider>
            <Navbar />
            <main className="min-h-screen bg-slate-50">
              {children}
            </main>
            <Footer />
          </FirebaseMessagingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}