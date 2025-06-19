// @filename: src/app/dashboard/rider/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, doc, getDoc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// Define interfaces for data structures
interface Order {
  id: string;
  storeId: string;
  storeName?: string;
  items: { productName: string; quantity: number; price: number }[];
  totalPrice: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  deliveryAddress: { address: string; lat?: number; lng?: number };
  timestamp: Timestamp;
  riderId?: string;
}

interface RiderProfile {
  userId: string;
  name:string;
  phone: string;
  vehicleDetails: string;
  status: 'available' | 'busy' | 'offline';
}

function RiderDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          if (userData.role === 'rider') {
            const riderDocRef = doc(db, 'riders', currentUser.uid);
            const riderDoc = await getDoc(riderDocRef);
            if (riderDoc.exists()) {
              setRiderProfile({ userId: riderDoc.id, ...riderDoc.data() } as RiderProfile);
            }
          }
        }
      } else {
        setUserRole(null);
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || userRole !== 'rider') return;

    const myOrdersQuery = query(collection(db, 'orders'), where('riderId', '==', user.uid), where('status', 'in', ['accepted', 'out_for_delivery', 'ready_for_pickup']));
    const unsubscribeMyOrders = onSnapshot(myOrdersQuery, (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setMyOrders(ordersList.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()));
    });

    const availableOrdersQuery = query(collection(db, 'orders'), where('status', '==', 'pending'));
    const unsubscribeAvailableOrders = onSnapshot(availableOrdersQuery, (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setAvailableOrders(ordersList.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
    });

    return () => {
      unsubscribeMyOrders();
      unsubscribeAvailableOrders();
    };
  }, [user, userRole]);


  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl && availableOrders.length > 0) {
      const orderFromList = availableOrders.find(o => o.id === orderIdFromUrl);
      if(orderFromList) {
          setSelectedOrder(orderFromList);
          setIsOrderModalOpen(true);
      }
    }
  }, [searchParams, availableOrders]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { riderId: user.uid, status: 'accepted' });
        alert('รับงานเรียบร้อยแล้ว!');
        setIsOrderModalOpen(false);
    } catch (err) {
        console.error("Error accepting order: ", err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรับงาน');
    }
  };
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
     try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        alert(`อัปเดตสถานะออเดอร์เป็น: ${newStatus}`);
    } catch (err) {
        console.error("Error updating order status: ", err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };
  
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  if (loading) return <div className="flex justify-center items-center h-screen">กำลังโหลดข้อมูล...</div>;
  if (userRole !== 'rider') return <div className="flex justify-center items-center h-screen bg-red-100 text-red-700 p-8">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ดไรเดอร์</h1>
            {riderProfile && <p className="text-gray-600">สวัสดี, {riderProfile.name}!</p>}
            {error && <p className="text-red-500 bg-red-100 p-2 rounded mt-2">{error}</p>}
        </header>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">🛵 งานของฉัน ({myOrders.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myOrders.length > 0 ? myOrders.map(order => (
                <Card key={order.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>ออเดอร์ #{order.id.substring(0, 6)}</CardTitle>
                        <p className="text-sm text-gray-500">จากร้าน: {order.storeName || 'N/A'}</p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p><strong>ที่อยู่จัดส่ง:</strong> {order.deliveryAddress.address}</p>
                       <p><strong>สถานะปัจจุบัน:</strong> <span className="font-semibold text-blue-600">{order.status}</span></p>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-2">
                         <Select onValueChange={(value) => handleUpdateOrderStatus(order.id, value as Order['status'])} defaultValue={order.status}>
                            <SelectTrigger>
                                <SelectValue placeholder="อัปเดตสถานะ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="out_for_delivery">กำลังไปส่ง</SelectItem>
                                <SelectItem value="completed">จัดส่งสำเร็จ</SelectItem>
                                <SelectItem value="cancelled">ยกเลิก</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardFooter>
                </Card>
            )) : <p className="text-gray-500 col-span-full">ยังไม่มีงานที่รับไว้ในตอนนี้</p>}
           </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">✨ งานใหม่ ({availableOrders.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableOrders.length > 0 ? availableOrders.map(order => (
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
              )) : <p className="text-gray-500 col-span-full">ยังไม่มีงานใหม่เข้ามา</p>}
          </div>
        </section>
      </div>
      
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle>ออเดอร์ #{selectedOrder.id.substring(0, 6)}</DialogTitle>
                <DialogDescription>จากร้าน: <strong>{selectedOrder.storeName || "ไม่ระบุ"}</strong></DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-3 text-sm">
                <h4 className="font-semibold mb-1">รายการอาหาร</h4>
                <ul className="list-disc list-inside bg-gray-100 p-3 rounded-md text-gray-800">
                  {selectedOrder.items.map((item, index) => <li key={index}>{item.productName} x {item.quantity}</li>)}
                </ul>
                <h4 className="font-semibold">ที่อยู่จัดส่ง</h4>
                <p className="text-gray-700">{selectedOrder.deliveryAddress.address}</p>
                <h4 className="font-semibold">ยอดรวม</h4>
                <p className="font-bold text-lg text-green-600">{selectedOrder.totalPrice.toFixed(2)} บาท</p>
              </div>
              <DialogFooter className="sm:justify-between gap-2">
                <DialogClose asChild><Button type="button" variant="secondary">ปิด</Button></DialogClose>
                {selectedOrder.status === 'pending' && <Button className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white" onClick={() => handleAcceptOrder(selectedOrder.id)}>✅ ยืนยันรับงานนี้</Button>}
              </DialogFooter>
            </>
          ) : <p>กำลังโหลดข้อมูล...</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RiderDashboardPage() {
  return (
      <Suspense fallback={<div className="flex justify-center items-center h-screen">กำลังโหลด...</div>}>
          <RiderDashboard />
      </Suspense>
  )
}