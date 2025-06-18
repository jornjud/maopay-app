"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  params: Promise<{ storeId: string }>;
};

interface Store {
  name: string;
  description: string;
  imageUrl: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function StoreDetailPage({ params }: Props) {
  const [storeId, setStoreId] = useState<string>("");
  const [store, setStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addItemToCart = useCartStore((state) => state.addItem);
  
  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setStoreId(resolvedParams.storeId);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!storeId) return;
    
    const fetchStoreData = async () => {
      setLoading(true);
      try {
        const storeDocRef = doc(db, "stores", storeId);
        const storeDocSnap = await getDoc(storeDocRef);
        if (!storeDocSnap.exists()) throw new Error("ไม่พบร้านค้านี้");
        setStore(storeDocSnap.data() as Store);

        const menuItemsColRef = collection(db, "stores", storeId, "menuItems");
        const menuItemsSnapshot = await getDocs(menuItemsColRef);
        const menuData = menuItemsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...(doc.data() as Omit<MenuItem, 'id'>)
        }));
        setMenuItems(menuData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStoreData();
  }, [storeId]);

  if (loading) return <div className="container text-center py-12">กำลังโหลด...</div>;
  if (!store) return <div className="container text-center py-12">ไม่พบข้อมูลร้าน</div>;

  return (
    <div>
      <div className="relative w-full h-64 bg-gray-200">
        <Image 
          src={store.imageUrl} 
          alt={store.name} 
          fill
          style={{ objectFit: 'cover' }}
          priority 
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white text-center px-4">{store.name}</h1>
        </div>
      </div>
      <div className="container mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">เมนูทั้งหมด</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{item.price} บาท</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    addItemToCart({id: item.id, name: item.name, price: item.price}, storeId);
                    alert(`เพิ่ม "${item.name}" ลงตะกร้าแล้ว!`);
                  }}
                >
                  เพิ่มลงตะกร้า
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}