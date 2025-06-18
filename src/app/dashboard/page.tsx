"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
interface Order { id: string; status: string; totalPrice: number; items: { name: string; quantity: number }[]; }
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
        if (profile.role !== 'admin') {
            findAndSetOwnedStore(user.uid);
        }
      }
      setLoading(false);
    });

    if (userProfile?.role === 'admin') {
      const storesQuery = query(collection(db, "stores"));
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

    const menuQuery = query(collection(db, "stores", selectedStoreId, "menuItems"));
    const unsubMenu = onSnapshot(menuQuery, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });

    return () => { unsubOrders(); unsubMenu(); };
  }, [selectedStoreId]);


  // --- Helper Functions ---
  const findAndSetOwnedStore = async (ownerId: string) => {
    const q = query(collection(db, "stores"), where("ownerId", "==", ownerId));
    const querySnapshot = await getDoc(q);
    if (!querySnapshot.empty) {
      setSelectedStoreId(querySnapshot.docs[0].id);
    }
  };

  const handleAddMenuItem = async () => {
    if (!newMenuName || !newMenuPrice || !selectedStoreId) {
        alert("กรุณากรอกชื่อและราคาเมนู");
        return;
    }
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
        alert("เพิ่มเมนูสำเร็จ!");
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเพิ่มเมนู");
        console.error(error);
    }
  };

  const handleDeleteMenuItem = async (menuItemId: string) => {
    if (!confirm("ยืนยันการลบเมนูนี้?") || !selectedStoreId) return;
    try {
        const menuItemRef = doc(db, "stores", selectedStoreId, "menuItems", menuItemId);
        await deleteDoc(menuItemRef);
        alert("ลบเมนูสำเร็จ!");
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการลบเมนู");
        console.error(error);
    }
  };

  // ... (handleNotifyRiders function can be added here later) ...


  // --- Render Logic ---
  if (authLoading || loading) return <div className="container text-center py-12">กำลังโหลดข้อมูล...</div>;
  if (!userProfile) return <div className="container text-center py-12">ไม่พบข้อมูลผู้ใช้</div>;


  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">แดชบอร์ด</h1>
      <p className="text-lg mb-8">ยินดีต้อนรับ, <span className="font-semibold">{user?.displayName || user?.email}</span> (ตำแหน่ง: {userProfile.role})</p>

      {/* Admin Store Selector */}
      {userProfile.role === 'admin' && (
        <div className="mb-8">
             <Label>เลือกร้านค้าที่จะจัดการ</Label>
             <Select onValueChange={setSelectedStoreId} value={selectedStoreId}>
                <SelectTrigger>
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

      {selectedStoreId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Menu Management Section */}
            <div>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>จัดการเมนู</CardTitle>
                            <CardDescription>เพิ่ม/ลบเมนูของร้านคุณ</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>เพิ่มเมนูใหม่</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>เพิ่มเมนูใหม่</DialogTitle></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">ชื่อเมนู</Label>
                                        <Input id="name" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="desc" className="text-right">คำอธิบาย</Label>
                                        <Input id="desc" value={newMenuDesc} onChange={(e) => setNewMenuDesc(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="price" className="text-right">ราคา</Label>
                                        <Input id="price" type="number" value={newMenuPrice} onChange={(e) => setNewMenuPrice(Number(e.target.value))} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="submit" onClick={handleAddMenuItem}>บันทึก</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {menuItems.length > 0 ? menuItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2 border-b">
                                <span>{item.name} - {item.price} บาท</span>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteMenuItem(item.id)}>ลบ</Button>
                            </div>
                        )) : <p>ยังไม่มีเมนูในร้านนี้</p>}
                    </CardContent>
                </Card>
            </div>
            {/* Order List Section */}
            <div>
                <Card>
                    <CardHeader><CardTitle>รายการออเดอร์</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                    {orders.length > 0 ? orders.map(order => (
                        <div key={order.id} className="p-3 border rounded-md">
                           <p><strong>Order ID:</strong> {order.id.substring(0,6)}...</p>
                           <p><strong>สถานะ:</strong> {order.status}</p>
                           <p><strong>ยอดรวม:</strong> {order.totalPrice} บาท</p>
                           {/* Add notify rider button later */}
                        </div>
                    )) : <p>ยังไม่มีออเดอร์</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
