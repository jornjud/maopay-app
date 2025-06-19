"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/auth/UserAvatar";

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg">🔴⚪️ MAOPAY</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-2">
            {/* --- 👇👇 เจ๊แก้ตรงนี้ให้เพื่อน! 👇👇 --- */}

            {/* ถ้ายังโหลดข้อมูล user อยู่ ให้แสดงว่า 'กำลังโหลด...' */}
            {loading ? (
              <Button variant="ghost" disabled>
                กำลังโหลด...
              </Button>
            ) : user ? (
              // ถ้า user ล็อกอินแล้ว...
              <>
                {/* ปุ่มสมัครร้านค้า */}
                <Link href="/stores/register" passHref legacyBehavior>
                  <Button variant="ghost">🏪 สมัครร้านค้า</Button>
                </Link>

                {/* ปุ่มสมัครไรเดอร์ */}
                <Link href="/riders/register" passHref legacyBehavior>
                  <Button variant="ghost">🛵 สมัครไรเดอร์</Button>
                </Link>

                {/* แสดงรูปโปรไฟล์และเมนูของ user */}
                <UserAvatar />
              </>
            ) : (
              // ถ้า user ยังไม่ได้ล็อกอิน...
              <Link href="/login" passHref legacyBehavior>
                <Button>เข้าสู่ระบบ</Button>
              </Link>
            )}

            {/* --- 👆👆 จบส่วนที่เจ๊แก้ 👆👆 --- */}
          </nav>
        </div>
      </div>
    </header>
  );
}