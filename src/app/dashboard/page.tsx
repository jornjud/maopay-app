"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// สร้าง Interface สำหรับ UserProfile
interface UserProfile {
  role: 'customer' | 'store_owner' | 'rider' | 'admin';
}

export default function DashboardRedirectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("กำลังตรวจสอบสิทธิ์...");

  useEffect(() => {
    // ถ้ายังไม่ล็อกอิน ก็ไม่ต้องทำอะไร รอให้ AuthProvider พาไปหน้า login เอง
    if (authLoading || !user) {
      return;
    }

    const checkUserRoleAndRedirect = async () => {
      const userDocRef = doc(db, "users", user.uid);
      try {
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const userProfile = docSnap.data() as UserProfile;
          setStatus(`คุณคือ ${userProfile.role}, กำลังพาไป...`);

          // --- นี่คือหัวใจหลัก! สับรางตาม Role ---
          switch (userProfile.role) {
            case 'admin':
              router.replace('/dashboard/admin');
              break;
            case 'store_owner':
              router.replace('/dashboard/store');
              break;
            case 'rider':
              router.replace('/dashboard/rider');
              break;
            default: // customer or other roles
              // ลูกค้าไม่มีแดชบอร์ดเฉพาะ ก็ส่งไปหน้าประวัติการสั่งซื้อแทน
              router.replace('/history');
              break;
          }
        } else {
          // ไม่เจอข้อมูล role, อาจเป็นลูกค้าธรรมดา
          setStatus("ไม่พบข้อมูลผู้ใช้เฉพาะ, กำลังไปที่หน้าหลัก...");
          router.replace('/');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setStatus("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
        // อาจจะส่งไปหน้าแรกถ้ามีปัญหา
        router.replace('/');
      }
    };

    checkUserRoleAndRedirect();

  }, [user, authLoading, router]);

  // หน้าจอตอนกำลังโหลด...
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-xl font-semibold">{status}</p>
        <p className="text-gray-500">กรุณารอสักครู่...</p>
      </div>
    </div>
  );
}