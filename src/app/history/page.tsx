// @filename: src/app/history/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface OrderHistoryItem {
    id: string;
    totalPrice: number;
    status: string;
    timestamp: Timestamp;
    items: { productName: string, quantity: number }[];
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
            const q = query(collection(db, "orders"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            const history = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as OrderHistoryItem));
            setOrderHistory(history.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
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
                <p>คุณยังไม่มีประวัติการสั่งซื้อ</p>
            ) : (
                <div className="space-y-4">
                    {orderHistory.map(order => (
                        <div key={order.id} className="bg-white shadow rounded-lg p-4">
                            <p className="font-semibold">Order #{order.id.substring(0, 7)}</p>
                             <p className="text-right font-bold mt-4">Total: {order.totalPrice.toFixed(2)} THB</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}