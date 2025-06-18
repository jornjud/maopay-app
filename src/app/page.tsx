import { Button } from "@/components/ui/button"; // << เห็นมั้ย! เราเรียกใช้ปุ่มที่ติดตั้งมาแล้ว
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row items-center justify-between">
        
        {/* ส่วนของข้อความ */}
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 leading-tight">
            หิวเหรอ? ให้ <span className="text-red-600">MAOPAY</span> จัดการ
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            สั่งอาหารร้านโปรดของคุณ ส่งตรงถึงหน้าบ้าน รวดเร็วทันใจ ไรเดอร์คุณภาพพร้อมบริการ
          </p>
          <Link href="/stores">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg">
              สั่งเลย!
            </Button>
          </Link>
        </div>

        {/* ส่วนของรูปภาพ */}
        <div className="md:w-1/2">
            {/* นายหารูป Delivery สวยๆ มาใส่ตรงนี้ได้เลย */}
            <Image 
                src="https://placehold.co/600x400/fecaca/ef233c?text=MAOPAY+DELIVERY"
                alt="Maopay Delivery"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
            />
        </div>

      </div>
    </div>
  );
}
