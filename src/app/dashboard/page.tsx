// src/app/dashboard/page.tsx

"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, Store, Bike, UserCog } from "lucide-react";

// สร้าง Interface สำหรับ UserProfile
interface UserProfile {
  role: 'customer' | 'owner' | 'rider' | 'admin';
  displayName: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    const fetchUserProfile = async () => {
      const userDocRef = doc(db, "users", user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // ถ้าไม่มี profile อาจจะให้ไปสร้างก่อน หรือถือว่าเป็น customer
          setUserProfile({ role: 'customer', displayName: user.displayName || "เพื่อนเหมา" });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold">กำลังโหลดแดชบอร์ดของมึงอยู่เพื่อน...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
     return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold">หาโปรไฟล์มึงไม่เจอว่ะ! 😭</p>
           <Button onClick={() => router.push('/')} className="mt-4">กลับหน้าแรก</Button>
        </div>
      </div>
    );
  }

  // --- ส่วนแสดงผลตาม Role ---
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ด</h1>
            <p className="text-gray-500 mt-1">หวัดดีเพื่อน, {userProfile.displayName}! นี่คือศูนย์บัญชาการของมึง</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* การ์ดที่ทุกคนเห็น */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5"/> ประวัติการสั่งซื้อ</CardTitle>
                    <CardDescription>ดูรายการที่มึงเคยสั่งทั้งหมด</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/history" passHref>
                        <Button className="w-full">ดูประวัติ</Button>
                    </Link>
                </CardContent>
            </Card>

            {/* การ์ดเฉพาะสำหรับ Store Owner */}
            {userProfile.role === 'owner' && (
                <Card className="border-2 border-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5"/> จัดการร้านค้า</CardTitle>
                        <CardDescription>จัดการเมนู, ดูออเดอร์, และอื่นๆ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/store" passHref>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">ไปจัดการร้านค้า</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* การ์ดเฉพาะสำหรับ Rider */}
            {userProfile.role === 'rider' && (
                <Card className="border-2 border-green-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bike className="h-5 w-5"/> แดชบอร์ดไรเดอร์</CardTitle>
                        <CardDescription>ดูงานใหม่, งานที่กำลังทำ</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Link href="/dashboard/rider" passHref>
                            <Button className="w-full bg-green-600 hover:bg-green-700">ไปที่หน้าไรเดอร์</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* การ์ดเฉพาะสำหรับ Admin */}
            {userProfile.role === 'admin' && (
                 <Card className="border-2 border-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5"/> จัดการระบบ (Admin)</CardTitle>
                        <CardDescription>อนุมัติร้านค้า, ไรเดอร์, จัดการผู้ใช้</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Link href="/dashboard/admin" passHref>
                            <Button variant="destructive" className="w-full">เข้าสู่หลังบ้าน</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}