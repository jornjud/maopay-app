"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore'; // เพิ่ม orderBy
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// 🔥 แก้ Interface ให้ถูกต้อง
interface OrderHistoryItem {
    id: string;
    totalPrice: number;
    status: string;
    createdAt: Timestamp; // <--- ใช้ createdAt
    items: { productName?: string, name?: string, quantity: number }[]; // ทำให้ยืดหยุ่นขึ้น
    storeName?: string;
}

export default function OrderHistoryPage() {
    const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                fetchOrderHistory(currentUser.uid);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchOrderHistory = async (userId: string) => {
        setLoading(true);
        try {
            // 🔥 เพิ่ม orderBy เข้าไปใน query
            const q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const history = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as OrderHistoryItem));
            // 🔥 ไม่ต้อง sort ที่ client แล้ว เพราะ query มาให้แล้ว
            setOrderHistory(history);
        } catch (error) {
            console.error("Error fetching order history: ", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-10">Loading your order history...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">ประวัติการสั่งซื้อ</h1>
            {orderHistory.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500">คุณยังไม่มีประวัติการสั่งซื้อ</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orderHistory.map(order => (
                        <div key={order.id} className="bg-white shadow rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-800">Order #{order.id.substring(0, 7)}</p>
                                    <p className="text-sm text-gray-500">
                                        {/* 🔥 เช็คก่อนใช้ และใช้ createdAt */}
                                        {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'ไม่มีข้อมูลเวลา'}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="mt-4 border-t pt-4">
                               <ul className="space-y-1">
                                   {/* 🔥 ทำให้รองรับทั้ง productName และ name */}
                                   {(order.items || []).map((item, index) => (
                                       <li key={index} className="text-sm text-gray-600 flex justify-between">
                                           <span>{item.productName || item.name}</span>
                                           <span>x{item.quantity}</span>
                                       </li>
                                   ))}
                               </ul>
                            </div>
                             <p className="text-right font-bold text-lg text-gray-800 mt-4">Total: {order.totalPrice.toFixed(2)} THB</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}