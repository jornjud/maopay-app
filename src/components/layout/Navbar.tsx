// src/components/layout/Navbar.tsx
"use client";

import { useEffect } from 'react'; // 1. เพิ่ม useEffect
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth, app } from "@/lib/firebase"; // 2. เพิ่ม app เข้ามา
import { Button } from "@/components/ui/button";
import { NotificationBell } from './NotificationBell';

// --- 3. เพิ่ม imports สำหรับ Messaging ---
import { getMessaging, onMessage } from 'firebase/messaging';
import { useNotificationStore } from '@/store/notificationStore';

export const Navbar = () => {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const { user, loading } = useAuth();
  const { addNotification } = useNotificationStore(); // 4. ดึงฟังก์ชันเพิ่มแจ้งเตือนมา

  // --- 5. เพิ่ม useEffect สำหรับดักฟัง Notification โดยเฉพาะ! ---
  useEffect(() => {
    // จะทำงานก็ต่อเมื่อ user ล็อกอินแล้วเท่านั้น
    if (user && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const messaging = getMessaging(app);

        // ตั้งค่า "หูทิพย์" ดักฟังข้อความ
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('✅ NAV-BAR: Foreground message received!', payload);

          const notiTitle = payload.notification?.title || 'แจ้งเตือนใหม่';
          const notiBody = payload.notification?.body || 'ไม่มีเนื้อหา';

          // ยัดแจ้งเตือนใหม่เข้าไปใน Store! (เดี๋ยวกระดิ่งมันก็อัปเดตเอง)
          addNotification({
            message: `${notiTitle}: ${notiBody}`,
            role: 'all',
          });
        });

        // Cleanup function
        return () => {
          console.log("Unsubscribing from foreground messages in Navbar.");
          unsubscribe();
        };
      } catch (error) {
        console.error("Failed to initialize foreground messaging in Navbar:", error);
      }
    }
  }, [user, addNotification]); // ให้มันทำงานใหม่ทุกครั้งที่ user หรือ addNotification เปลี่ยน

  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert("ออกจากระบบสำเร็จ!");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-red-600">MAOPAY 🛵</Link>
        <div className="flex items-center space-x-2 md:space-x-4 text-gray-700">
          <Link href="/stores" className="hover:text-red-600">ร้านค้า</Link>
          
          {user && (
            <>
              <Link href="/stores/register" passHref legacyBehavior>
                <Button variant="ghost" className="hidden sm:inline-flex">🏪 สมัครร้านค้า</Button>
              </Link>
              <Link href="/riders/register" passHref legacyBehavior>
                <Button variant="ghost" className="hidden sm:inline-flex">🛵 สมัครไรเดอร์</Button>
              </Link>
            </>
          )}

          <Link href="/cart" className="relative">
            <ShoppingCart className="h-6 w-6 hover:text-red-600" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          
          {loading ? (
            <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center space-x-2 md:space-4">
               <NotificationBell />
               <Link href="/dashboard" className="hover:text-red-600" title="แดชบอร์ด">
                  <LayoutDashboard className="h-6 w-6" />
              </Link>
			        <Link href="/history" className="hover:text-red-600" title="ประวัติการสั่งซื้อ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M12 8v4l2 2"/></svg>
              </Link>
               <Link href="/profile" className="hover:text-red-600" title="โปรไฟล์">
                  <UserIcon className="h-6 w-6" />
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="icon" title="ออกจากระบบ">
                <LogOut className="h-6 w-6 text-red-600" />
              </Button>
            </div>
          ) : (
            <Link href="/login" passHref legacyBehavior>
                 <Button className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700">
                    เข้าสู่ระบบ
                </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};