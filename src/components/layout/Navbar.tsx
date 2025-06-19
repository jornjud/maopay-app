"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const { user, loading } = useAuth();

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
          
          {/* --- 👇👇 เจ๊เพิ่มปุ่มสมัครเข้ามาตรงนี้ ถ้าล็อกอินแล้วจะเห็น! 👇👇 --- */}
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
          {/* --- 👆👆 จบส่วนที่เพิ่ม 👆👆 --- */}

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
            <div className="flex items-center space-x-2 md:space-x-3">
               <Link href="/dashboard" className="hover:text-red-600" title="แดชบอร์ด">
                  <LayoutDashboard className="h-6 w-6" />
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