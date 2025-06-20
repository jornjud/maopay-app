"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, getDocs, addDoc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"


// --- Type Definitions ---
interface UserProfile { role: 'customer' | 'owner' | 'admin'; }
interface Order { id: string; status: string; totalPrice: number; items: { name: string; quantity: number }[]; createdAt: Timestamp; }
interface Store { id: string; name: string; ownerId: string; }
interface MenuItem { id: string; name: string; description: string; price: number; }

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- States ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]); // For admin
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- New Menu Item States ---
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDesc, setNewMenuDesc] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState(0);

  // --- Effects ---
  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const profile = doc.data() as UserProfile;
        setUserProfile(profile);
        if (profile.role === 'owner') {
            findAndSetOwnedStore(user.uid);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    if (userProfile?.role === 'admin') {
      const storesQuery = query(collection(db, "stores"), orderBy("name"));
      const unsubStores = onSnapshot(storesQuery, (snapshot) => {
        setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
      });
      return () => { unsubUser(); unsubStores(); };
    }
    
    return () => unsubUser();

  }, [user, userProfile?.role]);

  useEffect(() => {
    if (!selectedStoreId) {
        setOrders([]);
        setMenuItems([]);
        return;
    };

    const ordersQuery = query(collection(db, "orders"), where("storeId", "==", selectedStoreId), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const menuQuery = query(collection(db, "stores", selectedStoreId, "menuItems"), orderBy("name"));
    const unsubMenu = onSnapshot(menuQuery, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });

    return () => { unsubOrders(); unsubMenu(); };
  }, [selectedStoreId]);


  // --- Helper Functions ---
  const findAndSetOwnedStore = async (ownerId: string) => {
    const q = query(collection(db, "stores"), where("ownerId", "==", ownerId));
    const querySnapshot = await getDocs(q); 
    if (!querySnapshot.empty) {
      setSelectedStoreId(querySnapshot.docs[0].id);
    }
  };

  const handleAddMenuItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMenuName || !newMenuPrice || !selectedStoreId) {
        alert("กรุณากรอกชื่อและราคาเมนู");
        return;
    }
    setIsSubmitting(true);
    try {
        const menuItemsRef = collection(db, "stores", selectedStoreId, "menuItems");
        await addDoc(menuItemsRef, {
            name: newMenuName,
            description: newMenuDesc,
            price: Number(newMenuPrice)
        });
        setNewMenuName('');
        setNewMenuDesc('');
        setNewMenuPrice(0);
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเพิ่มเมนู");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async (menuItemId: string) => {
    if (!confirm("ยืนยันการลบเมนูนี้?") || !selectedStoreId) return;
    try {
        const menuItemRef = doc(db, "stores", selectedStoreId, "menuItems", menuItemId);
        await deleteDoc(menuItemRef);
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการลบเมนู");
        console.error(error);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: status });
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // ต้องแก้ให้มันรับ storeId เข้ามาด้วย!
const handleNotifyRiders = async (orderId: string, storeId: string) => {
    if (!confirm("แน่ใจนะว่าจะแจ้งให้ไรเดอร์ไปรับ?")) return;
    try {
      await fetch('/api/orders/notify-riders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // ส่ง storeId ไปด้วย!
          body: JSON.stringify({ orderId, storeId }),
      });
      alert('แจ้งเตือนไรเดอร์แล้ว!');
    } catch (error) {
      console.error(error);
      alert("ส่งแจ้งเตือนล้มเหลว");
    }
};


  // --- Render Logic ---
  if (authLoading || loading) return <div className="container text-center py-12">กำลังโหลดข้อมูล...</div>;
  if (!userProfile) return <div className="container text-center py-12">ไม่พบข้อมูลผู้ใช้ หรือคุณอาจไม่มีสิทธิ์เข้าถึงหน้านี้</div>;


  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">แดชบอร์ด</h1>
      <p className="text-lg mb-8">ยินดีต้อนรับ, <span className="font-semibold">{user?.displayName || user?.email}</span> (ตำแหน่ง: {userProfile.role})</p>

      {userProfile.role === 'admin' && (
        <div className="mb-8 max-w-sm">
             <Label htmlFor="store-selector">เลือกร้านค้าที่จะจัดการ</Label>
             <Select onValueChange={setSelectedStoreId} value={selectedStoreId}>
                <SelectTrigger id="store-selector">
                    <SelectValue placeholder="-- เลือกร้านค้า --" />
                </SelectTrigger>
                <SelectContent>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      )}

      {!selectedStoreId && userProfile.role !== 'customer' && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-xl text-gray-600">
                  {userProfile.role === 'admin' ? 'กรุณาเลือกร้านค้าเพื่อเริ่มการจัดการ' : 'ไม่พบร้านค้าที่คุณเป็นเจ้าของ'}
              </p>
          </div>
      )}

      {selectedStoreId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>จัดการเมนู</CardTitle>
                            <CardDescription>เพิ่ม/ลบเมนูของร้านคุณ</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>เพิ่มเมนูใหม่</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <form onSubmit={handleAddMenuItem}>
                                <DialogHeader><DialogTitle>เพิ่มเมนูใหม่</DialogTitle></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">ชื่อเมนู</Label>
                                        <Input id="name" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="desc" className="text-right">คำอธิบาย</Label>
                                        <Input id="desc" value={newMenuDesc} onChange={(e) => setNewMenuDesc(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="price" className="text-right">ราคา</Label>
                                        <Input id="price" type="number" value={newMenuPrice} onChange={(e) => setNewMenuPrice(Number(e.target.value))} className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {menuItems.length > 0 ? menuItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                                <span>{item.name} - {item.price} บาท</span>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteMenuItem(item.id)}>ลบ</Button>
                            </div>
                        )) : <p className="text-gray-500">ยังไม่มีเมนูในร้านนี้</p>}
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader><CardTitle>รายการออเดอร์ล่าสุด</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                    {orders.length > 0 ? orders.map(order => (
                        <Card key={order.id} className="p-4">
                           <p><strong>Order ID:</strong> {order.id.substring(0,6)}...</p>
                           <ul className="list-disc pl-5 my-2">
                             {order.items.map(item => <li key={item.name}>{item.name} x {item.quantity}</li>)}
                           </ul>
                           <p><strong>ยอดรวม:</strong> {order.totalPrice} บาท</p>
                           <p><strong>สถานะ:</strong> <span className="font-semibold">{order.status}</span></p>
                           <// src/app/dashboard/page.tsx

							<div className="flex gap-2 mt-3">
								{/* แก้ 'pending' เป็น 'waiting_for_confirmation' และเปลี่ยน status ถัดไปเป็น 'waiting_for_payment' */}
								{order.status === 'waiting_for_confirmation' && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(order.id, 'waiting_for_payment')}>✅ ยืนยันออเดอร์</Button>}
								
								{/* อันนี้เหมือนเดิมก็ได้ หรือจะแก้ตาม flow ใหม่ก็ดี */}
								{order.status === 'paid' && <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus(order.id, 'cooking')}>🍳 เริ่มทำอาหาร</Button>}
								{order.status === 'ready_for_pickup' && <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleNotifyRiders(order.id, selectedStoreId)}>🛵 เรียกไรเดอร์</Button>}

								{/* ปุ่มยกเลิกยังใช้ได้ดีอยู่ */}
								{order.status !== 'completed' && order.status !== 'cancelled' && <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order.id, 'cancelled')}>ยกเลิก</Button>}
							</div>
                        </Card>
                    )) : <p className="text-gray-500">ยังไม่มีออเดอร์</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}