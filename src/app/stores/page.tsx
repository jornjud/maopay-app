"use client"; // << หน้านี้ต้องทำงานฝั่ง Client เพราะต้องดึงข้อมูล

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

// Import ของจำเป็นจาก Firebase
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// กำหนดหน้าตาข้อมูลร้านค้า (TypeScript)
interface Store {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export default function StoresPage() {
  // สร้าง State สำหรับเก็บข้อมูลต่างๆ
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect จะทำงานแค่ครั้งเดียวตอนหน้านี้โหลดขึ้นมา
  useEffect(() => {
    const fetchStores = async () => {
      try {
        // ไปที่ collection 'stores' แล้วดึงเอกสารทั้งหมดมา
        const querySnapshot = await getDocs(collection(db, "stores"));
        const storesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Store, 'id'>),
        }));
        setStores(storesData); // เอาข้อมูลที่ได้มาเก็บใน State
      } catch (err) {
        setError("ไม่สามารถดึงข้อมูลร้านค้าได้ โปรดลองอีกครั้ง");
        console.error(err);
      } finally {
        setLoading(false); // ไม่ว่าจะสำเร็จหรือล้มเหลว ก็ให้หยุดหมุน
      }
    };

    fetchStores();
  }, []); // [] ว่างๆ หมายถึงให้ทำงานแค่ครั้งเดียว

  // --- ส่วนของการแสดงผล ---

  if (loading) {
    return <div className="container text-center py-12">กำลังโหลดร้านค้า...</div>;
  }

  if (error) {
    return <div className="container text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        เลือกร้านค้าใกล้บ้านคุณ
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stores.map((store) => (
          <Card key={store.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <Image src={store.imageUrl} alt={store.name} width={400} height={200} className="w-full h-40 object-cover" />
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-xl mb-1">{store.name}</CardTitle>
              <CardDescription>{store.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Link href={`/stores/${store.id}`} className="w-full">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  ดูเมนู
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
