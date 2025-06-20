"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface OrderHistoryItem {
    id: string;
    total: number;
    status: string;
    createdAt: Timestamp;
    items: { name: string, quantity: number }[];
    storeName?: string;
}

// Function to translate status to Thai and add color
const getStatusBadge = (status: string) => {
    switch(status) {
        case 'waiting_for_confirmation': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">รอร้านยืนยัน</span>;
        case 'waiting_for_payment': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">รอชำระเงิน</span>;
        case 'paid': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-200 text-blue-800">จ่ายเงินแล้ว</span>;
        case 'cooking': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-200 text-indigo-800">กำลังทำอาหาร</span>;
        case 'ready_for_pickup': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-200 text-purple-800">พร้อมให้ไรเดอร์รับ</span>;
        case 'out_for_delivery': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-200 text-pink-800">กำลังจัดส่ง</span>;
        case 'completed': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">สำเร็จ</span>;
        case 'cancelled': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-200 text-red-800">ยกเลิก</span>;
        default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">{status}</span>;
    }
}


export default function OrderHistoryPage() {
    const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
                const unsubOrders = onSnapshot(q, (querySnapshot) => {
                    const history = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as OrderHistoryItem));
                    setOrderHistory(history);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching order history: ", error);
                    setLoading(false);
                });
                return () => unsubOrders();
            } else {
                router.push('/login?redirect=/history');
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return <div className="text-center p-10">กำลังโหลดประวัติการสั่งซื้อ...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">ประวัติการสั่งซื้อของฉัน</h1>
            {orderHistory.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500">คุณยังไม่มีประวัติการสั่งซื้อ</p>
                    <Button onClick={() => router.push('/stores')} className="mt-4">ไปสั่งอาหารกันเลย!</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {orderHistory.map(order => (
                        <div key={order.id} className="bg-white shadow rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        ออเดอร์จากร้าน: {order.storeName || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        #{order.id.substring(0, 7)}...
                                    </p>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="mt-4 border-t pt-4">
                               <ul className="space-y-1 text-sm text-gray-600">
                                   {order.items.map((item, index) => (
                                       <li key={index} className="flex justify-between">
                                           <span>{item.name}</span>
                                           <span>x{item.quantity}</span>
                                       </li>
                                   ))}
                               </ul>
                            </div>
                            <div className="flex justify-between items-center mt-4 border-t pt-4">
                               <p className="font-bold text-lg text-gray-800">
                                  ยอดรวม: {order.total.toFixed(2)} THB
                               </p>
                               {order.status === 'waiting_for_payment' && (
                                   <Link href={`/payment/${order.id}`} passHref>
                                     <Button className="bg-green-500 hover:bg-green-600">จ่ายเงินเลย!</Button>
                                   </Link>
                               )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

