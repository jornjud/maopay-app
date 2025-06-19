"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

// Define interfaces for data structures
interface Order {
  id: string;
  storeId: string;
  storeName?: string;
  items: { productName: string; quantity: number; price: number }[];
  totalPrice: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  deliveryAddress: { address: string; lat?: number; lng?: number };
  timestamp: any; // Firestore timestamp
  riderId?: string;
}

interface RiderProfile {
  userId: string;
  name: string;
  phone: string;
  vehicleDetails: string;
  status: 'available' | 'busy' | 'offline';
}

function RiderDashboard() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // States for the order details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const searchParams = useSearchParams();

  // Effect for handling authentication and fetching initial data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // ... (rest of the auth logic is the same)
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          if (userData.role === 'rider') {
            const riderDocRef = doc(db, 'riders', user.uid);
            const riderDoc = await getDoc(riderDocRef);
            if (riderDoc.exists()) {
              setRiderProfile({ userId: riderDoc.id, ...riderDoc.data() } as RiderProfile);
            }
          }
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect for real-time order updates
  useEffect(() => {
    if (!userId || userRole !== 'rider') return;

    // Listener for orders assigned to me
    const myOrdersQuery = query(collection(db, 'orders'), where('riderId', '==', userId), where('status', 'in', ['accepted', 'out_for_delivery']));
    const unsubscribeMyOrders = onSnapshot(myOrdersQuery, (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setMyOrders(ordersList);
    });

    // Listener for new/available orders
    const availableOrdersQuery = query(collection(db, 'orders'), where('status', '==', 'pending'));
    const unsubscribeAvailableOrders = onSnapshot(availableOrdersQuery, (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setAvailableOrders(ordersList);
    });

    return () => {
      unsubscribeMyOrders();
      unsubscribeAvailableOrders();
    };
  }, [userId, userRole]);


  // Effect to handle opening modal from URL
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl) {
      const fetchOrderAndShowModal = async () => {
        const orderRef = doc(db, 'orders', orderIdFromUrl);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
          setSelectedOrder(orderData);
          setIsOrderModalOpen(true);
        } else {
          console.error("Order from URL not found:", orderIdFromUrl);
          alert("ไม่พบออเดอร์ที่ระบุในลิงก์");
        }
      };
      fetchOrderAndShowModal();
    }
  }, [searchParams]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!userId) return;
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { riderId: userId, status: 'accepted' });
        alert('รับงานเรียบร้อยแล้ว!');
        setIsOrderModalOpen(false); // Close modal on success
    } catch (error) {
        console.error("Error accepting order: ", error);
        alert('เกิดข้อผิดพลาดในการรับงาน');
    }
  };
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // ... same as before ...
  };
  
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  if (loading) { /* ... loading UI ... */ }
  if (userRole !== 'rider') { /* ... access denied UI ... */ }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ... Header ... */}
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ดไรเดอร์</h1>
            {riderProfile && <p className="text-gray-600">สวัสดี, {riderProfile.name}!</p>}
        </header>
        {/* My Current Orders Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">🛵 งานของฉัน</h2>
          {/* ... My Orders list map ... */}
        </section>

        {/* Available Orders Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">✨ งานใหม่ที่น่าสนใจ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableOrders.length > 0 ? (
                  availableOrders.map(order => (
                       <Card key={order.id}>
                          <CardHeader>
                              <CardTitle>ออเดอร์ #{order.id.substring(0, 6)}</CardTitle>
                              <p className="text-sm text-gray-500">จากร้าน: {order.storeName || 'N/A'}</p>
                          </CardHeader>
                          <CardContent>
                              <p><strong>ยอดรวม:</strong> {order.totalPrice.toFixed(2)} บาท</p>
                               <p><strong>ที่อยู่จัดส่ง:</strong> {order.deliveryAddress.address}</p>
                          </CardContent>
                          <CardFooter>
                              <Button onClick={() => handleViewOrderDetails(order)} className="w-full">ดูรายละเอียด</Button>
                          </CardFooter>
                      </Card>
                  ))
              ) : (
                  <p className="text-gray-500 col-span-full">ยังไม่มีงานใหม่เข้ามาในตอนนี้</p>
              )}
          </div>
        </section>
      </div>
      
      {/* Order Details Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle>ออเดอร์ #{selectedOrder.id.substring(0, 6)}</DialogTitle>
                <DialogDescription>
                  จากร้าน: <strong>{selectedOrder.storeName}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">รายการอาหาร</h4>
                  <ul className="list-disc list-inside bg-gray-100 p-3 rounded-md text-gray-800">
                    {selectedOrder.items.map((item, index) => (
                      <li key={index}>{item.productName} x {item.quantity}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">ที่อยู่จัดส่ง</h4>
                  <p className="text-gray-700">{selectedOrder.deliveryAddress.address}</p>
                </div>
                 <div>
                  <h4 className="font-semibold">ยอดรวม</h4>
                  <p className="font-bold text-lg text-green-600">{selectedOrder.totalPrice.toFixed(2)} บาท</p>
                </div>
              </div>
              <DialogFooter className="sm:justify-between gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">ปิด</Button>
                </DialogClose>
                {selectedOrder.status === 'pending' && (
                  <Button
                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                  >
                    ✅ ยืนยันรับงานนี้
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <p>กำลังโหลดข้อมูลออเดอร์...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrap the component in Suspense, which is required when using useSearchParams.
export default function RiderDashboardPage() {
  return (
      <Suspense fallback={<div className="flex justify-center items-center h-screen">กำลังโหลดหน้า...</div>}>
          <RiderDashboard />
      </Suspense>
  )
}
