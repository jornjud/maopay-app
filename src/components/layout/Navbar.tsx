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
        <div className="flex items-center space-x-4 md:space-x-6 text-gray-700">
          <Link href="/stores" className="hover:text-red-600">ร้านค้า</Link>
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
            <div className="flex items-center space-x-3 md:space-x-4">
               {/* --- นี่คือลิงก์ที่เพิ่มเข้ามา! --- */}
               <Link href="/dashboard" className="hover:text-red-600" title="แดชบอร์ดร้านค้า">
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
            <Link href="/login" className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
