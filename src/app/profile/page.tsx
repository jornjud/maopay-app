"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // ถ้ายังโหลดอยู่ หรือถ้าโหลดเสร็จแล้วแต่ไม่มี user ให้เด้งกลับไปหน้า login
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="container text-center py-12">กำลังตรวจสอบข้อมูล...</div>;
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">โปรไฟล์ของฉัน</h1>
            <Card>
                <CardHeader>
                    <CardTitle>ข้อมูลผู้ใช้</CardTitle>
                    <CardDescription>นี่คือข้อมูลบัญชีของคุณที่ลงทะเบียนกับ MAOPAY</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>อีเมล:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> {user.uid}</p>
                    <p><strong>ผู้ให้บริการ:</strong> {user.providerData[0]?.providerId}</p>
                </CardContent>
            </Card>
        </div>
    );
}
