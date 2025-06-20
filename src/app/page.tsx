// src/app/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, CookingPot, Leaf } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* --- Hero Section --- */}
      <div className="relative bg-red-50">
          <div className="container mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4 leading-tight">
                หิวเหรอ? ให้ <span className="text-red-600">MAOPAY</span> จัดการ
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                สั่งอาหารร้านโปรดของคุณ ส่งตรงถึงหน้าบ้าน รวดเร็วทันใจ ไรเดอร์คุณภาพพร้อมบริการในพื้นที่ของคุณ
              </p>
              <Link href="/stores">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <CookingPot className="mr-2 h-5 w-5" />
                  สั่งเลยตอนนี้!
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2">
                <Image 
                    src="https://placehold.co/600x450/FFE4E6/DC2626?text=Delicious+Food"
                    alt="Maopay Delivery Service"
                    width={600} height={450} className="rounded-lg shadow-2xl" priority
                />
            </div>
          </div>
      </div>

      {/* --- Features Section --- */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">ทำไมต้อง MaoPay?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature Cards Here */}
            </div>
        </div>
      </div>
      
      {/* --- Call to Action for Stores/Riders --- */}
      <div className="bg-gray-800 text-white py-16">
         {/* CTA content Here */}
      </div>
    </>
  );
}