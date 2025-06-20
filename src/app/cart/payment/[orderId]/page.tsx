"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

// --- Interfaces ---
interface Order {
  id: string;
  userId: string;
  storeName: string;
  items: { name: string; quantity: number, price: number }[];
  total: number;
  status: string;
  createdAt: Timestamp;
  payment: {
      qrImage: string;
  }
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !user) {
        if (!authLoading) router.push('/login');
        return;
    };

    const orderRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        // --- Security Check! ---
        if (orderData.userId !== user.uid) {
            setError("แกไม่มีสิทธิ์ดูออเดอร์นี้เว้ย!");
            setOrder(null);
        } else {
            setOrder(orderData);
        }
      } else {
        setError("ไม่เจอออเดอร์ว่ะเพื่อน");
      }
      setLoading(false);
    }, (err) => {
        console.error(err);
        setError("มีปัญหากับการดึงข้อมูลออเดอร์");
        setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, user, authLoading, router]);

  if (loading || authLoading) return <div className="text-center p-10">กำลังโหลดหน้าจ่ายเงิน...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!order) return <div className="text-center p-10">ไม่พบข้อมูลออเดอร์</div>;

  if (order.status !== 'waiting_for_payment') {
      return (
          <div className="container mx-auto p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">สถานะออเดอร์: <span className='text-blue-600'>{order.status.replace('_', ' ')}</span></h2>
              <p>ตอนนี้ยังไม่ถึงขั้นตอนการจ่ายเงินนะเพื่อน</p>
              <Button onClick={() => router.push('/history')} className="mt-4">กลับไปที่ประวัติการสั่งซื้อ</Button>
          </div>
      )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ชำระเงินสำหรับออเดอร์</CardTitle>
          <CardDescription>#{order.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className='text-center'>
                 <p>กรุณาสแกน QR Code ด้านล่างเพื่อชำระเงิน</p>
                 <p className="text-3xl font-bold my-2">{order.total.toFixed(2)} บาท</p>
            </div>
            <div className="flex justify-center">
                <Image
                    src={order.payment.qrImage || 'https://placehold.co/300x300?text=QR+CODE'}
                    alt="QR Code for payment"
                    width={300}
                    height={300}
                    className="rounded-lg shadow-md"
                />
            </div>
            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <strong>สำคัญ:</strong> หลังจากสแกนจ่ายเงินแล้ว กรุณารอแอดมินตรวจสอบและยืนยันยอดเงินในระบบ สถานะออเดอร์ของคุณจะอัปเดตอัตโนมัติ
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={() => router.push('/history')} variant="outline" className="w-full">
                กลับไปที่ประวัติการสั่งซื้อ
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
