"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- Firebase Imports ---
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, doc, updateDoc, addDoc, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // FIX: แก้ Path ให้ถูกต้องและรวมไว้ด้วยกัน

// --- UI Component Imports ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// --- Interfaces ---
interface Store {
  name: string;
  description: string;
  imageUrl: string;
  ownerId: string;
  telegramGroupId?: string;
  paymentInfo?: {
      accountName: string;
      accountNumber: string;
      bankName: string;
  }
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

interface Order {
  id: string;
  customerName?: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: 'waiting_for_confirmation' | 'waiting_for_payment' | 'paid' | 'cooking' | 'ready_for_pickup' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}

export default function StoreDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Edit Store States ---
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editedStoreName, setEditedStoreName] = useState('');
  const [editedStoreDesc, setEditedStoreDesc] = useState('');
  const [editedBankName, setEditedBankName] = useState('');
  const [editedAccountName, setEditedAccountName] = useState('');
  const [editedAccountNumber, setEditedAccountNumber] = useState('');

  // --- Add Menu Item States ---
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        setUser(null);
        return;
      }
      setUser(currentUser);
      
      const storeQuery = query(collection(db, 'stores'), where('ownerId', '==', currentUser.uid));
      const unsubscribeStore = onSnapshot(storeQuery, (storeSnapshot) => {
        if (!storeSnapshot.empty) {
          const storeDoc = storeSnapshot.docs[0];
          const storeData = storeDoc.data() as Store;
          const storeDocId = storeDoc.id;
          
          setStoreInfo(storeData);
          setStoreId(storeDocId);
          setEditedStoreName(storeData.name);
          setEditedStoreDesc(storeData.description);
          setEditedBankName(storeData.paymentInfo?.bankName || '');
          setEditedAccountName(storeData.paymentInfo?.accountName || '');
          setEditedAccountNumber(storeData.paymentInfo?.accountNumber || '');

        } else {
            setStoreInfo(null);
            setStoreId(null);
        }
        setLoading(false);
      }, (err) => {
          console.error(err);
          setError("Failed to fetch store data.");
          setLoading(false);
      });
      return () => unsubscribeStore();
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
      if (!storeId) {
          setMenuItems([]);
          setOrders([]);
          return;
      };

      const menuQuery = query(collection(db, `stores/${storeId}/menuItems`));
      const unsubscribeMenu = onSnapshot(menuQuery, (snap) => {
          const menuList = snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
          setMenuItems(menuList);
      });

      const orderQuery = query(collection(db, 'orders'), where('storeId', '==', storeId));
      const unsubscribeOrders = onSnapshot(orderQuery, (snap) => {
          const ordersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
          setOrders(ordersList.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      });

      return () => {
          unsubscribeMenu();
          unsubscribeOrders();
      }

  }, [storeId]);


  const handleUpdateStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    try {
      await updateDoc(doc(db, 'stores', storeId), {
        name: editedStoreName,
        description: editedStoreDesc,
        paymentInfo: {
            bankName: editedBankName,
            accountName: editedAccountName,
            accountNumber: editedAccountNumber
        }
      });
      setIsEditingStore(false);
      alert('อัปเดตข้อมูลร้านค้าเรียบร้อย!');
    } catch (error) {
        console.error("Failed to update store info:", error);
        alert('อัปเดตข้อมูลร้านค้าล้มเหลว');
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !newMenuName || !newMenuPrice) return;
    try {
      await addDoc(collection(db, `stores/${storeId}/menuItems`), {
        name: newMenuName,
        description: newMenuDesc,
        price: parseFloat(newMenuPrice),
        imageUrl: `https://placehold.co/400x300/E2E8F0/4A5568?text=${encodeURIComponent(newMenuName)}`,
      });
      setNewMenuName('');
      setNewMenuDesc('');
      setNewMenuPrice('');
      setIsAddingMenu(false);
      alert("เพิ่มเมนูเรียบร้อย!");
    } catch (error) {
        console.error("Failed to add menu item:", error);
        alert("เพิ่มเมนูล้มเหลว");
    }
  };
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
      try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, { status: newStatus, updatedAt: serverTimestamp() });
          alert(`อัปเดตสถานะออเดอร์เป็น ${newStatus}`);
      } catch (error) {
          console.error("Failed to update order status:", error);
          alert("อัปเดตสถานะล้มเหลว");
      }
  };

  const handleNotifyRiders = async (orderId: string) => {
    if (!storeId) {
        alert("ไม่เจอ ID ร้านค้า!");
        return;
    }
    try {
        await fetch('/api/orders/notify-riders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, storeId }),
        });
        alert('แจ้งเตือนไรเดอร์แล้ว!');
    } catch (error) {
        console.error("Failed to notify riders:", error);
        alert("ส่งแจ้งเตือนล้มเหลว");
    }
  };

  if (loading) return <div className="text-center p-10">กำลังโหลด...</div>;
  if (error) return <div className="container mx-auto p-8 text-center text-red-500 bg-red-100 rounded-lg"><h2>เกิดข้อผิดพลาด:</h2><p>{error}</p></div>;
  if (!user) return <div className="text-center p-10"><Link href="/login">กรุณาเข้าสู่ระบบ</Link></div>;

  if (!storeInfo) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">ยังไม่มีร้านค้า</h2>
        <p className="mb-6">ดูเหมือนว่าคุณยังไม่ได้ลงทะเบียนร้านค้ากับเรา</p>
        <Button asChild><Link href="/stores/register">สมัครร้านค้าเลย!</Link></Button>
      </div>
    );
  }

  const renderOrderCardActions = (order: Order) => {
      switch(order.status) {
          case 'waiting_for_confirmation':
              return (
                  <div className="flex gap-2">
                     <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateOrderStatus(order.id, 'waiting_for_payment')}>✅ ยืนยันออเดอร์</Button>
                     <Button size="sm" variant="destructive" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>❌ ยกเลิก</Button>
                  </div>
              )
          case 'paid':
               return <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateOrderStatus(order.id, 'cooking')}>🍳 เริ่มทำอาหาร</Button>
          case 'ready_for_pickup':
               return <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleNotifyRiders(order.id)}>🛵 เรียกไรเดอร์</Button>
          default:
              return <p className="text-sm text-gray-500">รอการดำเนินการจากส่วนอื่น...</p>;
      }
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{storeInfo.name}</h1>
          <p className="text-gray-500 mt-1">{storeInfo.description}</p>
        </div>
        <Dialog open={isEditingStore} onOpenChange={setIsEditingStore}>
          <DialogTrigger asChild><Button variant="outline">แก้ไขข้อมูลร้าน</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>แก้ไขข้อมูลร้านค้าและบัญชีรับเงิน</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateStoreInfo} className="space-y-4 py-4">
              <div><Label htmlFor="s-name">ชื่อร้าน</Label><Input id="s-name" value={editedStoreName} onChange={e => setEditedStoreName(e.target.value)} /></div>
              <div><Label htmlFor="s-desc">คำอธิบาย</Label><Textarea id="s-desc" value={editedStoreDesc} onChange={e => setEditedStoreDesc(e.target.value)} /></div>
              <hr/>
              <h3 className="font-semibold">ข้อมูลบัญชีสำหรับรับเงิน</h3>
              <div><Label htmlFor="s-bank">ชื่อธนาคาร</Label><Input id="s-bank" value={editedBankName} onChange={e => setEditedBankName(e.target.value)} placeholder="เช่น กสิกรไทย" /></div>
              <div><Label htmlFor="s-acc-name">ชื่อบัญชี</Label><Input id="s-acc-name" value={editedAccountName} onChange={e => setEditedAccountName(e.target.value)} placeholder="นายเหมา เปย์" /></div>
              <div><Label htmlFor="s-acc-num">เลขบัญชี</Label><Input id="s-acc-num" value={editedAccountNumber} onChange={e => setEditedAccountNumber(e.target.value)} placeholder="123-4-56789-0"/></div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">ยกเลิก</Button></DialogClose>
                <Button type="submit">บันทึกข้อมูล</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold">รายการออเดอร์ ({orders.length})</h2>
            {orders.length > 0 ? (
                orders.map(order => (
                    <Card key={order.id}>
                        <CardHeader>
                            <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
                            <CardDescription>
                                เมื่อ: {order.createdAt.toDate().toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                         <CardContent>
                            <ul className="list-disc pl-5 my-2">
                                {order.items.map((item, index) => <li key={index}>{item.name} x {item.quantity}</li>)}
                            </ul>
                            <p><strong>ยอดรวม:</strong> {order.total.toFixed(2)} บาท</p>
                            <p><strong>สถานะ:</strong> <span className="font-semibold uppercase">{order.status.replace(/_/g, ' ')}</span></p>
                         </CardContent>
                         <CardFooter>
                            {renderOrderCardActions(order)}
                         </CardFooter>
                    </Card>
                ))
            ) : <p>ยังไม่มีออเดอร์เข้ามา</p>}
        </div>

        <div className="space-y-6">
           <h2 className="text-2xl font-semibold">จัดการเมนู ({menuItems.length})</h2>
           <Dialog open={isAddingMenu} onOpenChange={setIsAddingMenu}>
             <DialogTrigger asChild><Button className="w-full">เพิ่มเมนูใหม่</Button></DialogTrigger>
             <DialogContent>
               <DialogHeader><DialogTitle>เพิ่มเมนูใหม่</DialogTitle></DialogHeader>
               <form onSubmit={handleAddMenuItem} className="space-y-4 py-4">
                 <div><Label htmlFor="p-name">ชื่อเมนู</Label><Input id="p-name" value={newMenuName} onChange={e => setNewMenuName(e.target.value)} required /></div>
                 <div><Label htmlFor="p-desc">คำอธิบาย</Label><Input id="p-desc" value={newMenuDesc} onChange={e => setNewMenuDesc(e.target.value)} /></div>
                 <div><Label htmlFor="p-price">ราคา</Label><Input id="p-price" type="number" value={newMenuPrice} onChange={e => setNewMenuPrice(e.target.value)} required /></div>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">ยกเลิก</Button></DialogClose>
                    <Button type="submit">บันทึกเมนู</Button>
                 </DialogFooter>
               </form>
             </DialogContent>
           </Dialog>
           <div className="space-y-2">
             {menuItems.map(item => (
               <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                 <p>{item.name} - {item.price} THB</p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
