"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"; // << แก้ไข: เอา 'where' ที่ไม่ได้ใช้ออก
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter, // << แก้ไข: Import CardFooter ที่ลืมไป
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  items: { name: string; quantity: number }[];
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return; 

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotifyRiders = async (orderId: string) => {
    if (!confirm("ยืนยันการส่งงานให้ไรเดอร์?")) return;

    try {
        const response = await fetch('/api/orders/notify-riders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        alert('ส่งแจ้งเตือนให้ไรเดอร์เรียบร้อย!');
    } catch (error: unknown) { // << แก้ไข: เปลี่ยนจาก any เป็น unknown
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
    }
  };


  if (authLoading || loading) {
    return <div className="container text-center py-12">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">แดชบอร์ดร้านค้า</h1>
      <div className="space-y-6">
        {orders.length === 0 ? (
            <p>ยังไม่มีออเดอร์เข้ามา...</p>
        ) : (
            orders.map(order => (
                <Card key={order.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Order ID: {order.id.substring(0, 8)}...</span>
                            <span className="text-lg font-bold">{order.totalPrice} บาท</span>
                        </CardTitle>
                        <CardDescription>
                            สถานะ: <span className="font-semibold text-red-600">{order.status}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            {order.items.map(item => (
                                <li key={item.name}>{item.name} x {item.quantity}</li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {order.status === 'pending' && (
                             <Button 
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleNotifyRiders(order.id)}
                            >
                                ยืนยันออเดอร์และหาไรเดอร์
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
